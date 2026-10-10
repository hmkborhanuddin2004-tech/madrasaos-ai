import { Router, Response } from 'express';
import { muhasabaService } from '../services/muhasabaService.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';

export const muhasabaRoutes = Router();

muhasabaRoutes.use(authenticate);

// Get daily amal records for a date and optional class
muhasabaRoutes.get('/daily', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const { date, classId } = req.query;

    let studentIds: string[] | undefined = undefined;
    if (req.user?.role === 'student' || req.user?.role === 'guardian') {
      studentIds = req.user.linkedStudentIds && req.user.linkedStudentIds.length > 0
        ? req.user.linkedStudentIds
        : ['std_001'];
    }

    const data = await muhasabaService.getDailyRecords(tenantId, date as string, classId as string, studentIds);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Record or update daily amal
muhasabaRoutes.post('/record', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const userId = req.user?.userId || 'usr_teacher';

    // Privacy guard: if student, ensure they only record their own student_id
    if (req.user?.role === 'student') {
      const allowed = req.user.linkedStudentIds && req.user.linkedStudentIds.length > 0
        ? req.user.linkedStudentIds
        : ['std_001'];
      if (!allowed.includes(req.body.student_id)) {
        req.body.student_id = allowed[0];
      }
    }

    const data = await muhasabaService.recordAmal(tenantId, req.body, userId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Get Amal Leaderboard
muhasabaRoutes.get('/leaderboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const tenantId = req.user?.tenantId || 'inst_main';
    const data = await muhasabaService.getLeaderboard(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});
