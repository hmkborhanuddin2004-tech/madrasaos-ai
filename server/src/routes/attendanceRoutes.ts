import { Router, Response } from 'express';
import { attendanceService } from '../services/attendanceService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/summary', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { date } = req.query;
    const data = await attendanceService.getTodaySummary(req.user!.tenantId, date as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/register', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { classId, date } = req.query;
    if (!classId) throw new Error('classId is required');

    const data = await attendanceService.getClassRegister(req.user!.tenantId, classId as string, date as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/register', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'teacher'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { classId, records, date } = req.body;
    if (!classId || !records || !Array.isArray(records)) {
      throw new Error('classId and records array are required');
    }

    const data = await attendanceService.submitClassAttendance(
      req.user!.tenantId,
      req.user!.branchId,
      classId,
      req.user!.userId,
      records,
      date
    );

    await logAudit(req, 'SUBMIT_ATTENDANCE', 'class', classId, `${records.length} জন শিক্ষার্থীর দৈনিক হাজিরা সংরক্ষণ করা হয়েছে।`);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/repeated-absences', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const minAbsences = req.query.minAbsences ? parseInt(req.query.minAbsences as string) : 2;
    const data = await attendanceService.getRepeatedAbsences(req.user!.tenantId, days, minAbsences);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
