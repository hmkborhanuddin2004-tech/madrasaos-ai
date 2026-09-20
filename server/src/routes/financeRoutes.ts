import { Router, Response } from 'express';
import { financeService } from '../services/financeService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

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
    const { studentId, status, month } = req.query;

    // Guardian scope restriction
    if (req.user!.role === 'guardian') {
      const linked = req.user!.linkedStudentIds || [];
      const data = await financeService.getInvoices(req.user!.tenantId, {
        studentId: linked[0] || 'none',
        status: status as string,
        month: month as string
      });
      return res.json({ success: true, data });
    }

    const data = await financeService.getInvoices(req.user!.tenantId, {
      studentId: studentId as string,
      status: status as string,
      month: month as string
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/payments/collect', authenticate, requireRole('super_admin', 'madrasa_admin', 'accountant'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { invoiceId, amount, paymentMethod, transactionId } = req.body;
    if (!invoiceId || !amount || !paymentMethod) {
      throw new Error('invoiceId, amount, and paymentMethod are required');
    }

    const result = await financeService.collectPayment(req.user!.tenantId, req.user!.userId, {
      invoiceId,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId
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
