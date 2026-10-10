import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { HifzRecord } from '../types/index.js';
import { ProblemDetailsException } from '../utils/problemDetails.js';
import { settingsService } from './settingsService.js';

export class HifzService {
  public async getTodayWorkspace(tenantId: string, teacherId?: string, dateStr?: string): Promise<any> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    // Fetch all Hifz enrolled students
    const students = await db.all<any>(
      `SELECT s.id, s.student_id_number, s.full_name_bn, s.roll_number, c.name_bn as class_name_bn,
              h.id as hifz_record_id, h.teacher_id, h.sabaq_para, h.sabaq_surah, h.sabaq_ayah_range,
              h.sabaq_pages, h.sabak_line, h.sabak_mistakes, h.sabaq_rating,
              h.sabki_para, h.sabki_para_from, h.sabki_para_to, h.sabki_pages, h.sabki_mistakes,
              h.amukhta_para_from, h.amukhta_para_to, h.amukhta_mistakes,
              h.dour_para_from, h.dour_para_to, h.dour_mistakes,
              h.manzil_para, h.manzil_mistakes, h.teacher_notes, h.client_uuid, h.is_offline_sync
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
        teacherId: s.teacher_id,
        // Sabak
        sabaqPara: s.sabaq_para || 1,
        sabaqSurah: s.sabaq_surah || 'সূরা আল-বাকারাহ',
        sabaqAyahRange: s.sabaq_ayah_range || '১-২০',
        sabaqPages: s.sabaq_pages || 1.0,
        sabakLine: s.sabak_line || 1,
        sabakMistakes: s.sabak_mistakes || 0,
        sabaqRating: s.sabaq_rating || 'good',
        // Sabki
        sabkiPara: s.sabki_para || 1,
        sabkiParaFrom: s.sabki_para_from || s.sabki_para || 1,
        sabkiParaTo: s.sabki_para_to || s.sabki_para || 1,
        sabkiPages: s.sabki_pages || 2.0,
        sabkiMistakes: s.sabki_mistakes || 0,
        // Amukhta ("আমুখতা" - strictly separated from Dour)
        amukhtaParaFrom: s.amukhta_para_from || 1,
        amukhtaParaTo: s.amukhta_para_to || 1,
        amukhtaMistakes: s.amukhta_mistakes || 0,
        // Dour
        dourParaFrom: s.dour_para_from || 1,
        dourParaTo: s.dour_para_to || 1,
        dourMistakes: s.dour_mistakes || 0,
        // Legacy compatibility
        manzilPara: s.manzil_para || 1,
        manzilMistakes: s.manzil_mistakes || 0,
        teacherNotes: s.teacher_notes || '',
        clientUuid: s.client_uuid || null,
        isOfflineSync: Boolean(s.is_offline_sync)
      }))
    };
  }

  public async recordDailyHifz(tenantId: string, teacherId: string, payload: any): Promise<any> {
    const studentId = payload.studentId || payload.student_id;
    if (!studentId) {
      throw new ProblemDetailsException({
        code: 'VALIDATION_ERROR',
        title: 'Validation Error',
        status: 400,
        detail: 'studentId is required for Hifz progress submission.'
      });
    }

    const targetDate = payload.date || new Date().toISOString().split('T')[0];

    // Check for existing record on that date
    const existing = await db.get<any>(
      'SELECT * FROM hifz_records WHERE tenant_id = ? AND student_id = ? AND date = ?',
      [tenantId, studentId, targetDate]
    );

    if (existing) {
      // Rule 1: Same teacher submits again -> Last-Write-Wins (LWW) per field, with audit log
      if (existing.teacher_id === teacherId) {
        const updated = {
          sabaq_para: payload.sabaqPara ?? payload.sabaq_para ?? existing.sabaq_para,
          sabaq_surah: payload.sabaqSurah ?? payload.sabaq_surah ?? existing.sabaq_surah,
          sabaq_ayah_range: payload.sabaqAyahRange ?? payload.sabaq_ayah_range ?? existing.sabaq_ayah_range,
          sabaq_pages: payload.sabaqPages ?? payload.sabaq_pages ?? existing.sabaq_pages,
          sabak_line: payload.sabakLine ?? payload.sabak_line ?? existing.sabak_line ?? 1,
          sabak_mistakes: payload.sabakMistakes ?? payload.sabak_mistakes ?? existing.sabak_mistakes ?? 0,
          sabaq_rating: payload.sabaqRating ?? payload.sabaq_rating ?? existing.sabaq_rating,
          sabki_para: payload.sabkiPara ?? payload.sabki_para ?? existing.sabki_para,
          sabki_para_from: payload.sabkiParaFrom ?? payload.sabki_para_from ?? existing.sabki_para_from,
          sabki_para_to: payload.sabkiParaTo ?? payload.sabki_para_to ?? existing.sabki_para_to,
          sabki_pages: payload.sabkiPages ?? payload.sabki_pages ?? existing.sabki_pages,
          sabki_mistakes: payload.sabkiMistakes ?? payload.sabki_mistakes ?? existing.sabki_mistakes,
          amukhta_para_from: payload.amukhtaParaFrom ?? payload.amukhta_para_from ?? existing.amukhta_para_from,
          amukhta_para_to: payload.amukhtaParaTo ?? payload.amukhta_para_to ?? existing.amukhta_para_to,
          amukhta_mistakes: payload.amukhtaMistakes ?? payload.amukhta_mistakes ?? existing.amukhta_mistakes ?? 0,
          dour_para_from: payload.dourParaFrom ?? payload.dour_para_from ?? existing.dour_para_from,
          dour_para_to: payload.dourParaTo ?? payload.dour_para_to ?? existing.dour_para_to,
          dour_mistakes: payload.dourMistakes ?? payload.dour_mistakes ?? existing.dour_mistakes ?? 0,
          manzil_para: payload.manzilPara ?? payload.manzil_para ?? existing.manzil_para,
          manzil_mistakes: payload.manzilMistakes ?? payload.manzil_mistakes ?? existing.manzil_mistakes,
          teacher_notes: payload.teacherNotes ?? payload.teacher_notes ?? existing.teacher_notes,
          client_uuid: payload.clientUuid ?? payload.client_uuid ?? existing.client_uuid,
          is_offline_sync: payload.isOfflineSync ? 1 : existing.is_offline_sync
        };

        await db.run(
          `UPDATE hifz_records SET
            sabaq_para = ?, sabaq_surah = ?, sabaq_ayah_range = ?, sabaq_pages = ?,
            sabak_line = ?, sabak_mistakes = ?, sabaq_rating = ?,
            sabki_para = ?, sabki_para_from = ?, sabki_para_to = ?, sabki_pages = ?, sabki_mistakes = ?,
            amukhta_para_from = ?, amukhta_para_to = ?, amukhta_mistakes = ?,
            dour_para_from = ?, dour_para_to = ?, dour_mistakes = ?,
            manzil_para = ?, manzil_mistakes = ?, teacher_notes = ?,
            client_uuid = ?, is_offline_sync = ?
           WHERE id = ?`,
          [
            updated.sabaq_para, updated.sabaq_surah, updated.sabaq_ayah_range, updated.sabaq_pages,
            updated.sabak_line, updated.sabak_mistakes, updated.sabaq_rating,
            updated.sabki_para, updated.sabki_para_from, updated.sabki_para_to, updated.sabki_pages, updated.sabki_mistakes,
            updated.amukhta_para_from, updated.amukhta_para_to, updated.amukhta_mistakes,
            updated.dour_para_from, updated.dour_para_to, updated.dour_mistakes,
            updated.manzil_para, updated.manzil_mistakes, updated.teacher_notes,
            updated.client_uuid, updated.is_offline_sync, existing.id
          ]
        );

        // Record audit trail
        try {
          const nowStr = new Date().toISOString();
          await db.run(
            `INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, old_values, new_values, details, timestamp, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(), tenantId, teacherId, 'HIFZ_LWW_UPDATE', 'hifz_record', existing.id,
              JSON.stringify(existing), JSON.stringify(updated), 'Hifz progress LWW merge', nowStr, nowStr
            ]
          );
        } catch {}

        return { success: true, recordId: existing.id, mode: 'lww_merged' };
      }

      // Rule 2: Different teacher submits for the same student on the same date -> Conflict!
      const conflictId = `cnfl_${uuidv4().slice(0, 8)}`;
      await db.run(
        `INSERT INTO hifz_conflicts (
          id, tenant_id, student_id, date, teacher_a_id, teacher_a_payload_json, teacher_b_id, teacher_b_payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conflictId,
          tenantId,
          studentId,
          targetDate,
          existing.teacher_id,
          JSON.stringify(existing),
          teacherId,
          JSON.stringify(payload)
        ]
      );

      throw new ProblemDetailsException({
        code: 'HIFZ_TEACHER_CONFLICT',
        title: 'Hifz Progress Submission Conflict',
        status: 409,
        detail: 'উক্ত শিক্ষার্থীর জন্য আজকের তারিখে অন্য একজন শিক্ষক ইতোমধ্যে হিফজ অগ্রগতি দাখিল করেছেন। হেড-টিচার বা মুহতামিম সমন্বয়ের জন্য দ্বন্দ্ব সংরক্ষণ করা হয়েছে।',
        extras: {
          conflictId,
          existingTeacherId: existing.teacher_id,
          studentId,
          date: targetDate
        }
      });
    }

    // New record insertion
    const recordId = `hifz_${studentId}_${targetDate.replace(/-/g, '')}`;
    const sabaqPara = payload.sabaqPara ?? payload.sabaq_para ?? 1;
    const sabaqSurah = payload.sabaqSurah ?? payload.sabaq_surah ?? 'সূরা আল-বাকারাহ';
    const sabaqAyahRange = payload.sabaqAyahRange ?? payload.sabaq_ayah_range ?? '১-২০';
    const sabaqPages = payload.sabaqPages ?? payload.sabaq_pages ?? 1.0;
    const sabakLine = payload.sabakLine ?? payload.sabak_line ?? 1;
    const sabakMistakes = payload.sabakMistakes ?? payload.sabak_mistakes ?? 0;
    const sabaqRating = payload.sabaqRating ?? payload.sabaq_rating ?? 'good';

    const sabkiPara = payload.sabkiPara ?? payload.sabki_para ?? 1;
    const sabkiParaFrom = payload.sabkiParaFrom ?? payload.sabki_para_from ?? sabkiPara;
    const sabkiParaTo = payload.sabkiParaTo ?? payload.sabki_para_to ?? sabkiPara;
    const sabkiPages = payload.sabkiPages ?? payload.sabki_pages ?? 2.0;
    const sabkiMistakes = payload.sabkiMistakes ?? payload.sabki_mistakes ?? 0;

    const amukhtaParaFrom = payload.amukhtaParaFrom ?? payload.amukhta_para_from ?? 1;
    const amukhtaParaTo = payload.amukhtaParaTo ?? payload.amukhta_para_to ?? 1;
    const amukhtaMistakes = payload.amukhtaMistakes ?? payload.amukhta_mistakes ?? 0;

    const dourParaFrom = payload.dourParaFrom ?? payload.dour_para_from ?? 1;
    const dourParaTo = payload.dourParaTo ?? payload.dour_para_to ?? 1;
    const dourMistakes = payload.dourMistakes ?? payload.dour_mistakes ?? 0;

    const manzilPara = payload.manzilPara ?? payload.manzil_para ?? 1;
    const manzilMistakes = payload.manzilMistakes ?? payload.manzil_mistakes ?? 0;
    const teacherNotes = payload.teacherNotes ?? payload.teacher_notes ?? '';
    const clientUuid = payload.clientUuid ?? payload.client_uuid ?? null;
    const isOfflineSync = payload.isOfflineSync ? 1 : 0;

    await db.run(
      `INSERT INTO hifz_records (
        id, tenant_id, student_id, teacher_id, date,
        sabaq_para, sabaq_surah, sabaq_ayah_range, sabaq_pages, sabak_line, sabak_mistakes, sabaq_rating,
        sabki_para, sabki_para_from, sabki_para_to, sabki_pages, sabki_mistakes,
        amukhta_para_from, amukhta_para_to, amukhta_mistakes,
        dour_para_from, dour_para_to, dour_mistakes,
        manzil_para, manzil_mistakes, teacher_notes, client_uuid, is_offline_sync, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId, tenantId, studentId, teacherId, targetDate,
        sabaqPara, sabaqSurah, sabaqAyahRange, sabaqPages, sabakLine, sabakMistakes, sabaqRating,
        sabkiPara, sabkiParaFrom, sabkiParaTo, sabkiPages, sabkiMistakes,
        amukhtaParaFrom, amukhtaParaTo, amukhtaMistakes,
        dourParaFrom, dourParaTo, dourMistakes,
        manzilPara, manzilMistakes, teacherNotes, clientUuid, isOfflineSync, new Date().toISOString()
      ]
    );

    return { success: true, recordId, mode: 'created' };
  }

  public async getConflicts(tenantId: string): Promise<any[]> {
    const sql = `
      SELECT 
        hc.id,
        hc.tenant_id,
        hc.student_id,
        hc.date,
        hc.teacher_a_id,
        hc.teacher_a_payload_json,
        hc.teacher_b_id,
        hc.teacher_b_payload_json,
        hc.resolved_at,
        hc.resolved_by,
        s.full_name_bn as student_name_bn,
        s.student_id_number,
        s.roll_number,
        u1.full_name_bn as teacher_a_name_bn,
        u2.full_name_bn as teacher_b_name_bn
      FROM hifz_conflicts hc
      JOIN students s ON hc.student_id = s.id
      LEFT JOIN users u1 ON hc.teacher_a_id = u1.id
      LEFT JOIN users u2 ON hc.teacher_b_id = u2.id
      WHERE hc.tenant_id = ? AND hc.resolved_at IS NULL
      ORDER BY hc.date DESC
    `;
    const rows = await db.all<any>(sql, [tenantId]);
    return rows.map((r) => {
      let payloadA = {};
      let payloadB = {};
      try { payloadA = JSON.parse(r.teacher_a_payload_json); } catch {}
      try { payloadB = JSON.parse(r.teacher_b_payload_json); } catch {}
      return {
        ...r,
        teacherAPayload: payloadA,
        teacherBPayload: payloadB
      };
    });
  }

  public async resolveConflict(
    tenantId: string,
    conflictId: string,
    resolvedBy: string,
    resolution: { chosenTeacher: 'a' | 'b' | 'custom'; customPayload?: any; notes?: string }
  ): Promise<any> {
    const conflict = await db.get<any>(
      'SELECT * FROM hifz_conflicts WHERE id = ? AND tenant_id = ?',
      [conflictId, tenantId]
    );
    if (!conflict) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Conflict Not Found',
        status: 404,
        detail: 'The requested Hifz conflict record does not exist.'
      });
    }

    let payload: any = {};
    let chosenTeacherId = conflict.teacher_a_id;

    if (resolution.chosenTeacher === 'a') {
      try { payload = JSON.parse(conflict.teacher_a_payload_json); } catch {}
      chosenTeacherId = conflict.teacher_a_id;
    } else if (resolution.chosenTeacher === 'b') {
      try { payload = JSON.parse(conflict.teacher_b_payload_json); } catch {}
      chosenTeacherId = conflict.teacher_b_id;
    } else {
      payload = resolution.customPayload || {};
      chosenTeacherId = resolvedBy;
    }

    // Apply the resolution payload to hifz_records
    await db.run(
      `UPDATE hifz_records SET
        teacher_id = ?,
        sabaq_para = ?, sabaq_surah = ?, sabaq_ayah_range = ?, sabaq_pages = ?,
        sabak_line = ?, sabak_mistakes = ?, sabaq_rating = ?,
        sabki_para = ?, sabki_para_from = ?, sabki_para_to = ?, sabki_pages = ?, sabki_mistakes = ?,
        amukhta_para_from = ?, amukhta_para_to = ?, amukhta_mistakes = ?,
        dour_para_from = ?, dour_para_to = ?, dour_mistakes = ?,
        manzil_para = ?, manzil_mistakes = ?, teacher_notes = ?
       WHERE student_id = ? AND date = ? AND tenant_id = ?`,
      [
        chosenTeacherId,
        payload.sabaq_para || payload.sabaqPara || 1,
        payload.sabaq_surah || payload.sabaqSurah || 'সূরা আল-বাকারাহ',
        payload.sabaq_ayah_range || payload.sabaqAyahRange || '১-২০',
        payload.sabaq_pages || payload.sabaqPages || 1.0,
        payload.sabak_line || payload.sabakLine || 1,
        payload.sabak_mistakes || payload.sabakMistakes || 0,
        payload.sabaq_rating || payload.sabaqRating || 'good',
        payload.sabki_para || payload.sabkiPara || 1,
        payload.sabki_para_from || payload.sabkiParaFrom || 1,
        payload.sabki_para_to || payload.sabkiParaTo || 1,
        payload.sabki_pages || payload.sabkiPages || 2.0,
        payload.sabki_mistakes || payload.sabkiMistakes || 0,
        payload.amukhta_para_from || payload.amukhtaParaFrom || 1,
        payload.amukhta_para_to || payload.amukhtaParaTo || 1,
        payload.amukhta_mistakes || payload.amukhtaMistakes || 0,
        payload.dour_para_from || payload.dourParaFrom || 1,
        payload.dour_para_to || payload.dourParaTo || 1,
        payload.dour_mistakes || payload.dourMistakes || 0,
        payload.manzil_para || payload.manzilPara || 1,
        payload.manzil_mistakes || payload.manzilMistakes || 0,
        payload.teacher_notes || payload.teacherNotes || '',
        conflict.student_id, conflict.date, tenantId
      ]
    );

    // Mark conflict as resolved
    await db.run(
      `UPDATE hifz_conflicts SET
        resolved_at = ?, resolved_by = ?, resolution_json = ?
       WHERE id = ?`,
      [new Date().toISOString(), resolvedBy, JSON.stringify(resolution), conflictId]
    );

    // Write audit log
    try {
      await db.run(
        `INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(), tenantId, resolvedBy, 'HIFZ_CONFLICT_RESOLVED', 'hifz_conflict', conflictId,
          `হিফজ দ্বন্দ্ব সমাধান করা হয়েছে (পছন্দ: ${resolution.chosenTeacher}, নোট: ${resolution.notes || 'N/A'})`,
          new Date().toISOString()
        ]
      );
    } catch {}

    return { success: true, conflictId, resolvedBy, resolution };
  }

  public async inlineEditStudent(
    tenantId: string,
    studentId: string,
    updatedBy: string,
    payload: { fullNameBn?: string; rollNumber?: string; currentPara?: number; reason?: string }
  ): Promise<any> {
    const student = await db.get<any>(
      'SELECT id, full_name_bn, roll_number FROM students WHERE id = ? AND tenant_id = ?',
      [studentId, tenantId]
    );
    if (!student) {
      throw new ProblemDetailsException({
        code: 'NOT_FOUND',
        title: 'Student Not Found',
        status: 404,
        detail: 'The requested student was not found.'
      });
    }

    const oldValues = {
      fullNameBn: student.full_name_bn,
      rollNumber: student.roll_number
    };

    const newValues: any = {};
    if (payload.fullNameBn !== undefined) newValues.fullNameBn = payload.fullNameBn;
    if (payload.rollNumber !== undefined) newValues.rollNumber = payload.rollNumber;

    if (Object.keys(newValues).length > 0) {
      await db.run(
        'UPDATE students SET full_name_bn = COALESCE(?, full_name_bn), roll_number = COALESCE(?, roll_number) WHERE id = ?',
        [payload.fullNameBn || null, payload.rollNumber || null, studentId]
      );
    }

    // Write audit log
    try {
      const nowStr = new Date().toISOString();
      await db.run(
        `INSERT INTO audit_logs (id, tenant_id, user_id, user_name, user_role, action, entity_name, entity_type, entity_id, old_values, new_values, details, timestamp, created_at)
         VALUES (?, ?, ?, 'System User', 'admin', ?, 'student', 'student', ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          tenantId,
          updatedBy,
          'STUDENT_INLINE_EDIT',
          studentId,
          JSON.stringify(oldValues),
          JSON.stringify(newValues),
          `হিফজ ওয়ার্কস্পেস থেকে সরাসরি তথ্য হালনাগাদ (কারণ: ${payload.reason || 'ওয়ার্কস্পেস এডিট'})`,
          nowStr,
          nowStr
        ]
      );
    } catch (e) {
      console.error('Audit log insert failed:', e);
    }

    const updatedStudent = await db.get<any>('SELECT * FROM students WHERE id = ?', [studentId]);
    return { success: true, data: updatedStudent };
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
      recentMistakes += (r.sabki_mistakes || 0) + (r.amukhta_mistakes || 0) + (r.manzil_mistakes || 0);
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
    // Read dynamic alert configuration from settings
    const alertSettings = await settingsService.getHifzAlertSettings(tenantId);
    const maxSabki = alertSettings.maxSabkiMistakes ?? 3;
    const maxAmukhta = alertSettings.maxAmukhtaMistakes ?? 4;

    const sql = `
      SELECT 
        s.id as student_id,
        s.full_name_bn,
        s.student_id_number,
        c.name_bn as class_name_bn,
        COUNT(h.id) as weak_count,
        AVG(h.sabki_mistakes) as avg_mistakes,
        MAX(h.date) as last_weak_date
      FROM hifz_records h
      JOIN students s ON h.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE h.tenant_id = ? AND (h.sabaq_rating = 'weak' OR h.sabki_mistakes >= ? OR h.amukhta_mistakes >= ?)
      GROUP BY s.id
      HAVING weak_count >= 1
      ORDER BY avg_mistakes DESC
      LIMIT 20
    `;
    return db.all<any>(sql, [tenantId, maxSabki, maxAmukhta]);
  }
}

export const hifzService = new HifzService();
