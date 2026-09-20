import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export class ExamService {
  public async getExams(tenantId: string): Promise<any[]> {
    return db.all<any>('SELECT * FROM exams WHERE tenant_id = ? ORDER BY start_date DESC', [tenantId]);
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
}

export const examService = new ExamService();
