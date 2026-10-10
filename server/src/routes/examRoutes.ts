import { Router, Response } from 'express';
import { examService } from '../services/examService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { db } from '../db/db.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = await examService.getExams(req.user!.tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ==================== Exam State Machine Actions ====================

// Open marks entry
router.post(
  '/:id/open-marks',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const result = await examService.openMarks(req.user!.tenantId, examId);
      await logAudit(req, 'EXAM_OPEN_MARKS', 'exam', examId, 'পরীক্ষার নম্বর এন্ট্রি উন্মুক্ত করা হয়েছে');
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Close marks entry
router.post(
  '/:id/close-marks',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const result = await examService.closeMarks(req.user!.tenantId, examId);
      await logAudit(req, 'EXAM_CLOSE_MARKS', 'exam', examId, 'পরীক্ষার নম্বর এন্ট্রি সমাপ্ত করা হয়েছে');
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Audit exam (checks all subjects submitted/audited)
router.post(
  '/:id/audit',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const result = await examService.auditExam(req.user!.tenantId, examId);
      await logAudit(req, 'EXAM_AUDIT', 'exam', examId, 'পরীক্ষা নিরীক্ষা ও যাচাই সম্পন্ন হয়েছে');
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Approve exam
router.post(
  '/:id/approve',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const result = await examService.approveExam(req.user!.tenantId, examId, req.user!.userId);
      await logAudit(req, 'EXAM_APPROVE', 'exam', examId, 'মজলিসে ইমতেহান কর্তৃক ফলাফল অনুমোদন লাভ করেছে');
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Publish exam (locks marks and computes DENSE_RANK)
router.post(
  '/:id/publish',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const result = await examService.publishExam(req.user!.tenantId, examId, req.user!.userId);
      await logAudit(req, 'EXAM_PUBLISH', 'exam', examId, 'পরীক্ষার ফলাফল চূড়ান্তভাবে প্রকাশিত ও লক করা হয়েছে');
      res.json({ success: true, data: result, message: 'ফলাফল সফলভাবে প্রকাশিত হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

// Unpublish exam (strictly protected against pending re-evaluations)
router.post(
  '/:id/unpublish',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const result = await examService.unpublishExam(req.user!.tenantId, examId);
      await logAudit(req, 'EXAM_UNPUBLISH', 'exam', examId, 'পরীক্ষার ফলাফল অপ্রকাশিত ও মার্কস আনলক করা হয়েছে');
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== Subject Submission Actions ====================

// Teacher submits subject marks
router.post(
  '/:id/subjects/:subjectId/submit',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal', 'teacher', 'hifz_teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const subjectId = req.params.subjectId as string;
      const result = await examService.submitSubjectMarks(req.user!.tenantId, examId, subjectId, req.user!.userId);
      await logAudit(req, 'SUBJECT_MARKS_SUBMIT', 'marks_submission', `${examId}_${subjectId}`, `বিষয়ের নম্বর দাখিল করা হয়েছে (বিষয়: ${subjectId})`);
      res.json({ success: true, data: result, message: 'বিষয়ের নম্বর সফলভাবে জমা দেওয়া হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

// Auditor audits subject marks
router.post(
  '/:id/subjects/:subjectId/audit',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const subjectId = req.params.subjectId as string;
      const result = await examService.auditSubjectMarks(req.user!.tenantId, examId, subjectId, req.user!.userId);
      await logAudit(req, 'SUBJECT_MARKS_AUDIT', 'marks_submission', `${examId}_${subjectId}`, `বিষয়ের নম্বর নিরীক্ষা অনুমোদন করা হয়েছে`);
      res.json({ success: true, data: result, message: 'বিষয়ের নম্বর নিরীক্ষা সম্পন্ন হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

// Auditor rejects subject marks
router.post(
  '/:id/subjects/:subjectId/reject',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const subjectId = req.params.subjectId as string;
      const { reason } = req.body;
      const result = await examService.rejectSubjectMarks(req.user!.tenantId, examId, subjectId, req.user!.userId, reason);
      await logAudit(req, 'SUBJECT_MARKS_REJECT', 'marks_submission', `${examId}_${subjectId}`, `বিষয়ের নম্বর প্রত্যাখ্যান করা হয়েছে (কারণ: ${reason})`);
      res.json({ success: true, data: result, message: 'বিষয়ের নম্বর প্রত্যাখ্যান করা হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

// List subject submission statuses for exam
router.get(
  '/:id/subjects/submissions',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const data = await examService.getSubjectSubmissions(req.user!.tenantId, examId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== Re-evaluation Workflow ====================

// Request re-evaluation
router.post(
  '/:id/re-evaluation',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const { studentId, subjectId, reason } = req.body;
      const result = await examService.requestReEvaluation(
        req.user!.tenantId,
        examId,
        studentId,
        subjectId,
        req.user!.userId,
        reason
      );
      await logAudit(req, 'REQUEST_RE_EVALUATION', 're_evaluation', result.id, `নম্বর পুনর্বিবেচনার আবেদন করা হয়েছে`);
      res.status(201).json({ success: true, data: result, message: 'পুনর্বিবেচনার আবেদন গৃহীত হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

// List re-evaluations
router.get(
  '/:id/re-evaluations',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const data = await examService.getReEvaluations(req.user!.tenantId, examId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// Review re-evaluation
router.put(
  '/re-evaluation/:id/review',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const requestId = req.params.id as string;
      const result = await examService.reviewReEvaluation(
        req.user!.tenantId,
        requestId,
        req.user!.userId,
        req.body
      );
      await logAudit(req, 'REVIEW_RE_EVALUATION', 're_evaluation', requestId, `পুনর্বিবেচনার আবেদন নিষ্পত্তি করা হয়েছে (${req.body.status})`);
      res.json({ success: true, data: result, message: 'পুনর্বিবেচনা পর্যালোচনা সম্পন্ন হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== Standard Mark Entry & Sheets ====================

router.post(
  '/:id/marks',
  authenticate,
  requireRole('super_admin', 'madrasa_admin', 'principal', 'teacher', 'hifz_teacher'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const examId = req.params.id as string;
      const { classId, marksList } = req.body;
      if (!classId || !Array.isArray(marksList)) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'শ্রেণি ও নম্বর তালিকা প্রদান আবশ্যক।' } });
      }
      const result = await examService.saveBatchMarks(req.user!.tenantId, examId, classId, marksList, req.user!.userId);
      res.json({ success: true, data: result, message: 'নম্বর সফলভাবে সংরক্ষিত হয়েছে।' });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id/tabulation', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal', 'teacher', 'hifz_teacher'), async (req: AuthenticatedRequest, res: Response, next) => {
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

    // Guardian and Student access control: Only allow access to own linked child/student
    if (req.user!.role === 'guardian' || req.user!.role === 'student') {
      const linked = req.user!.linkedStudentIds || [];
      if (!linked.includes(studentId)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'আপনি শুধুমাত্র নিজের বা নিজের সন্তানের পরীক্ষার ফলাফল দেখতে পারবেন।' }
        });
      }
    }

    const data = await examService.getStudentMarksheet(req.user!.tenantId, examId, studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/:examId/marks/:studentId/audit', async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const marks = await db.all<any>('SELECT id FROM exam_marks WHERE exam_id = ? AND student_id = ?', [examId, studentId]);
    if (marks.length === 0) return res.json([]);
    const markIds = marks.map((m: any) => `'${m.id}'`).join(',');
    const audits = await db.all<any>(`SELECT * FROM mark_audits WHERE mark_id IN (${markIds}) ORDER BY changed_at DESC`);
    res.json(audits);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
