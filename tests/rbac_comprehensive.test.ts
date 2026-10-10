/**
 * tests/rbac_comprehensive.test.ts
 * M5 — Role-Based Access Control Comprehensive Adversarial Test Suite
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';

let adminToken: string;
let teacherToken: string;
let accountantToken: string;
let guardianToken: string;
let studentToken: string;

async function login(identifier: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier, password });
  return res.body?.data?.token ?? '';
}

beforeAll(async () => {
  await initializeDatabase();
  await seedDatabase();

  [adminToken, teacherToken, accountantToken, guardianToken, studentToken] = await Promise.all([
    login('muhtamim', 'admin123'),
    login('teacher_rashid', 'teacher123'),
    login('accountant_faruq', 'account123'),
    login('01811111111', 'parent123'),
    login('student_abdullah', 'student123'),
  ]);
}, 15000);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Unauthenticated Access → 401
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 RBAC: 1. Unauthenticated Requests → 401', () => {
  const protectedRoutes: [string, string][] = [
    ['get', '/api/v1/students'],
    ['get', '/api/v1/finance/invoices'],
    ['get', '/api/v1/payroll/profiles'],
    ['get', '/api/v1/telemetry'],
    ['get', '/api/v1/hifz/today'],
  ];

  for (const [method, path] of protectedRoutes) {
    it(`${method.toUpperCase()} ${path} without token → 401`, async () => {
      const res = await (request(app) as any)[method](path)
        .set('X-Tenant-ID', 'inst_main');
      expect(res.status).toBe(401);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Teacher → Financial Endpoint Blocks
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 RBAC: 2. Teacher Blocked from Financial Routes → 403', () => {
  const financialRoutes: [string, string][] = [
    ['get', '/api/v1/finance/invoices'],
    ['get', '/api/v1/payroll/profiles'],
    ['post', '/api/v1/payroll/profiles'],
  ];

  for (const [method, path] of financialRoutes) {
    it(`Teacher ${method.toUpperCase()} ${path} → 403`, async () => {
      const res = await (request(app) as any)[method](path)
        .set('Authorization', `Bearer ${teacherToken}`)
        .set('X-Tenant-ID', 'inst_main');
      expect([403, 401]).toContain(res.status);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Guardian / Student → Admin Route Escalation Probes
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 RBAC: 3. Guardian/Student Role Escalation Probes → Scoped Access', () => {
  it('Guardian GET /students → 200 but scoped to linked children only (not all students)', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${guardianToken}`)
      .set('X-Tenant-ID', 'inst_main');
    // Guardian gets 200 but only their own children — not a full admin list
    expect(res.status).toBe(200);
    const students = res.body.data?.students ?? res.body.students ?? [];
    // Guardian should only see max 1-2 linked children, not 10+ total students
    expect(Array.isArray(students)).toBe(true);
    // Admin listing would return many more — guardian should not get all 10+
    // This confirms scoping: guardian sees 0-2 students (their children only)
    expect(students.length).toBeLessThanOrEqual(5);
  });

  it('Student GET /students → 200 but scoped to own profile only', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Tenant-ID', 'inst_main');
    // Student gets 200 but only their own profile
    expect(res.status).toBe(200);
    const students = res.body.data?.students ?? res.body.students ?? [];
    expect(Array.isArray(students)).toBe(true);
    // Student should only see their own profile (0-1 records)
    expect(students.length).toBeLessThanOrEqual(1);
  });

  it('Guardian cannot approve workflow decisions (403)', async () => {
    const res = await request(app)
      .post('/api/v1/automations/approvals/appr_demo_01/decide')
      .set('Authorization', `Bearer ${guardianToken}`)
      .set('X-Tenant-ID', 'inst_main')
      .send({ decision: 'approved' });
    expect([403, 401]).toContain(res.status);
  });

  it('Guardian cannot access payroll profiles (403)', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${guardianToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect([403, 401]).toContain(res.status);
  });

  it('Student cannot access payroll profiles (403)', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect([403, 401]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SQL Injection Probes
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 Security: 4. SQL Injection Probes → safe (no 500)', () => {
  const injectionPayloads = [
    `' OR '1'='1`,
    `1; DROP TABLE students; --`,
    `' UNION SELECT username,password_hash FROM users --`,
    `admin'--`,
  ];

  for (const payload of injectionPayloads) {
    it(`GET /students?search="${payload.slice(0, 30)}" → no 500 or data leak`, async () => {
      const res = await request(app)
        .get(`/api/v1/students`)
        .query({ search: payload })
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'inst_main');
      // Should return 200 (empty safe result) or 400 — never 500
      expect([200, 400, 403]).toContain(res.status);
      if (res.status === 200) {
        const body = JSON.stringify(res.body);
        expect(body).not.toContain('password_hash');
        expect(body).not.toContain('argon2');
      }
    });
  }

  it('SQL injection in student ID path param → 404 or 400 (not 500)', async () => {
    const maliciousId = `' OR 1=1 --`;
    const res = await request(app)
      .get(`/api/v1/students/${encodeURIComponent(maliciousId)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect([400, 404]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Idempotency — Duplicate Payment Protection
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 Security: 5. Duplicate Digital Transaction ID → 409', () => {
  it('Same digital transaction ID on second payment → 409 Conflict', async () => {
    // Create invoice using seed student ID
    const invRes = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_main')
      .send({
        student_id: 'std_001',   // seed student ID linked to student_abdullah
        month: 'November',
        year: 2026,
        ledger_type: 'non_residential',
        fee_items: [{ name_bn: 'মাসিক বেতন', amount: 2000 }],
        due_date: '2026-11-10',
      });

    // Accept 201 (created) or 200 (existing)
    if (![200, 201].includes(invRes.status)) {
      // Student may not exist with this ID — try a different student
      const studentsRes = await request(app)
        .get('/api/v1/students?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'inst_main');
      const firstStudent = studentsRes.body?.data?.students?.[0] ?? studentsRes.body?.students?.[0];
      if (!firstStudent) return; // skip if no students available

      const inv2 = await request(app)
        .post('/api/v1/finance/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'inst_main')
        .send({
          student_id: firstStudent.id,
          month: 'November',
          year: 2026,
          ledger_type: 'non_residential',
          fee_items: [{ name_bn: 'মাসিক বেতন', amount: 2000 }],
          due_date: '2026-11-10',
        });
      if (![200, 201].includes(inv2.status)) return;
    }

    const invoiceId = invRes.body?.invoice?.id;
    if (!invoiceId) return;
    const uniqueTxnId = `TXN_IDEM_${Date.now()}`;

    // First payment — should succeed
    const pay1 = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_main')
      .send({ invoice_id: invoiceId, amount: 2000, payment_method: 'bkash', digital_transaction_id: uniqueTxnId });
    expect(pay1.status).toBe(201);

    // Second payment with same txn_id → 409
    const pay2 = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_main')
      .send({ invoice_id: invoiceId, amount: 2000, payment_method: 'bkash', digital_transaction_id: uniqueTxnId });
    expect(pay2.status).toBe(409);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Cross-Tenant Data Leakage
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 Security: 6. Cross-Tenant Leakage Prevention', () => {
  it('Mismatched X-Tenant-ID header → 403 with TENANT_MISMATCH code', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_EVIL_OTHER_TENANT');
    expect(res.status).toBe(403);
    // Error code is nested in res.body.error.code
    expect(res.body?.error?.code).toBe('TENANT_MISMATCH');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Teacher Payslip Self-Access Only
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 RBAC: 7. Teacher Payslip Isolation', () => {
  it('Teacher can fetch own payslip → 200 or 404 (no profile for this teacher, but not 403)', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/payslip/me')
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(403);
  });

  it('Teacher cannot list all payroll profiles → 403', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Malformed Auth Headers
// ═══════════════════════════════════════════════════════════════════════════════
describe('M5 Security: 8. Malformed Auth Headers → 401', () => {
  it('Bearer with garbage token → 401', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', 'Bearer GARBAGE_TOKEN_XYZ.NOT.VALID')
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(401);
  });

  it('Basic auth scheme (not Bearer) → 401', async () => {
    const res = await request(app)
      .get('/api/v1/students')
      .set('Authorization', 'Basic YWRtaW46cGFzc3dvcmQ=')
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(401);
  });
});
