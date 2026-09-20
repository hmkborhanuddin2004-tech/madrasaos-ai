import { Router, Response } from 'express';
import { hostelService } from '../services/hostelService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await hostelService.getHostelStatus(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/outpasses', authenticate, requireRole('super_admin', 'madrasa_admin', 'hostel_manager'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await hostelService.issueOutpass(req.user!.tenantId, req.body);
    await logAudit(req, 'ISSUE_OUTPASS', 'hostel_outpass', result.id, `আবাসিক ছাত্রের অনুমোদিত আউটপাস ইস্যু করা হয়েছে: ${req.body.reason || 'ছুটি'}`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
