import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { MuhasabaRecord } from '../types/index.js';

export class MuhasabaService {
  public calculateAmalScore(data: {
    fajr?: number;
    dhuhr?: number;
    asr?: number;
    maghrib?: number;
    isha?: number;
    tahajjud?: number;
    tilawat_pages?: number;
    duas_read?: number;
    truthfulness_score?: number;
    adab_score?: number;
  }): number {
    let score = 0;
    // 5 daily prayers in Jamat = 12 points each = 60 points
    if (data.fajr) score += 12;
    if (data.dhuhr) score += 12;
    if (data.asr) score += 12;
    if (data.maghrib) score += 12;
    if (data.isha) score += 12;

    // Tahajjud prayer = 10 points bonus
    if (data.tahajjud) score += 10;

    // Quran Tilawat pages: 2 points per page (max 10 points for 5+ pages)
    const pages = Number(data.tilawat_pages || 0);
    score += Math.min(10, pages * 2);

    // Masnoon Duas & Dhikr = 5 points
    if (data.duas_read) score += 5;

    // Truthfulness & Honesty score (1-5) = max 7.5 points
    const truth = Number(data.truthfulness_score || 5);
    score += Math.min(7.5, (truth / 5) * 7.5);

    // Adab, Sunnah & Akhlaq score (1-5) = max 7.5 points
    const adab = Number(data.adab_score || 5);
    score += Math.min(7.5, (adab / 5) * 7.5);

    return Math.round(score * 10) / 10;
  }

  public async getDailyRecords(
    tenantId: string = 'inst_main',
    date?: string,
    classId?: string,
    studentIds?: string[]
  ): Promise<any[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    let sql = `
      SELECT 
        s.id as student_id,
        s.full_name_bn,
        s.roll_number,
        c.name_bn as class_name_bn,
        m.id as record_id,
        COALESCE(m.date, ?) as date,
        COALESCE(m.fajr, 0) as fajr,
        COALESCE(m.dhuhr, 0) as dhuhr,
        COALESCE(m.asr, 0) as asr,
        COALESCE(m.maghrib, 0) as maghrib,
        COALESCE(m.isha, 0) as isha,
        COALESCE(m.tahajjud, 0) as tahajjud,
        COALESCE(m.tilawat_pages, 0) as tilawat_pages,
        COALESCE(m.duas_read, 0) as duas_read,
        COALESCE(m.truthfulness_score, 5) as truthfulness_score,
        COALESCE(m.adab_score, 5) as adab_score,
        COALESCE(m.total_score, 0) as total_score,
        m.notes,
        m.created_at
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN muhasaba_records m ON s.id = m.student_id AND m.date = ?
      WHERE (s.tenant_id = ? OR s.tenant_id = 'inst_main') AND s.status = 'active'
    `;
    const params: any[] = [targetDate, targetDate, tenantId];

    if (classId) {
      sql += ` AND s.class_id = ?`;
      params.push(classId);
    }

    if (studentIds && studentIds.length > 0) {
      const placeholders = studentIds.map(() => '?').join(',');
      sql += ` AND s.id IN (${placeholders})`;
      params.push(...studentIds);
    }

    sql += ` ORDER BY s.roll_number ASC`;
    return await db.all<any>(sql, params);
  }

  public async recordAmal(
    tenantId: string = 'inst_main',
    payload: {
      student_id: string;
      date?: string;
      fajr?: number;
      dhuhr?: number;
      asr?: number;
      maghrib?: number;
      isha?: number;
      tahajjud?: number;
      tilawat_pages?: number;
      duas_read?: number;
      truthfulness_score?: number;
      adab_score?: number;
      notes?: string;
    },
    verifiedByUserId: string = 'usr_zubair'
  ): Promise<MuhasabaRecord> {
    if (!payload.student_id) {
      const err: any = new Error('শিক্ষার্থীর আইডি আবশ্যক');
      err.statusCode = 400;
      throw err;
    }

    const date = payload.date || new Date().toISOString().split('T')[0];
    const totalScore = this.calculateAmalScore(payload);
    const now = new Date().toISOString();
    const id = `muh_${uuidv4().slice(0, 8)}`;

    await db.run(
      `INSERT INTO muhasaba_records (
        id, tenant_id, student_id, date, fajr, dhuhr, asr, maghrib, isha,
        tahajjud, tilawat_pages, duas_read, truthfulness_score, adab_score,
        total_score, notes, verified_by_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tenant_id, student_id, date) DO UPDATE SET
        fajr = excluded.fajr,
        dhuhr = excluded.dhuhr,
        asr = excluded.asr,
        maghrib = excluded.maghrib,
        isha = excluded.isha,
        tahajjud = excluded.tahajjud,
        tilawat_pages = excluded.tilawat_pages,
        duas_read = excluded.duas_read,
        truthfulness_score = excluded.truthfulness_score,
        adab_score = excluded.adab_score,
        total_score = excluded.total_score,
        notes = excluded.notes,
        verified_by_user_id = excluded.verified_by_user_id`,
      [
        id,
        tenantId,
        payload.student_id,
        date,
        payload.fajr ? 1 : 0,
        payload.dhuhr ? 1 : 0,
        payload.asr ? 1 : 0,
        payload.maghrib ? 1 : 0,
        payload.isha ? 1 : 0,
        payload.tahajjud ? 1 : 0,
        Number(payload.tilawat_pages || 0),
        payload.duas_read ? 1 : 0,
        Number(payload.truthfulness_score || 5),
        Number(payload.adab_score || 5),
        totalScore,
        payload.notes || null,
        verifiedByUserId,
        now
      ]
    );

    const record = await db.get<any>(
      `SELECT m.*, s.full_name_bn as student_name_bn 
       FROM muhasaba_records m 
       JOIN students s ON m.student_id = s.id 
       WHERE m.tenant_id = ? AND m.student_id = ? AND m.date = ?`,
      [tenantId, payload.student_id, date]
    );
    return record!;
  }

  public async getLeaderboard(tenantId: string = 'inst_main'): Promise<any[]> {
    const rows = await db.all<any>(
      `SELECT 
        s.id as student_id,
        s.full_name_bn,
        s.roll_number,
        c.name_bn as class_name_bn,
        COUNT(m.id) as days_recorded,
        ROUND(AVG(m.total_score), 1) as avg_score,
        SUM(m.tilawat_pages) as total_tilawat_pages,
        SUM(m.fajr + m.dhuhr + m.asr + m.maghrib + m.isha) as total_prayers
       FROM students s
       JOIN muhasaba_records m ON s.id = m.student_id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE (s.tenant_id = ? OR s.tenant_id = 'inst_main')
       GROUP BY s.id
       ORDER BY avg_score DESC, total_prayers DESC
       LIMIT 10`,
      [tenantId]
    );

    return rows.map((r, idx) => ({
      rank: idx + 1,
      badge: idx === 0 ? 'গোল্ড মেডেল 🥇' : idx === 1 ? 'সিলভার মেডেল 🥈' : idx === 2 ? 'ব্রোঞ্জ মেডেল 🥉' : 'আমল স্টার ⭐',
      ...r
    }));
  }
}

export const muhasabaService = new MuhasabaService();
