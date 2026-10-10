import crypto from 'crypto';
import { db } from '../db/db.js';
import {
  StaffDesignation,
  PayrollStatus,
  PayrollDisbursementMethod,
  StaffPayrollProfile,
  PayrollVoucher,
  PayslipData
} from '../types/index.js';

export interface CreateProfileDTO {
  organization_id?: string;
  user_id?: string;
  staff_name: string;
  designation: StaffDesignation;
  base_salary: number;
  housing_allowance?: number;
  food_allowance?: number;
  bonus_allowance?: number;
  advance_loan_deduction?: number;
  payment_method?: PayrollDisbursementMethod;
  account_details?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateProfileDTO {
  user_id?: string;
  staff_name?: string;
  designation?: StaffDesignation;
  base_salary?: number;
  housing_allowance?: number;
  food_allowance?: number;
  bonus_allowance?: number;
  advance_loan_deduction?: number;
  payment_method?: PayrollDisbursementMethod;
  account_details?: string;
  status?: 'active' | 'inactive';
}

export interface GenerateVouchersDTO {
  month: string;
  year: number;
  organizationId?: string;
  tenantId?: string;
  generatedBy?: string;
}

export interface DisburseVoucherDTO {
  disbursement_method?: PayrollDisbursementMethod;
  transaction_reference?: string;
  bank_account_id?: string;
  notes?: string;
}

export class PayrollService {
  private secretKey = process.env.JWT_SECRET || 'madrasaos-secret-key-bangladesh-2026';

  /**
   * Generates a cryptographic HMAC-SHA256 QR validation token for a payroll voucher.
   */
  public generateQrToken(voucherNumber: string, netPayable: number, month: string, year: number): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(`${voucherNumber}:${netPayable}:${month}:${year}`)
      .digest('hex');
  }

