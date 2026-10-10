import {
  INotificationAdapter,
  NotificationChannel,
  NotificationDispatchResult,
  WhatsAppTemplateName
} from '../../../types/index.js';

export interface WhatsAppLogEntry {
  messageId: string;
  recipient: string;
  type: 'template' | 'session_text';
  templateName?: string;
  content: string;
  payload: any;
  timestamp: string;
  status: 'sent' | 'delivered';
}

export class WhatsAppAdapter implements INotificationAdapter {
  public readonly channel: NotificationChannel = 'whatsapp';
  private logs: WhatsAppLogEntry[] = [];
  private activeSessions: Map<string, number> = new Map(); // recipient -> expiry timestamp ms

  /**
   * Formats a pre-approved WhatsApp Cloud API template into official payload and human-readable text.
   */
  public formatTemplate(
    templateName: WhatsAppTemplateName,
    params: Record<string, any>
  ): { formattedText: string; apiPayload: any } {
    let formattedText = '';
    const bodyParameters: any[] = [];

    switch (templateName) {
      case 'attendance_alert': {
        const studentName = params.studentName || 'শিক্ষার্থী';
        const date = params.date || new Date().toISOString().split('T')[0];
        const madrasaPhone = params.madrasaPhone || '01700000000';
        formattedText = `আসসালামু আলাইকুম। সম্মানিত অভিভাবক, আপনার সন্তান ${studentName} আজ (${date}) ক্লাসে অনুপস্থিত। বিস্তারিত জানতে মাদ্রাসার দফতরে যোগাযোগ করুন: ${madrasaPhone}`;
        bodyParameters.push(
          { type: 'text', text: studentName },
          { type: 'text', text: date },
          { type: 'text', text: madrasaPhone }
        );
        break;
      }
      case 'sabaq_progress': {
        const studentName = params.studentName || 'শিক্ষার্থী';
        const sabaqPara = params.sabaqPara || '১';
        const sabaqSurah = params.sabaqSurah || 'সূরা ফাতিহা';
        const sabaqRating = params.sabaqRating || 'উত্তম';
        formattedText = `আসসালামু আলাইকুম। আজ ${studentName} এর হিফজ সবক অগ্রগতি: পারা ${sabaqPara}, ${sabaqSurah}। মূল্যায়ন: ${sabaqRating}। মাশাআল্লাহ!`;
        bodyParameters.push(
          { type: 'text', text: studentName },
          { type: 'text', text: String(sabaqPara) },
          { type: 'text', text: sabaqSurah },
          { type: 'text', text: sabaqRating }
        );
        break;
      }
      case 'fee_overdue': {
        const studentName = params.studentName || 'শিক্ষার্থী';
        const month = params.month || 'চলতি';
        const dueAmount = params.dueAmount || '০';
        const paymentLink = params.paymentLink || 'https://pay.madrasaos.edu.bd';
        formattedText = `সম্মানিত অভিভাবক, ${studentName} এর ${month} মাসের বকেয়া ফি ৳${dueAmount}। বিলম্ব এড়াতে অনুগ্রহ করে bKash/Nagad এ পরিশোধ করুন: ${paymentLink}`;
        bodyParameters.push(
          { type: 'text', text: studentName },
          { type: 'text', text: month },
          { type: 'text', text: String(dueAmount) },
          { type: 'text', text: paymentLink }
        );
        break;
      }
      case 'general_notice':
      default: {
        const title = params.title || 'প্রাতিষ্ঠানিক নোটিশ';
        const body = params.body || params.message || '';
        const inst = params.institutionName || 'মাদ্রাসা';
        formattedText = `📢 [${title}]\n${body}\n— ${inst}`;
        bodyParameters.push(
          { type: 'text', text: title },
          { type: 'text', text: body }
        );
        break;
      }
    }

    const apiPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'bn' },
        components: [
          {
            type: 'body',
            parameters: bodyParameters
          }
        ]
      }
    };

    return { formattedText, apiPayload };
  }

  /**
   * Simulates or establishes an active 24h customer support session.
   */
  public openSession(recipient: string, durationHours: number = 24): void {
    const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
    this.activeSessions.set(recipient, expiresAt);
  }

  public isSessionActive(recipient: string): boolean {
    const expiresAt = this.activeSessions.get(recipient);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.activeSessions.delete(recipient);
      return false;
    }
    return true;
  }

  public getActiveSessionsCount(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, exp] of this.activeSessions.entries()) {
      if (exp > now) count++;
      else this.activeSessions.delete(key);
    }
    return count;
  }

  public getLogs(): WhatsAppLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.activeSessions.clear();
  }

  /**
   * Dispatches WhatsApp Cloud API message.
   */
  public async send(
    to: string,
    message: string,
    metadata: {
      templateName?: WhatsAppTemplateName;
      templateParams?: Record<string, any>;
      isSessionMessage?: boolean;
      [key: string]: any;
    } = {}
  ): Promise<NotificationDispatchResult> {
    const now = new Date().toISOString();
    const messageId = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let finalContent = message;
    let payload: any;
    let msgType: 'template' | 'session_text' = 'session_text';

    if (metadata.templateName) {
      const templateResult = this.formatTemplate(metadata.templateName, metadata.templateParams || {});
      finalContent = templateResult.formattedText || message;
      payload = {
        ...templateResult.apiPayload,
        to
      };
      msgType = 'template';
    } else {
      // Session text message
      this.openSession(to); // Register active 24h conversation
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: message }
      };
      msgType = 'session_text';
    }

    const logEntry: WhatsAppLogEntry = {
      messageId,
      recipient: to,
      type: msgType,
      templateName: metadata.templateName,
      content: finalContent,
      payload,
      timestamp: now,
      status: 'delivered'
    };
    this.logs.push(logEntry);

    return {
      success: true,
      messageId,
      channel: 'whatsapp',
      recipient: to,
      timestamp: now,
      details: {
        type: msgType,
        templateName: metadata.templateName,
        payload
      }
    };
  }

  public async getTelemetry(): Promise<{
    provider: string;
    activeSessions: number;
    totalSent: number;
    status: string;
  }> {
    return {
      provider: 'WhatsApp Cloud API (Meta)',
      activeSessions: this.getActiveSessionsCount(),
      totalSent: this.logs.length,
      status: 'connected'
    };
  }
}

export const whatsappAdapter = new WhatsAppAdapter();
