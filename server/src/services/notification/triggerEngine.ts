import { db } from '../../db/db.js';
import { notificationRouter, NotificationRouter } from './notificationRouter.js';
import { payrollService, PayrollService } from '../payrollService.js';
import { NotificationChannel, NotificationDispatchResult } from '../../types/index.js';

export interface ConsecutiveAbsenceResult {
  studentId: string;
  studentName: string;
  className: string;
  guardianPhone: string;
  consecutiveAbsentDays: number;
  message: string;
  dispatchResult?: NotificationDispatchResult;
}

export interface FeeReminderResult {
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  guardianPhone: string;
  dueAmount: number;
  month: string;
  paymentLink: string;
  message: string;
  dispatchResult?: NotificationDispatchResult;
}

export interface NoticeBroadcastResult {
  noticeTitle: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  results: NotificationDispatchResult[];
}

export interface HifzStagnationResult {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName?: string;
  teacherPhone?: string;
  guardianPhone: string;
  incompleteDays: number;
  guardianMessage: string;
  teacherMessage: string;
  guardianDispatch?: NotificationDispatchResult;
  teacherDispatch?: NotificationDispatchResult;
}

export interface MonthlyPayrollTriggerResult {
  month: string;
  year: number;
  vouchersGenerated: number;
  vouchers: any[];
  adminAlertDispatched?: NotificationDispatchResult;
}

export class TriggerEngine {
  private router: NotificationRouter;
  private payroll: PayrollService;

  constructor(router: NotificationRouter = notificationRouter, payroll: PayrollService = payrollService) {
    this.router = router;
    this.payroll = payroll;
  }

  /**
   * Rule 1: Consecutive Absence Alert
   * Checks `attendance_records` for students absent 2+ consecutive recorded days.
   * Drafts and routes alerts to guardian's preferred channel.
   */
  public async evaluateConsecutiveAbsence(options: {
    tenantId?: string;
    minConsecutiveDays?: number;
    dryRun?: boolean;
    channel?: NotificationChannel;
  } = {}): Promise<ConsecutiveAbsenceResult[]> {
    const tenantId = options.tenantId || 'inst_main';
    const minDays = options.minConsecutiveDays || 2;
    const dryRun = Boolean(options.dryRun);

    // Fetch active students with class info
    const students = await db.all<any>(
      `SELECT s.id, s.full_name_bn, s.guardian_name_bn, s.guardian_phone, c.name_bn as class_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.tenant_id = ? AND s.status = 'active'`,
      [tenantId]
    );

    const flagged: ConsecutiveAbsenceResult[] = [];

    for (const student of students) {
      if (!student.guardian_phone) continue;

      // Get latest attendance records for this student ordered by date DESC
      const records = await db.all<any>(
        `SELECT date, status FROM attendance_records 
         WHERE student_id = ? AND tenant_id = ?
         ORDER BY date DESC LIMIT ?`,
        [student.id, tenantId, Math.max(5, minDays)]
      );

      if (records.length < minDays) continue;

      let consecutiveAbsent = 0;
      for (const rec of records) {
        if (rec.status === 'absent') {
          consecutiveAbsent++;
        } else {
          break; // Streak broken
        }
      }

      if (consecutiveAbsent >= minDays) {
        const message = `আসসালামু আলাইকুম। সম্মানিত অভিভাবক, আপনার সন্তান ${student.full_name_bn} (${student.class_name || 'শ্রেণি'}) গত ${consecutiveAbsent} দিন যাবত মাদ্রাসায় অনুপস্থিত। জরুরি প্রয়োজনে মাদ্রাসার দফতরে যোগাযোগ করুন।`;

        let dispatchResult: NotificationDispatchResult | undefined;
        if (!dryRun) {
          dispatchResult = await this.router.dispatch({
            recipient: student.guardian_phone,
            preferredChannel: options.channel || 'sms',
            message,
            templateName: 'attendance_alert',
            metadata: {
              studentName: student.full_name_bn,
              date: records[0]?.date,
              consecutiveDays: consecutiveAbsent
            }
          });
        }

        flagged.push({
          studentId: student.id,
          studentName: student.full_name_bn,
          className: student.class_name || '',
          guardianPhone: student.guardian_phone,
          consecutiveAbsentDays: consecutiveAbsent,
          message,
          dispatchResult
        });
      }
    }

    return flagged;
  }