  /**
   * Retrieves all staff payroll profiles for an organization.
   */
  public async getProfiles(organizationId: string = 'org_main'): Promise<StaffPayrollProfile[]> {
    const rows = await db.all<any>(
      `SELECT * FROM staff_payroll_profiles WHERE organization_id = ? ORDER BY created_at ASC`,
      [organizationId]
    );

    return rows.map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id,
      user_id: row.user_id,
      staff_name: row.staff_name,
      designation: row.designation as StaffDesignation,
      base_salary: Number(row.base_salary || 0),
      housing_allowance: Number(row.housing_allowance || 0),
      food_allowance: Number(row.food_allowance || 0),
      bonus_allowance: Number(row.bonus_allowance || 0),
      advance_loan_deduction: Number(row.advance_loan_deduction || 0),
      payment_method: (row.payment_method || 'cash') as PayrollDisbursementMethod,
      account_details: row.account_details || '',
      status: (row.status || 'active') as 'active' | 'inactive',
      created_at: row.created_at
    }));
  }

  /**
   * Retrieves a single staff payroll profile by ID.
   */
  public async getProfileById(id: string): Promise<StaffPayrollProfile | null> {
    const row = await db.get<any>(
      `SELECT * FROM staff_payroll_profiles WHERE id = ?`,
      [id]
    );
    if (!row) return null;

    return {
      id: row.id,
      organization_id: row.organization_id,
      user_id: row.user_id,
      staff_name: row.staff_name,
      designation: row.designation as StaffDesignation,
      base_salary: Number(row.base_salary || 0),
      housing_allowance: Number(row.housing_allowance || 0),
      food_allowance: Number(row.food_allowance || 0),
      bonus_allowance: Number(row.bonus_allowance || 0),
      advance_loan_deduction: Number(row.advance_loan_deduction || 0),
      payment_method: (row.payment_method || 'cash') as PayrollDisbursementMethod,
      account_details: row.account_details || '',
      status: (row.status || 'active') as 'active' | 'inactive',
      created_at: row.created_at
    };
  }

  /**
   * Retrieves a staff profile by linked user ID.
   */
  public async getProfileByUserId(userId: string): Promise<StaffPayrollProfile | null> {
    const row = await db.get<any>(
      `SELECT * FROM staff_payroll_profiles WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    if (!row) return null;

    return {
      id: row.id,
      organization_id: row.organization_id,
      user_id: row.user_id,
      staff_name: row.staff_name,
      designation: row.designation as StaffDesignation,
      base_salary: Number(row.base_salary || 0),
      housing_allowance: Number(row.housing_allowance || 0),
      food_allowance: Number(row.food_allowance || 0),
      bonus_allowance: Number(row.bonus_allowance || 0),
      advance_loan_deduction: Number(row.advance_loan_deduction || 0),
      payment_method: (row.payment_method || 'cash') as PayrollDisbursementMethod,
      account_details: row.account_details || '',
      status: (row.status || 'active') as 'active' | 'inactive',
      created_at: row.created_at
    };
  }

  /**
   * Creates a new staff payroll profile.
   */
  public async createProfile(dto: CreateProfileDTO): Promise<StaffPayrollProfile> {
    if (!dto.staff_name || !dto.staff_name.trim()) {
      const err: any = new Error('স্টাফের নাম প্রদান আবশ্যক (staff_name is required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    if (!dto.designation) {
      const err: any = new Error('পদবী নির্বাচন আবশ্যক (designation is required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const validDesignations: StaffDesignation[] = [
      'muhtamim',
      'shaykhul_hadith',
      'senior_muhaddis',
      'kitab_teacher',
      'hifz_teacher',
      'nazir_office',
      'cook_hostel',
      'security'
    ];

    if (!validDesignations.includes(dto.designation)) {
      const err: any = new Error(`অকার্যকর পদবী (Invalid designation: ${dto.designation})`);
      err.statusCode = 400;
      err.code = 'INVALID_DESIGNATION';
      throw err;
    }

    const baseSalary = Number(dto.base_salary);
    if (isNaN(baseSalary) || baseSalary < 0) {
      const err: any = new Error('মূল বেতন অবশ্যই একটি অঋণাত্মক সংখ্যা হতে হবে (base_salary must be a non-negative number)');
      err.statusCode = 400;
      err.code = 'INVALID_SALARY';
      throw err;
    }

    const id = `prf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const organizationId = dto.organization_id || 'org_main';
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO staff_payroll_profiles (
        id, organization_id, user_id, staff_name, designation,
        base_salary, housing_allowance, food_allowance, bonus_allowance,
        advance_loan_deduction, payment_method, account_details, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        organizationId,
        dto.user_id || null,
        dto.staff_name.trim(),
        dto.designation,
        baseSalary,
        Number(dto.housing_allowance || 0),
        Number(dto.food_allowance || 0),
        Number(dto.bonus_allowance || 0),
        Number(dto.advance_loan_deduction || 0),
        dto.payment_method || 'cash',
        dto.account_details || '',
        dto.status || 'active',
        now
      ]
    );

    const created = await this.getProfileById(id);
    return created!;
  }

  /**
   * Updates an existing staff payroll profile.
   */
  public async updateProfile(id: string, dto: UpdateProfileDTO): Promise<StaffPayrollProfile> {
    const existing = await this.getProfileById(id);
    if (!existing) {
      const err: any = new Error('স্টাফ প্রোফাইল পাওয়া যায়নি (Staff profile not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Validate staff_name if provided
    if (dto.staff_name !== undefined) {
      if (!dto.staff_name || !dto.staff_name.trim()) {
        const err: any = new Error('স্টাফের নাম প্রদান আবশ্যক (staff_name is required)');
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }
    }
    const staffName = dto.staff_name !== undefined ? dto.staff_name.trim() : existing.staff_name;

    // Validate designation if provided
    const validDesignations: StaffDesignation[] = [
      'muhtamim',
      'shaykhul_hadith',
      'senior_muhaddis',
      'kitab_teacher',
      'hifz_teacher',
      'nazir_office',
      'cook_hostel',
      'security'
    ];
    if (dto.designation !== undefined) {
      if (!validDesignations.includes(dto.designation)) {
        const err: any = new Error(`অকার্যকর পদবী (Invalid designation: ${dto.designation})`);
        err.statusCode = 400;
        err.code = 'INVALID_DESIGNATION';
        throw err;
      }
    }
    const designation = dto.designation !== undefined ? dto.designation : existing.designation;

    // Validate base_salary if provided
    if (dto.base_salary !== undefined) {
      const baseSalaryNum = Number(dto.base_salary);
      if (isNaN(baseSalaryNum) || baseSalaryNum < 0) {
        const err: any = new Error('মূল বেতন অবশ্যই একটি অঋণাত্মক সংখ্যা হতে হবে (base_salary must be a non-negative number)');
        err.statusCode = 400;
        err.code = 'INVALID_SALARY';
        throw err;
      }
    }
    const baseSalary = dto.base_salary !== undefined ? Number(dto.base_salary) : existing.base_salary;

    const housingAllowance = dto.housing_allowance !== undefined ? Math.max(0, Number(dto.housing_allowance)) : existing.housing_allowance;
    const foodAllowance = dto.food_allowance !== undefined ? Math.max(0, Number(dto.food_allowance)) : existing.food_allowance;
    const bonusAllowance = dto.bonus_allowance !== undefined ? Math.max(0, Number(dto.bonus_allowance)) : existing.bonus_allowance;
    const advanceLoanDeduction = dto.advance_loan_deduction !== undefined ? Math.max(0, Number(dto.advance_loan_deduction)) : existing.advance_loan_deduction;
    const paymentMethod = dto.payment_method !== undefined ? dto.payment_method : existing.payment_method;
    const accountDetails = dto.account_details !== undefined ? dto.account_details : existing.account_details;
    const status = dto.status !== undefined ? dto.status : existing.status;
    const userId = dto.user_id !== undefined ? dto.user_id : existing.user_id;

    await db.run(
      `UPDATE staff_payroll_profiles SET
        user_id = ?, staff_name = ?, designation = ?, base_salary = ?,
        housing_allowance = ?, food_allowance = ?, bonus_allowance = ?,
        advance_loan_deduction = ?, payment_method = ?, account_details = ?, status = ?
      WHERE id = ?`,
      [
        userId || null,
        staffName,
        designation,
        baseSalary,
        housingAllowance,
        foodAllowance,
        bonusAllowance,
        advanceLoanDeduction,
        paymentMethod,
        accountDetails,
        status,
        id
      ]
    );

    const updated = await this.getProfileById(id);
    return updated!;
  }

  /**
   * Generates draft monthly payroll vouchers for all active staff profiles.
   * net_payable = base_salary + housing_allowance + food_allowance + bonus_allowance - advance_loan_deduction - absent_deduction
   */
  public async generateMonthlyVouchers(dto: GenerateVouchersDTO): Promise<PayrollVoucher[]> {
    if (!dto.month || !dto.year) {
      const err: any = new Error('মাস এবং বছর প্রদান আবশ্যক (month and year are required)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const organizationId = dto.organizationId || 'org_main';
    const profiles = await db.all<any>(
      `SELECT * FROM staff_payroll_profiles 
       WHERE organization_id = ? AND (status IS NULL OR status = 'active')
       ORDER BY created_at ASC`,
      [organizationId]
    );

    if (!profiles || profiles.length === 0) {
      return [];
    }

    const now = new Date().toISOString();
    const generatedVouchers: PayrollVoucher[] = [];

    // Get current voucher count for sequential numbering
    const countRow = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM payroll_vouchers WHERE organization_id = ? AND year = ?`,
      [organizationId, dto.year]
    );
    let seq = (countRow?.count || 0) + 1;

    for (const profile of profiles) {
      // Check if voucher already exists for this profile in the specified month and year
      const existing = await db.get<any>(
        `SELECT id FROM payroll_vouchers WHERE profile_id = ? AND month = ? AND year = ?`,
        [profile.id, dto.month, dto.year]
      );

      if (existing) {
        const fullExisting = await this.getVoucherById(existing.id);
        if (fullExisting) {
          generatedVouchers.push(fullExisting);
        }
        continue;
      }

      const voucherId = `vch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const voucherNumber = `PAY-${dto.year}${String(dto.month).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
      seq++;

      const baseSalary = Number(profile.base_salary || 0);
      const housingAllowance = Number(profile.housing_allowance || 0);
      const foodAllowance = Number(profile.food_allowance || 0);
      const bonusAllowance = Number(profile.bonus_allowance || 0);
      const advanceLoanDeduction = Number(profile.advance_loan_deduction || 0);
      const absentDeduction = 0.0;

      const netPayable = Math.max(
        0,
        baseSalary +
        housingAllowance +
        foodAllowance +
        bonusAllowance -
        advanceLoanDeduction -
        absentDeduction
      );

      const qrToken = this.generateQrToken(voucherNumber, netPayable, dto.month, dto.year);

      await db.run(
        `INSERT INTO payroll_vouchers (
          id, organization_id, voucher_number, profile_id, staff_name, designation,
          month, year, base_salary, housing_allowance, food_allowance, bonus_allowance,
          advance_loan_deduction, absent_deduction, net_payable, status,
          verified_by, approved_by, disbursed_by, disbursement_method,
          transaction_reference, qr_code_token, disbursed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NULL, NULL, NULL, NULL, NULL, ?, NULL, ?)`,
        [
          voucherId,
          organizationId,
          voucherNumber,
          profile.id,
          profile.staff_name,
          profile.designation,
          dto.month,
          dto.year,
          baseSalary,
          housingAllowance,
          foodAllowance,
          bonusAllowance,
          advanceLoanDeduction,
          absentDeduction,
          netPayable,
          qrToken,
          now
        ]
      );

      const createdVoucher = await this.getVoucherById(voucherId);
      if (createdVoucher) {
        generatedVouchers.push(createdVoucher);
      }
    }

    return generatedVouchers;
  }

  /**
   * Manually creates a payroll voucher with clamped net_payable.
   */
  public async createVoucher(dto: any): Promise<PayrollVoucher> {
    const organizationId = dto.organization_id || 'org_main';
    const baseSalary = Number(dto.base_salary || 0);
    const housingAllowance = Number(dto.housing_allowance || 0);
    const foodAllowance = Number(dto.food_allowance || 0);
    const bonusAllowance = Number(dto.bonus_allowance || 0);
    const advanceLoanDeduction = Number(dto.advance_loan_deduction || 0);
    const absentDeduction = Number(dto.absent_deduction || 0);

    const netPayable = Math.max(
      0,
      baseSalary +
      housingAllowance +
      foodAllowance +
      bonusAllowance -
      advanceLoanDeduction -
      absentDeduction
    );

    const voucherId = dto.id || `vch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const voucherNumber = dto.voucher_number || `PAY-${dto.year || 2026}${String(dto.month || '01').padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const qrToken = this.generateQrToken(voucherNumber, netPayable, dto.month || 'জানুয়ারি', dto.year || 2026);

    await db.run(
      `INSERT INTO payroll_vouchers (
        id, organization_id, voucher_number, profile_id, staff_name, designation,
        month, year, base_salary, housing_allowance, food_allowance, bonus_allowance,
        advance_loan_deduction, absent_deduction, net_payable, status,
        verified_by, approved_by, disbursed_by, disbursement_method,
        transaction_reference, qr_code_token, disbursed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        voucherId,
        organizationId,
        voucherNumber,
        dto.profile_id || 'manual',
        dto.staff_name || 'Staff',
        dto.designation || 'kitab_teacher',
        dto.month || 'জানুয়ারি',
        dto.year || 2026,
        baseSalary,
        housingAllowance,
        foodAllowance,
        bonusAllowance,
        advanceLoanDeduction,
        absentDeduction,
        netPayable,
        dto.status || 'draft',
        dto.verified_by || null,
        dto.approved_by || null,
        dto.disbursed_by || null,
        dto.disbursement_method || null,
        dto.transaction_reference || null,
        qrToken,
        dto.disbursed_at || null,
        now
      ]
    );

    return (await this.getVoucherById(voucherId))!;
  }

  /**
   * Retrieves all payroll vouchers with optional filtering.
   */
  public async getVouchers(filter: {
    organizationId?: string;
    month?: string;
    year?: number;
    status?: string;
    designation?: string;
    profileId?: string;
  } = {}): Promise<PayrollVoucher[]> {
    const organizationId = filter.organizationId || 'org_main';
    let query = `SELECT * FROM payroll_vouchers WHERE organization_id = ?`;
    const params: any[] = [organizationId];

    if (filter.month) {
      query += ` AND month = ?`;
      params.push(filter.month);
    }
    if (filter.year) {
      query += ` AND year = ?`;
      params.push(filter.year);
    }
    if (filter.status) {
      query += ` AND status = ?`;
      params.push(filter.status);
    }
    if (filter.designation) {
      query += ` AND designation = ?`;
      params.push(filter.designation);
    }
    if (filter.profileId) {
      query += ` AND profile_id = ?`;
      params.push(filter.profileId);
    }

    query += ` ORDER BY created_at DESC, voucher_number DESC`;

    const rows = await db.all<any>(query, params);
    return rows.map((r: any) => this.mapVoucherRow(r));
  }

  /**
   * Retrieves a single payroll voucher by ID or voucher number.
   */
  public async getVoucherById(idOrNumber: string): Promise<PayrollVoucher | null> {
    const row = await db.get<any>(
      `SELECT * FROM payroll_vouchers WHERE id = ? OR voucher_number = ?`,
      [idOrNumber, idOrNumber]
    );
    if (!row) return null;
    return this.mapVoucherRow(row);
  }

  /**
   * Retrieves payroll vouchers for a specific user.
   */
  public async getVouchersByUserId(userId: string): Promise<PayrollVoucher[]> {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      return [];
    }
    return this.getVouchers({ profileId: profile.id });
  }

  /**
   * Step 1 in lifecycle: Accountant verification.
   * Transitions voucher from 'draft' to 'accountant_verified'.
   */
  public async verifyVoucher(voucherId: string, verifiedByUserId: string): Promise<PayrollVoucher> {
    const voucher = await this.getVoucherById(voucherId);
    if (!voucher) {
      const err: any = new Error('বেতন ভাউচার পাওয়া যায়নি (Voucher not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (voucher.status !== 'draft') {
      const err: any = new Error(`ভাউচারটি বর্তমানে '${voucher.status}' অবস্থায় রয়েছে, শুধুমাত্র খসড়া (draft) ভাউচার যাচাই করা সম্ভব।`);
      err.statusCode = 400;
      err.code = 'INVALID_LIFECYCLE_STATE';
      throw err;
    }

    await db.run(
      `UPDATE payroll_vouchers SET status = 'accountant_verified', verified_by = ? WHERE id = ?`,
      [verifiedByUserId, voucher.id]
    );

    const updated = await this.getVoucherById(voucher.id);
    return updated!;
  }

  /**
   * Step 2 in lifecycle: Muhtamim / Principal approval.
   * Transitions voucher from 'accountant_verified' to 'muhtamim_approved'.
   */
  public async approveVoucher(voucherId: string, approvedByUserId: string): Promise<PayrollVoucher> {
    const voucher = await this.getVoucherById(voucherId);
    if (!voucher) {
      const err: any = new Error('বেতন ভাউচার পাওয়া যায়নি (Voucher not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (voucher.status !== 'accountant_verified') {
      const err: any = new Error(
        `ভাউচারটি এখনও হিসাবরক্ষক কর্তৃক যাচাইকৃত নয় (বর্তমান অবস্থা: '${voucher.status}')। অনুমোদনের পূর্বে হিসাবরক্ষকের যাচাই সম্পন্ন হতে হবে।`
      );
      err.statusCode = 400;
      err.code = 'INVALID_LIFECYCLE_STATE';
      throw err;
    }

    await db.run(
      `UPDATE payroll_vouchers SET status = 'muhtamim_approved', approved_by = ? WHERE id = ?`,
      [approvedByUserId, voucher.id]
    );

    const updated = await this.getVoucherById(voucher.id);
    return updated!;
  }

  /**
   * Step 3 in lifecycle: Disbursement.
   * Voucher MUST be 'muhtamim_approved' or returns 400 Bad Request.
   * Records disbursement method, reference, and integrates with Cash Book / Expenses.
   */
  public async disburseVoucher(
    voucherId: string,
    disbursedByUserId: string,
    dto: DisburseVoucherDTO = {}
  ): Promise<PayrollVoucher> {
    const voucher = await this.getVoucherById(voucherId);
    if (!voucher) {
      const err: any = new Error('বেতন ভাউচার পাওয়া যায়নি (Voucher not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // STRICT SPEC REQUIREMENT: voucher must be muhtamim_approved or returns 400 Bad Request
    if (voucher.status !== 'muhtamim_approved') {
      const err: any = new Error(
        `পরিশোধ করার পূর্বে ভাউচারটি অবশ্যই মুহতামিম কর্তৃক অনুমোদিত হতে হবে (বর্তমান অবস্থা: '${voucher.status}')।`
      );
      err.statusCode = 400;
      err.code = 'INVALID_LIFECYCLE_STATE';
      throw err;
    }

    const disbursementMethod: PayrollDisbursementMethod =
      dto.disbursement_method || voucher.disbursement_method || 'cash';
    const transactionRef =
      dto.transaction_reference ||
      `TXN_SAL_${voucher.voucher_number.replace(/-/g, '_')}_${Date.now()}`;
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Update voucher status to disbursed
    await db.run(
      `UPDATE payroll_vouchers SET
        status = 'disbursed',
        disbursed_by = ?,
        disbursement_method = ?,
        transaction_reference = ?,
        disbursed_at = ?
      WHERE id = ?`,
      [disbursedByUserId, disbursementMethod, transactionRef, now, voucher.id]
    );

    // Integrate with Expense records and Cash Book
    const expenseId = `exp_sal_${voucher.id}`;
    await db.run(
      `INSERT INTO expenses (
        id, tenant_id, branch_id, category, amount, payment_method,
        voucher_number, payee, approved_by, date, description
      ) VALUES (?, 'inst_main', 'branch_mirpur', 'teacher_salary', ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        amount = excluded.amount,
        payment_method = excluded.payment_method,
        voucher_number = excluded.voucher_number,
        payee = excluded.payee,
        approved_by = excluded.approved_by,
        date = excluded.date,
        description = excluded.description`,
      [
        expenseId,
        voucher.net_payable,
        disbursementMethod === 'bank' ? 'bank' : disbursementMethod === 'bkash' ? 'bkash' : 'cash',
        voucher.voucher_number,
        voucher.staff_name,
        voucher.approved_by || disbursedByUserId,
        today,
        `ওস্তাদ/স্টাফ মাসিক বেতন পরিশোধ (${voucher.designation}, মাস: ${voucher.month} ${voucher.year})`
      ]
    );

    // If payment method is cash, update daily cash book expenses
    if (disbursementMethod === 'cash') {
      const existingCb = await db.get<any>(
        `SELECT id, opening_balance, cash_collections, cash_expenses, bank_deposits, closing_balance 
         FROM cash_book_daily WHERE date = ? AND (tenant_id = 'inst_main' OR organization_id = 'org_main')`,
        [today]
      );

      if (existingCb) {
        const newExpenses = (existingCb.cash_expenses || 0) + voucher.net_payable;
        const newClosing =
          (existingCb.opening_balance || 0) +
          (existingCb.cash_collections || 0) -
          newExpenses -
          (existingCb.bank_deposits || 0);

        await db.run(
          `UPDATE cash_book_daily SET cash_expenses = ?, closing_balance = ? WHERE id = ?`,
          [newExpenses, newClosing, existingCb.id]
        );
      } else {
        // Create today's cash book entry with opening balance 25000 or prior closing
        const priorRecord = await db.get<any>(
          `SELECT closing_balance FROM cash_book_daily WHERE date < ? ORDER BY date DESC LIMIT 1`,
          [today]
        );
        const opening = priorRecord?.closing_balance !== undefined ? priorRecord.closing_balance : 25000;
        const closing = opening - voucher.net_payable;

        await db.run(
          `INSERT INTO cash_book_daily (
            id, tenant_id, organization_id, date, opening_balance,
            cash_collections, cash_expenses, bank_deposits, closing_balance, created_at
          ) VALUES (?, 'inst_main', 'org_main', ?, ?, 0.0, ?, 0.0, ?, ?)`,
          [`cb_${today.replace(/-/g, '')}`, today, opening, voucher.net_payable, closing, now]
        );
      }
    }

    // If payment method is bank and bank account is provided or available, update bank balance
    if (disbursementMethod === 'bank') {
      const bankAccount = dto.bank_account_id
        ? await db.get<any>(`SELECT id, current_balance FROM bank_accounts WHERE id = ?`, [dto.bank_account_id])
        : await db.get<any>(`SELECT id, current_balance FROM bank_accounts LIMIT 1`);

      if (bankAccount) {
        const newBalance = (bankAccount.current_balance || 0) - voucher.net_payable;
        await db.run(`UPDATE bank_accounts SET current_balance = ? WHERE id = ?`, [newBalance, bankAccount.id]);
      }
    }

    const updated = await this.getVoucherById(voucher.id);
    return updated!;
  }

  /**
   * Generates payslip data with cryptographic QR token for a voucher.
   */
  public async getPayslip(voucherId: string): Promise<PayslipData> {
    const voucher = await this.getVoucherById(voucherId);
    if (!voucher) {
      const err: any = new Error('বেতন ভাউচার পাওয়া যায়নি (Voucher not found)');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const profile = await this.getProfileById(voucher.profile_id);

    const instRow = await db.get<any>(
      `SELECT name_bn FROM institution_settings WHERE tenant_id = 'inst_main'
       UNION
       SELECT name_bn FROM institutions WHERE id = 'inst_main'
       LIMIT 1`
    );
    const institutionNameBn = instRow?.name_bn || 'জামিয়া ইসলামিয়া মডেল মাদ্রাসা';

    return {
      voucher,
      profile: profile || undefined,
      organizationName: 'আল-জামিয়াতুল ইসলামিয়া ট্রাস্ট বাংলাদেশ',
      institutionNameBn,
      qrVerificationUrl: `/api/v1/payroll/vouchers/verify-qr/${voucher.qr_code_token}`,
      qrCodeToken: voucher.qr_code_token || '',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Public QR Token verification endpoint.
   * Validates authenticity against HMAC cryptographic proof.
   */
  public async verifyQrToken(token: string): Promise<{ valid: boolean; message?: string; data?: any }> {
    if (!token || !token.trim()) {
      return {
        valid: false,
        message: 'কিউআর কোড টোকেন প্রদান আবশ্যক (Token is required)'
      };
    }

    const voucher = await db.get<any>(
      `SELECT * FROM payroll_vouchers WHERE qr_code_token = ?`,
      [token.trim()]
    );

    if (!voucher) {
      return {
        valid: false,
        message: 'অকার্যকর বা নকল কিউআর কোড টোকেন (Invalid or forged QR token)'
      };
    }

    // Verify token cryptographic match
    const expectedToken = this.generateQrToken(
      voucher.voucher_number,
      Number(voucher.net_payable),
      voucher.month,
      Number(voucher.year)
    );

    if (expectedToken !== voucher.qr_code_token) {
      return {
        valid: false,
        message: 'কিউআর কোডের ডিজিটাল স্বাক্ষর গরমিল (Cryptographic verification mismatch)'
      };
    }

    const instRow = await db.get<any>(
      `SELECT name_bn FROM institution_settings WHERE tenant_id = 'inst_main'
       UNION
       SELECT name_bn FROM institutions WHERE id = 'inst_main'
       LIMIT 1`
    );
    const institutionName = instRow?.name_bn || 'জামিয়া ইসলামিয়া মডেল মাদ্রাসা';

    return {
      valid: true,
      data: {
        voucher_number: voucher.voucher_number,
        staff_name: voucher.staff_name,
        designation: voucher.designation,
        month: voucher.month,
        year: voucher.year,
        base_salary: Number(voucher.base_salary),
        housing_allowance: Number(voucher.housing_allowance),
        food_allowance: Number(voucher.food_allowance),
        bonus_allowance: Number(voucher.bonus_allowance),
        advance_loan_deduction: Number(voucher.advance_loan_deduction),
        absent_deduction: Number(voucher.absent_deduction),
        net_payable: Number(voucher.net_payable),
        status: voucher.status,
        disbursement_method: voucher.disbursement_method,
        transaction_reference: voucher.transaction_reference,
        disbursed_at: voucher.disbursed_at,
        verified_by: voucher.verified_by,
        approved_by: voucher.approved_by,
        institution_name: institutionName,
        organization_name: 'আল-জামিয়াতুল ইসলামিয়া ট্রাস্ট বাংলাদেশ'
      }
    };
  }

  private mapVoucherRow(row: any): PayrollVoucher {
    return {
      id: row.id,
      organization_id: row.organization_id,
      voucher_number: row.voucher_number,
      profile_id: row.profile_id,
      staff_name: row.staff_name,
      designation: row.designation as StaffDesignation,
      month: row.month,
      year: Number(row.year),
      base_salary: Number(row.base_salary || 0),
      housing_allowance: Number(row.housing_allowance || 0),
      food_allowance: Number(row.food_allowance || 0),
      bonus_allowance: Number(row.bonus_allowance || 0),
      advance_loan_deduction: Number(row.advance_loan_deduction || 0),
      absent_deduction: Number(row.absent_deduction || 0),
      net_payable: Number(row.net_payable || 0),
      status: row.status as PayrollStatus,
      verified_by: row.verified_by || undefined,
      approved_by: row.approved_by || undefined,
      disbursed_by: row.disbursed_by || undefined,
      disbursement_method: (row.disbursement_method || undefined) as PayrollDisbursementMethod | undefined,
      transaction_reference: row.transaction_reference || undefined,
      qr_code_token: row.qr_code_token || undefined,
      disbursed_at: row.disbursed_at || undefined,
      created_at: row.created_at
    };
  }
}

export const payrollService = new PayrollService();
