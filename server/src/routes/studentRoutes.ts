import { Router, Response } from 'express';
import { studentService } from '../services/studentService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { search, classId, isHifz, isResidential, status, page, limit } = req.query;

    // Guardian scope restriction: Guardians only see their linked children
    if (req.user!.role === 'guardian') {
      const linked = req.user!.linkedStudentIds || [];
      if (linked.length === 0) {
        return res.json({ success: true, data: { students: [], total: 0, page: 1, totalPages: 1 } });
      }
      const students = [];
      for (const sid of linked) {
        try {
          const s = await studentService.getStudentById(req.user!.tenantId, sid);
          students.push(s);
        } catch {}
      }
      return res.json({
        success: true,
        data: { students, total: students.length, page: 1, totalPages: 1 }
      });
    }

    const data = await studentService.getStudents(req.user!.tenantId, {
      search: search as string,
      classId: classId as string,
      isHifz: isHifz !== undefined ? isHifz === 'true' : undefined,
      isResidential: isResidential !== undefined ? isResidential === 'true' : undefined,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const studentId = req.params.id as string;

    // Guardian access check: Ensure guardian can only access own linked child
    if (req.user!.role === 'guardian') {
      const linked = req.user!.linkedStudentIds || [];
      if (!linked.includes(studentId)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'আপনি শুধুমাত্র আপনার নিজের সন্তানের প্রোফাইল দেখতে পারবেন।' }
        });
      }
    }

    const data = await studentService.getStudentById(req.user!.tenantId, studentId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const student = await studentService.createStudent(req.user!.tenantId, req.user!.branchId, req.body);
    await logAudit(req, 'CREATE_STUDENT', 'student', student.id, `নতুন শিক্ষার্থী যোগ করা হয়েছে: ${student.full_name_bn} (${student.student_id_number})`);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, requireRole('super_admin', 'madrasa_admin', 'principal'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const studentId = req.params.id as string;
    const student = await studentService.updateStudent(req.user!.tenantId, studentId, req.body);
    await logAudit(req, 'UPDATE_STUDENT', 'student', student.id, `শিক্ষার্থীর তথ্য হালনাগাদ করা হয়েছে: ${student.full_name_bn}`);
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireRole('super_admin', 'madrasa_admin'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const studentId = req.params.id as string;
    await studentService.deleteStudent(req.user!.tenantId, studentId);
    await logAudit(req, 'DELETE_STUDENT', 'student', studentId, `শিক্ষার্থীর প্রোফাইল সফট-ডিলিট করা হয়েছে (ID: ${studentId})`);
    res.json({ success: true, message: 'শিক্ষার্থীর তথ্য সফলভাবে অপসারিত হয়েছে।' });
  } catch (err) {
    next(err);
  }
});

export default router;
