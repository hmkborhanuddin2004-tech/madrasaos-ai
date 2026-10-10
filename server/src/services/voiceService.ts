import { db } from '../db/db.js';

export interface TranscribeResult {
  success: boolean;
  text?: string;
  provider?: 'gemini' | 'local';
  error?: string;
  message?: string;
}

export class VoiceService {
  /**
   * Retrieves Gemini API Key from environment or database settings
   */
  public async getGeminiApiKey(tenantId: string = 'inst_main'): Promise<string | null> {
    // 1. Process environment
    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (envKey && envKey.trim().length > 10) {
      return envKey.trim();
    }

    // 2. Database settings for tenant
    try {
      const row = await db.get<any>(
        `SELECT gemini_api_key FROM institution_settings WHERE tenant_id = ?`,
        [tenantId]
      );
      if (row?.gemini_api_key && row.gemini_api_key.trim().length > 10) {
        return row.gemini_api_key.trim();
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Transcribes base64 encoded audio using Google Gemini API
   */
  public async transcribeAudio(
    audioBase64: string,
    mimeType: string = 'audio/webm',
    tenantId: string = 'inst_main',
    clientApiKey?: string
  ): Promise<TranscribeResult> {
    if (!audioBase64 || audioBase64.trim().length === 0) {
      return { success: false, error: 'EMPTY_AUDIO', message: 'কোনো অডিও ডেটা পাওয়া যায়নি।' };
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = audioBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '').trim();

    const apiKey = (clientApiKey && clientApiKey.trim().length > 10)
      ? clientApiKey.trim()
      : await this.getGeminiApiKey(tenantId);

    if (!apiKey) {
      return {
        success: false,
        error: 'NO_API_KEY',
        message: 'গুগল জেমিনি এপিআই কি সেটআপ করা নেই। সেটিংস থেকে আপনার ফ্রি API Key যুক্ত করতে পারেন।'
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'You are an accurate Speech-to-Text transcriber for a Bangladeshi Madrasa management software. Transcribe the following spoken audio accurately. The speaker speaks in Bengali (বাংলা), English, or Arabic terms (e.g. হাজিরা, ফি, হিফজ, কিতাব, মুহতামিম, রসিদ, বকেয়া). Return ONLY the transcription text in natural Bengali script (or English if spoken in English). Do NOT include any explanations, markdown quotes, formatting, or labels.'
                },
                {
                  inline_data: {
                    mime_type: mimeType.split(';')[0] || 'audio/webm',
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn('[VoiceService] Gemini transcription error:', response.status, errorBody);
        return {
          success: false,
          error: `HTTP_${response.status}`,
          message: 'গুগল ভয়েস সার্ভারে সংযোগ করা যায়নি। দয়া করে ইন্টারনেট ও API Key যাচাই করুন।'
        };
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText || candidateText.trim().length === 0) {
        return {
          success: false,
          error: 'EMPTY_TRANSCRIPT',
          message: 'কথা স্পষ্টভাবে শোনা যায়নি। অনুগ্রহ করে আবার বলুন।'
        };
      }

      return {
        success: true,
        text: candidateText.trim(),
        provider: 'gemini'
      };
    } catch (err: any) {
      console.error('[VoiceService] Transcription exception:', err);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err?.message || 'ভয়েস রূপান্তরে ত্রুটি হয়েছে।'
      };
    }
  }
}

export const voiceService = new VoiceService();
