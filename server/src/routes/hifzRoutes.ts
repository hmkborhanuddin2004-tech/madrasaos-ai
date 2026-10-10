import { Router, Response } from 'express';
import { hifzService } from '../services/hifzService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = Router();

router.get('/today', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'hifz_teacher', 'teacher'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { date } = req.query;
    const data = await hifzService.getTodayWorkspace(req.user!.tenantId, req.user!.userId, date as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Modern v3.0 progress submission endpoint with idempotency support
router.post(
  '/progress',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'hifz_teacher', 'teacher'),
  idempotencyMiddleware(),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await hifzService.recordDailyHifz(req.user!.tenantId, req.user!.userId, req.body);
      const studentId = req.body.studentId || req.body.student_id;
      await logAudit(
        req,
        result.mode === 'lww_merged' ? 'HIFZ_LWW_UPDATE' : 'RECORD_HIFZ',
        'student',
        studentId,
        `শিক্ষার্থীর দৈনিক হিফজ অগ্রগতি দাখিল করা হয়েছে (মোড: ${result.mode})`
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Backward-compatible record endpoint
router.post(
  '/record',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'hifz_teacher', 'teacher'),
  idempotencyMiddleware(),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await hifzService.recordDailyHifz(req.user!.tenantId, req.user!.userId, req.body);
      const studentId = req.body.studentId || req.body.student_id;
      await logAudit(req, 'RECORD_HIFZ', 'student', studentId, `শিক্ষার্থীর দৈনিক সবক ও মঞ্জিল রেকর্ড করা হয়েছে`);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Pending conflicts for head-teacher / muhtamim review
router.get(
  '/conflicts',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal', 'hifz_teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await hifzService.getConflicts(req.user!.tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// Resolve conflict
router.post(
  '/conflicts/:id/resolve',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal', 'hifz_teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const conflictId = req.params.id as string;
      const { chosenTeacher, customPayload, notes } = req.body;
      const result = await hifzService.resolveConflict(req.user!.tenantId, conflictId, req.user!.userId, {
        chosenTeacher: chosenTeacher || 'a',
        customPayload,
        notes
      });
      res.json({ success: true, data: result, message: 'হিফজ অগ্রগতি দ্বন্দ্ব সফলভাবে সমাধান করা হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

// Inline student metadata editing from Hifz workspace
router.put(
  '/students/:id/inline-edit',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal', 'hifz_teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const studentId = req.params.id as string;
      const result = await hifzService.inlineEditStudent(req.user!.tenantId, studentId, req.user!.userId, req.body);
      res.json({ success: true, data: result, message: 'শিক্ষার্থীর তথ্য সফলভাবে হালনাগাদ করা হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/student/:id/summary', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const studentId = req.params.id as string;

    // Guardian and Student access control: Only allow access to own linked child/student
    if (req.user!.role === 'guardian' || req.user!.role === 'student') {
      const linked = req.user!.linkedStudentIds || [];
      if (!linked.includes(studentId)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'আপনি শুধুমাত্র নিজের বা নিজের সন্তানের হিফজ বিবরণী দেখতে পারবেন।' }
        });
      }
    }

    const data = await hifzService.getStudentHifzSummary(req.user!.tenantId, studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/declining-alerts', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'hifz_teacher', 'teacher'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await hifzService.getDecliningAlerts(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
