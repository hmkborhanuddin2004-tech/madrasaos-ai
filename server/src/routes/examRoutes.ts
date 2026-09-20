import { Router, Response } from 'express';
import { examService } from '../services/examService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await examService.getExams(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/tabulation', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { classId } = req.query;
    if (!classId) throw new Error('classId is required');

    const examId = req.params.id as string;
    const data = await examService.getTabulationSheet(req.user!.tenantId, examId, classId as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/student/:studentId', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const examId = req.params.id as string;
    const studentId = req.params.studentId as string;
    const data = await examService.getStudentMarksheet(req.user!.tenantId, examId, studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
