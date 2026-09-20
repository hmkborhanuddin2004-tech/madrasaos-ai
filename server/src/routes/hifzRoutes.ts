import { Router, Response } from 'express';
import { hifzService } from '../services/hifzService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/today', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { date } = req.query;
    const data = await hifzService.getTodayWorkspace(req.user!.tenantId, req.user!.userId, date as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/record', authenticate, requireRole('super_admin', 'madrasa_admin', 'hifz_teacher', 'teacher'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await hifzService.recordDailyHifz(req.user!.tenantId, req.user!.userId, req.body);
    await logAudit(req, 'RECORD_HIFZ', 'student', req.body.studentId, `শিক্ষার্থীর দৈনিক সবক ও মঞ্জিল মূল্যায়ন রেকর্ড করা হয়েছে (রেটিং: ${req.body.sabaqRating || 'good'})`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/student/:id/summary', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const studentId = req.params.id as string;
    const data = await hifzService.getStudentHifzSummary(req.user!.tenantId, studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/declining-alerts', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await hifzService.getDecliningAlerts(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
