import { randomUUID } from 'crypto';
import { DatabaseService } from '../../db/db.js';
import { SmsGateway } from '../sms/smsGateway.js';

export class AutomationContext {
  constructor(
    public db: DatabaseService,
    public sms: SmsGateway,
    public config: Record<string, any>,
    public dryRun: boolean = false
  ) {}

  async sendSms(phone: string, text: string, kind: string, ref: string): Promise<boolean> {
    // Check duplicate guard
    const exists = await this.db.get(
      'SELECT id FROM notification_logs WHERE kind = ? AND ref = ? AND phone = ?',
      [kind, ref, phone]
    );
    if (exists) {
      return false; // Already sent
    }

    let ok = false;
    if (this.dryRun) {
      console.log(`[DRY RUN SMS - ${kind}] to ${phone}: ${text}`);
      ok = true; // assume success
    } else {
      ok = await this.sms.send(phone, text);
    }

    if (ok) {
      const id = randomUUID();
      await this.db.run(
        'INSERT OR IGNORE INTO notification_logs (id, kind, ref, phone, sent_at) VALUES (?, ?, ?, ?, ?)',
        [id, kind, ref, phone, new Date().toISOString()]
      );
    }
    return ok;
  }

  today(): string {
    return this.now().toISOString().split('T')[0];
  }

  now(): Date {
    return new Date();
  }

  madrasaName(): string {
    return this.config.madrasa_name || 'মাদরাসা';
  }
}
