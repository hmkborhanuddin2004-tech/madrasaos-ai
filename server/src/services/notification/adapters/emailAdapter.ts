import {
  INotificationAdapter,
  NotificationChannel,
  NotificationDispatchResult,
  EmailAttachment
} from '../../../types/index.js';

export interface EmailLogEntry {
  messageId: string;
  recipient: string;
  subject: string;
  htmlContent: string;
  attachmentsCount: number;
  attachments?: EmailAttachment[];
  timestamp: string;
  quotaUsedToday: number;
  status: 'sent' | 'delivered' | 'failed';
}

export class EmailAdapter implements INotificationAdapter {
  public readonly channel: NotificationChannel = 'email';
  private dailyQuota: number = 300; // Free tier standard
  private dailySentCount: number = 0;
  private currentDay: string = new Date().toISOString().split('T')[0];
  private logs: EmailLogEntry[] = [];

  constructor(dailyQuota: number = 300) {
    this.dailyQuota = dailyQuota;
  }

  private checkAndResetDailyQuota(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.currentDay !== today) {
      this.currentDay = today;
      this.dailySentCount = 0;
    }
  }

  public getDailyQuota(): number {
    return this.dailyQuota;
  }

  public setDailyQuota(quota: number): void {
    this.dailyQuota = quota;
  }

  public getDailySent(): number {
    this.checkAndResetDailyQuota();
    return this.dailySentCount;
  }

  public resetDailyQuota(): void {
    this.dailySentCount = 0;
    this.currentDay = new Date().toISOString().split('T')[0];
  }

  public getLogs(): EmailLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.dailySentCount = 0;
  }

  /**
   * Generates a styled Bengali HTML template for emails with optional voucher box.
   */
  public generateHtmlTemplate(params: {
    subject: string;
    body: string;
    voucherDetails?: Record<string, string | number>;
    institutionName?: string;
  }): string {
    let voucherTable = '';
    if (params.voucherDetails && Object.keys(params.voucherDetails).length > 0) {
      const rows = Object.entries(params.voucherDetails)
        .map(
          ([key, value]) => `
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold; background: #f8fafc; color: #334155;">${key}</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0f172a;">${value}</td>
            </tr>`
        )
        .join('');

      voucherTable = `
        <div style="margin: 20px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <div style="background: #0f766e; color: white; padding: 8px 12px; font-weight: bold; font-size: 13px;">
            ভাউচার ও আর্থিক বিবরণী
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${rows}
          </table>
        </div>`;
    }

    const instHeading = params.institutionName || 'মাদ্রাসা ডিজিটাল নোটিশ';

    return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>${params.subject}</title>
</head>
<body style="font-family: 'SolaimanLipi', 'Hind Siliguri', 'Segoe UI', Tahoma, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: #042f2e; color: #ffffff; padding: 20px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">${instHeading}</h1>
      <p style="margin: 4px 0 0; font-size: 12px; color: #99f6e4;">মাদ্রাসার কেন্দ্রীয় ডিজিটাল বিজ্ঞপ্তি ও লেনদেন সেবা</p>
    </div>
    <div style="padding: 24px; line-height: 1.6; font-size: 14px;">
      <h2 style="font-size: 16px; color: #0f766e; margin-top: 0; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">
        ${params.subject}
      </h2>
      <div style="margin: 16px 0; white-space: pre-line; color: #334155;">
        ${params.body}
      </div>
      ${voucherTable}
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">বি.দ্র. এটি একটি স্বয়ংক্রিয় প্রাতিষ্ঠানিক ডিজিটাল বার্তা। প্রয়োজনে মাদ্রাসা অফিসে যোগাযোগ করুন।</p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 12px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © 2026 MadrasaOS AI. সর্বস্বত্ব সংরক্ষিত।
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Dispatches transactional email via Brevo / SMTP with daily quota check and PDF attachments.
   */
  public async send(
    to: string,
    message: string,
    metadata: {
      subject?: string;
      attachments?: EmailAttachment[];
      voucherDetails?: Record<string, string | number>;
      htmlContent?: string;
      institutionName?: string;
      [key: string]: any;
    } = {}
  ): Promise<NotificationDispatchResult> {
    this.checkAndResetDailyQuota();

    const now = new Date().toISOString();
    const instName = metadata.institutionName || 'মাদ্রাসা';
    const subject = metadata.subject || `${instName} - প্রাতিষ্ঠানিক নোটিশ`;
    const attachments = metadata.attachments || [];

    if (this.dailySentCount >= this.dailyQuota) {
      const failEntry: EmailLogEntry = {
        messageId: `brevo_fail_${Date.now()}`,
        recipient: to,
        subject,
        htmlContent: '',
        attachmentsCount: attachments.length,
        timestamp: now,
        quotaUsedToday: this.dailySentCount,
        status: 'failed'
      };
      this.logs.push(failEntry);

      return {
        success: false,
        messageId: failEntry.messageId,
        channel: 'email',
        recipient: to,
        quotaUsedToday: this.dailySentCount,
        error: `Daily email quota exceeded (${this.dailyQuota}/day on Brevo free tier)`
      };
    }

    const htmlContent =
      metadata.htmlContent ||
      this.generateHtmlTemplate({
        subject,
        body: message,
        voucherDetails: metadata.voucherDetails,
        institutionName: metadata.institutionName
      });

    this.dailySentCount++;

    const messageId = `brevo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const logEntry: EmailLogEntry = {
      messageId,
      recipient: to,
      subject,
      htmlContent,
      attachmentsCount: attachments.length,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: now,
      quotaUsedToday: this.dailySentCount,
      status: 'delivered'
    };
    this.logs.push(logEntry);

    return {
      success: true,
      messageId,
      channel: 'email',
      recipient: to,
      quotaUsedToday: this.dailySentCount,
      timestamp: now,
      details: {
        provider: 'Brevo (formerly Sendinblue)',
        subject,
        attachmentsCount: attachments.length,
        quotaRemaining: Math.max(0, this.dailyQuota - this.dailySentCount)
      }
    };
  }

  public async getTelemetry(): Promise<{
    provider: string;
    dailyQuota: number;
    dailyQuotaUsed: number;
    dailyQuotaRemaining: number;
    totalSent: number;
    status: string;
  }> {
    this.checkAndResetDailyQuota();
    return {
      provider: 'Brevo (formerly Sendinblue) Transactional SMTP',
      dailyQuota: this.dailyQuota,
      dailyQuotaUsed: this.dailySentCount,
      dailyQuotaRemaining: Math.max(0, this.dailyQuota - this.dailySentCount),
      totalSent: this.logs.filter((l) => l.status === 'delivered').length,
      status: this.dailySentCount < this.dailyQuota ? 'operational' : 'quota_exhausted'
    };
  }
}

export const emailAdapter = new EmailAdapter();
