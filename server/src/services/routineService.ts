import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { ClassRoutine } from '../types/index.js';

export class RoutineService {
  public async getRoutines(
    tenantId: string = 'inst_main',
    filters: { classId?: string; dayOfWeek?: string } = {}
  ): Promise<ClassRoutine[]> {
    let sql = `
      SELECT cr.*, c.name_bn as class_name_bn 
      FROM class_routines cr
      LEFT JOIN classes c ON cr.class_id = c.id
      WHERE (cr.tenant_id = ? OR cr.tenant_id = 'inst_main')
    `;
    const params: any[] = [tenantId];

    if (filters.classId) {
      sql += ` AND cr.class_id = ?`;
      params.push(filters.classId);
    }
    if (filters.dayOfWeek) {
      sql += ` AND cr.day_of_week = ?`;
      params.push(filters.dayOfWeek);
    }

    sql += ` ORDER BY cr.period_number ASC`;
    return await db.all<ClassRoutine>(sql, params);
  }

  public async saveRoutineSlot(
    tenantId: string = 'inst_main',
    payload: {
      id?: string;
      branch_id?: string;
      class_id: string;
      day_of_week: string;
      period_number: number;
      start_time: string;
      end_time: string;
      subject_name_bn: string;
      teacher_id?: string;
      teacher_name_bn: string;
      room_number: string;
    }
  ): Promise<ClassRoutine> {
    if (!payload.class_id || !payload.day_of_week || !payload.subject_name_bn) {
      const err: any = new Error('ক্লাস, বার (দিন) এবং বিষয়ের নাম আবশ্যক');
      err.statusCode = 400;
      throw err;
    }

    const id = payload.id || `rtn_${uuidv4().slice(0, 8)}`;
    const branchId = payload.branch_id || 'branch_mirpur';

    const existing = await db.get<any>(`SELECT id FROM class_routines WHERE id = ?`, [id]);
    if (existing) {
      await db.run(
        `UPDATE class_routines SET
          class_id = ?, day_of_week = ?, period_number = ?, start_time = ?,
          end_time = ?, subject_name_bn = ?, teacher_id = ?, teacher_name_bn = ?, room_number = ?
         WHERE id = ?`,
        [
          payload.class_id,
          payload.day_of_week,
          Number(payload.period_number || 1),
          payload.start_time,
          payload.end_time,
          payload.subject_name_bn,
          payload.teacher_id || null,
          payload.teacher_name_bn,
          payload.room_number || '১০১',
          id
        ]
      );
    } else {
      await db.run(
        `INSERT INTO class_routines (
          id, tenant_id, branch_id, class_id, day_of_week, period_number,
          start_time, end_time, subject_name_bn, teacher_id, teacher_name_bn, room_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          tenantId,
          branchId,
          payload.class_id,
          payload.day_of_week,
          Number(payload.period_number || 1),
          payload.start_time,
          payload.end_time,
          payload.subject_name_bn,
          payload.teacher_id || null,
          payload.teacher_name_bn,
          payload.room_number || '১০১'
        ]
      );
    }

    const saved = await db.get<ClassRoutine>(`SELECT * FROM class_routines WHERE id = ?`, [id]);
    return saved!;
  }

  public async copyDayRoutine(
    tenantId: string = 'inst_main',
    classId: string,
    fromDay: string,
    toDay: string
  ): Promise<{ success: boolean; copiedCount: number }> {
    if (!classId || !fromDay || !toDay) {
      const err: any = new Error('উৎস দিন (From Day) এবং গন্তব্য দিন (To Day) নির্বাচন আবশ্যক');
      err.statusCode = 400;
      throw err;
    }

    const sourceSlots = await db.all<ClassRoutine>(
      `SELECT * FROM class_routines WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND class_id = ? AND day_of_week = ?`,
      [tenantId, classId, fromDay]
    );

    if (sourceSlots.length === 0) {
      const err: any = new Error(`${fromDay} বারে কোনো রুটিন স্লট পাওয়া যায়নি কপি করার জন্য`);
      err.statusCode = 404;
      throw err;
    }

    await db.transaction(async () => {
      // Delete existing slots in destination day
      await db.run(
        `DELETE FROM class_routines WHERE (tenant_id = ? OR tenant_id = 'inst_main') AND class_id = ? AND day_of_week = ?`,
        [tenantId, classId, toDay]
      );

      // Clone slots into destination day
      for (const slot of sourceSlots) {
        const newId = `rtn_${uuidv4().slice(0, 8)}`;
        await db.run(
          `INSERT INTO class_routines (
            id, tenant_id, branch_id, class_id, day_of_week, period_number,
            start_time, end_time, subject_name_bn, teacher_id, teacher_name_bn, room_number
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            tenantId,
            slot.branch_id,
            slot.class_id,
            toDay,
            slot.period_number,
            slot.start_time,
            slot.end_time,
            slot.subject_name_bn,
            slot.teacher_id,
            slot.teacher_name_bn,
            slot.room_number
          ]
        );
      }
    });

    return {
      success: true,
      copiedCount: sourceSlots.length
    };
  }

  public async deleteRoutineSlot(tenantId: string = 'inst_main', id: string): Promise<boolean> {
    const res = await db.run(
      `DELETE FROM class_routines WHERE id = ? AND (tenant_id = ? OR tenant_id = 'inst_main')`,
      [id, tenantId]
    );
    return res.changes > 0;
  }

  public async checkConflict(
    tenantId: string = 'inst_main',
    payload: {
      id?: string;
      classId: string;
      dayOfWeek: string;
      periodNumber: number;
      teacherId?: string;
      teacherNameBn?: string;
      roomNumber?: string;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<{ hasConflict: boolean; conflicts: Array<{ vector: 'teacher' | 'room' | 'class' | 'time'; detail: string }> }> {
    const conflicts: Array<{ vector: 'teacher' | 'room' | 'class' | 'time'; detail: string }> = [];

    // Vector 1: Time / Period Bounds
    if (payload.periodNumber < 1 || payload.periodNumber > 12) {
      conflicts.push({
        vector: 'time',
        detail: `ঘণ্টা/পিরিয়ড নম্বর ১ থেকে ১২ এর মধ্যে হতে হবে (দেওয়া হয়েছে: ${payload.periodNumber})`
      });
    }

    // Vector 2: Class conflict (Does class already have a routine in this period?)
    const classConflict = await db.get<any>(
      `SELECT cr.*, c.name_bn as class_name_bn 
       FROM class_routines cr
       LEFT JOIN classes c ON cr.class_id = c.id
       WHERE (cr.tenant_id = ? OR cr.tenant_id = 'inst_main')
         AND cr.class_id = ? 
         AND cr.day_of_week = ? 
         AND cr.period_number = ?
         AND cr.id != ? LIMIT 1`,
      [tenantId, payload.classId, payload.dayOfWeek, payload.periodNumber, payload.id || 'new']
    );
    if (classConflict) {
      conflicts.push({
        vector: 'class',
        detail: `এই শ্রেণিতে (${classConflict.class_name_bn || payload.classId}) ${payload.dayOfWeek} বারে ${payload.periodNumber}-ম পিরিয়ডে ইতোমধ্যে "${classConflict.subject_name_bn}" বিষয় নির্ধারিত রয়েছে।`
      });
    }

    // Vector 3: Teacher conflict (Is teacher assigned to another class in this period?)
    if (payload.teacherId || payload.teacherNameBn) {
      const teacherConflict = await db.get<any>(
        `SELECT cr.*, c.name_bn as class_name_bn 
         FROM class_routines cr
         LEFT JOIN classes c ON cr.class_id = c.id
         WHERE (cr.tenant_id = ? OR cr.tenant_id = 'inst_main')
           AND (cr.teacher_id = ? OR (cr.teacher_name_bn = ? AND cr.teacher_name_bn IS NOT NULL AND cr.teacher_name_bn != ''))
           AND cr.day_of_week = ? 
           AND cr.period_number = ?
           AND cr.id != ? LIMIT 1`,
        [tenantId, payload.teacherId || '__none__', payload.teacherNameBn || '__none__', payload.dayOfWeek, payload.periodNumber, payload.id || 'new']
      );
      if (teacherConflict) {
        conflicts.push({
          vector: 'teacher',
          detail: `শিক্ষক "${payload.teacherNameBn || teacherConflict.teacher_name_bn}" উক্ত সময়ে (${payload.dayOfWeek}, ${payload.periodNumber}-ম পিরিয়ড) "${teacherConflict.class_name_bn || teacherConflict.class_id}" শ্রেণিতে নিয়োজিত আছেন।`
        });
      }
    }

    // Vector 4: Room conflict (Is room occupied in this period?)
    if (payload.roomNumber && payload.roomNumber.trim()) {
      const roomConflict = await db.get<any>(
        `SELECT cr.*, c.name_bn as class_name_bn 
         FROM class_routines cr
         LEFT JOIN classes c ON cr.class_id = c.id
         WHERE (cr.tenant_id = ? OR cr.tenant_id = 'inst_main')
           AND cr.room_number = ?
           AND cr.day_of_week = ? 
           AND cr.period_number = ?
           AND cr.id != ? LIMIT 1`,
        [tenantId, payload.roomNumber.trim(), payload.dayOfWeek, payload.periodNumber, payload.id || 'new']
      );
      if (roomConflict) {
        conflicts.push({
          vector: 'room',
          detail: `কক্ষ নম্বর "${payload.roomNumber}" উক্ত সময়ে (${payload.dayOfWeek}, ${payload.periodNumber}-ম পিরিয়ড) "${roomConflict.class_name_bn || roomConflict.class_id}" দ্বারা ব্যবহৃত হচ্ছে।`
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }

  public async publishTimetable(tenantId: string = 'inst_main', publishedBy: string): Promise<any> {
    const activeSlots = await db.all<any>(
      `SELECT cr.*, c.name_bn as class_name_bn 
       FROM class_routines cr
       LEFT JOIN classes c ON cr.class_id = c.id
       WHERE (cr.tenant_id = ? OR cr.tenant_id = 'inst_main')
       ORDER BY cr.class_id, cr.day_of_week, cr.period_number ASC`,
      [tenantId]
    );

    const versionId = `ttv_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO timetable_versions (id, tenant_id, published_at, published_by, snapshot_json)
       VALUES (?, ?, ?, ?, ?)`,
      [versionId, tenantId, now, publishedBy, JSON.stringify(activeSlots)]
    );

    return {
      success: true,
      versionId,
      publishedAt: now,
      snapshotCount: activeSlots.length
    };
  }

  public async getTimetableVersions(tenantId: string = 'inst_main'): Promise<any[]> {
    return db.all<any>(
      `SELECT id, tenant_id, published_at, published_by, snapshot_json
       FROM timetable_versions
       WHERE tenant_id = ? OR tenant_id = 'inst_main'
       ORDER BY published_at DESC`,
      [tenantId]
    );
  }
}

export const routineService = new RoutineService();
