import { Router, Response } from 'express';
import { financeService } from '../services/financeService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import donationRoutes from './donationRoutes.js';
import cashBookRoutes from './cashBookRoutes.js';

const router = Router();

// Mount Sub-Routes for Milestone 1
router.use('/donations', donationRoutes);
router.use('/donors', donationRoutes);
router.use('/cash-book', cashBookRoutes);
router.use('/bank-accounts', cashBookRoutes);
router.use('/', cashBookRoutes); // Handles /bank-accounts directly

router.get('/summary', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { month, year } = req.query;
    const data = await financeService.getSummary(
      req.user!.tenantId,
      (month as string) || 'সেপ্টেম্বর',
      year ? parseInt(year as string) : 2026
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { studentId, status, month, type, ledgerType, limit } = req.query;

    // Block teachers and hostel managers from institution-wide financial invoices
    if (req.user!.role === 'teacher' || req.user!.role === 'hifz_teacher' || req.user!.role === 'hostel_manager') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'আর্থিক হিসাব ও ইনভয়েস দেখার অনুমতি আপনার অ্যাকাউন্টে নেই।' }
      });
    }

    // Guardian scope restriction
    if (req.user!.role === 'guardian') {
      const linked = req.user!.linkedStudentIds || [];
      const data = await financeService.getInvoices(req.user!.tenantId, {
        studentId: linked[0] || 'none',
        status: status as string,
        month: month as string,
        type: type as string,
        ledgerType: ledgerType as string
      });
      return res.json({ success: true, data });
    }

    // Student scope restriction
    if (req.user!.role === 'student') {
      const linked = req.user!.linkedStudentIds || [];
      const data = await financeService.getInvoices(req.user!.tenantId, {
        studentId: linked[0] || 'none',
        status: status as string,
        month: month as string,
        type: type as string,
        ledgerType: ledgerType as string
      });
      return res.json({ success: true, data });
    }

    const data = await financeService.getInvoices(req.user!.tenantId, {
      studentId: studentId as string,
      status: status as string,
      month: month as string,
      type: type as string,
      ledgerType: ledgerType as string,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/invoices', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await financeService.createInvoice(req.user!.tenantId, req.body);
    await logAudit(
      req,
      'CREATE_INVOICE',
      'invoice',
      result.id,
      `চালান তৈরি সম্পন্ন: ${result.invoice_number}, শিক্ষার্থী: ${result.student_name_bn}, পরিমাণ ৳${result.total_amount}, লেজার: ${result.ledger_type}`
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/payments/collect', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const invoiceId = req.body.invoiceId || req.body.invoice_id;
    const amount = req.body.amount;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    const transactionId = req.body.transactionId || req.body.transaction_id;
    const date = req.body.date || req.body.paidAt || req.body.paid_at;

    if (!invoiceId || amount === undefined || amount === null || !paymentMethod) {
      const err: any = new Error('invoiceId, amount, and paymentMethod are required');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const result = await financeService.collectPayment(req.user!.tenantId, req.user!.userId, {
      invoiceId,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId,
      date
    });

    await logAudit(
      req,
      'COLLECT_FEE',
      'payment',
      result.paymentId,
      `ফি সংগ্রহ সম্পন্ন: রসিদ ${result.paymentNumber}, পরিমাণ ৳${result.amount}, মাধ্যম: ${paymentMethod}`
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/expenses', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await financeService.recordExpense(req.user!.tenantId, req.user!.branchId, req.body);
    await logAudit(
      req,
      'RECORD_EXPENSE',
      'expense',
      result.id,
      `ব্যয় ভাউচার লিপিবদ্ধ: ${result.voucherNumber}, পরিমাণ ৳${req.body.amount || 0}, খাত: ${req.body.category}`
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
