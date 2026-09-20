import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { KitabProgress } from '../types/index.js';

export class KitabService {
  public async getClasses(tenantId: string): Promise<any[]> {
    return db.all<any>(
      `SELECT c.*, COUNT(s.id) as student_count
       FROM classes c
       LEFT JOIN students s ON c.id = s.class_id AND s.deleted_at IS NULL AND s.status = 'active'
       WHERE c.tenant_id = ?
       GROUP BY c.id
       ORDER BY c.order_index ASC`,
      [tenantId]
    );
  }

  public async getKitabProgressList(tenantId: string, classId?: string): Promise<any[]> {
    let sql = `
      SELECT kp.*, c.name_bn as class_name_bn
      FROM kitab_progress kp
      JOIN classes c ON kp.class_id = c.id
      WHERE kp.tenant_id = ?
    `;
    const params: any[] = [tenantId];
    if (classId) {
      sql += ' AND kp.class_id = ?';
      params.push(classId);
    }
    sql += ' ORDER BY kp.date DESC';

    return db.all<any>(sql, params);
  }

  public async logKitabProgress(tenantId: string, payload: Partial<KitabProgress>): Promise<any> {
    const id = `kp_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString().split('T')[0];

    await db.run(
      `INSERT INTO kitab_progress (
        id, tenant_id, class_id, subject_name_bn, kitab_name, teacher_name_bn,
        date, bab_or_chapter, lesson_title, pages_completed, total_kitab_pages, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, payload.classId, payload.subjectNameBn || 'সাধারণ পাঠ',
        payload.kitabName || 'কিতাব', payload.teacherNameBn || 'সম্মানিত উস্তাদ',
        payload.date || now, payload.babOrChapter || 'অধ্যায় ১',
        payload.lessonTitle || 'আজকের পাঠ', payload.pagesCompleted || 5,
        payload.totalKitabPages || 100, payload.remarks || null
      ]
    );

    return { success: true, id };
  }
}

export const kitabService = new KitabService();
