import {
  INotificationAdapter,
  NotificationChannel,
  NotificationDispatchResult,
  NotificationTelemetry,
  WhatsAppTemplateName
} from '../../types/index.js';
import { smsAdapter, SmsAdapter } from './adapters/smsAdapter.js';
import { whatsappAdapter, WhatsAppAdapter } from './adapters/whatsappAdapter.js';
import { messengerAdapter, MessengerAdapter } from './adapters/messengerAdapter.js';
import { emailAdapter, EmailAdapter } from './adapters/emailAdapter.js';

export interface DispatchOptions {
  recipient: string;
  preferredChannel?: NotificationChannel;
  message: string;
  templateName?: string;
  metadata?: Record<string, any>;
}

export interface BatchDispatchOptions {
  recipients: string[];
  preferredChannel?: NotificationChannel;
  channels?: NotificationChannel[];
  message: string;
  templateName?: string;
  metadata?: Record<string, any>;
}

export interface BatchDispatchSummary {
  total: number;
  sentCount: number;
  failedCount: number;
  results: NotificationDispatchResult[];
}

export interface NotificationHistoryEntry {
  id: string;
  recipient: string;
  channel: NotificationChannel;
  message: string;
  status: 'delivered' | 'failed';
  timestamp: string;
  details?: any;
}

export class NotificationRouter {
  public readonly sms: SmsAdapter;
  public readonly whatsapp: WhatsAppAdapter;
  public readonly messenger: MessengerAdapter;
  public readonly email: EmailAdapter;
  private history: NotificationHistoryEntry[] = [];

  constructor(
    sms: SmsAdapter = smsAdapter,
    whatsapp: WhatsAppAdapter = whatsappAdapter,
    messenger: MessengerAdapter = messengerAdapter,
    email: EmailAdapter = emailAdapter
  ) {
    this.sms = sms;
    this.whatsapp = whatsapp;
    this.messenger = messenger;
    this.email = email;
  }

  /**
   * Resolves the target channel based on explicit preference or recipient address format.
   */
  public resolveChannel(recipient: string, preferredChannel?: NotificationChannel): NotificationChannel {
    if (preferredChannel) {
      return preferredChannel;
    }
    if (recipient.includes('@')) {
      return 'email';
    }
    if (recipient.startsWith('psid_') || recipient.startsWith('fbm_')) {
      return 'messenger';
    }
    // Default for Bangladeshi phone numbers
    return 'sms';
  }

  /**
   * Returns the appropriate adapter instance for a channel.
   */
  public getAdapter(channel: NotificationChannel): INotificationAdapter {
    switch (channel) {
      case 'sms':
        return this.sms;
      case 'whatsapp':
        return this.whatsapp;
      case 'messenger':
        return this.messenger;
      case 'email':
        return this.email;
      default:
        return this.sms;
    }
  }

  /**
   * Dispatches a single notification to a recipient via their preferred or resolved channel,
   * with automatic fallback if the primary channel is exhausted.
   */
  public async dispatch(options: DispatchOptions): Promise<NotificationDispatchResult> {
    const { recipient, message, templateName, metadata = {} } = options;
    let targetChannel = this.resolveChannel(recipient, options.preferredChannel);

    const adapter = this.getAdapter(targetChannel);
    const dispatchMeta = {
      ...metadata,
      templateName: templateName as WhatsAppTemplateName | undefined
    };

    let result = await adapter.send(recipient, message, dispatchMeta);

    // Fallback logic: If SMS fails due to insufficient balance, try WhatsApp if valid phone
    if (!result.success && targetChannel === 'sms' && this.sms.getBalance() < 1) {
      const fallbackResult = await this.whatsapp.send(recipient, message, dispatchMeta);
      if (fallbackResult.success) {
        result = {
          ...fallbackResult,
          details: {
            ...fallbackResult.details,
            fallbackNotice: 'SMS balance exhausted; message delivered via WhatsApp fallback.'
          }
        };
        targetChannel = 'whatsapp';
      }
    }

    const historyEntry: NotificationHistoryEntry = {
      id: result.messageId,
      recipient,
      channel: targetChannel,
      message,
      status: result.success ? 'delivered' : 'failed',
      timestamp: new Date().toISOString(),
      details: result.details
    };
    this.history.push(historyEntry);

    return result;
  }

  /**
   * Dispatches a batch of notifications to multiple recipients.
   */
  public async dispatchBatch(options: BatchDispatchOptions): Promise<BatchDispatchSummary> {
    const { recipients, message, preferredChannel, channels, templateName, metadata } = options;
    const results: NotificationDispatchResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      let channelToUse = preferredChannel;
      if (!channelToUse && channels && channels.length > 0) {
        channelToUse = channels[0];
      }

      const res = await this.dispatch({
        recipient,
        preferredChannel: channelToUse,
        message,
        templateName,
        metadata
      });

      results.push(res);
      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    return {
      total: recipients.length,
      sentCount,
      failedCount,
      results
    };
  }

  /**
   * Aggregates live telemetry from all 4 notification adapters.
   */
  public async getTelemetry(): Promise<NotificationTelemetry> {
    const [smsTel, waTel, fbmTel, emailTel] = await Promise.all([
      this.sms.getTelemetry(),
      this.whatsapp.getTelemetry(),
      this.messenger.getTelemetry(),
      this.email.getTelemetry()
    ]);

    return {
      sms: smsTel,
      whatsapp: waTel,
      messenger: fbmTel,
      email: emailTel
    };
  }

  public getHistory(limit: number = 50): NotificationHistoryEntry[] {
    return this.history.slice(-limit);
  }

  public clearHistory(): void {
    this.history = [];
    this.sms.clearLogs();
    this.whatsapp.clearLogs();
    this.messenger.clearLogs();
    this.email.clearLogs();
  }
}

export const notificationRouter = new NotificationRouter();
