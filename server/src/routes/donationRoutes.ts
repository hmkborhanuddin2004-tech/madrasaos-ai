import { Router, Response } from 'express';
import { donationService } from '../services/donationService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

// Middleware to block non-finance staff (Teachers, Hifz Teachers, Hostel Managers, Students, Guardians)
const requireDonationReadAccess = (req: AuthenticatedRequest, res: Response, next: any) => {
  const role = req.user?.role;
  const allowed = ['super_admin', 'madrasa_admin', 'principal', 'accountant'];
  if (!role || !allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'অনুদান ও তহবিল সংক্রান্ত তথ্য দেখার অনুমতি নেই।' }
    });
  }
  next();
};

const requireDonationWriteAccess = (req: AuthenticatedRequest, res: Response, next: any) => {
  const role = req.user?.role;
  const allowed = ['super_admin', 'madrasa_admin', 'accountant'];
  if (!role || !allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'অনুদান গ্রহণ বা দাতা নিবন্ধনের অনুমতি নেই।' }
    });
  }
  next();
};

// 1. Funds Summary
const handleFundsSummary = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const summary = await donationService.getFundsSummary(req.user!.tenantId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
router.get('/funds-summary', authenticate, requireDonationReadAccess, handleFundsSummary);
router.get('/funds/summary', authenticate, requireDonationReadAccess, handleFundsSummary);

// 2. Receipts
router.get('/receipts', authenticate, requireDonationReadAccess, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { fundType, fund_type, donorId, donor_id, startDate, endDate } = req.query;
    const data = await donationService.getReceipts(req.user!.tenantId, {
      fundType: (fundType || fund_type) as string,
      donorId: (donorId || donor_id) as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/receipts', authenticate, requireDonationWriteAccess, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await donationService.createReceipt(req.user!.tenantId, req.body);
    await logAudit(
      req,
      'CREATE_DONATION_RECEIPT',
      'donation_receipt',
      result.id,
      `অনুদান রসিদ প্রদান: ${result.receiptNo}, পরিমাণ ৳${result.amount}, তহবিল: ${result.fundType}`
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// 3. Donors List & Create
const handleGetDonors = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const { category, query } = req.query;
    const data = await donationService.getDonors(req.user!.tenantId, {
      category: category as string,
      query: query as string
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const handleCreateDonor = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const result = await donationService.createDonor(req.user!.tenantId, req.body);
    await logAudit(
      req,
      'CREATE_DONOR',
      'donor',
      result.id,
      `নতুন দাতা নিবন্ধন: ${result.name}, শ্রেণি: ${result.category}`
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

router.get('/donors', authenticate, requireDonationReadAccess, handleGetDonors);
router.post('/donors', authenticate, requireDonationWriteAccess, handleCreateDonor);

// Allow root path handling when mounted directly
router.get('/', authenticate, requireDonationReadAccess, handleGetDonors);
router.post('/', authenticate, requireDonationWriteAccess, handleCreateDonor);

// Single Donor Details
router.get('/donors/:id', authenticate, requireDonationReadAccess, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await donationService.getDonorById(req.user!.tenantId, req.params.id as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/donors/:id', authenticate, requireDonationWriteAccess, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await donationService.updateDonor(req.user!.tenantId, req.params.id as string, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
