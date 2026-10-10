import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';
import { db } from '../server/src/db/db.js';

describe('Milestone 2: Asatiza & Staff Payroll Lifecycle', () => {
  let adminToken: string;
  let principalToken: string;
  let accountantToken: string;
  let teacherToken: string;
  let hifzTeacherToken: string;
  let studentToken: string;

  let createdProfileId: string;
  let draftVoucherId: string;
  let verifiedVoucherId: string;
  let approvedVoucherId: string;
  let disbursedVoucherId: string;
  let qrCodeToken: string;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();

    // Reset seeded vouchers for idempotency
    await db.run(
      "UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_02'"
    );
    await db.run(
      "UPDATE payroll_vouchers SET status = 'accountant_verified', approved_by = NULL, disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_03'"
    );
    await db.run(
      "UPDATE payroll_vouchers SET status = 'draft', verified_by = NULL, approved_by = NULL, disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_04'"
    );

    // Clean up dynamic test vouchers and profiles from prior runs
    await db.run("DELETE FROM payroll_vouchers WHERE profile_id NOT IN ('prf_muhtamim', 'prf_shaykh', 'prf_senior_muhaddis', 'prf_kitab', 'prf_hifz', 'prf_nazir', 'prf_cook', 'prf_security') OR month = 'অক্টোবর' AND year = 2026 OR id LIKE 'test_%' OR voucher_number LIKE 'VCH-202610%'");
    await db.run("DELETE FROM staff_payroll_profiles WHERE id LIKE 'test_%' OR id NOT IN ('prf_muhtamim', 'prf_shaykh', 'prf_senior_muhaddis', 'prf_kitab', 'prf_hifz', 'prf_nazir', 'prf_cook', 'prf_security')");

    // 1. Login as Admin / Muhtamim
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'admin123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Login as Principal
    const principalRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'principal', password: 'admin123' });
    expect(principalRes.status).toBe(200);
    principalToken = principalRes.body.data.token;

    // 3. Login as Accountant
    const accountantRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'accountant_faruq', password: 'account123' });
    expect(accountantRes.status).toBe(200);
    accountantToken = accountantRes.body.data.token;

    // 4. Login as Teacher
    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher_rashid', password: 'teacher123' });
    expect(teacherRes.status).toBe(200);
    teacherToken = teacherRes.body.data.token;

    // 5. Login as Hifz Teacher
    const hifzRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'hafez_zubair', password: 'hifz123' });
    expect(hifzRes.status).toBe(200);
    hifzTeacherToken = hifzRes.body.data.token;

    // 6. Login as Student
    const studentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'student_abdullah', password: 'student123' });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.data.token;
  });

  beforeEach(async () => {
    // Reset vch_02 status to muhtamim_approved for test 2.13 or any voucher lifecycle test
    await db.run(
      "UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_02'"
    );
  });

  // Test 2.1
  it('2.1 Authenticates and acquires tokens for all payroll roles', () => {
    expect(adminToken).toBeTruthy();
    expect(principalToken).toBeTruthy();
    expect(accountantToken).toBeTruthy();
    expect(teacherToken).toBeTruthy();
    expect(hifzTeacherToken).toBeTruthy();
    expect(studentToken).toBeTruthy();
  });

  // Test 2.2
  it('2.2 Accountant creates a new staff payroll profile with designation and allowances', async () => {
    const res = await request(app)
      .post('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        staff_name: 'মাওলানা তরিকুল ইসলাম',
        designation: 'kitab_teacher',
        base_salary: 20000,
        housing_allowance: 5000,
        food_allowance: 2500,
        bonus_allowance: 1500,
        advance_loan_deduction: 1000,
        payment_method: 'bank',
        account_details: 'IBBL-205099887766'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.staff_name).toBe('মাওলানা তরিকুল ইসলাম');
    expect(res.body.data.designation).toBe('kitab_teacher');
    expect(res.body.data.base_salary).toBe(20000);
    expect(res.body.data.housing_allowance).toBe(5000);
    expect(res.body.data.food_allowance).toBe(2500);
    expect(res.body.data.bonus_allowance).toBe(1500);
    expect(res.body.data.advance_loan_deduction).toBe(1000);

    createdProfileId = res.body.data.id;
    expect(createdProfileId).toBeTruthy();
  });

  // Test 2.3
  it('2.3 Rejects profile creation with invalid designation or negative salary', async () => {
    const resInvalidDesig = await request(app)
      .post('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        staff_name: 'পরীক্ষামূলক স্টাফ',
        designation: 'invalid_designation_code',
        base_salary: 15000
      });

    expect(resInvalidDesig.status).toBe(400);
    expect(resInvalidDesig.body.success).toBe(false);

    const resNegativeSalary = await request(app)
      .post('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        staff_name: 'পরীক্ষামূলক স্টাফ',
        designation: 'security',
        base_salary: -5000
      });

    expect(resNegativeSalary.status).toBe(400);
    expect(resNegativeSalary.body.success).toBe(false);
  });

  // Test 2.4
  it('2.4 Lists staff payroll profiles for authorized accountant', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);

    // Verify key designation structures exist
    const designations = res.body.data.map((p: any) => p.designation);
    expect(designations).toContain('muhtamim');
    expect(designations).toContain('shaykhul_hadith');
    expect(designations).toContain('kitab_teacher');
    expect(designations).toContain('hifz_teacher');
  });

  // Test 2.5
  it('2.5 Updates an existing staff payroll profile allowances and deductions', async () => {
    // Adversarial validation checks: empty staff_name, invalid designation, negative base_salary
    const resEmptyName = await request(app)
      .put(`/api/v1/payroll/profiles/${createdProfileId}`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ staff_name: '   ' });
    expect(resEmptyName.status).toBe(400);

    const resInvalidDesig = await request(app)
      .put(`/api/v1/payroll/profiles/${createdProfileId}`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ designation: 'invalid_role_xyz' });
    expect(resInvalidDesig.status).toBe(400);

    const resNegativeSalary = await request(app)
      .put(`/api/v1/payroll/profiles/${createdProfileId}`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ base_salary: -5000 });
    expect(resNegativeSalary.status).toBe(400);

    // Valid update
    const res = await request(app)
      .put(`/api/v1/payroll/profiles/${createdProfileId}`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        base_salary: 22000,
        housing_allowance: 6000,
        bonus_allowance: 2000
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.base_salary).toBe(22000);
    expect(res.body.data.housing_allowance).toBe(6000);
    expect(res.body.data.bonus_allowance).toBe(2000);
  });

  // Test 2.6
  it('2.6 Generates monthly salary vouchers for active staff profiles', async () => {
    const res = await request(app)
      .post('/api/v1/payroll/vouchers/generate-monthly')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        month: 'অক্টোবর',
        year: 2026
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Store a draft voucher for lifecycle tests
    const draftVoucher = res.body.data.find((v: any) => v.status === 'draft');
    expect(draftVoucher).toBeDefined();
    expect(draftVoucher.status).toBe('draft');
    expect(draftVoucher.voucher_number).toContain('PAY-2026');
    expect(draftVoucher.qr_code_token).toBeTruthy();

    draftVoucherId = draftVoucher.id;
  });

  // Test 2.7
  it('2.7 Verifies exact net salary calculation formula on drafted vouchers', async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/vouchers?month=অক্টোবর&year=2026`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const voucher of res.body.data) {
      const rawNet =
        voucher.base_salary +
        voucher.housing_allowance +
        voucher.food_allowance +
        voucher.bonus_allowance -
        voucher.advance_loan_deduction -
        voucher.absent_deduction;
      const expectedNet = Math.max(0, rawNet);

      expect(voucher.net_payable).toBe(expectedNet);
      expect(voucher.net_payable).toBeGreaterThanOrEqual(0);
    }
  });

  // Test 2.8
  it('2.8 Accountant verifies draft voucher (draft -> accountant_verified)', async () => {
    const res = await request(app)
      .post(`/api/v1/payroll/vouchers/${draftVoucherId}/verify`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('accountant_verified');
    expect(res.body.data.verified_by).toBeTruthy();

    verifiedVoucherId = res.body.data.id;
  });

  // Test 2.9
  it('2.9 Blocks unauthorized users (teachers, accountants) from approving vouchers', async () => {
    // Teacher attempting to approve
    const resTeacher = await request(app)
      .post(`/api/v1/payroll/vouchers/${verifiedVoucherId}/approve`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(resTeacher.status).toBe(403);
    expect(resTeacher.body.success).toBe(false);

    // Accountant attempting to approve (approval must be muhtamim / principal)
    const resAccountant = await request(app)
      .post(`/api/v1/payroll/vouchers/${verifiedVoucherId}/approve`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(resAccountant.status).toBe(403);
    expect(resAccountant.body.success).toBe(false);
  });

  // Test 2.10
  it('2.10 Muhtamim / Principal approves verified voucher (accountant_verified -> muhtamim_approved)', async () => {
    const res = await request(app)
      .post(`/api/v1/payroll/vouchers/${verifiedVoucherId}/approve`)
      .set('Authorization', `Bearer ${principalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('muhtamim_approved');
    expect(res.body.data.approved_by).toBeTruthy();

    approvedVoucherId = res.body.data.id;
  });

  // Test 2.11
  it('2.11 Premature disbursement strictly rejected with HTTP 400 Bad Request', async () => {
    // Attempt to disburse seeded vch_03 which is in 'accountant_verified' status
    const resVerified = await request(app)
      .post(`/api/v1/payroll/vouchers/vch_03/disburse`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ disbursement_method: 'cash' });

    expect(resVerified.status).toBe(400);
    expect(resVerified.body.success).toBe(false);

    // Attempt to disburse seeded vch_04 which is in 'draft' status
    const resDraft = await request(app)
      .post(`/api/v1/payroll/vouchers/vch_04/disburse`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ disbursement_method: 'cash' });

    expect(resDraft.status).toBe(400);
    expect(resDraft.body.success).toBe(false);
  });

  // Test 2.12
  it('2.12 Accountant disburses muhtamim-approved voucher with transaction reference', async () => {
    const res = await request(app)
      .post(`/api/v1/payroll/vouchers/${approvedVoucherId}/disburse`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        disbursement_method: 'bank',
        transaction_reference: 'TRX_IBBL_TEST_9901'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('disbursed');
    expect(res.body.data.disbursed_by).toBeTruthy();
    expect(res.body.data.disbursement_method).toBe('bank');
    expect(res.body.data.transaction_reference).toBe('TRX_IBBL_TEST_9901');
    expect(res.body.data.disbursed_at).toBeTruthy();

    disbursedVoucherId = res.body.data.id;
  });

  // Test 2.13
  it('2.13 Cash disbursement integrates into expense ledgers and daily cash book', async () => {
    // Reset vch_02 to muhtamim_approved to guarantee test idempotency
    await db.run(
      "UPDATE payroll_vouchers SET status = 'muhtamim_approved', disbursed_by = NULL, disbursement_method = NULL, transaction_reference = NULL, disbursed_at = NULL WHERE id = 'vch_02'"
    );

    const resCash = await request(app)
      .post(`/api/v1/payroll/vouchers/vch_02/disburse`)
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        disbursement_method: 'cash',
        transaction_reference: 'VCH_CASH_SAL_OCT_01'
      });

    expect(resCash.status).toBe(200);
    expect(resCash.body.data.status).toBe('disbursed');
    expect(resCash.body.data.disbursement_method).toBe('cash');

    // Verify daily cash book reflects the expense
    const today = new Date().toISOString().split('T')[0];
    const cbRes = await request(app)
      .get(`/api/v1/finance/cash-book/daily?date=${today}`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(cbRes.status).toBe(200);
    expect(cbRes.body.data).toBeDefined();
    expect(cbRes.body.data.cash_expenses).toBeGreaterThanOrEqual(resCash.body.data.net_payable);
  });

  // Test 2.14
  it('2.14 Payslip endpoint returns complete voucher payload with HMAC QR token', async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/vouchers/${disbursedVoucherId}/payslip`)
      .set('Authorization', `Bearer ${accountantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.voucher).toBeDefined();
    expect(res.body.data.voucher.net_payable).toBeGreaterThan(0);
    expect(res.body.data.institutionNameBn).toContain('মাদ্রাসা');
    expect(res.body.data.qrCodeToken).toBeTruthy();
    expect(res.body.data.qrVerificationUrl).toContain('/verify-qr/');

    qrCodeToken = res.body.data.qrCodeToken;
  });

  // Test 2.15
  it('2.15 Public QR token verification validates authentic vouchers and rejects forged tokens', async () => {
    // Valid authentic token check
    const resValid = await request(app)
      .get(`/api/v1/payroll/vouchers/verify-qr/${qrCodeToken}`);

    expect(resValid.status).toBe(200);
    expect(resValid.body.success).toBe(true);
    expect(resValid.body.data).toBeDefined();
    expect(resValid.body.data.voucher_number).toBeTruthy();
    expect(resValid.body.data.staff_name).toBeTruthy();
    expect(resValid.body.data.status).toBe('disbursed');

    // Forged/fake token check
    const fakeToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const resForged = await request(app)
      .get(`/api/v1/payroll/vouchers/verify-qr/${fakeToken}`);

    expect(resForged.status).toBe(400);
    expect(resForged.body.success).toBe(false);
  });

  // Test 2.16
  it('2.16 RBAC: Teachers are strictly blocked from full payroll voucher lists and staff profiles', async () => {
    // Teacher blocked from full voucher list
    const resVouchers = await request(app)
      .get('/api/v1/payroll/vouchers')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(resVouchers.status).toBe(403);
    expect(resVouchers.body.success).toBe(false);
    expect(resVouchers.body.error.code).toBe('FORBIDDEN');

    // Hifz teacher blocked from profiles
    const resProfiles = await request(app)
      .get('/api/v1/payroll/profiles')
      .set('Authorization', `Bearer ${hifzTeacherToken}`);

    expect(resProfiles.status).toBe(403);
    expect(resProfiles.body.success).toBe(false);
    expect(resProfiles.body.error.code).toBe('FORBIDDEN');

    // Student blocked from full payroll
    const resStudent = await request(app)
      .get('/api/v1/payroll/vouchers')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(resStudent.status).toBe(403);
    expect(resStudent.body.success).toBe(false);
  });

  // Test 2.17
  it('2.17 RBAC: Teachers can view own payslips, but are strictly blocked from other teachers payslips', async () => {
    // Teacher fetches own payslips list
    const resMyPayslips = await request(app)
      .get('/api/v1/payroll/my-payslips')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(resMyPayslips.status).toBe(200);
    expect(resMyPayslips.body.success).toBe(true);
    expect(Array.isArray(resMyPayslips.body.data)).toBe(true);
    // Teacher Harunur Rashid (prf_kitab) has seeded vch_03
    const hasOwnVoucher = resMyPayslips.body.data.some((v: any) => v.id === 'vch_03');
    expect(hasOwnVoucher).toBe(true);

    // Teacher accessing own payslip (vch_03)
    const resOwnPayslip = await request(app)
      .get('/api/v1/payroll/vouchers/vch_03/payslip')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(resOwnPayslip.status).toBe(200);
    expect(resOwnPayslip.body.success).toBe(true);
    expect(resOwnPayslip.body.data.voucher.staff_name).toBe('মাওলানা হারুনুর রশিদ');

    // Teacher attempting to view Muhtamim's payslip (vch_01) -> MUST return 403 Forbidden
    const resOtherPayslip = await request(app)
      .get('/api/v1/payroll/vouchers/vch_01/payslip')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(resOtherPayslip.status).toBe(403);
    expect(resOtherPayslip.body.success).toBe(false);
    expect(resOtherPayslip.body.error.code).toBe('FORBIDDEN');
  });
});
