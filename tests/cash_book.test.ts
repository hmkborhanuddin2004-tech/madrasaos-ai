import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';

describe('Milestone 1: Daily Cash Book & Bank Deposit Ledgers', () => {
  let adminToken: string;
  let accountantToken: string;
  let teacherToken: string;

  let bankAccountId: string;
  let testStudentInvoiceId: string;
  let donorId: string;

  const targetDate = '2026-10-05';
  const nextDate = '2026-10-06';
  const uniqueAccNumber = `ACC_${Date.now()}`;
  const uniqueSlipNumber = `SLIP_IBBL_${Date.now()}`;
  const uniqueCashReceiptNo = `CSH_DON_${Date.now()}`;
  const voucher1 = `VOUCH_FOOD_${Date.now()}`;
  const voucher2 = `VOUCH_UTIL_${Date.now()}`;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();

    // 1. Admin token
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'admin123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Accountant token
    const accountantRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'accountant_faruq', password: 'account123' });
    expect(accountantRes.status).toBe(200);
    accountantToken = accountantRes.body.data.token;

    // 3. Teacher token
    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher_rashid', password: 'teacher123' });
    expect(teacherRes.status).toBe(200);
    teacherToken = teacherRes.body.data.token;

    // 4. Create a dedicated invoice for student std_001 for cash payment testing
    const invRes = await request(app)
      .post('/api/v1/finance/invoices')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        student_id: 'std_001',
        ledger_type: 'non_residential',
        month: 'অক্টোবর',
        year: 2026,
        fee_items: [{ title: 'টিউশন ফি', amount: 3500 }],
        due_date: '2026-10-10'
      });
    expect(invRes.status).toBe(201);
    testStudentInvoiceId = invRes.body.data.id;

    // 5. Create a dedicated donor for cash donation testing
    const donorRes = await request(app)
      .post('/api/v1/finance/donations/donors')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        name: 'হাজী জয়নাল আবেদীন',
        category: 'one_time',
        contact_phone: '01799887766'
      });
    expect(donorRes.status).toBe(201);
    donorId = donorRes.body.data.id;
  });

  // Test 3.1
  it('3.1 Creates an institutional bank account with opening liquid balance', async () => {
    const res = await request(app)
      .post('/api/v1/finance/bank-accounts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        bank_name: 'Islami Bank Bangladesh PLC',
        account_number: uniqueAccNumber,
        branch_name: 'মিরপুর শাখা',
        current_balance: 100000
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account_number).toBe(uniqueAccNumber);
    expect(res.body.data.current_balance).toBe(100000);

    bankAccountId = res.body.data.id;
    expect(bankAccountId).toBeTruthy();
  });

  // Test 3.2
  it('3.2 Retrieves list of institutional bank accounts', async () => {
    const res = await request(app)
      .get('/api/v1/finance/bank-accounts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((b: any) => b.id === bankAccountId);
    expect(found).toBeDefined();
    expect(found.account_number).toBe(uniqueAccNumber);
  });

  // Test 3.3
  it('3.3 Posts cash fee collection on target date', async () => {
    const res = await request(app)
      .post('/api/v1/finance/payments/collect')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: testStudentInvoiceId,
        amount: 3000,
        paymentMethod: 'cash',
        date: targetDate
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(3000);
  });

  // Test 3.4
  it('3.4 Posts cash donation on target date (Total Collections = 10,000)', async () => {
    const res = await request(app)
      .post('/api/v1/finance/donations/receipts')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        donor_id: donorId,
        fund_type: 'general',
        amount: 7000,
        payment_method: 'cash',
        receipt_no: uniqueCashReceiptNo,
        date: targetDate
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(7000);
    expect(res.body.data.payment_method).toBe('cash');
  });

  // Test 3.5
  it('3.5 Posts cash expense #1 (food ration ৳2,500) on target date', async () => {
    const res = await request(app)
      .post('/api/v1/finance/expenses')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        category: 'food_ration',
        amount: 2500,
        payment_method: 'cash',
        voucher_number: voucher1,
        payee: 'মেসার্স মদিনা ট্রেডার্স',
        approved_by: 'মুহতামিম',
        date: targetDate,
        description: 'আবাসিক ছাত্রদের খাবার বাজার'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Test 3.6
  it('3.6 Posts cash expense #2 (utility bill ৳1,500) on target date (Total Expenses = 4,000)', async () => {
    const res = await request(app)
      .post('/api/v1/finance/expenses')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        category: 'utility',
        amount: 1500,
        payment_method: 'cash',
        voucher_number: voucher2,
        payee: 'ডেসকো বিদ্যুৎ বিল',
        approved_by: 'মুহতামিম',
        date: targetDate,
        description: 'বিদ্যুৎ বিল ক্যাশ পরিশোধ'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // Test 3.7
  it('3.7 Records bank deposit slip (৳5,000 drawer cash deposited to Bank)', async () => {
    const res = await request(app)
      .post('/api/v1/finance/cash-book/bank-deposits')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        bank_account_id: bankAccountId,
        amount: 5000,
        deposit_slip_number: uniqueSlipNumber,
        deposit_date: targetDate,
        deposited_by: 'মুহাম্মদ ফারুক হোসেন',
        notes: 'নগদ ক্যাশ থেকে ব্যাংক ডিপোজিট'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(5000);
    expect(res.body.data.newBankBalance).toBe(105000); // 100,000 + 5,000
  });

  // Test 3.8
  it('3.8 Daily Cash Book verifies equation: Closing = Opening + Collections - Expenses - Bank Deposits', async () => {
    const res = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${targetDate}`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cb = res.body.data;
    expect(cb.date).toBe(targetDate);
    expect(cb.collections_total).toBeGreaterThanOrEqual(10000);
    expect(cb.expenses_total).toBeGreaterThanOrEqual(4000);
    expect(cb.bank_deposits_total).toBeGreaterThanOrEqual(5000);

    // Fundamental accounting equation verification
    const expectedClosing = cb.opening_balance + cb.collections_total - cb.expenses_total - cb.bank_deposits_total;
    expect(cb.closing_balance).toBe(expectedClosing);
  });

  // Test 3.9
  it('3.9 Verifies daily cash book itemized ledger entries list', async () => {
    const res = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${targetDate}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const entries = res.body.data.entries;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(4);

    // Check entry types present
    const types = entries.map((e: any) => e.type);
    expect(types).toContain('fee_collection');
    expect(types).toContain('donation');
    expect(types).toContain('expense');
    expect(types).toContain('bank_deposit');
  });

  // Test 3.10
  it('3.10 Verifies multi-day continuity: Next day opening balance strictly equals previous day closing balance', async () => {
    const day1Res = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${targetDate}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const day2Res = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${nextDate}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(day1Res.status).toBe(200);
    expect(day2Res.status).toBe(200);
    expect(day2Res.body.data.opening_balance).toBe(day1Res.body.data.closing_balance);
  });

  // Test 3.11
  it('3.11 RBAC: Blocks Teacher from viewing daily cash book and depositing cash (HTTP 403)', async () => {
    const readRes = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${targetDate}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(readRes.status).toBe(403);
    expect(readRes.body.error.code).toBe('FORBIDDEN');

    const writeRes = await request(app)
      .post('/api/v1/finance/cash-book/bank-deposits')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        bank_account_id: bankAccountId,
        amount: 1000,
        deposit_slip_number: 'ILLEGAL_SLIP',
        deposit_date: targetDate,
        deposited_by: 'অননুমোদিত শিক্ষক'
      });
    expect(writeRes.status).toBe(403);
    expect(writeRes.body.error.code).toBe('FORBIDDEN');
  });
});
