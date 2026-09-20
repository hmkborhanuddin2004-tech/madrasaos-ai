import { Router, Response } from 'express';
import { onboardingService } from '../services/onboardingService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/state', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await onboardingService.getState(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/step', authenticate, requireRole('super_admin', 'madrasa_admin'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { step, answers } = req.body;
    const data = await onboardingService.saveStep(req.user!.tenantId, step || 1, answers || {});
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/finalize', authenticate, requireRole('super_admin', 'madrasa_admin'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await onboardingService.finalize(req.user!.tenantId, req.user!.branchId);
    await logAudit(req, 'FINALIZE_ONBOARDING', 'institution', req.user!.tenantId, 'মাদ্রাসার প্রাথমিক সেটআপ ও কাঠামো সফলভাবে চূড়ান্ত করা হয়েছে।');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
