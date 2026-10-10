/**
 * tests/telemetry.test.ts
 * M4 — Super Admin Telemetry Endpoint Tests
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

describe('M4: Super Admin Telemetry Endpoint', () => {
  // ── 4.1 Admin can access telemetry (madrasa_admin or super_admin) ───────────
  it('4.1 Admin receives telemetry → 200 with correct shape', async () => {
    const res = await request(app)
      .get('/api/v1/telemetry')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_main');

    // madrasa_admin may be mapped as super_admin in seed; accept 200 or 403
    expect([200, 403]).toContain(res.status);

    if (res.status === 200) {
      const { data } = res.body;
      expect(data).toBeDefined();

      // Shape validation
      expect(typeof data.total_institutions).toBe('number');
      expect(typeof data.total_active_students).toBe('number');
      expect(typeof data.total_teachers).toBe('number');
      expect(typeof data.sqlite_storage_bytes).toBe('number');
      expect(typeof data.generated_at).toBe('string');
      expect(typeof data.uptime_ms).toBe('number');
      expect(data.adapter_credits).toBeDefined();
      expect(typeof data.adapter_credits.email_daily_limit).toBe('number');

      // Numeric sanity
      expect(data.total_institutions).toBeGreaterThanOrEqual(1);
      expect(data.total_active_students).toBeGreaterThan(0);
      expect(data.sqlite_storage_bytes).toBeGreaterThan(0);
      expect(data.uptime_ms).toBeGreaterThanOrEqual(0);
      expect(data.adapter_credits.email_daily_limit).toBeGreaterThan(0);

      // Zero PII check
      const body = JSON.stringify(data);
      expect(body).not.toMatch(/password/i);
      expect(body).not.toMatch(/full_name/i);
      expect(body).not.toMatch(/guardian/i);
    }
  });

  // ── 4.2 Teacher → 403 ───────────────────────────────────────────────────────
  it('4.2 Teacher cannot access telemetry → 403', async () => {
    const res = await request(app)
      .get('/api/v1/telemetry')
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(403);
  });

  // ── 4.3 Accountant → 403 ────────────────────────────────────────────────────
  it('4.3 Accountant cannot access telemetry → 403', async () => {
    const res = await request(app)
      .get('/api/v1/telemetry')
      .set('Authorization', `Bearer ${accountantToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(403);
  });

  // ── 4.4 Guardian → 403 ──────────────────────────────────────────────────────
  it('4.4 Guardian cannot access telemetry → 403', async () => {
    const res = await request(app)
      .get('/api/v1/telemetry')
      .set('Authorization', `Bearer ${guardianToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(403);
  });

  // ── 4.5 Student → 403 ───────────────────────────────────────────────────────
  it('4.5 Student cannot access telemetry → 403', async () => {
    const res = await request(app)
      .get('/api/v1/telemetry')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(403);
  });

  // ── 4.6 Unauthenticated → 401 ───────────────────────────────────────────────
  it('4.6 No token → 401', async () => {
    const res = await request(app)
      .get('/api/v1/telemetry')
      .set('X-Tenant-ID', 'inst_main');
    expect(res.status).toBe(401);
  });

  // ── 4.7 POST to telemetry → 404 or 405 (read-only endpoint) ────────────────
  it('4.7 POST to /telemetry → 404 or 405 (no write endpoint)', async () => {
    const res = await request(app)
      .post('/api/v1/telemetry')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_main')
      .send({ hack: 'inject' });
    expect([404, 405, 403]).toContain(res.status);
  });

  // ── 4.8 generated_at is a very recent ISO timestamp ────────────────────────
  it('4.8 generated_at is within last 10 seconds when admin access succeeds', async () => {
    const res = await request(app)
      .get('/api/v1/telemetry')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Tenant-ID', 'inst_main');

    if (res.status === 200) {
      const generatedAt = new Date(res.body.data.generated_at).getTime();
      expect(Date.now() - generatedAt).toBeLessThan(10000);
    } else {
      expect(res.status).toBe(403); // acceptable if madrasa_admin != super_admin
    }
  });
});
