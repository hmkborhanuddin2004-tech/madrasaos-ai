import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export class CertificateService {
  public async generateCertificate(
    tenantId: string,
    studentId: string,
    certificateType: 'student_certificate' | 'transfer_certificate' | 'hifz_sanad' | 'marksheet',
    issuedBy: string
  ): Promise<any> {
    const student = await db.get<any>(
      `SELECT s.*, c.name_bn as class_name_bn, c.department as department_name_bn
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ? AND s.tenant_id = ?`,
      [studentId, tenantId]
    );
    if (!student) throw new Error('Student not found');

    const certId = `cert_${uuidv4().slice(0, 10)}`;
    const certNumber = `CERT-${certificateType.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().split('T')[0];
    const qrVerificationUrl = `/verify-certificate/${certNumber}`;

    const metadata = {
      studentNameBn: student.full_name_bn,
      studentNameEn: student.full_name_en,
      studentIdNumber: student.student_id_number,
      classNameBn: student.class_name_bn,
      department: student.department_name_bn,
      guardianNameBn: student.guardian_name_bn,
      issueDate: now,
      institutionNameBn: 'দারুল উলূম সেন্ট্রাল মাদ্রাসা, ঢাকা'
    };

    await db.run(
      `INSERT INTO certificates (id, tenant_id, certificate_number, student_id, certificate_type, issue_date, issued_by, qr_verification_url, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        certId, tenantId, certNumber, studentId, certificateType,
        now, issuedBy, qrVerificationUrl, JSON.stringify(metadata)
      ]
    );

    return {
      certificateId: certId,
      certificateNumber: certNumber,
      qrVerificationUrl,
      issueDate: now,
      metadata
    };
  }

  public async verifyCertificate(certificateNumber: string): Promise<any> {
    const cert = await db.get<any>(
      `SELECT c.*, i.name_bn as institution_name_bn, i.code as institution_code
       FROM certificates c
       JOIN institutions i ON c.tenant_id = i.id
       WHERE c.certificate_number = ?`,
      [certificateNumber]
    );

    if (!cert) {
      return { isValid: false, message: 'প্রদত্ত সনদ নম্বরটি সঠিক নয় বা ডাটাবেজে সংরক্ষিত নেই।' };
    }

    return {
      isValid: true,
      certificateNumber: cert.certificate_number,
      certificateType: cert.certificate_type,
      issueDate: cert.issue_date,
      issuedBy: cert.issued_by,
      institutionNameBn: cert.institution_name_bn,
      details: JSON.parse(cert.metadata_json || '{}')
    };
  }
}

export const certificateService = new CertificateService();
