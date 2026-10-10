import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { ProblemDetailsException } from '../utils/problemDetails.js';

export class ExamService {
  public async getExams(tenantId: string): Promise<any[]> {
    return db.all<any>('SELECT * FROM exams WHERE tenant_id = ? ORDER BY start_date DESC', [tenantId]);
  }

  public async getExamById(tenantId: string, examId: string): Promise<any> {
    return db.get<any>('SELECT * FROM exams WHERE id = ? AND tenant_id = ?', [examId, tenantId]);
  }

  // Two-Level State Machine: Exam Level
  public async openMarks(tenantId: string, examId: string): Promise<any> {
    const exam = await this.getExamById(tenantId, examId);
    if (!exam) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Exam Not Found',
        status: 404,
        detail: 'The requested exam does not exist.'
      });
    }

    const now = new Date().toISOString();
    await db.run(
      "UPDATE exams SET status = 'MARKS_OPEN', marks_open_at = ? WHERE id = ? AND tenant_id = ?",
      [now, examId, tenantId]
    );
    return { success: true, status: 'MARKS_OPEN', marksOpenAt: now };
  }

  public async closeMarks(tenantId: string, examId: string): Promise<any> {
    const exam = await this.getExamById(tenantId, examId);
    if (!exam) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Exam Not Found',
        status: 404,
        detail: 'The requested exam does not exist.'
      });
    }

    const now = new Date().toISOString();
    await db.run(
      "UPDATE exams SET status = 'MARKS_CLOSED', marks_close_at = ? WHERE id = ? AND tenant_id = ?",
      [now, examId, tenantId]
    );
    return { success: true, status: 'MARKS_CLOSED', marksCloseAt: now };
  }

  public async auditExam(tenantId: string, examId: string): Promise<any> {
    const exam = await this.getExamById(tenantId, examId);
    if (!exam) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Exam Not Found',
        status: 404,
        detail: 'The requested exam does not exist.'
      });
    }

    // Check if any subject submission is still PENDING or REJECTED
    const pendingSubjects = await db.all<any>(
      "SELECT * FROM marks_submission WHERE exam_id = ? AND status IN ('PENDING', 'REJECTED')",
      [examId]
    );

    if (pendingSubjects.length > 0) {
      throw new ProblemDetailsException({
        code: 'ALL_SUBJECTS_NOT_SUBMITTED',
        title: 'Subjects Pending Submission/Audit',
        status: 422,
        detail: `পরীক্ষার সকল বিষয়ের নম্বর দাখিল ও যাচাই সম্পন্ন হয়নি (${pendingSubjects.length}টি বিষয় এখনও অনিষ্পন্ন)।`,
        extras: { pendingCount: pendingSubjects.length }
      });
    }

    const now = new Date().toISOString();
    await db.run(
      "UPDATE exams SET status = 'UNDER_REVIEW', audited_at = ? WHERE id = ? AND tenant_id = ?",
      [now, examId, tenantId]
    );
    return { success: true, status: 'UNDER_REVIEW', auditedAt: now };
  }

  public async approveExam(tenantId: string, examId: string, approvedBy: string): Promise<any> {
    const exam = await this.getExamById(tenantId, examId);
    if (!exam) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Exam Not Found',
        status: 404,
        detail: 'The requested exam does not exist.'
      });
    }

    const now = new Date().toISOString();
    await db.run(
      "UPDATE exams SET status = 'APPROVED', approved_at = ? WHERE id = ? AND tenant_id = ?",
      [now, examId, tenantId]
    );
    return { success: true, status: 'APPROVED', approvedAt: now };
  }

  public async publishExam(tenantId: string, examId: string, publishedBy: string): Promise<any> {
    const exam = await this.getExamById(tenantId, examId);
    if (!exam) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Exam Not Found',
        status: 404,
        detail: 'The requested exam does not exist.'
      });
    }

    const now = new Date().toISOString();

    // Compute DENSE_RANK() across students per class
    const marks = await db.all<any>(
      `SELECT em.*, s.class_id, s.id as student_id
       FROM exam_marks em
       JOIN students s ON em.student_id = s.id
       WHERE em.exam_id = ? AND em.tenant_id = ?`,
      [examId, tenantId]
    );

    // Group marks by class then student
    const classStudentMap = new Map<string, Map<string, { studentId: string; totalObtained: number; totalMax: number }>>();
    for (const m of marks) {
      const clsId = m.class_id;
      if (!classStudentMap.has(clsId)) {
        classStudentMap.set(clsId, new Map());
      }
      const stMap = classStudentMap.get(clsId)!;
      if (!stMap.has(m.student_id)) {
        stMap.set(m.student_id, { studentId: m.student_id, totalObtained: 0, totalMax: 0 });
      }
      const item = stMap.get(m.student_id)!;
      item.totalObtained += m.obtained_marks;
      item.totalMax += m.total_marks;
    }

    // Calculate DENSE_RANK per class
    for (const [classId, stMap] of classStudentMap.entries()) {
      const sortedStudents = Array.from(stMap.values()).sort((a, b) => b.totalObtained - a.totalObtained);

      let currentRank = 1;
      for (let i = 0; i < sortedStudents.length; i++) {
        if (i > 0 && sortedStudents[i].totalObtained < sortedStudents[i - 1].totalObtained) {
          currentRank++;
        }
        const student = sortedStudents[i];
        const percentage = student.totalMax > 0 ? (student.totalObtained / student.totalMax) * 100 : 0;
        const gpa = percentage >= 80 ? 5.0 : percentage >= 70 ? 4.0 : percentage >= 60 ? 3.5 : percentage >= 50 ? 3.0 : percentage >= 33 ? 2.0 : 0.0;
        const grade = percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 60 ? 'A-' : percentage >= 50 ? 'B' : percentage >= 33 ? 'C' : 'F';

        // Upsert into exam_results
        const resId = `res_${examId}_${student.studentId}`;
        await db.run(
          `INSERT INTO exam_results (id, exam_id, student_id, total_marks, obtained_marks, percentage, gpa, grade, merit_position, is_locked, published_by, created_at, rank_scope)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'class')
           ON CONFLICT(id) DO UPDATE SET
             total_marks = excluded.total_marks,
             obtained_marks = excluded.obtained_marks,
             percentage = excluded.percentage,
             gpa = excluded.gpa,
             grade = excluded.grade,
             merit_position = excluded.merit_position,
             is_locked = 1,
             published_by = excluded.published_by`,
          [
            resId, examId, student.studentId,
            student.totalMax, student.totalObtained, percentage, gpa, grade, currentRank,
            publishedBy, now
          ]
        );
      }
    }

    // Update exam status to PUBLISHED
    await db.run(
      "UPDATE exams SET status = 'PUBLISHED', is_published = 1, published_at = ? WHERE id = ? AND tenant_id = ?",
      [now, examId, tenantId]
    );

    return { success: true, status: 'PUBLISHED', publishedAt: now, message: 'ফলাফল সফলভাবে প্রকাশিত এবং মেধা তালিকা চূড়ান্ত হয়েছে।' };
  }

  public async unpublishExam(tenantId: string, examId: string): Promise<any> {
    const exam = await this.getExamById(tenantId, examId);
    if (!exam) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Exam Not Found',
        status: 404,
        detail: 'The requested exam does not exist.'
      });
    }

    // STRICT SPEC RULE: Cannot unpublish if re-evaluations are in progress!
    const pendingReEvals = await db.get<any>(
      "SELECT COUNT(*) as count FROM re_evaluation_requests WHERE exam_id = ? AND status IN ('REQUESTED', 'UNDER_REVIEW')",
      [examId]
    );

    if (pendingReEvals && pendingReEvals.count > 0) {
      throw new ProblemDetailsException({
        code: 'PUBLISH_WHILE_LOCKED',
        title: 'Cannot Unpublish Exam',
        status: 422,
        detail: `Cannot unpublish exam while re-evaluation is in progress (${pendingReEvals.count} pending request(s)). Please resolve or cancel all re-evaluations first.`,
        extras: {
          pendingCount: pendingReEvals.count,
          examId
        }
      });
    }

    await db.run(
      "UPDATE exams SET status = 'APPROVED', is_published = 0 WHERE id = ? AND tenant_id = ?",
      [examId, tenantId]
    );
    await db.run(
      "UPDATE exam_results SET is_locked = 0 WHERE exam_id = ?",
      [examId]
    );

    return { success: true, status: 'APPROVED', message: 'ফলাফল অপ্রকাশিত করা হয়েছে এবং মার্ক এন্ট্রি পুনঃউন্মুক্ত করা হয়েছে।' };
  }

  // Two-Level State Machine: Subject Level (marks_submission table)
  public async submitSubjectMarks(tenantId: string, examId: string, subjectId: string, teacherId: string): Promise<any> {
    const id = `ms_${examId}_${subjectId}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO marks_submission (id, exam_id, subject_id, teacher_id, status, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, 'SUBMITTED', ?, ?)
       ON CONFLICT(exam_id, subject_id) DO UPDATE SET
         status = 'SUBMITTED',
         submitted_at = excluded.submitted_at,
         teacher_id = excluded.teacher_id,
         rejection_reason = NULL,
         updated_at = excluded.updated_at`,
      [id, examId, subjectId, teacherId, now, now]
    );

    return { success: true, examId, subjectId, status: 'SUBMITTED', submittedAt: now };
  }

  public async auditSubjectMarks(tenantId: string, examId: string, subjectId: string, auditorId: string): Promise<any> {
    const now = new Date().toISOString();
    await db.run(
      `UPDATE marks_submission SET status = 'AUDITED', audited_at = ?, updated_at = ? WHERE exam_id = ? AND subject_id = ?`,
      [now, now, examId, subjectId]
    );
    return { success: true, examId, subjectId, status: 'AUDITED', auditedAt: now };
  }

  public async rejectSubjectMarks(tenantId: string, examId: string, subjectId: string, auditorId: string, reason: string): Promise<any> {
    if (!reason || !reason.trim()) {
      throw new ProblemDetailsException({
        code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        status: 400,
        detail: 'Rejection reason is strictly required when rejecting subject marks.'
      });
    }

    const now = new Date().toISOString();
    await db.run(
      `UPDATE marks_submission SET status = 'REJECTED', rejection_reason = ?, updated_at = ? WHERE exam_id = ? AND subject_id = ?`,
      [reason.trim(), now, examId, subjectId]
    );

    return { success: true, examId, subjectId, status: 'REJECTED', rejectionReason: reason.trim(), updatedAt: now };
  }

  public async getSubjectSubmissions(tenantId: string, examId: string): Promise<any[]> {
    return db.all<any>(
      `SELECT ms.*, u.full_name_bn as teacher_name_bn
       FROM marks_submission ms
       LEFT JOIN users u ON ms.teacher_id = u.id
       WHERE ms.exam_id = ?`,
      [examId]
    );
  }

  // Re-evaluation Workflow
  public async requestReEvaluation(
    tenantId: string,
    examId: string,
    studentId: string,
    subjectId: string,
    requestedBy: string,
    reason: string
  ): Promise<any> {
    const exam = await this.getExamById(tenantId, examId);
    if (!exam || !exam.is_published) {
      throw new ProblemDetailsException({
        code: 'PRECONDITION_FAILED',
        title: 'Exam Not Published',
        status: 400,
        detail: 'পুনর্বিবেচনার (Re-evaluation) আবেদন শুধুমাত্র প্রকাশিত ফলাফলের জন্য করা যাবে।'
      });
    }

    if (!reason || !reason.trim()) {
      throw new ProblemDetailsException({
        code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        status: 400,
        detail: 'পুনর্বিবেচনার কারণ উল্লেখ করা আবশ্যক।'
      });
    }

    const id = `reeval_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO re_evaluation_requests (id, exam_id, student_id, subject_id, status, requested_at, requested_by, reason)
       VALUES (?, ?, ?, ?, 'REQUESTED', ?, ?, ?)`,
      [id, examId, studentId, subjectId, now, requestedBy, reason.trim()]
    );

    return { success: true, id, status: 'REQUESTED', requestedAt: now };
  }

  public async getReEvaluations(tenantId: string, examId?: string): Promise<any[]> {
    let sql = `
      SELECT rer.*, s.full_name_bn as student_name_bn, s.student_id_number, s.roll_number,
             e.name_bn as exam_name_bn
      FROM re_evaluation_requests rer
      JOIN students s ON rer.student_id = s.id
      JOIN exams e ON rer.exam_id = e.id
      WHERE (s.tenant_id = ? OR s.tenant_id = 'inst_main')
    `;
    const params: any[] = [tenantId];
    if (examId) {
      sql += ' AND rer.exam_id = ?';
      params.push(examId);
    }
    sql += ' ORDER BY rer.requested_at DESC';
    return db.all<any>(sql, params);
  }

  public async reviewReEvaluation(
    tenantId: string,
    requestId: string,
    reviewedBy: string,
    outcome: { status: 'APPROVED' | 'REJECTED'; newMarks?: number; notes?: string }
  ): Promise<any> {
    const req = await db.get<any>(
      'SELECT * FROM re_evaluation_requests WHERE id = ?',
      [requestId]
    );
    if (!req) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Request Not Found',
        status: 404,
        detail: 'The requested re-evaluation does not exist.'
      });
    }

    const now = new Date().toISOString();

    if (outcome.status === 'APPROVED' && outcome.newMarks !== undefined) {
      // Update student marks
      const existingMark = await db.get<any>(
        'SELECT * FROM exam_marks WHERE exam_id = ? AND student_id = ? AND (subject_name_bn = ? OR id = ?)',
        [req.exam_id, req.student_id, req.subject_id, req.subject_id]
      );

      if (existingMark) {
        await db.run(
          'UPDATE exam_marks SET obtained_marks = ? WHERE id = ?',
          [outcome.newMarks, existingMark.id]
        );
        await db.run(
          `INSERT INTO mark_audits (id, mark_id, old_marks, new_marks, old_value, new_value, changed_by, change_reason, reason, changed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(), existingMark.id, existingMark.obtained_marks, outcome.newMarks,
            existingMark.obtained_marks, outcome.newMarks,
            reviewedBy, `Re-evaluation approved: ${outcome.notes || 'Corrected marks'}`,
            `Re-evaluation approved: ${outcome.notes || 'Corrected marks'}`, now
          ]
        );
      }
    }

    const finalStatus = outcome.status === 'APPROVED' ? 'RESOLVED' : 'REJECTED';
    await db.run(
      `UPDATE re_evaluation_requests SET status = ?, reviewed_at = ?, reviewed_by = ?, outcome_json = ? WHERE id = ?`,
      [finalStatus, now, reviewedBy, JSON.stringify(outcome), requestId]
    );

    return { success: true, requestId, status: finalStatus, reviewedAt: now };
  }

  public async getTabulationSheet(tenantId: string, examId: string, classId: string): Promise<any> {
    const exam = await db.get<any>('SELECT * FROM exams WHERE id = ? AND tenant_id = ?', [examId, tenantId]);
    const classInfo = await db.get<any>('SELECT * FROM classes WHERE id = ? AND tenant_id = ?', [classId, tenantId]);

    const marks = await db.all<any>(
      `SELECT em.*, s.full_name_bn, s.roll_number
       FROM exam_marks em
       JOIN students s ON em.student_id = s.id
       WHERE em.exam_id = ? AND em.class_id = ? AND em.tenant_id = ?
       ORDER BY CAST(s.roll_number AS INTEGER) ASC`,
      [examId, classId, tenantId]
    );

    // Group marks by student
    const studentMap = new Map<string, any>();
    for (const m of marks) {
      if (!studentMap.has(m.student_id)) {
        studentMap.set(m.student_id, {
          studentId: m.student_id,
          fullNameBn: m.full_name_bn,
          rollNumber: m.roll_number,
          subjects: [],
          totalObtained: 0,
          totalMax: 0
        });
      }
      const item = studentMap.get(m.student_id);
      item.subjects.push({
        subjectNameBn: m.subject_name_bn,
        obtained: m.obtained_marks,
        total: m.total_marks,
        grade: m.letter_grade
      });
      item.totalObtained += m.obtained_marks;
      item.totalMax += m.total_marks;
    }

    const students = Array.from(studentMap.values()).map((st) => ({
      ...st,
      percentage: st.totalMax > 0 ? Math.round((st.totalObtained / st.totalMax) * 100) : 0,
      finalGrade: st.totalMax > 0 && (st.totalObtained / st.totalMax) >= 0.8 ? 'মুমতাজ (A+)' : 'জাইয়্যিদ জিদ্দান (A)'
    }));

    return { exam, classInfo, students };
  }

  public async getStudentMarksheet(tenantId: string, examId: string, studentId: string): Promise<any> {
    const exam = await db.get<any>('SELECT * FROM exams WHERE id = ? AND tenant_id = ?', [examId, tenantId]);
    const student = await db.get<any>(
      `SELECT s.*, c.name_bn as class_name_bn FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ? AND s.tenant_id = ?`,
      [studentId, tenantId]
    );

    const marks = await db.all<any>(
      'SELECT * FROM exam_marks WHERE exam_id = ? AND student_id = ? AND tenant_id = ?',
      [examId, studentId, tenantId]
    );

    let totalMarks = 0;
    let obtainedMarks = 0;
    marks.forEach((m) => {
      totalMarks += m.total_marks;
      obtainedMarks += m.obtained_marks;
    });

    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    const grade = percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 60 ? 'A-' : 'B';

    return {
      exam,
      student,
      marks,
      summary: {
        totalMarks,
        obtainedMarks,
        percentage,
        grade,
        arabicGrade: percentage >= 80 ? 'মুমতাজ (ممتاز)' : percentage >= 65 ? 'জাইয়্যিদ জিদ্দান (جيد جدا)' : 'জাইয়্যিদ (جيد)'
      }
    };
  }

  public async saveBatchMarks(tenantId: string, examId: string, classId: string, marksList: Array<{ studentId: string, subjectNameBn: string, obtained: number, total?: number }>, userId: string): Promise<any> {
    for (const item of marksList) {
      const existing = await db.get<any>(
        'SELECT id, obtained_marks FROM exam_marks WHERE exam_id = ? AND student_id = ? AND subject_name_bn = ? AND tenant_id = ?',
        [examId, item.studentId, item.subjectNameBn, tenantId]
      );

      const total = item.total || 100;
      const pct = Math.round((item.obtained / total) * 100);
      const grade = pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'A-' : pct >= 50 ? 'B' : pct >= 33 ? 'C' : 'F';

      if (existing) {
        if (existing.obtained_marks !== item.obtained) {
          await db.run(
            'UPDATE exam_marks SET obtained_marks = ?, letter_grade = ? WHERE id = ?',
            [item.obtained, grade, existing.id]
          );
          await db.run(
            'INSERT INTO mark_audits (id, mark_id, old_marks, new_marks, old_value, new_value, changed_by, change_reason, reason, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), existing.id, existing.obtained_marks, item.obtained, existing.obtained_marks, item.obtained, userId, 'Keyboard-first batch mark entry', 'Keyboard-first batch mark entry', new Date().toISOString()]
          );
        }
      } else {
        const markId = uuidv4();
        await db.run(
          'INSERT INTO exam_marks (id, tenant_id, exam_id, class_id, student_id, subject_name_bn, full_marks, total_marks, obtained_marks, letter_grade, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [markId, tenantId, examId, classId, item.studentId, item.subjectNameBn, total, total, item.obtained, grade, new Date().toISOString()]
        );
      }
    }
    return { success: true, count: marksList.length };
  }
}

export const examService = new ExamService();
