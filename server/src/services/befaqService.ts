import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { BefaqRegistration, BefaqDivision, BefaqMarhalah } from '../types/index.js';

export class BefaqService {
  public async getRegistrations(
    tenantId: string = 'inst_main',
    filters: { marhalah?: string; session_year?: number; search?: string } = {}
  ): Promise<any[]> {
    let sql = `
      SELECT 
        br.*,
        s.full_name_bn as student_name_bn,
        s.full_name_en as student_name_en,
        s.student_id_number,
        s.guardian_phone,
        c.name_bn as class_name_bn
      FROM befaq_registrations br
      JOIN students s ON br.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE (br.tenant_id = ? OR br.tenant_id = 'inst_main')
    `;
    const params: any[] = [tenantId];

    if (filters.marhalah) {
      sql += ` AND br.marhalah = ?`;
      params.push(filters.marhalah);
    }
    if (filters.session_year) {
      sql += ` AND br.session_year = ?`;
      params.push(filters.session_year);
    }
    if (filters.search) {
      sql += ` AND (br.roll_number LIKE ? OR br.registration_number LIKE ? OR s.full_name_bn LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ` ORDER BY br.created_at DESC`;

    return await db.all<any>(sql, params);
  }

  public async registerStudent(
    tenantId: string = 'inst_main',
    payload: {
      student_id: string;
      marhalah: BefaqMarhalah;
      session_year?: number;
      exam_center?: string;
      roll_number?: string;
      registration_number?: string;
    }
  ): Promise<BefaqRegistration> {
    if (!payload.student_id || !payload.marhalah) {
      const err: any = new Error('শিক্ষার্থী এবং মারহালাহ নির্বাচন বাধ্যতামূলক');
      err.statusCode = 400;
      throw err;
    }

    const year = payload.session_year || new Date().getFullYear();
    const roll = payload.roll_number || `${year}-${payload.marhalah.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const reg = payload.registration_number || `REG-BFQ-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const center = payload.exam_center || 'জামিয়া রাহমানিয়া আরাবিয়া, ঢাকা';
    const id = `bfq_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO befaq_registrations (
        id, tenant_id, student_id, marhalah, roll_number, registration_number,
        session_year, exam_center, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'registered', ?)`,
      [id, tenantId, payload.student_id, payload.marhalah, roll, reg, year, center, now]
    );

    const created = await db.get<any>(
      `SELECT br.*, s.full_name_bn as student_name_bn 
       FROM befaq_registrations br 
       JOIN students s ON br.student_id = s.id 
       WHERE br.id = ?`,
      [id]
    );
    return created;
  }

  public async verifyCertificate(rollOrReg: string): Promise<any> {
    const clean = rollOrReg.trim();
    const row = await db.get<any>(
      `SELECT 
        br.*,
        s.full_name_bn as student_name_bn,
        s.full_name_en as student_name_en,
        s.date_of_birth,
        s.guardian_name_bn,
        s.student_id_number,
        inst.name_bn as institution_name_bn
       FROM befaq_registrations br
       JOIN students s ON br.student_id = s.id
       LEFT JOIN institutions inst ON br.tenant_id = inst.id
       WHERE br.roll_number = ? OR br.registration_number = ? OR br.sanad_number = ?`,
      [clean, clean, clean]
    );

    if (!row) {
      return {
        verified: false,
        message: 'বেফাক বোর্ডে প্রদত্ত রোল বা রেজিস্ট্রেশন নম্বরের কোনো তথ্য পাওয়া যায়নি।'
      };
    }

    return {
      verified: true,
      message: 'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ কর্তৃক সনদ/সনদপত্র সত্য ও নির্ভুল হিসেবে প্রত্যায়িত।',
      data: row
    };
  }

  public async getAdmitCard(registrationId: string): Promise<any> {
    const reg = await db.get<any>(
      `SELECT 
        br.*,
        s.full_name_bn as student_name_bn,
        s.full_name_en as student_name_en,
        s.guardian_name_bn,
        s.photo_url,
        COALESCE(st.name_bn, inst.name_bn, 'মাদ্রাসা') as institution_name_bn
       FROM befaq_registrations br
       JOIN students s ON br.student_id = s.id
       LEFT JOIN institutions inst ON br.tenant_id = inst.id
       LEFT JOIN institution_settings st ON br.tenant_id = st.tenant_id
       WHERE br.id = ?`,
      [registrationId]
    );

    if (!reg) {
      const err: any = new Error('প্রবেশপত্র পাওয়া যায়নি');
      err.statusCode = 404;
      throw err;
    }

    // Set status to admit_issued if currently registered
    if (reg.status === 'registered') {
      await db.run(`UPDATE befaq_registrations SET status = 'admit_issued' WHERE id = ?`, [registrationId]);
      reg.status = 'admit_issued';
    }

    return {
      institution: reg.institution_name_bn || 'জামিয়া ইসলামিয়া মডেল মাদ্রাসা',
      boardNameBn: 'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ (Wafaqul Madarisil Arabia)',
      title: 'বোর্ড কেন্দ্রীয় পরীক্ষা - প্রবেশপত্র (Admit Card)',
      registration: reg,
      examSchedule: [
        { date: '২০২৬-১০-১৫', day: 'বৃহস্পতিবার', time: 'সকাল ০৯:০০ - ১২:০০', subject: 'কুরআন মজীদ ও তাফসীর' },
        { date: '২০২৬-১০-১৭', day: 'শনিবার', time: 'সকাল ০৯:০০ - ১২:০০', subject: 'হাদীস শরীফ ও উসূলে হাদীস' },
        { date: '২০২৬-১০-১৮', day: 'রবিবার', time: 'সকাল ০৯:০০ - ১২:০০', subject: 'ফিক্বহ ও উসূলে ফিক্বহ' },
        { date: '২০২৬-১০-১৯', day: 'সোমবার', time: 'সকাল ০৯:০০ - ১২:০০', subject: 'আক্বাইদ ও বালাগাত' }
      ]
    };
  }

  public async updateResult(
    registrationId: string,
    payload: { total_marks: number; division?: BefaqDivision; sanad_number?: string }
  ): Promise<any> {
    const marks = Number(payload.total_marks);
    let division: BefaqDivision = payload.division || 'jayyid';

    if (!payload.division) {
      if (marks >= 540) division = 'mumtaz'; // Mumtaz (Star / First with distinction)
      else if (marks >= 450) division = 'jayyid_jiddan'; // 1st Class
      else if (marks >= 360) division = 'jayyid'; // 2nd Class
      else if (marks >= 270) division = 'maqbool'; // Pass
      else division = 'rasib'; // Failed
    }

    const sanadNumber =
      payload.sanad_number ||
      (division !== 'rasib' ? `SND-BFQ-2026-${Math.floor(10000 + Math.random() * 90000)}` : null);
    const status = division === 'rasib' ? 'failed' : 'passed';

    await db.run(
      `UPDATE befaq_registrations SET
        total_marks = ?,
        division = ?,
        sanad_number = ?,
        status = ?
       WHERE id = ?`,
      [marks, division, sanadNumber, status, registrationId]
    );

    return await db.get<any>(`SELECT * FROM befaq_registrations WHERE id = ?`, [registrationId]);
  }
}

export const befaqService = new BefaqService();
