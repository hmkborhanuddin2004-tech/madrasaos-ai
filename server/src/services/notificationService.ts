import { db } from '../db/db.js';
import { resolveGuardianRecipients } from '../utils/guardianResolver.js';
import { notificationRouter } from './notification/notificationRouter.js';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  /**
   * Dispatches an SMS notice to a list of students using the guardianResolver
   * to avoid sending duplicate SMS to the same guardian.
   */
  public async dispatchNoticeToStudents(tenantId: string, noticeId: string, studentIds: string[], message: string) {
    // Resolve guardians for the given students
    const { deliveries, skipped } = await resolveGuardianRecipients(tenantId, studentIds, db);
    const now = new Date().toISOString();

    const results = [];

    for (const delivery of deliveries) {
      // dispatch to this phone number
      const dispatchRes = await notificationRouter.dispatch({
        recipient: delivery.phone,
        preferredChannel: 'sms',
        message: message
      });

      const status = dispatchRes.success ? 'delivered' : 'failed';

      // update notice_delivery_logs with ONE entry per phone
      // tracking all associated students in a JSON field (using 'reason' column as JSON storage since schema lacks students_json)
      const students_json = JSON.stringify(delivery.students.map(s => ({ id: s.id, name: s.name_bn || s.name_en })));
      const error_details = dispatchRes.success ? null : JSON.stringify(dispatchRes.details || {});
      const reason_json = JSON.stringify({ students: JSON.parse(students_json), error_details: error_details ? JSON.parse(error_details) : null });

      await db.run(
        `INSERT INTO notice_delivery_logs (
          id, notice_id, phone, channel, status, sent_at, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          noticeId,
          delivery.phone,
          'sms',
          status,
          now,
          reason_json
        ]
      );

      results.push({ phone: delivery.phone, status, dispatchRes });
    }

    return {
      deliveries: results,
      skipped
    };
  }
}

export const notificationService = new NotificationService();
