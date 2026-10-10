import { Router, Response } from 'express';
import { cashBookService } from '../services/cashBookService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

const requireCashBookReadAccess = (req: AuthenticatedRequest, res: Response, next: any) => {
  const role = req.user?.role;
  const allowed = ['super_admin', 'madrasa_admin', 'principal', 'accountant'];
  if (!role || !allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'দৈনিক ক্যাশ বই ও ব্যাংক হিসাব দেখার অনুমতি নেই।' }
    });
  }
  next();
};

const requireCashBookWriteAccess = (req: AuthenticatedRequest, res: Response, next: any) => {
  const role = req.user?.role;
  const allowed = ['super_admin', 'madrasa_admin', 'accountant'];
  if (!role || !allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'ব্যাংক জমা বা ক্যাশ বই পরিবর্তনের অনুমতি নেই।' }
    });
  }
  next();
};

// 1. Daily Cash Book
const handleDailyCashBook = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const { date } = req.query;
    const data = await cashBookService.getDailyCashBook(req.user!.tenantId, date as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
router.get('/daily', authenticate, requireCashBookReadAccess, handleDailyCashBook);
router.get('/cash-book/daily', authenticate, requireCashBookReadAccess, handleDailyCashBook);

// 2. Bank Deposits
const handleBankDeposit = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const result = await cashBookService.recordBankDeposit(req.user!.tenantId, req.body);
    await logAudit(
      req,
      'RECORD_BANK_DEPOSIT',
      'bank_deposit',
      result.id,
      `ব্যাংক জমা ভাউচার: স্লিপ নং ${result.depositSlipNumber}, ব্যাংক: ${result.bankName}, পরিমাণ ৳${result.amount}`
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

router.post('/bank-deposits', authenticate, requireCashBookWriteAccess, handleBankDeposit);
router.post('/bank-deposit', authenticate, requireCashBookWriteAccess, handleBankDeposit);
router.post('/cash-book/bank-deposits', authenticate, requireCashBookWriteAccess, handleBankDeposit);
router.post('/cash-book/bank-deposit', authenticate, requireCashBookWriteAccess, handleBankDeposit);

// 3. Bank Accounts
const handleGetBankAccounts = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const data = await cashBookService.getBankAccounts(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const handleCreateBankAccount = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const result = await cashBookService.createBankAccount(req.user!.tenantId, req.body);
    await logAudit(
      req,
      'CREATE_BANK_ACCOUNT',
      'bank_account',
      result.id,
      `নতুন ব্যাংক অ্যাকাউন্ট যোগ: ${result.bankName}, হিসাব নং: ${result.accountNumber}`
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

router.get('/bank-accounts', authenticate, requireCashBookReadAccess, handleGetBankAccounts);
router.post('/bank-accounts', authenticate, requireCashBookWriteAccess, handleCreateBankAccount);

// 4. Close Day
const handleCloseDay = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const { date } = req.body;
    const result = await cashBookService.closeDay(req.user!.tenantId, date || new Date().toISOString().split('T')[0]);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
router.post('/close-day', authenticate, requireCashBookWriteAccess, handleCloseDay);
router.post('/cash-book/close-day', authenticate, requireCashBookWriteAccess, handleCloseDay);

export default router;
