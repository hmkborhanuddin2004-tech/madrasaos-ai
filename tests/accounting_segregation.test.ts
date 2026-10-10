import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';

describe('Milestone 1: Accounting Segregation & Ledger Isolation', () => {
  let adminToken: string;
  let accountantToken: string;
  let teacherToken: string;
  let studentToken: string;

  let residentialInvoiceId: string;
  let nonResidentialInvoiceId: string;

  const uniqueTxn1 = `TXN_RES_PARTIAL_${Date.now()}`;
  const uniqueTxn2 = `TXN_RES_FULL_${Date.now()}`;
  const uniqueTxn3 = `TXN_OVERPAY_${Date.now()}`;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();

    // 1. Login as Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'admin123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Login as Accountant
    const accountantRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'accountant_faruq', password: 'account123' });
    expect(accountantRes.status).toBe(200);
    accountantToken = accountantRes.body.data.token;

    // 3. Login as Teacher
    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher_rashid', password: 'teacher123' });
    expect(teacherRes.status).toBe(200);
    teacherToken = teacherRes.body.data.token;

    // 4. Login as Student (std_001)
    const studentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student_abdullah', password: 'student123' });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.data.token;
  });

  // Test 1.1
  it('1.1 Authenticates and acquires JWT tokens for all financial roles', async () => {
    expect(adminToken).toBeTruthy();
    expect(accountantToken).toBeTruthy();
    expect(teacherToken).toBeTruthy();
    expect(studentToken).toBeTruthy();
  });

  // Test 1.2
  it('1.2 Generates residential invoice with mess/boarding charges', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        student_id: 'std_002',
        ledger_type: 'residential',
        month: 'অক্টোবর',
        year: 2026,
        fee_items: [
          { title: 'মেস ও খোরাকি চার্জ (Meal/Mess)', amount: 3000 },
          { title: 'হোস্টেল সিট ও বেড ভাড়া (Boarding Rent)', amount: 1000 },
          { title: 'লন্ড্রি ও ইউটিলিটি চার্জ (Laundry/Utility)', amount: 500 }
        ],
        due_date: '2026-10-10'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ledger_type).toBe('residential');
    expect(res.body.data.total_amount).toBe(4500);
    expect(res.body.data.due_amount).toBe(4500);
    expect(res.body.data.paid_amount).toBe(0);
    expect(res.body.data.status).toBe('unpaid');
    expect(res.body.data.fee_items.length).toBe(3);

    residentialInvoiceId = res.body.data.id;
    expect(residentialInvoiceId).toBeTruthy();
  });

  // Test 1.3
  it('1.3 Generates non-residential invoice with academic tuition/session items', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: 'std_001',
        ledger_type: 'non_residential',
        month: 'অক্টোবর',
        year: 2026,
        fee_items: [
          { title: 'মাসিক একাডেমিক বেতন (Tuition)', amount: 1800 },
          { title: 'বার্ষিক সেশন ফি (Session Fee)', amount: 500 }
        ],
        due_date: '2026-10-10'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ledger_type).toBe('non_residential');
    expect(res.body.data.total_amount).toBe(2300);
    expect(res.body.data.due_amount).toBe(2300);
    expect(res.body.data.paid_amount).toBe(0);

    nonResidentialInvoiceId = res.body.data.id;
    expect(nonResidentialInvoiceId).toBeTruthy();
  });

  // Test 1.4
  it('1.4 Segregated retrieval: ?type=residential returns only residential invoices', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices?type=residential')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const inv of res.body.data) {
      expect(inv.ledger_type).toBe('residential');
      expect(inv.ledger_type).not.toBe('non_residential');
    }
  });

  // Test 1.5
  it('1.5 Segregated retrieval: ?type=non_residential returns only non-residential invoices', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices?type=non_residential')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const inv of res.body.data) {
      expect(inv.ledger_type).toBe('non_residential');
      expect(inv.ledger_type).not.toBe('residential');
    }
  });

  // Test 1.6
  it('1.6 Records partial payment on residential invoice via bKash', async () => {
    const res = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: residentialInvoiceId,
        amount: 2000,
        paymentMethod: 'bkash',
        transactionId: uniqueTxn1
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2000);
    expect(res.body.data.newDue).toBe(2500);
    expect(res.body.data.invoiceStatus).toBe('partially_paid');
  });

  // Test 1.7
  it('1.7 Confirms ledger balance reflects partial payment accurately', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices?type=residential')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    const updated = res.body.data.find((i: any) => i.id === residentialInvoiceId);
    expect(updated).toBeDefined();
    expect(updated.paid_amount).toBe(2000);
    expect(updated.due_amount).toBe(2500);
    expect(updated.status).toBe('partially_paid');
  });

  // Test 1.8
  it('1.8 Clears remaining residential balance to 0 with final payment', async () => {
    const res = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: residentialInvoiceId,
        amount: 2500,
        paymentMethod: 'nagad',
        transactionId: uniqueTxn2
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newDue).toBe(0);
    expect(res.body.data.invoiceStatus).toBe('paid');
  });

  // Test 1.9
  it('1.9 Rejects duplicate digital transaction ID with HTTP 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: nonResidentialInvoiceId,
        amount: 500,
        paymentMethod: 'bkash',
        transactionId: uniqueTxn1 // Reusing txn1
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_TRANSACTION');
  });

  // Test 1.10
  it('1.10 Rejects payment attempts on already fully paid invoice', async () => {
    const res = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: residentialInvoiceId,
        amount: 500,
        paymentMethod: 'bkash',
        transactionId: uniqueTxn3
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVOICE_ALREADY_PAID');
  });

  // Test 1.11
  it('1.11 Rejects zero and negative payment amounts with 400', async () => {
    const resZero = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: nonResidentialInvoiceId,
        amount: 0,
        paymentMethod: 'cash'
      });
    expect(resZero.status).toBe(400);
    expect(resZero.body.error.code).toBe('INVALID_AMOUNT');

    const resNeg = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: nonResidentialInvoiceId,
        amount: -250,
        paymentMethod: 'cash'
      });
    expect(resNeg.status).toBe(400);
    expect(resNeg.body.error.code).toBe('INVALID_AMOUNT');
  });

  // Test 1.12
  it('1.12 Rejects invoice creation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        month: 'অক্টোবর',
        year: 2026
        // missing student_id and ledger_type
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Test 1.13
  it('1.13 RBAC: Blocks Teacher from creating financial invoice (HTTP 403)', async () => {
    const res = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        student_id: 'std_001',
        ledger_type: 'non_residential',
        fee_items: [{ title: 'টিউশন ফি', amount: 1000 }]
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // Test 1.14
  it('1.14 RBAC: Blocks Teacher from querying segregated financial invoices (HTTP 403)', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices?type=residential')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // Test 1.15
  it('1.15 RBAC: Restricts Student to strictly viewing their own linked invoices', async () => {
    const res = await request(app)
      .get('/api/v1/finance/invoices?type=non_residential')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const inv of res.body.data) {
      expect(inv.student_id).toBe('std_001');
    }
  });
});
