import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { HifzRecord } from '../types/index.js';

export class HifzService {
  public async getTodayWorkspace(tenantId: string, teacherId?: string, dateStr?: string): Promise<any> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    // Fetch all Hifz enrolled students
    const students = await db.all<any>(
      `SELECT s.id, s.student_id_number, s.full_name_bn, s.roll_number, c.name_bn as class_name_bn,
              h.id as hifz_record_id, h.sabaq_para, h.sabaq_surah, h.sabaq_ayah_range,
              h.sabaq_pages, h.sabaq_rating, h.sabqi_para, h.sabqi_mistakes,
              h.manzil_para, h.manzil_mistakes, h.teacher_notes
       FROM students s
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN hifz_records h ON s.id = h.student_id AND h.date = ?
       WHERE s.tenant_id = ? AND s.is_hifz_student = 1 AND s.deleted_at IS NULL AND s.status = 'active'
       ORDER BY c.order_index ASC, CAST(s.roll_number AS INTEGER) ASC`,
      [targetDate, tenantId]
    );

    const totalHifz = students.length;
    const recordedCount = students.filter((s) => s.hifz_record_id).length;

    return {
      date: targetDate,
      totalHifzStudents: totalHifz,
      recordedCount,
      pendingCount: totalHifz - recordedCount,
      students: students.map((s) => ({
        studentId: s.id,
        studentIdNumber: s.student_id_number,
        fullNameBn: s.full_name_bn,
        rollNumber: s.roll_number,
        classNameBn: s.class_name_bn,
        hasRecordedToday: Boolean(s.hifz_record_id),
        sabaqPara: s.sabaq_para || 1,
        sabaqSurah: s.sabaq_surah || 'সূরা আল-বাকারাহ',
        sabaqAyahRange: s.sabaq_ayah_range || '১-২০',
        sabaqPages: s.sabaq_pages || 1.0,
        sabaqRating: s.sabaq_rating || 'good',
        sabqiPara: s.sabqi_para || 1,
        sabqiMistakes: s.sabqi_mistakes || 0,
        manzilPara: s.manzil_para || 1,
        manzilMistakes: s.manzil_mistakes || 0,
        teacherNotes: s.teacher_notes || ''
      }))
    };
  }

  public async recordDailyHifz(tenantId: string, teacherId: string, payload: Partial<HifzRecord>): Promise<any> {
    if (!payload.studentId) throw new Error('studentId is required');

    const targetDate = payload.date || new Date().toISOString().split('T')[0];
    const recordId = `hifz_${payload.studentId}_${targetDate.replace(/-/g, '')}`;

    // Upsert hifz record
    await db.run(
      `INSERT INTO hifz_records (
        id, tenant_id, student_id, teacher_id, date,
        sabaq_para, sabaq_surah, sabaq_ayah_range, sabaq_pages, sabaq_rating,
        sabqi_para, sabqi_pages, sabqi_mistakes, manzil_para, manzil_mistakes, teacher_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sabaq_para = excluded.sabaq_para,
        sabaq_surah = excluded.sabaq_surah,
        sabaq_ayah_range = excluded.sabaq_ayah_range,
        sabaq_pages = excluded.sabaq_pages,
        sabaq_rating = excluded.sabaq_rating,
        sabqi_para = excluded.sabqi_para,
        sabqi_mistakes = excluded.sabqi_mistakes,
        manzil_para = excluded.manzil_para,
        manzil_mistakes = excluded.manzil_mistakes,
        teacher_notes = excluded.teacher_notes`,
      [
        recordId, tenantId, payload.studentId, teacherId, targetDate,
        payload.sabaqPara || 1, payload.sabaqSurah || 'সূরা আল-বাকারাহ', payload.sabaqAyahRange || '১-২০',
        payload.sabaqPages || 1.0, payload.sabaqRating || 'good',
        payload.sabqiPara || 1, payload.sabqiPages || 2.0, payload.sabqiMistakes || 0,
        payload.manzilPara || 1, payload.manzilMistakes || 0, payload.teacherNotes || '',
        new Date().toISOString()
      ]
    );

    return { success: true, recordId };
  }

  public async getStudentHifzSummary(tenantId: string, studentId: string): Promise<any> {
    const student = await db.get<any>(
      'SELECT id, full_name_bn, student_id_number FROM students WHERE id = ? AND tenant_id = ?',
      [studentId, tenantId]
    );
    if (!student) throw new Error('Student not found');

    const records = await db.all<any>(
      'SELECT * FROM hifz_records WHERE student_id = ? AND tenant_id = ? ORDER BY date DESC LIMIT 30',
      [studentId, tenantId]
    );

    const latest = records[0] || {};
    const totalParasCompleted = latest.sabaq_para ? Math.max(1, latest.sabaq_para - 1) : 1;
    const progressPercentage = Math.min(100, Math.round((totalParasCompleted / 30) * 100));

    // Calculate mistakes trend over last 10 entries
    let recentMistakes = 0;
    records.slice(0, 10).forEach((r) => {
      recentMistakes += (r.sabqi_mistakes || 0) + (r.manzil_mistakes || 0);
    });

    const averageMistakes = records.length > 0 ? (recentMistakes / Math.min(10, records.length)).toFixed(1) : '0';

    return {
      student,
      currentPara: latest.sabaq_para || 1,
      currentSurah: latest.sabaq_surah || 'সূরা আল-বাকারাহ',
      totalParasCompleted,
      progressPercentage,
      averageMistakes,
      trend: Number(averageMistakes) > 3 ? 'declining' : 'improving',
      history: records
    };
  }

  public async getDecliningAlerts(tenantId: string): Promise<any[]> {
    const sql = `
      SELECT 
        s.id as student_id,
        s.full_name_bn,
        s.student_id_number,
        c.name_bn as class_name_bn,
        COUNT(h.id) as weak_count,
        AVG(h.sabqi_mistakes) as avg_mistakes
      FROM hifz_records h
      JOIN students s ON h.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE h.tenant_id = ? AND (h.sabaq_rating = 'weak' OR h.sabqi_mistakes >= 4)
      GROUP BY s.id
      HAVING weak_count >= 1
      ORDER BY avg_mistakes DESC
      LIMIT 10
    `;
    return db.all<any>(sql, [tenantId]);
  }
}

export const hifzService = new HifzService();
