import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { AttendanceRecord, AttendanceStatus } from '../types/index.js';

export class AttendanceService {
  public async getTodaySummary(tenantId: string, dateStr?: string): Promise<any> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    const totalStudentsRow = await db.get<any>(
      `SELECT COUNT(*) as total FROM students WHERE tenant_id = ? AND deleted_at IS NULL AND status = 'active'`,
      [tenantId]
    );
    const totalStudents = totalStudentsRow?.total || 0;

    const stats = await db.get<any>(
      `SELECT 
         COUNT(*) as total_recorded,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
         SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
         SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_count
       FROM attendance_records
       WHERE tenant_id = ? AND date = ?`,
      [tenantId, targetDate]
    );

    const present = stats?.present_count || 0;
    const absent = stats?.absent_count || 0;
    const late = stats?.late_count || 0;
    const leave = stats?.leave_count || 0;
    const recorded = stats?.total_recorded || 0;
    const rate = recorded > 0 ? Math.round((present / recorded) * 100) : 0;

    // Unrecorded classes count
    const totalClasses = (await db.get<any>('SELECT COUNT(*) as c FROM classes WHERE tenant_id = ?', [tenantId]))?.c || 0;
    const recordedClasses = (await db.get<any>(
      'SELECT COUNT(DISTINCT class_id) as c FROM attendance_records WHERE tenant_id = ? AND date = ?',
      [tenantId, targetDate]
    ))?.c || 0;

    return {
      date: targetDate,
      totalStudents,
      recordedStudents: recorded,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      leaveCount: leave,
      attendanceRate: rate,
      pendingClassesCount: Math.max(0, totalClasses - recordedClasses)
    };
  }

  public async getClassRegister(tenantId: string, classId: string, dateStr?: string): Promise<any> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    const classInfo = await db.get<any>('SELECT * FROM classes WHERE id = ? AND tenant_id = ?', [classId, tenantId]);
    if (!classInfo) {
      const err: any = new Error('শ্রেণি খুঁজে পাওয়া যায়নি।');
      err.statusCode = 404;
      throw err;
    }

    const students = await db.all<any>(
      `SELECT s.id, s.student_id_number, s.full_name_bn, s.roll_number, s.guardian_phone,
              a.status, a.check_in_time, a.remarks
       FROM students s
       LEFT JOIN attendance_records a ON s.id = a.student_id AND a.date = ?
       WHERE s.class_id = ? AND s.tenant_id = ? AND s.deleted_at IS NULL AND s.status = 'active'
       ORDER BY CAST(s.roll_number AS INTEGER) ASC`,
      [targetDate, classId, tenantId]
    );

    return {
      classInfo,
      date: targetDate,
      students: students.map((s) => ({
        studentId: s.id,
        studentIdNumber: s.student_id_number,
        fullNameBn: s.full_name_bn,
        rollNumber: s.roll_number,
        guardianPhone: s.guardian_phone,
        status: (s.status as AttendanceStatus) || 'present', // Default to present for speed
        remarks: s.remarks || ''
      }))
    };
  }

  public async submitClassAttendance(
    tenantId: string,
    branchId: string,
    classId: string,
    recordedByUserId: string,
    records: { studentId: string; status: AttendanceStatus; remarks?: string }[],
    dateStr?: string
  ): Promise<any> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    await db.transaction(async () => {
      // Delete existing records for class and date
      await db.run(
        'DELETE FROM attendance_records WHERE tenant_id = ? AND class_id = ? AND date = ?',
        [tenantId, classId, targetDate]
      );

      for (const r of records) {
        await db.run(
          `INSERT INTO attendance_records (id, tenant_id, branch_id, class_id, student_id, date, status, check_in_time, remarks, recorded_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `att_${r.studentId}_${targetDate.replace(/-/g, '')}`,
            tenantId,
            branchId,
            classId,
            r.studentId,
            targetDate,
            r.status,
            r.status === 'present' || r.status === 'late' ? '08:00' : null,
            r.remarks || null,
            recordedByUserId
          ]
        );
      }
    });

    return this.getTodaySummary(tenantId, targetDate);
  }

  public async getRepeatedAbsences(tenantId: string, days: number = 7, minAbsences: number = 2): Promise<any[]> {
    const sql = `
      SELECT 
        s.id as student_id,
        s.full_name_bn,
        s.roll_number,
        s.guardian_name_bn,
        s.guardian_phone,
        c.name_bn as class_name_bn,
        COUNT(a.id) as absent_count
      FROM attendance_records a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE a.tenant_id = ? 
        AND a.status = 'absent'
        AND a.date >= date('now', '-' || ? || ' days')
      GROUP BY s.id
      HAVING absent_count >= ?
      ORDER BY absent_count DESC
    `;

    return db.all<any>(sql, [tenantId, days, minAbsences]);
  }
}

export const attendanceService = new AttendanceService();
