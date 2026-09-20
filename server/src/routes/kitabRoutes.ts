import { Router, Response } from 'express';
import { kitabService } from '../services/kitabService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/classes', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await kitabService.getClasses(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/progress', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { classId } = req.query;
    const data = await kitabService.getKitabProgressList(req.user!.tenantId, classId as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/progress', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'teacher'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await kitabService.logKitabProgress(req.user!.tenantId, req.body);
    await logAudit(req, 'LOG_KITAB_PROGRESS', 'class', req.body.classId, `কিতাবের পাঠ ও নেসাব অগ্রগতি রেকর্ড করা হয়েছে: ${req.body.kitabName}`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
