import { Router, Response } from 'express';
import { payrollService } from '../services/payrollService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

// ==========================================
// 1. Public QR Verification (No Auth Required)
// ==========================================
router.get('/vouchers/verify-qr/:token', async (req, res, next) => {
  try {
    const token = req.params.token as string;
    const result = await payrollService.verifyQrToken(token);
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QR_TOKEN',
          message: result.message || 'অকার্যকর কিউআর কোড টোকেন।'
        }
      });
    }
    return res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. Staff Payslips (Self-service for Teachers & Staff)
// ==========================================
router.get('/my-payslips', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const userId = req.user!.userId;
    const vouchers = await payrollService.getVouchersByUserId(userId);
    res.json({
      success: true,
      data: vouchers
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. Staff Profiles (RBAC Protected: Accountant & Admin Only)
// ==========================================
router.get('/profiles', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const role = req.user!.role;
    // Strictly block teachers, hifz teachers, staff, students, and guardians from viewing profiles
    if (['teacher', 'hifz_teacher', 'staff', 'hostel_manager', 'librarian', 'student', 'guardian'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ওস্তাদ ও কর্মচারীদের বেতন কাঠামো দেখার অনুমতি আপনার অ্যাকাউন্টে নেই।'
        }
      });
    }

    const { organizationId } = req.query;
    const profiles = await payrollService.getProfiles((organizationId as string) || 'org_main');
    res.json({
      success: true,
      data: profiles
    });
  } catch (err) {
    next(err);
  }
});

router.post('/profiles', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const profile = await payrollService.createProfile(req.body);
    await logAudit(
      req,
      'CREATE_PAYROLL_PROFILE',
      'staff_payroll_profile',
      profile.id,
      `নতুন বেতন কাঠামো তৈরি: ${profile.staff_name} (${profile.designation}), মূল বেতন: ৳${profile.base_salary}`
    );
    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
});

router.put('/profiles/:id', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params.id as string;
    const profile = await payrollService.updateProfile(id, req.body);
    await logAudit(
      req,
      'UPDATE_PAYROLL_PROFILE',
      'staff_payroll_profile',
      profile.id,
      `বেতন কাঠামো হালনাগাদ: ${profile.staff_name} (${profile.designation}), মূল বেতন: ৳${profile.base_salary}`
    );
    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. Monthly Voucher Generation
// ==========================================
router.post('/vouchers/generate-monthly', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { month, year, organizationId } = req.body;
    const vouchers = await payrollService.generateMonthlyVouchers({
      month,
      year: year ? parseInt(year) : new Date().getFullYear(),
      organizationId: organizationId || 'org_main',
      generatedBy: req.user!.userId
    });

    await logAudit(
      req,
      'GENERATE_PAYROLL_VOUCHERS',
      'payroll_vouchers',
      `${month}_${year}`,
      `মাসিক বেতন ভাউচার ড্রাফট প্রস্তুত: ${month} ${year}, মোট ভাউচার: ${vouchers.length} টি`
    );

    res.status(201).json({
      success: true,
      data: vouchers,
      count: vouchers.length
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. Payroll Vouchers Listing (RBAC Protected: Accountant/Admin/Muhtamim Only)
// ==========================================
router.get('/vouchers', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const role = req.user!.role;
    // Strictly block teachers, hifz teachers, staff, students, and guardians from viewing the full voucher list
    if (['teacher', 'hifz_teacher', 'staff', 'hostel_manager', 'librarian', 'student', 'guardian'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'মাদ্রাসার সামগ্রিক বেতন ও ভাউচার তালিকা দেখার অনুমতি আপনার অ্যাকাউন্টে নেই।'
        }
      });
    }

    const { month, year, status, designation, profileId, organizationId } = req.query;
    const vouchers = await payrollService.getVouchers({
      month: month as string,
      year: year ? parseInt(year as string) : undefined,
      status: status as string,
      designation: designation as string,
      profileId: profileId as string,
      organizationId: (organizationId as string) || 'org_main'
    });

    res.json({
      success: true,
      data: vouchers
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. Workflow Lifecycle: Verification (Accountant & Admin Only)
// ==========================================
router.post('/vouchers/:id/verify', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params.id as string;
    const voucher = await payrollService.verifyVoucher(id, req.user!.userId);

    await logAudit(
      req,
      'VERIFY_PAYROLL_VOUCHER',
      'payroll_voucher',
      voucher.id,
      `বেতন ভাউচার হিসাবরক্ষক কর্তৃক যাচাইকৃত: ${voucher.voucher_number}, প্রাপক: ${voucher.staff_name}, পরিমাণ: ৳${voucher.net_payable}`
    );

    res.json({
      success: true,
      data: voucher
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7. Workflow Lifecycle: Approval (Muhtamim / Principal / Admin Only)
// ==========================================
router.post('/vouchers/:id/approve', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params.id as string;
    const voucher = await payrollService.approveVoucher(id, req.user!.userId);

    await logAudit(
      req,
      'APPROVE_PAYROLL_VOUCHER',
      'payroll_voucher',
      voucher.id,
      `বেতন ভাউচার মুহতামিম কর্তৃক অনুমোদিত: ${voucher.voucher_number}, প্রাপক: ${voucher.staff_name}, পরিমাণ: ৳${voucher.net_payable}`
    );

    res.json({
      success: true,
      data: voucher
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 8. Workflow Lifecycle: Disbursement (Accountant & Admin Only)
// ==========================================
router.post('/vouchers/:id/disburse', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params.id as string;
    const { disbursement_method, disbursementMethod, transaction_reference, transactionReference, bank_account_id, bankAccountId, notes } = req.body;

    const voucher = await payrollService.disburseVoucher(id, req.user!.userId, {
      disbursement_method: disbursement_method || disbursementMethod,
      transaction_reference: transaction_reference || transactionReference,
      bank_account_id: bank_account_id || bankAccountId,
      notes
    });

    await logAudit(
      req,
      'DISBURSE_PAYROLL_VOUCHER',
      'payroll_voucher',
      voucher.id,
      `বেতন পরিশোধ সম্পন্ন: ভাউচার ${voucher.voucher_number}, প্রাপক: ${voucher.staff_name}, পরিমাণ: ৳${voucher.net_payable}, মাধ্যম: ${voucher.disbursement_method}`
    );

    res.json({
      success: true,
      data: voucher
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 9. Single Payslip with Cryptographic QR Token
// ==========================================
router.get('/vouchers/:id/payslip', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = req.params.id as string;
    const payslip = await payrollService.getPayslip(id);

    // RBAC: Teachers & staff can ONLY view their own payslips
    const role = req.user!.role;
    if (['teacher', 'hifz_teacher', 'staff', 'student', 'guardian'].includes(role)) {
      const userProfile = await payrollService.getProfileByUserId(req.user!.userId);
      const isOwner = userProfile && userProfile.id === payslip.voucher.profile_id;
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'অন্য শিক্ষক বা কর্মচারীর বেতন রসিদ দেখার অনুমতি আপনার নেই।'
          }
        });
      }
    }

    res.json({
      success: true,
      data: payslip
    });
  } catch (err) {
    next(err);
  }
});

export default router;
