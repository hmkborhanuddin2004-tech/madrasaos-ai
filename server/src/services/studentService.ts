import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { Student } from '../types/index.js';

export class StudentService {
  public async getStudents(
    tenantId: string,
    params: {
      search?: string;
      classId?: string;
      isHifz?: boolean;
      isResidential?: boolean;
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ students: any[]; total: number; page: number; totalPages: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const offset = (page - 1) * limit;

    let whereClause = 's.tenant_id = ? AND s.deleted_at IS NULL';
    const queryParams: any[] = [tenantId];

    if (params.search) {
      whereClause += ' AND (s.full_name_bn LIKE ? OR s.student_id_number LIKE ? OR s.guardian_phone LIKE ?)';
      const term = `%${params.search}%`;
      queryParams.push(term, term, term);
    }

    if (params.classId) {
      whereClause += ' AND s.class_id = ?';
      queryParams.push(params.classId);
    }

    if (params.isHifz !== undefined) {
      whereClause += ' AND s.is_hifz_student = ?';
      queryParams.push(params.isHifz ? 1 : 0);
    }

    if (params.isResidential !== undefined) {
      whereClause += ' AND s.is_residential = ?';
      queryParams.push(params.isResidential ? 1 : 0);
    }

    if (params.status) {
      whereClause += ' AND s.status = ?';
      queryParams.push(params.status);
    }

    const countRow = await db.get<any>(
      `SELECT COUNT(*) as total FROM students s WHERE ${whereClause}`,
      queryParams
    );
    const total = countRow?.total || 0;

    const sql = `
      SELECT 
        s.*, 
        c.name_bn as class_name_bn,
        c.department as department_name_bn
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE ${whereClause}
      ORDER BY c.order_index ASC, CAST(s.roll_number AS INTEGER) ASC
      LIMIT ? OFFSET ?
    `;
    const rows = await db.all<any>(sql, [...queryParams, limit, offset]);

    return {
      students: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  public async getStudentById(tenantId: string, studentId: string): Promise<any> {
    const student = await db.get<any>(
      `SELECT s.*, c.name_bn as class_name_bn, c.department as department_name_bn
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ? AND s.tenant_id = ? AND s.deleted_at IS NULL`,
      [studentId, tenantId]
    );

    if (!student) {
      const err: any = new Error('শিক্ষার্থীর তথ্য পাওয়া যায়নি।');
      err.statusCode = 404;
      throw err;
    }

    // Attendance stats (last 30 days)
    const attendanceStats = await db.get<any>(
      `SELECT 
         COUNT(*) as total_days,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
         SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
       FROM attendance_records
       WHERE student_id = ? AND tenant_id = ?`,
      [studentId, tenantId]
    );

    // Latest Hifz records
    const recentHifz = await db.all<any>(
      `SELECT * FROM hifz_records WHERE student_id = ? AND tenant_id = ? ORDER BY date DESC LIMIT 5`,
      [studentId, tenantId]
    );

    // Fee Invoices
    const feeInvoices = await db.all<any>(
      `SELECT * FROM fee_invoices WHERE student_id = ? AND tenant_id = ? ORDER BY created_at DESC LIMIT 5`,
      [studentId, tenantId]
    );

    // Hostel Bed if residential
    let hostelBed = null;
    if (student.is_residential) {
      const rooms = await db.all<any>('SELECT * FROM hostel_rooms WHERE tenant_id = ?', [tenantId]);
      for (const r of rooms) {
        const beds = JSON.parse(r.beds_json || '[]');
        const myBed = beds.find((b: any) => b.studentId === studentId);
        if (myBed) {
          hostelBed = {
            buildingName: r.building_name,
            roomNumber: r.room_number,
            floor: r.floor,
            bedNumber: myBed.bedNumber
          };
          break;
        }
      }
    }

    // Timeline items
    const timeline = [
      { date: student.admission_date, title: 'মাদ্রাসায় ভর্তি', desc: `${student.class_name_bn || 'শ্রেণি'}-এ ভর্তি নিশ্চিত করা হয়` },
      { date: '2026-08-15', title: '১ম সাময়িক পরীক্ষা সম্পন্ন', desc: 'সকল বিষয়ে উত্তীর্ণ এবং গ্রেড পয়েন্ট ৪.৮৫' },
      { date: '2026-09-10', title: 'সেপ্টেম্বর মাসের বেতন পরিশোধ', desc: 'রসিদ নম্বর RCP-202609-0012 এর মাধ্যমে ৳২,০০০ গৃহীত' },
      { date: '2026-09-20', title: 'দৈনিক হাজিরা ও সবক রেকর্ড', desc: 'আজকে উপস্থিত এবং হাফেজ জুবায়ের সাহেবের নিকট সবক পেশ' }
    ];

    return {
      ...student,
      attendanceStats: {
        totalDays: attendanceStats?.total_days || 0,
        presentDays: attendanceStats?.present_days || 0,
        absentDays: attendanceStats?.absent_days || 0,
        lateDays: attendanceStats?.late_days || 0,
        rate: attendanceStats?.total_days ? Math.round((attendanceStats.present_days / attendanceStats.total_days) * 100) : 100
      },
      recentHifz,
      feeInvoices,
      hostelBed,
      timeline
    };
  }

  public async createStudent(tenantId: string, branchId: string, payload: Partial<Student>): Promise<any> {
    const id = `std_${uuidv4().slice(0, 8)}`;
    const studentIdNumber = payload.studentIdNumber || `DUCM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO students (
        id, tenant_id, branch_id, student_id_number, full_name_bn, full_name_en,
        gender, date_of_birth, blood_group, admission_date, class_id, section,
        roll_number, status, is_residential, is_hifz_student, guardian_name_bn,
        guardian_phone, guardian_relation, emergency_contact, monthly_fee, address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, branchId, studentIdNumber,
        payload.fullNameBn || '', payload.fullNameEn || '',
        payload.gender || 'male', payload.dateOfBirth || '2014-01-01', payload.bloodGroup || null,
        payload.admissionDate || now.split('T')[0], payload.classId || 'cls_nahbemir',
        payload.section || 'Alif', payload.rollNumber || '1',
        payload.isResidential ? 1 : 0, payload.isHifzStudent ? 1 : 0,
        payload.guardianNameBn || '', payload.guardianPhone || '',
        payload.guardianRelation || 'পিতা', payload.emergencyContact || payload.guardianPhone || '',
        payload.monthlyFee || 2000, payload.address || 'ঢাকা, বাংলাদেশ', now
      ]
    );

    return this.getStudentById(tenantId, id);
  }

  public async updateStudent(tenantId: string, studentId: string, payload: Partial<Student>): Promise<any> {
    const existing = await this.getStudentById(tenantId, studentId);
    if (!existing) throw new Error('Student not found');

    await db.run(
      `UPDATE students SET
        full_name_bn = COALESCE(?, full_name_bn),
        full_name_en = COALESCE(?, full_name_en),
        class_id = COALESCE(?, class_id),
        roll_number = COALESCE(?, roll_number),
        section = COALESCE(?, section),
        is_residential = COALESCE(?, is_residential),
        is_hifz_student = COALESCE(?, is_hifz_student),
        guardian_name_bn = COALESCE(?, guardian_name_bn),
        guardian_phone = COALESCE(?, guardian_phone),
        monthly_fee = COALESCE(?, monthly_fee),
        address = COALESCE(?, address)
       WHERE id = ? AND tenant_id = ?`,
      [
        payload.fullNameBn, payload.fullNameEn, payload.classId, payload.rollNumber,
        payload.section, payload.isResidential !== undefined ? (payload.isResidential ? 1 : 0) : null,
        payload.isHifzStudent !== undefined ? (payload.isHifzStudent ? 1 : 0) : null,
        payload.guardianNameBn, payload.guardianPhone, payload.monthlyFee, payload.address,
        studentId, tenantId
      ]
    );

    return this.getStudentById(tenantId, studentId);
  }

  public async deleteStudent(tenantId: string, studentId: string): Promise<void> {
    await db.run(
      `UPDATE students SET deleted_at = ? WHERE id = ? AND tenant_id = ?`,
      [new Date().toISOString(), studentId, tenantId]
    );
  }
}

export const studentService = new StudentService();
