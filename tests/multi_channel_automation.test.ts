import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { db } from '../server/src/db/db.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';
import { SmsAdapter } from '../server/src/services/notification/adapters/smsAdapter.js';
import { WhatsAppAdapter } from '../server/src/services/notification/adapters/whatsappAdapter.js';
import { MessengerAdapter } from '../server/src/services/notification/adapters/messengerAdapter.js';
import { EmailAdapter } from '../server/src/services/notification/adapters/emailAdapter.js';
import { notificationRouter } from '../server/src/services/notification/notificationRouter.js';
import { triggerEngine } from '../server/src/services/notification/triggerEngine.js';

describe('Milestone 3: Multi-Channel Notification Adapters & Automation Engine', () => {
  let adminToken: string;
  let principalToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();

    // 1. Authenticate as Muhtamim (madrasa_admin)
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'admin123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Authenticate as Principal
    const principalRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'principal', password: 'admin123' });
    expect(principalRes.status).toBe(200);
    principalToken = principalRes.body.data.token;

    // 3. Authenticate as Teacher
    const teacherRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'teacher_rashid', password: 'teacher123' });
    expect(teacherRes.status).toBe(200);
    teacherToken = teacherRes.body.data.token;
  });

  beforeEach(() => {
    notificationRouter.clearHistory();
  });

  // =========================================================================
  // 1. SMS Adapter Unit Tests
  // =========================================================================
  describe('1. SMS Gateway Adapter (SSL Wireless / Greenweb / Onnorokom)', () => {
    let testSms: SmsAdapter;

    beforeEach(() => {
      testSms = new SmsAdapter('ssl_wireless', 100);
    });

    it('1.1 Accurately detects Bengali Unicode vs Standard GSM-7 English text', () => {
      const bengaliText = 'আসসালামু আলাইকুম। আগামীকাল মাদ্রাসা ছুটি।';
      const englishText = 'Notice: Tomorrow is an official madrasa holiday.';

      expect(testSms.isBengaliUnicode(bengaliText)).toBe(true);
      expect(testSms.isBengaliUnicode(englishText)).toBe(false);
      expect(testSms.isBengaliUnicode('')).toBe(false);
    });

    it('1.2 Calculates SMS parts correctly (70 chars per Unicode SMS vs 160 chars GSM-7)', () => {
      // GSM single part: 160 chars
      const gsmSingle = 'A'.repeat(160);
      const calcGsm1 = testSms.calculateParts(gsmSingle);
      expect(calcGsm1.isUnicode).toBe(false);
      expect(calcGsm1.partsCount).toBe(1);
      expect(calcGsm1.encoding).toBe('GSM-7');

      // GSM multipart: 161 chars -> 2 parts (153 chars/part)
      const gsmMulti = 'A'.repeat(161);
      const calcGsm2 = testSms.calculateParts(gsmMulti);
      expect(calcGsm2.partsCount).toBe(2);

      // Bengali single part: <= 70 chars
      const bengaliSingle = 'ক'.repeat(70);
      const calcBn1 = testSms.calculateParts(bengaliSingle);
      expect(calcBn1.isUnicode).toBe(true);
      expect(calcBn1.partsCount).toBe(1);
      expect(calcBn1.encoding).toBe('Bengali-Unicode');

      // Bengali multipart: 71 chars -> 2 parts (67 chars/part)
      const bengaliMulti2 = 'ক'.repeat(71);
      const calcBn2 = testSms.calculateParts(bengaliMulti2);
      expect(calcBn2.partsCount).toBe(2);

      // Bengali multipart: 140 chars -> 3 parts (Math.ceil(140 / 67) = 3)
      const bengaliMulti3 = 'ক'.repeat(140);
      const calcBn3 = testSms.calculateParts(bengaliMulti3);
      expect(calcBn3.partsCount).toBe(3);
    });

    it('1.3 Normalizes Bangladeshi mobile numbers into international format', () => {
      expect(testSms.normalizePhoneNumber('01711223344')).toBe('+8801711223344');
      expect(testSms.normalizePhoneNumber('8801811223344')).toBe('+8801811223344');
      expect(testSms.normalizePhoneNumber('+8801911223344')).toBe('+8801911223344');
    });

    it('1.4 Dispatches SMS with credit balance tracking and part deduction', async () => {
      const initialBalance = testSms.getBalance();
      const message = 'আসসালামু আলাইকুম। আপনার সন্তানের আজকের হাজিরা নিশ্চিত করা হলো।'; // <70 chars

      const result = await testSms.send('01711223344', message);
      expect(result.success).toBe(true);
      expect(result.channel).toBe('sms');
      expect(result.partsCount).toBe(1);
      expect(result.balanceRemaining).toBe(initialBalance - 1);
      expect(testSms.getBalance()).toBe(initialBalance - 1);
      expect(testSms.getLogs().length).toBe(1);
    });

    it('1.5 Strictly blocks dispatch when credit balance is insufficient', async () => {
      testSms.setBalance(1);
      const longBengaliMessage = 'ক'.repeat(140); // Requires 3 parts

      const result = await testSms.send('01711223344', longBengaliMessage);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient SMS balance');
      expect(testSms.getBalance()).toBe(1); // No credits deducted on failure
    });
  });

  // =========================================================================
  // 2. WhatsApp Cloud API Adapter Tests
  // =========================================================================
  describe('2. WhatsApp Cloud API Adapter', () => {
    let testWhatsApp: WhatsAppAdapter;

    beforeEach(() => {
      testWhatsApp = new WhatsAppAdapter();
    });

    it('2.1 Formats WhatsApp Cloud API pre-approved templates with Meta payload', () => {
      // 1. Attendance Alert Template
      const attTemplate = testWhatsApp.formatTemplate('attendance_alert', {
        studentName: 'আব্দুল্লাহ আল-মামুন',
        date: '2026-09-20',
        madrasaPhone: '01711000000'
      });
      expect(attTemplate.formattedText).toContain('আব্দুল্লাহ আল-মামুন');
      expect(attTemplate.formattedText).toContain('অনুপস্থিত');
      expect(attTemplate.apiPayload.template.name).toBe('attendance_alert');
      expect(attTemplate.apiPayload.template.language.code).toBe('bn');

      // 2. Sabaq Progress Template
      const sabaqTemplate = testWhatsApp.formatTemplate('sabaq_progress', {
        studentName: 'মুহাম্মদ ফারুক',
        sabaqPara: 5,
        sabaqSurah: 'সূরা নিসা',
        sabaqRating: 'মু্মতাজ (উত্তম)'
      });
      expect(sabaqTemplate.formattedText).toContain('পারা 5');
      expect(sabaqTemplate.formattedText).toContain('সূরা নিসা');
      expect(sabaqTemplate.apiPayload.template.name).toBe('sabaq_progress');

      // 3. Fee Overdue Template
      const feeTemplate = testWhatsApp.formatTemplate('fee_overdue', {
        studentName: 'আরিফুল ইসলাম',
        month: 'সেপ্টেম্বর',
        dueAmount: 2500,
        paymentLink: 'https://pay.madrasaos.edu.bd/mfs/INV-001'
      });
      expect(feeTemplate.formattedText).toContain('৳2500');
      expect(feeTemplate.formattedText).toContain('https://pay.madrasaos.edu.bd/mfs/INV-001');
      expect(feeTemplate.apiPayload.template.name).toBe('fee_overdue');
    });

    it('2.2 Dispatches WhatsApp session messaging and manages 24-hour customer window', async () => {
      const recipient = '+8801711223344';
      const result = await testWhatsApp.send(recipient, 'জরুরি মাদ্রাসা তথ্য ও নোটিশ');

      expect(result.success).toBe(true);
      expect(result.channel).toBe('whatsapp');
      expect(result.details.type).toBe('session_text');
      expect(testWhatsApp.isSessionActive(recipient)).toBe(true);
      expect(testWhatsApp.getActiveSessionsCount()).toBe(1);
    });
  });

  // =========================================================================
  // 3. Facebook Messenger Adapter Tests
  // =========================================================================
  describe('3. Facebook Messenger Page Webhook Adapter', () => {
    let testMessenger: MessengerAdapter;

    beforeEach(() => {
      testMessenger = new MessengerAdapter();
    });

    it('3.1 Formats page-scoped Send API payload for official notices with quick replies', async () => {
      const psid = 'psid_user_998877';
      const result = await testMessenger.send(psid, 'আগামীকাল বিশেষ মিলাদ মাহফিল অনুষ্ঠিত হবে।', {
        noticeTitle: 'মিলাদ মাহফিল বিজ্ঞপ্তি'
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('messenger');
      expect(result.details.messageType).toBe('text_notice');
      expect(result.details.payload.messaging_type).toBe('MESSAGE_TAG');
      expect(result.details.payload.recipient.id).toBe(psid);
      expect(result.details.payload.message.quick_replies).toBeDefined();
    });

    it('3.2 Formats digital payment receipt cards with transaction metadata', async () => {
      const psid = 'psid_guardian_123';
      const receiptData = {
        receiptNumber: 'RCP-202609-0099',
        studentName: 'তাহমিদুল ইসলাম',
        amount: 3000,
        paymentMethod: 'bkash',
        transactionId: 'TRX_BKASH_998811',
        month: 'সেপ্টেম্বর',
        year: 2026
      };

      const result = await testMessenger.send(psid, 'ফি রসিদ', {
        isReceipt: true,
        receiptData
      });

      expect(result.success).toBe(true);
      expect(result.details.messageType).toBe('receipt_card');
      expect(result.details.payload.message.text).toContain('RCP-202609-0099');
      expect(result.details.payload.message.text).toContain('৳3000');
      expect(result.details.payload.message.text).toContain('TRX_BKASH_998811');
    });
  });

  // =========================================================================
  // 4. Brevo / SMTP Email Adapter Tests
  // =========================================================================
  describe('4. Brevo / SMTP Email Adapter with Daily Quota Tracking', () => {
    let testEmail: EmailAdapter;

    beforeEach(() => {
      testEmail = new EmailAdapter(300); // 300/day free tier
    });

    it('4.1 Tracks daily quota and generates styled HTML template with voucher details', async () => {
      const result = await testEmail.send('guardian@example.com', 'আপনার সন্তানের সেপ্টেম্বর মাসের টিউশন ফি পরিশোধ নিশ্চিত হয়েছে।', {
        subject: 'ফি পরিশোধের ডিজিটাল রসিদ',
        voucherDetails: {
          'রসিদ নং': 'RCP-202609-005',
          'শিক্ষার্থীর নাম': 'আব্দুল্লাহ',
          'মোট টাকা': '৳২,০০০'
        },
        attachments: [
          { name: 'Fee_Receipt_RCP-005.pdf', content: 'JVBERi0xLjQK...', contentType: 'application/pdf' }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
      expect(result.quotaUsedToday).toBe(1);
      expect(result.details.quotaRemaining).toBe(299);
      expect(result.details.attachmentsCount).toBe(1);
    });

    it('4.2 Strictly enforces Brevo daily quota threshold and blocks excess dispatch', async () => {
      testEmail.setDailyQuota(2); // Cap at 2 for testing

      const r1 = await testEmail.send('g1@example.com', 'Mail 1');
      expect(r1.success).toBe(true);
      const r2 = await testEmail.send('g2@example.com', 'Mail 2');
      expect(r2.success).toBe(true);

      // 3rd attempt exceeds quota
      const r3 = await testEmail.send('g3@example.com', 'Mail 3');
      expect(r3.success).toBe(false);
      expect(r3.error).toContain('Daily email quota exceeded');
    });
  });

  // =========================================================================
  // 5. Notification Router & Adapter Telemetry
  // =========================================================================
  describe('5. Unified Notification Router & Hub', () => {
    it('5.1 Dispatches and resolves channels based on recipient identifier format', async () => {
      // 1. Email recipient
      const emailRes = await notificationRouter.dispatch({
        recipient: 'guardian.ali@example.com',
        message: 'একাডেমিক নোটিশ'
      });
      expect(emailRes.channel).toBe('email');
      expect(emailRes.success).toBe(true);

      // 2. Mobile phone recipient defaults to SMS
      const smsRes = await notificationRouter.dispatch({
        recipient: '01711223344',
        message: 'হাজিরা নোটিশ'
      });
      expect(smsRes.channel).toBe('sms');
      expect(smsRes.success).toBe(true);

      // 3. Explicit preferredChannel: WhatsApp
      const waRes = await notificationRouter.dispatch({
        recipient: '01711223344',
        preferredChannel: 'whatsapp',
        message: 'হিফজ সবক আপডেট'
      });
      expect(waRes.channel).toBe('whatsapp');
      expect(waRes.success).toBe(true);
    });

    it('5.2 Performs graceful channel fallback to WhatsApp when SMS credits are exhausted', async () => {
      notificationRouter.sms.setBalance(0); // Deplete SMS balance

      const res = await notificationRouter.dispatch({
        recipient: '01811223344',
        preferredChannel: 'sms',
        message: 'জরুরি বার্তা'
      });

      // Routed via WhatsApp fallback
      expect(res.channel).toBe('whatsapp');
      expect(res.success).toBe(true);
      expect(res.details?.fallbackNotice).toContain('WhatsApp fallback');

      notificationRouter.sms.setBalance(5000); // Restore balance
    });

    it('5.3 Aggregates live telemetry from all 4 notification adapters', async () => {
      const telemetry = await notificationRouter.getTelemetry();

      expect(telemetry.sms.provider).toBeDefined();
      expect(telemetry.sms.balanceRemaining).toBeGreaterThanOrEqual(0);
      expect(telemetry.whatsapp.activeSessions).toBeDefined();
      expect(telemetry.messenger.pageConnected).toBe(true);
      expect(telemetry.email.dailyQuota).toBe(300);
      expect(telemetry.email.dailyQuotaRemaining).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 6. Pre-Built Automation Triggers (TriggerEngine)
  // =========================================================================
  describe('6. Pre-Built Automation Triggers (5 Concrete Rules)', () => {
    it('6.1 Rule 1: Consecutive Absence Alert flags students with 2+ missed days and routes alert', async () => {
      // Seed consecutive absence records for student std_001
      const studentId = 'std_001';
      await db.run(
        `INSERT OR REPLACE INTO attendance_records (id, tenant_id, branch_id, class_id, student_id, date, status, recorded_by_user_id)
         VALUES 
         ('att_test_abs_01', 'inst_main', 'branch_mirpur', 'cls_kafiya', ?, '2026-09-19', 'absent', 'usr_faruq'),
         ('att_test_abs_02', 'inst_main', 'branch_mirpur', 'cls_kafiya', ?, '2026-09-20', 'absent', 'usr_faruq')`,
        [studentId, studentId]
      );

      const results = await triggerEngine.evaluateConsecutiveAbsence({
        tenantId: 'inst_main',
        minConsecutiveDays: 2,
        dryRun: false
      });

      expect(results.length).toBeGreaterThan(0);
      const studentFlag = results.find((r) => r.studentId === studentId);
      expect(studentFlag).toBeDefined();
      expect(studentFlag!.consecutiveAbsentDays).toBeGreaterThanOrEqual(2);
      expect(studentFlag!.guardianPhone).toBeDefined();
      expect(studentFlag!.message).toContain('অনুপস্থিত');
      expect(studentFlag!.dispatchResult?.success).toBe(true);
    });

    it('6.2 Rule 2: Automated Fee Reminder identifies overdue invoices and formats bKash/Nagad links', async () => {
      // Ensure at least one overdue invoice exists
      await db.run(
        `UPDATE fee_invoices SET status = 'overdue', due_amount = 2500 WHERE id = 'inv_residential_std_001_1'`
      );

      const reminders = await triggerEngine.evaluateFeeReminders({
        tenantId: 'inst_main',
        dryRun: false
      });

      expect(reminders.length).toBeGreaterThan(0);
      const firstReminder = reminders[0];
      expect(firstReminder.dueAmount).toBeGreaterThan(0);
      expect(firstReminder.paymentLink).toContain('https://pay.madrasaos.edu.bd/mfs/');
      expect(firstReminder.message).toContain('বকেয়া ফি');
      expect(firstReminder.dispatchResult?.success).toBe(true);
    });

    it('6.3 Rule 3: Instant Notice Broadcast formats and delivers Muhtamim official announcements', async () => {
      const broadcastRes = await triggerEngine.broadcastNotice({
        noticeTitle: 'আসন্ন সেমিস্টার পরীক্ষার ফি জমা সংক্রান্ত',
        noticeBody: 'সকল শিক্ষার্থীকে আগামী ২৫ সেপ্টেম্বরের মধ্যে পরীক্ষার ফি পরিশোধ করতে নির্দেশ দেওয়া হচ্ছে।',
        recipients: ['01711223344', '01811223355'],
        tenantId: 'inst_main'
      });

      expect(broadcastRes.totalRecipients).toBe(2);
      expect(broadcastRes.sentCount).toBe(2);
      expect(broadcastRes.failedCount).toBe(0);
      expect(broadcastRes.results[0].success).toBe(true);
    });

    it('6.4 Rule 4: Hifz Stagnation Warning detects 3+ consecutive days of incomplete Sabaq', async () => {
      const studentId = 'std_001';
      // Clean up any prior hifz records for this student for test determinism
      await db.run('DELETE FROM hifz_records WHERE student_id = ?', [studentId]);

      // Mark 3 consecutive days of incomplete/weak sabaq
      await db.run(
        `INSERT OR REPLACE INTO hifz_records (
          id, tenant_id, student_id, teacher_id, date, sabaq_para, sabaq_surah, sabaq_ayah_range,
          sabaq_pages, sabaq_rating, sabqi_para, sabqi_pages, sabqi_mistakes, manzil_para, manzil_mistakes,
          teacher_notes, created_at
        ) VALUES 
        ('hz_test_01', 'inst_main', ?, 'usr_zubair', '2026-09-18', 3, 'আল-ইমরান', '1-10', 0, 'weak', 2, 2.0, 4, 1, 0, 'সবক অসম্পূর্ণ', datetime('now')),
        ('hz_test_02', 'inst_main', ?, 'usr_zubair', '2026-09-19', 3, 'আল-ইমরান', '1-10', 0, 'weak', 2, 2.0, 5, 1, 0, 'সবক বাকি', datetime('now')),
        ('hz_test_03', 'inst_main', ?, 'usr_zubair', '2026-09-20', 3, 'আল-ইমরান', '1-10', 0, 'weak', 2, 2.0, 3, 1, 0, 'সবক দিতে পারেনি', datetime('now'))`,
        [studentId, studentId, studentId]
      );

      const stagnationAlerts = await triggerEngine.evaluateHifzStagnation({
        tenantId: 'inst_main',
        minIncompleteDays: 3,
        dryRun: false
      });

      expect(stagnationAlerts.length).toBeGreaterThan(0);
      const flagged = stagnationAlerts.find((s) => s.studentId === studentId);
      expect(flagged).toBeDefined();
      expect(flagged!.incompleteDays).toBeGreaterThanOrEqual(3);
      expect(flagged!.guardianMessage).toContain('নতুন সবক সম্পন্ন করতে পারেনি');
      expect(flagged!.teacherMessage).toContain('টানা');
      expect(flagged!.guardianDispatch?.success).toBe(true);
    });

    it('6.5 Rule 5: Monthly Payroll Generation drafts staff vouchers on schedule and alerts admin', async () => {
      const payrollTriggerRes = await triggerEngine.evaluateMonthlyPayroll({
        month: 'নভেম্বর',
        year: 2026,
        organizationId: 'org_main',
        notifyAdminPhone: '01711000000'
      });

      expect(payrollTriggerRes.month).toBe('নভেম্বর');
      expect(payrollTriggerRes.year).toBe(2026);
      expect(payrollTriggerRes.vouchersGenerated).toBeGreaterThan(0);
      expect(payrollTriggerRes.adminAlertDispatched?.success).toBe(true);
    });
  });

  // =========================================================================
  // 7. Human-in-the-Loop Mass Approval (>50 recipients) REST API
  // =========================================================================
  describe('7. Human-in-the-Loop Mass Broadcast Gate (>50 Recipients Safety Guard)', () => {
    let pendingApprovalId: string;

    it('7.1 <= 50 recipients dispatches immediately and returns status: "dispatched"', async () => {
      const smallRecipientList = Array.from({ length: 15 }).map((_, i) => `017111000${String(i).padStart(2, '0')}`);

      const res = await request(app)
        .post('/api/v1/notifications/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recipients: smallRecipientList,
          content: 'সম্মানিত অভিভাবক, আগামী রবিবার ক্লাস টেস্ট অনুষ্ঠিত হবে।',
          channels: ['sms']
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('dispatched');
      expect(res.body.sentCount).toBe(15);
      expect(res.body.recipientCount).toBe(15);
    });

    it('7.2 > 50 recipients halts immediate dispatch and creates pending_approval record', async () => {
      const massRecipientList = Array.from({ length: 75 }).map((_, i) => `018112000${String(i).padStart(2, '0')}`);

      const res = await request(app)
        .post('/api/v1/notifications/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recipients: massRecipientList,
          content: 'জরুরি বিজ্ঞপ্তি: কাল বৈশাখী ঝড়ের কারণে আগামীকাল মাদ্রাসার ক্লাস স্থগিত থাকবে।',
          channels: ['sms', 'whatsapp']
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('pending_approval');
      expect(res.body.recipientCount).toBe(75);
      expect(res.body.approvalId).toBeDefined();

      pendingApprovalId = res.body.approvalId;

      // Verify the record in workflow_approvals table
      const approvalRow = await db.get<any>(
        'SELECT * FROM workflow_approvals WHERE id = ?',
        [pendingApprovalId]
      );
      expect(approvalRow).toBeDefined();
      expect(approvalRow.status).toBe('pending_approval');
      expect(approvalRow.workflow_name).toContain('Mass Broadcast');
    });

    it('7.3 Lists pending mass approvals via GET /api/v1/notifications/approvals', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/approvals')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.approvals)).toBe(true);

      const targetApproval = res.body.approvals.find((a: any) => a.id === pendingApprovalId);
      expect(targetApproval).toBeDefined();
      expect(targetApproval.actionPayload.recipientCount).toBe(75);
    });

    it('7.4 Non-admin users (e.g. Teacher) are strictly blocked (HTTP 403) from approving mass broadcast', async () => {
      const res = await request(app)
        .post(`/api/v1/notifications/approvals/${pendingApprovalId}/approve`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('7.5 Admin/Muhtamim approval executes batch dispatch to all 75 queued recipients', async () => {
      const res = await request(app)
        .post(`/api/v1/notifications/approvals/${pendingApprovalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('dispatched');
      expect(res.body.sentCount).toBe(75);
      expect(res.body.approvalId).toBe(pendingApprovalId);

      // Verify approval record updated to 'approved' in database
      const approvalRow = await db.get<any>(
        'SELECT * FROM workflow_approvals WHERE id = ?',
        [pendingApprovalId]
      );
      expect(approvalRow.status).toBe('approved');
      expect(approvalRow.decided_by).toBeDefined();
    });

    it('7.6 Duplicate approval attempt is rejected with HTTP 409 Conflict', async () => {
      const res = await request(app)
        .post(`/api/v1/notifications/approvals/${pendingApprovalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_APPROVED');
    });

    it('7.7 GET /api/v1/notifications/telemetry returns full live adapter metrics', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/telemetry')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.telemetry.sms.balanceRemaining).toBeDefined();
      expect(res.body.telemetry.whatsapp.activeSessions).toBeDefined();
      expect(res.body.telemetry.messenger.pageConnected).toBe(true);
      expect(res.body.telemetry.email.dailyQuota).toBe(300);
    });

    it('7.8 POST /api/v1/notifications/triggers/evaluate executes rules on demand', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/triggers/evaluate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rule: 'consecutive_absence',
          options: { dryRun: true }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rule).toBe('consecutive_absence');
      expect(Array.isArray(res.body.result)).toBe(true);
    });
  });
});
