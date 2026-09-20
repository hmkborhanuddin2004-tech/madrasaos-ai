import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { AdmissionApplication } from '../types/index.js';

export class AdmissionService {
  public async getApplications(tenantId: string, status?: string): Promise<any[]> {
    let sql = 'SELECT * FROM admissions WHERE tenant_id = ?';
    const params: any[] = [tenantId];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    return db.all<any>(sql, params);
  }

  public async submitApplication(tenantId: string, payload: Partial<AdmissionApplication>): Promise<any> {
    const id = `adm_${uuidv4().slice(0, 8)}`;
    const appNum = `ADM-2026-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO admissions (
        id, tenant_id, application_number, applicant_name_bn, applicant_name_en,
        date_of_birth, guardian_name_bn, guardian_phone, applied_department,
        applied_class, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)`,
      [
        id, tenantId, appNum, payload.applicantNameBn || '', payload.applicantNameEn || '',
        payload.dateOfBirth || '2015-01-01', payload.guardianNameBn || '',
        payload.guardianPhone || '', payload.appliedDepartment || 'কওমী বিভাগ',
        payload.appliedClass || 'নাহবেমীর জামাত', payload.notes || null, now
      ]
    );

    return { success: true, id, applicationNumber: appNum };
  }

  public async updateStatus(
    tenantId: string,
    id: string,
    status: 'submitted' | 'under_review' | 'interview_scheduled' | 'approved' | 'rejected' | 'enrolled',
    score?: number,
    notes?: string
  ): Promise<any> {
    await db.run(
      `UPDATE admissions SET
        status = ?,
        interview_score = COALESCE(?, interview_score),
        notes = COALESCE(?, notes)
       WHERE id = ? AND tenant_id = ?`,
      [status, score || null, notes || null, id, tenantId]
    );
    return { success: true, id, status };
  }
}

export const admissionService = new AdmissionService();
