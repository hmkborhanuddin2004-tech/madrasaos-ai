import { Router, Response } from 'express';
import { routineService } from '../services/routineService.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

export const routineRoutes = Router();

routineRoutes.use(authenticate);

// Get routine slots
routineRoutes.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const { classId, dayOfWeek } = req.query;
    const data = await routineService.getRoutines(tenantId, {
      classId: classId as string,
      dayOfWeek: dayOfWeek as string
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Timetable conflict detection (4 vectors: teacher, room, class, time)
routineRoutes.post(
  '/check-conflict',
  authorize('super_admin', 'madrasa_admin', 'principal', 'teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const result = await routineService.checkConflict(tenantId, {
        id: req.body.id,
        classId: req.body.classId || req.body.class_id,
        dayOfWeek: req.body.dayOfWeek || req.body.day_of_week,
        periodNumber: Number(req.body.periodNumber || req.body.period_number || 1),
        teacherId: req.body.teacherId || req.body.teacher_id,
        teacherNameBn: req.body.teacherNameBn || req.body.teacher_name_bn,
        roomNumber: req.body.roomNumber || req.body.room_number,
        startTime: req.body.startTime || req.body.start_time,
        endTime: req.body.endTime || req.body.end_time
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Save or update routine slot
routineRoutes.post(
  '/slot',
  authorize('super_admin', 'madrasa_admin', 'principal', 'teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const data = await routineService.saveRoutineSlot(tenantId, req.body);
      await logAudit(
        req,
        'SAVE_ROUTINE_SLOT',
        'routine',
        data.id,
        `রুটিন স্লট সংরক্ষণ করা হয়েছে (${req.body.day_of_week}, পিরিয়ড: ${req.body.period_number})`
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// Publish Timetable Version (Majlis-e-Ilmi approved snapshot)
routineRoutes.post(
  '/publish',
  authorize('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const result = await routineService.publishTimetable(tenantId, req.user!.userId);
      await logAudit(
        req,
        'PUBLISH_TIMETABLE_VERSION',
        'timetable_version',
        result.versionId,
        `মজলিসে ইলমী অনুমোদিত রুটিন সংস্করণ প্রকাশিত হয়েছে (${result.snapshotCount}টি স্লট)`
      );
      res.json({
        success: true,
        data: result,
        message: 'রুটিন সংস্করণ সফলভাবে প্রকাশ ও লক করা হয়েছে।'
      });
    } catch (err) {
      next(err);
    }
  }
);

// List published timetable versions
routineRoutes.get(
  '/versions',
  authorize('super_admin', 'madrasa_admin', 'principal', 'teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tenantId = req.user?.tenantId || 'inst_main';
      const data = await routineService.getTimetableVersions(tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// Day-to-Day copy ("ডে-টু-ডে কপি")
routineRoutes.post('/copy-day', authorize('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const classId = req.body.classId || req.body.class_id;
    const fromDay = req.body.fromDay || req.body.from_day;
    const toDay = req.body.toDay || req.body.to_day;
    const data = await routineService.copyDayRoutine(tenantId, classId, fromDay, toDay);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Delete routine slot
routineRoutes.delete('/:id', authorize('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const success = await routineService.deleteRoutineSlot(tenantId, req.params.id as string);
    res.json({ success });
  } catch (err) {
    next(err);
  }
});
