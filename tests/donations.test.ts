import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';

describe('Milestone 1: Donations, Grants & Ring-Fenced Fund Isolation', () => {
  let adminToken: string;
  let accountantToken: string;
  let teacherToken: string;

  let permanentDonorId: string;
  let anonymousDonorId: string;

  const lilReceiptNo = `LIL_RCP_${Date.now()}`;
  const genReceiptNo = `GEN_RCP_${Date.now()}`;
  const wqfReceiptNo = `WQF_RCP_${Date.now()}`;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();

    // Login as Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'admin123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // Login as Accountant
    const accountantRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'accountant_faruq', password: 'account123' });
    expect(accountantRes.status).toBe(200);
    accountantToken = accountantRes.body.data.token;

    // Login as Teacher
    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher_rashid', password: 'teacher123' });
    expect(teacherRes.status).toBe(200);
    teacherToken = teacherRes.body.data.token;
  });

  // Test 2.1
  it('2.1 Registers a permanent donor with recurring commitment', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/donors')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        name: 'হাজী সামসুল আলম',
        org_name: 'আলম টেক্সটাইল মিলস লিমিটেড',
        category: 'permanent',
        contact_phone: '01711223344',
        whatsapp: '01711223344',
        email: 'shamsul.alam@example.com',
        commitment_frequency: 'monthly'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe('permanent');
    expect(res.body.data.name).toBe('হাজী সামসুল আলম');

    permanentDonorId = res.body.data.id;
    expect(permanentDonorId).toBeTruthy();
  });

  // Test 2.2
  it('2.2 Registers an anonymous benefactor without public branding', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/donors')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        name: 'বেনামী শুভাকাঙ্ক্ষী',
        category: 'anonymous',
        contact_phone: '01800000000'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe('anonymous');

    anonymousDonorId = res.body.data.id;
    expect(anonymousDonorId).toBeTruthy();
  });

  // Test 2.3
  it('2.3 Filters donor registry by category (permanent)', async () => {
    const res = await request(app)
      .get('/api/v1/finance/donations/donors?category=permanent')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const donor of res.body.data) {
      expect(donor.category).toBe('permanent');
    }
  });

  // Test 2.4
  it('2.4 Issues ring-fenced Lillah & Orphan Fund receipt (যাকাত তহবিল)', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: permanentDonorId,
        fund_type: 'lillah_orphan',
        amount: 50000,
        payment_method: 'bank',
        receipt_no: lilReceiptNo,
        notes: 'যাকাত ও ফিতরা তহবিল'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fund_type).toBe('lillah_orphan');
    expect(res.body.data.amount).toBe(50000);
    expect(res.body.data.receipt_no).toBe(lilReceiptNo);
  });

  // Test 2.5
  it('2.5 Issues General Operational Fund receipt (সাধারণ প্রাতিষ্ঠানিক অনুদান)', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: permanentDonorId,
        fund_type: 'general',
        amount: 20000,
        payment_method: 'cash',
        receipt_no: genReceiptNo,
        notes: 'বিদ্যুৎ বিল ও সাধারণ অনুদান'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fund_type).toBe('general');
    expect(res.body.data.amount).toBe(20000);
  });

  // Test 2.6
  it('2.6 Issues Waqf & Construction Fund receipt (মসজিদ ও ভবন ওয়াকফ)', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: anonymousDonorId,
        fund_type: 'waqf_construction',
        amount: 100000,
        payment_method: 'bank',
        receipt_no: wqfReceiptNo,
        notes: 'মসজিদ সম্প্রসারণ ও ভবন নির্মাণ'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fund_type).toBe('waqf_construction');
    expect(res.body.data.amount).toBe(100000);
  });

  // Test 2.7
  it('2.7 Verifies fund summary aggregates with strict mathematical fund isolation', async () => {
    const res = await request(app)
      .get('/api/v1/finance/donations/funds/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.funds).toBeDefined();
    expect(data.funds.lillah_orphan.total_amount).toBeGreaterThanOrEqual(50000);
    expect(data.funds.general.total_amount).toBeGreaterThanOrEqual(20000);
    expect(data.funds.waqf_construction.total_amount).toBeGreaterThanOrEqual(100000);

    // Sum of distinct ring-fenced funds must strictly equal the total collected
    const expectedSum =
      data.funds.lillah_orphan.total_amount +
      data.funds.general.total_amount +
      data.funds.waqf_construction.total_amount;

    expect(data.total_collected).toBe(expectedSum);
  });

  // Test 2.8
  it('2.8 Verifies zero cross-fund leakage in receipts filtered by fund_type', async () => {
    const res = await request(app)
      .get('/api/v1/finance/donations/receipts?fund_type=lillah_orphan')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const receipt of res.body.data) {
      expect(receipt.fund_type).toBe('lillah_orphan');
      expect(receipt.fund_type).not.toBe('general');
      expect(receipt.fund_type).not.toBe('waqf_construction');
    }
  });

  // Test 2.9
  it('2.9 Rejects duplicate receipt number with HTTP 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: permanentDonorId,
        fund_type: 'lillah_orphan',
        amount: 10000,
        payment_method: 'cash',
        receipt_no: lilReceiptNo // Reusing receipt number
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_RECEIPT');
  });

  // Test 2.10
  it('2.10 Rejects invalid fund types with HTTP 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: permanentDonorId,
        fund_type: 'crypto_fund_speculative',
        amount: 5000,
        payment_method: 'cash'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_FUND_TYPE');
  });

  // Test 2.11
  it('2.11 Rejects zero and negative donation amounts with HTTP 400', async () => {
    const resZero = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: permanentDonorId,
        fund_type: 'general',
        amount: 0,
        payment_method: 'cash'
      });

    expect(resZero.status).toBe(400);
    expect(resZero.body.error.code).toBe('INVALID_AMOUNT');

    const resNeg = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: permanentDonorId,
        fund_type: 'general',
        amount: -1000,
        payment_method: 'cash'
      });

    expect(resNeg.status).toBe(400);
    expect(resNeg.body.error.code).toBe('INVALID_AMOUNT');
  });

  // Test 2.12
  it('2.12 RBAC: Blocks Teacher from accessing donor registry and issuing receipts (HTTP 403)', async () => {
    const listRes = await request(app)
      .get('/api/v1/finance/donations/donors')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(listRes.status).toBe(403);
    expect(listRes.body.error.code).toBe('FORBIDDEN');

    const createRes = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        donor_id: permanentDonorId,
        fund_type: 'general',
        amount: 1000,
        payment_method: 'cash'
      });
    expect(createRes.status).toBe(403);
    expect(createRes.body.error.code).toBe('FORBIDDEN');
  });
});
