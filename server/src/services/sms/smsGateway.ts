import fetch from 'node-fetch';

export interface SmsGateway {
  send(phone: string, text: string): Promise<boolean>;
}

export class ConsoleSms implements SmsGateway {
  async send(phone: string, text: string): Promise<boolean> {
    console.log(`[SMS to ${phone}]: ${text}`);
    return true;
  }
}

export class BulkSmsBD implements SmsGateway {
  constructor(
    private apiKey: string,
    private senderId: string
  ) {}

  async send(phone: string, text: string): Promise<boolean> {
    try {
      const url = new URL('http://bulksmsbd.net/api/smsapi');
      url.searchParams.append('api_key', this.apiKey);
      url.searchParams.append('type', 'text');
      url.searchParams.append('number', phone);
      url.searchParams.append('senderid', this.senderId);
      url.searchParams.append('message', text);

      const res = await fetch(url.toString(), { method: 'GET' });
      if (!res.ok) return false;
      return true;
    } catch (err) {
      console.error('BulkSmsBD error:', err);
      return false;
    }
  }
}

export class NoSms implements SmsGateway {
  async send(phone: string, text: string): Promise<boolean> {
    return false;
  }
}