  /**
   * Rule 2: Automated Fee Reminder
   * Identifies overdue invoices on the 10th of the month, formats reminder with MFS bKash/Nagad payment link.
   */
  public async evaluateFeeReminders(options: {
    tenantId?: string;
    forceDateCheck?: boolean; // If true, only triggers if today is the 10th
    dryRun?: boolean;
    channel?: NotificationChannel;
  } = {}): Promise<FeeReminderResult[]> {
    const tenantId = options.tenantId || 'inst_main';
    const dryRun = Boolean(options.dryRun);

    if (options.forceDateCheck) {
      const today = new Date();
      if (today.getDate() !== 10) {
        return []; // Only run on 10th of month
      }
    }

    // Query overdue invoices or unpaid invoices with due date passed
    const invoices = await db.all<any>(
      `SELECT fi.id, fi.invoice_number, fi.student_id, fi.month, fi.year, fi.due_amount, fi.status,
              s.full_name_bn, s.guardian_phone
       FROM fee_invoices fi
       JOIN students s ON fi.student_id = s.id
       WHERE fi.tenant_id = ? AND (fi.status = 'overdue' OR (fi.status != 'paid' AND fi.due_amount > 0))
       ORDER BY fi.due_amount DESC`,
      [tenantId]
    );

    const reminders: FeeReminderResult[] = [];

    for (const inv of invoices) {
      if (!inv.guardian_phone || inv.due_amount <= 0) continue;

      const paymentLink = `https://pay.madrasaos.edu.bd/mfs/${inv.invoice_number}`;
      const message = `সম্মানিত অভিভাবক, ${inv.full_name_bn} এর ${inv.month} মাসের বকেয়া ফি ৳${inv.due_amount}। বিলম্ব এড়াতে bKash/Nagad এ দ্রুত পরিশোধ করুন: ${paymentLink}`;

      let dispatchResult: NotificationDispatchResult | undefined;
      if (!dryRun) {
        dispatchResult = await this.router.dispatch({
          recipient: inv.guardian_phone,
          preferredChannel: options.channel || 'sms',
          message,
          templateName: 'fee_overdue',
          metadata: {
            studentName: inv.full_name_bn,
            month: inv.month,
            dueAmount: inv.due_amount,
            paymentLink
          }
        });
      }

      reminders.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        studentId: inv.student_id,
        studentName: inv.full_name_bn,
        guardianPhone: inv.guardian_phone,
        dueAmount: inv.due_amount,
        month: inv.month,
        paymentLink,
        message,
        dispatchResult
      });
    }

    return reminders;
  }

  /**
   * Rule 3: Instant Notice Broadcast
   * Muhtamim official notices formatted and routed to recipients across their preferred channels.
   */
  public async broadcastNotice(params: {
    noticeTitle: string;
    noticeBody: string;
    recipients?: string[];
    targetAudience?: 'all' | 'guardians' | 'teachers' | 'students';
    tenantId?: string;
    preferredChannel?: NotificationChannel;
  }): Promise<NoticeBroadcastResult> {
    const tenantId = params.tenantId || 'inst_main';
    let targetRecipients = params.recipients || [];

    // If recipient list not explicitly provided, fetch from target audience
    if (targetRecipients.length === 0 && params.targetAudience) {
      if (params.targetAudience === 'guardians' || params.targetAudience === 'all') {
        const guardians = await db.all<any>(
          `SELECT DISTINCT guardian_phone FROM students WHERE tenant_id = ? AND status = 'active' AND guardian_phone IS NOT NULL`,
          [tenantId]
        );
        targetRecipients.push(...guardians.map((g) => g.guardian_phone));
      }
      if (params.targetAudience === 'teachers' || params.targetAudience === 'all') {
        const teachers = await db.all<any>(
          `SELECT phone FROM users WHERE tenant_id = ? AND role IN ('teacher', 'hifz_teacher', 'principal', 'madrasa_admin') AND status = 'active'`,
          [tenantId]
        );
        targetRecipients.push(...teachers.map((t) => t.phone));
      }
    }

    // De-duplicate recipients
    targetRecipients = Array.from(new Set(targetRecipients.filter(Boolean)));

    let instName = 'মাদ্রাসা';
    let muhtamimLabel = 'মুহতামিম';
    try {
      const instRow = await db.get<any>(
        'SELECT name_bn, designation_labels_json FROM institution_settings WHERE tenant_id = ? LIMIT 1',
        [tenantId]
      );
      if (instRow?.name_bn) instName = instRow.name_bn;
      if (instRow?.designation_labels_json) {
        const labels = JSON.parse(instRow.designation_labels_json);
        if (labels?.muhtamim) muhtamimLabel = labels.muhtamim;
      }
    } catch {}

    const formattedMessage = `📢 [মাদ্রাসা প্রাতিষ্ঠানিক নোটিশ]\nবিষয়: ${params.noticeTitle}\n\n${params.noticeBody}\n\n— ${muhtamimLabel}, ${instName}`;

    const batchSummary = await this.router.dispatchBatch({
      recipients: targetRecipients,
      preferredChannel: params.preferredChannel,
      message: formattedMessage,
      templateName: 'general_notice',
      metadata: {
        title: params.noticeTitle,
        body: params.noticeBody,
        noticeTitle: params.noticeTitle,
        tenantId,
        institutionName: instName
      }
    });

    return {
      noticeTitle: params.noticeTitle,
      totalRecipients: batchSummary.total,
      sentCount: batchSummary.sentCount,
      failedCount: batchSummary.failedCount,
      results: batchSummary.results
    };
  }

  /**
   * Rule 4: Hifz Stagnation Warning
   * Checks `hifz_records` for students with Sabaq incomplete 3+ consecutive recorded days.
   * Alerts both the Hifz teacher and guardian with actionable steps.
   */
  public async evaluateHifzStagnation(options: {
    tenantId?: string;
    minIncompleteDays?: number;
    dryRun?: boolean;
  } = {}): Promise<HifzStagnationResult[]> {
    const tenantId = options.tenantId || 'inst_main';
    const minDays = options.minIncompleteDays || 3;
    const dryRun = Boolean(options.dryRun);

    // Get active Hifz students (either marked as Hifz student, in Hifz class, or having Hifz records)
    const hifzStudents = await db.all<any>(
      `SELECT DISTINCT s.id, s.full_name_bn, s.guardian_phone FROM students s
       WHERE s.tenant_id = ? AND s.status = 'active'
         AND (s.is_hifz_student = 1 OR s.class_id LIKE '%hifz%' OR s.id IN (SELECT DISTINCT student_id FROM hifz_records WHERE tenant_id = ?))`,
      [tenantId, tenantId]
    );

    const stagnationAlerts: HifzStagnationResult[] = [];

    for (const student of hifzStudents) {
      // Get latest hifz records
      const records = await db.all<any>(
        `SELECT r.id, r.date, r.teacher_id, r.sabaq_pages, r.sabaq_rating, r.teacher_notes,
                u.full_name_bn as teacher_name, u.phone as teacher_phone
         FROM hifz_records r
         LEFT JOIN users u ON r.teacher_id = u.id
         WHERE r.student_id = ? AND r.tenant_id = ?
         ORDER BY r.date DESC LIMIT ?`,
        [student.id, tenantId, Math.max(5, minDays)]
      );

      if (records.length < minDays) continue;

      let incompleteStreak = 0;
      for (const rec of records) {
        // Incomplete criteria: sabaq_pages <= 0 OR rating is weak OR notes state incomplete
        const isIncomplete =
          rec.sabaq_pages <= 0 ||
          rec.sabaq_rating === 'weak' ||
          (rec.teacher_notes && (rec.teacher_notes.includes('অসম্পূর্ণ') || rec.teacher_notes.includes('বাকি')));

        if (isIncomplete) {
          incompleteStreak++;
        } else {
          break;
        }
      }

      if (incompleteStreak >= minDays) {
        const latestTeacher = records[0];
        const guardianMessage = `আসসালামু আলাইকুম। সম্মানিত অভিভাবক, আপনার সন্তান ${student.full_name_bn} হিফজ বিভাগে গত ${incompleteStreak} দিন যাবত নতুন সবক সম্পন্ন করতে পারেনি। অনুগ্রহ করে বাড়িতে কুরআন তিলাওয়াতে বিশেষ তদারকি করুন।`;
        const teacherMessage = `সতর্কবার্তা: হিফজ শিক্ষার্থী ${student.full_name_bn} এর সবক টানা ${incompleteStreak} দিন যাবত অসম্পূর্ণ। শ্রেণিকক্ষে বিশেষ পুনরাবৃত্তি ও যত্ন নেওয়া প্রয়োজন।`;

        let guardianDispatch: NotificationDispatchResult | undefined;
        let teacherDispatch: NotificationDispatchResult | undefined;

        if (!dryRun) {
          // Alert Guardian
          if (student.guardian_phone) {
            guardianDispatch = await this.router.dispatch({
              recipient: student.guardian_phone,
              preferredChannel: 'sms',
              message: guardianMessage,
              metadata: { studentName: student.full_name_bn, incompleteDays: incompleteStreak }
            });
          }

          // Alert Teacher
          if (latestTeacher?.teacher_phone) {
            teacherDispatch = await this.router.dispatch({
              recipient: latestTeacher.teacher_phone,
              preferredChannel: 'sms',
              message: teacherMessage,
              metadata: { studentName: student.full_name_bn, incompleteDays: incompleteStreak }
            });
          }
        }

        stagnationAlerts.push({
          studentId: student.id,
          studentName: student.full_name_bn,
          teacherId: latestTeacher?.teacher_id || 'usr_zubair',
          teacherName: latestTeacher?.teacher_name,
          teacherPhone: latestTeacher?.teacher_phone,
          guardianPhone: student.guardian_phone,
          incompleteDays: incompleteStreak,
          guardianMessage,
          teacherMessage,
          guardianDispatch,
          teacherDispatch
        });
      }
    }

    return stagnationAlerts;
  }

  /**
   * Rule 5: Monthly Payroll Generation
   * Scheduled trigger on 1st of month drafting teacher salary slips via `payrollService.generateMonthlyVouchers`.
   */
  public async evaluateMonthlyPayroll(options: {
    month?: string;
    year?: number;
    organizationId?: string;
    notifyAdminPhone?: string;
  } = {}): Promise<MonthlyPayrollTriggerResult> {
    const today = new Date();
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const month = options.month || monthsBn[today.getMonth()];
    const year = options.year || today.getFullYear();
    const organizationId = options.organizationId || 'org_main';

    const vouchers = await this.payroll.generateMonthlyVouchers({
      month,
      year,
      organizationId
    });

    let adminAlertDispatched: NotificationDispatchResult | undefined;
    const adminPhone = options.notifyAdminPhone || '01711111111';

    if (adminPhone && vouchers.length > 0) {
      const alertMsg = `আলহামদুলিল্লাহ, ${month} ${year} মাসের ওস্তাদ ও কর্মচারীদের মাসিক বেতন ভাউচার (${vouchers.length}টি) স্বয়ংক্রিয়ভাবে ড্রাফট করা হয়েছে। অনুগ্রহ করে ড্যাশবোর্ডে যাচাই ও অনুমোদন সম্পন্ন করুন।`;

      adminAlertDispatched = await this.router.dispatch({
        recipient: adminPhone,
        preferredChannel: 'sms',
        message: alertMsg,
        metadata: {
          month,
          year,
          vouchersCount: vouchers.length
        }
      });
    }

    return {
      month,
      year,
      vouchersGenerated: vouchers.length,
      vouchers,
      adminAlertDispatched
    };
  }

  /**
   * Evaluates all pre-built automation rules or a specific rule on demand.
   */
  public async evaluateRule(ruleName: string, options: any = {}): Promise<any> {
    switch (ruleName) {
      case 'consecutive_absence':
      case 'consecutiveAbsence':
        return this.evaluateConsecutiveAbsence(options);
      case 'fee_reminder':
      case 'feeReminder':
        return this.evaluateFeeReminders(options);
      case 'notice_broadcast':
      case 'noticeBroadcast':
        return this.broadcastNotice(options);
      case 'hifz_stagnation':
      case 'hifzStagnation':
        return this.evaluateHifzStagnation(options);
      case 'monthly_payroll':
      case 'monthlyPayroll':
        return this.evaluateMonthlyPayroll(options);
      default:
        throw new Error(`অজানা অটোমেশন রুল (Unknown trigger rule: ${ruleName})`);
    }
  }

  public async evaluateAllRules(options: any = {}): Promise<{
    consecutiveAbsence: ConsecutiveAbsenceResult[];
    feeReminders: FeeReminderResult[];
    hifzStagnation: HifzStagnationResult[];
    monthlyPayroll: MonthlyPayrollTriggerResult;
  }> {
    const consecutiveAbsence = await this.evaluateConsecutiveAbsence(options);
    const feeReminders = await this.evaluateFeeReminders(options);
    const hifzStagnation = await this.evaluateHifzStagnation(options);
    const monthlyPayroll = await this.evaluateMonthlyPayroll(options);

    return {
      consecutiveAbsence,
      feeReminders,
      hifzStagnation,
      monthlyPayroll
    };
  }
}

export const triggerEngine = new TriggerEngine();
