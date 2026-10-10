import { db } from '../db/db.js';

export interface PlatformTelemetry {
  // Institution-level counts (zero PII)
  total_institutions: number;
  total_branches: number;
  total_active_students: number;
  total_teachers: number;
  total_staff: number;
  // Academic snapshots
  total_hifz_students: number;
  total_residential_students: number;
  // Financial health (aggregate only, zero PII)
  total_outstanding_dues: number;
  total_collected_this_month: number;
  // Payroll
  total_payroll_profiles: number;
  payroll_pending_approval: number;
  // Storage
  sqlite_storage_bytes: number;
  sqlite_page_count: number;
  sqlite_page_size: number;
  // Notification adapter credits/usage
  adapter_credits: {
    sms_balance: number;
    email_daily_sent: number;
    email_daily_limit: number;
    whatsapp_session_count: number;
    notification_deliveries_today: number;
  };
  // Platform health
  generated_at: string;
  uptime_ms: number;
}

const _startTime = Date.now();

export class TelemetryService {
  async getPlatformTelemetry(): Promise<PlatformTelemetry> {
    // All queries are aggregate — zero individual PII returned
    const [
      institutions,
      branches,
      activeStudents,
      hifzStudents,
      residentialStudents,
      teachers,
      staff,
      payrollProfiles,
      payrollPending,
      outstandingDues,
      collectedThisMonth,
      pageInfo,
      notificationsToday,
    ] = await Promise.all([
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM institutions`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM branches`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM students WHERE status='active' AND deleted_at IS NULL`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM students WHERE is_hifz_student=1 AND status='active' AND deleted_at IS NULL`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM students WHERE is_residential=1 AND status='active' AND deleted_at IS NULL`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE role IN ('teacher','hifz_teacher')`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE role NOT IN ('student','guardian','teacher','hifz_teacher','super_admin')`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM staff_payroll_profiles WHERE status='active'`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM payroll_vouchers WHERE status IN ('draft','accountant_verified')`),
      db.get<{ total: number }>(`SELECT COALESCE(SUM(due_amount),0) as total FROM fee_invoices WHERE status IN ('unpaid','partially_paid','overdue')`),
      db.get<{ total: number }>(`SELECT COALESCE(SUM(amount),0) as total FROM fee_payments WHERE paid_at LIKE ?`, [`${new Date().toISOString().slice(0,7)}%`]),
      db.get<{ page_count: number; page_size: number }>(`SELECT (SELECT * FROM pragma_page_count()) as page_count, (SELECT * FROM pragma_page_size()) as page_size`),
      db.get<{ count: number }>(`SELECT COUNT(*) as count FROM notification_deliveries WHERE created_at LIKE ? AND status='sent'`, [`${new Date().toISOString().slice(0,10)}%`]).catch(() => ({ count: 0 })),
    ]);

    const page_count = pageInfo?.page_count ?? 0;
    const page_size = pageInfo?.page_size ?? 4096;
    const sqlite_storage_bytes = page_count * page_size;

    return {
      total_institutions: institutions?.count ?? 0,
      total_branches: branches?.count ?? 0,
      total_active_students: activeStudents?.count ?? 0,
      total_hifz_students: hifzStudents?.count ?? 0,
      total_residential_students: residentialStudents?.count ?? 0,
      total_teachers: teachers?.count ?? 0,
      total_staff: staff?.count ?? 0,
      total_payroll_profiles: payrollProfiles?.count ?? 0,
      payroll_pending_approval: payrollPending?.count ?? 0,
      total_outstanding_dues: outstandingDues?.total ?? 0,
      total_collected_this_month: collectedThisMonth?.total ?? 0,
      sqlite_storage_bytes,
      sqlite_page_count: page_count,
      sqlite_page_size: page_size,
      adapter_credits: {
        sms_balance: 0,        // populated from SMS adapter env in production
        email_daily_sent: notificationsToday?.count ?? 0,
        email_daily_limit: 300,
        whatsapp_session_count: 0,
        notification_deliveries_today: notificationsToday?.count ?? 0,
      },
      generated_at: new Date().toISOString(),
      uptime_ms: Date.now() - _startTime,
    };
  }
}

export const telemetryService = new TelemetryService();
