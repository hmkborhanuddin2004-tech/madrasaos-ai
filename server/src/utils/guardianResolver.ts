import { DatabaseService } from '../db/db.js';

export interface GuardianDelivery {
  phone: string;
  guardian: any;
  students: any[];
}

export async function resolveGuardianRecipients(
  tenantId: string,
  studentIds: string[],
  db: DatabaseService
): Promise<{ deliveries: GuardianDelivery[]; skipped: { studentId: string; reason: string }[] }> {
  const deliveriesMap = new Map<string, GuardianDelivery>();
  const skipped: { studentId: string; reason: string }[] = [];

  for (const studentId of studentIds) {
    const student = await db.get(`SELECT id, student_id_number, full_name_en, full_name_bn, guardian_phone, guardian_name_bn FROM students WHERE id = ? AND tenant_id = ? AND status = 'active'`, [studentId, tenantId]);
    if (!student) {
      skipped.push({ studentId, reason: 'Student not found or not active' });
      continue;
    }

    const phone = student.guardian_phone;
    if (!phone) {
      skipped.push({ studentId, reason: 'Guardian has no phone number' });
      continue;
    }

    const simpleStudent = { id: student.id, name_en: student.full_name_en, name_bn: student.full_name_bn };

    if (deliveriesMap.has(phone)) {
      const existing = deliveriesMap.get(phone)!;
      existing.students.push(simpleStudent);
    } else {
      deliveriesMap.set(phone, {
        phone,
        guardian: { name: student.guardian_name_bn },
        students: [simpleStudent]
      });
    }
  }

  return {
    deliveries: Array.from(deliveriesMap.values()),
    skipped
  };
}
