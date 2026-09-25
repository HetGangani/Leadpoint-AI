import twilio from 'twilio';

export type TelephonyProviderType = 'mock' | 'twilio';

export interface InitiateCallParams {
  leadId: string;
  leadPhone: string;
  callId?: string;
  customWebhookUrl?: string;
  customStatusWebhookUrl?: string;
}

export interface InitiateCallResult {
  success: boolean;
  provider: TelephonyProviderType;
  providerCallId?: string;
  status?: string;
  normalizedPhone?: string;
  error?: string;
}

export interface CallStatusResult {
  providerCallId: string;
  provider: TelephonyProviderType;
  status: string;
  durationSeconds?: number;
  error?: string;
}

/**
 * Normalizes phone numbers to standard E.164 format.
 * Returns null if the phone number is invalid.
 * Strictly avoids blindly prepending country codes unless clear (e.g. 11 digits starting with 1).
 */
export function normalizePhoneNumberToE164(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // Remove whitespace, dashes, parentheses, dots
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (!cleaned) return null;

  // If starts with +, check E.164 international standard format (+ followed by 8 to 15 digits)
  if (cleaned.startsWith('+')) {
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    return e164Regex.test(cleaned) ? cleaned : null;
  }

  // If 11 digits starting with 1 (US/NANP with country code missing +)
  if (/^1[2-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Otherwise, invalid without an explicit country code prefix (+)
  return null;
}

/**
 * Telephony Provider Service Abstraction
 * Supports TELEPHONY_PROVIDER=mock and TELEPHONY_PROVIDER=twilio
 */
export class TelephonyService {
  public static getProvider(): TelephonyProviderType {
    const provider = (process.env.TELEPHONY_PROVIDER || 'mock').toLowerCase();
    return provider === 'twilio' ? 'twilio' : 'mock';
  }

  public static async initiateCall(params: InitiateCallParams): Promise<InitiateCallResult> {
    const provider = this.getProvider();
    const normalizedPhone = normalizePhoneNumberToE164(params.leadPhone);

    if (!normalizedPhone) {
      return {
        success: false,
        provider,
        error: `Invalid phone number format: "${params.leadPhone}". Phone numbers must be in valid E.164 format (e.g., +15553829901 or +919876543210).`,
      };
    }

    if (provider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioVoiceNumber = process.env.TWILIO_VOICE_NUMBER;
      const webhookUrl = params.customWebhookUrl || process.env.TWILIO_VOICE_WEBHOOK_URL;
      const statusWebhookUrl = params.customStatusWebhookUrl || process.env.TWILIO_VOICE_STATUS_WEBHOOK_URL;

      if (!accountSid || !authToken) {
        return {
          success: false,
          provider: 'twilio',
          error: 'Missing Twilio account credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).',
        };
      }

      if (!twilioVoiceNumber) {
        return {
          success: false,
          provider: 'twilio',
          error: 'Missing TWILIO_VOICE_NUMBER environment variable.',
        };
      }

      if (!webhookUrl) {
        return {
          success: false,
          provider: 'twilio',
          error: 'Missing TWILIO_VOICE_WEBHOOK_URL environment variable.',
        };
      }

      try {
        const client = twilio(accountSid, authToken);
        const callOptions: any = {
          to: normalizedPhone,
          from: twilioVoiceNumber,
          url: webhookUrl,
        };

        if (statusWebhookUrl) {
          callOptions.statusCallback = statusWebhookUrl;
          callOptions.statusCallbackEvent = ['initiated', 'ringing', 'answered', 'completed'];
          callOptions.statusCallbackMethod = 'POST';
        }

        const call = await client.calls.create(callOptions);

        return {
          success: true,
          provider: 'twilio',
          providerCallId: call.sid,
          status: call.status || 'initiated',
          normalizedPhone,
        };
      } catch (err: any) {
        return {
          success: false,
          provider: 'twilio',
          error: err?.message || 'Failed to initiate Twilio voice call.',
        };
      }
    }

    // Mock Provider Fallback
    const mockCallId = params.callId || `call_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      provider: 'mock',
      providerCallId: mockCallId,
      status: 'initiated',
      normalizedPhone,
    };
  }

  public static async hangupCall(providerCallId: string): Promise<{ success: boolean; status: string; error?: string }> {
    const provider = this.getProvider();

    if (provider === 'twilio' && !providerCallId.startsWith('call_mock_')) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        return { success: false, status: 'failed', error: 'Missing Twilio credentials.' };
      }

      try {
        const client = twilio(accountSid, authToken);
        const call = await client.calls(providerCallId).update({ status: 'completed' });
        return { success: true, status: call.status };
      } catch (err: any) {
        return { success: false, status: 'failed', error: err?.message };
      }
    }

    return { success: true, status: 'completed' };
  }

  public static async getCallStatus(providerCallId: string): Promise<CallStatusResult> {
    const provider = this.getProvider();

    if (provider === 'twilio' && !providerCallId.startsWith('call_mock_')) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (accountSid && authToken) {
        try {
          const client = twilio(accountSid, authToken);
          const call = await client.calls(providerCallId).fetch();
          return {
            providerCallId: call.sid,
            provider: 'twilio',
            status: call.status,
            durationSeconds: call.duration ? parseInt(call.duration, 10) : undefined,
          };
        } catch (err: any) {
          return {
            providerCallId,
            provider: 'twilio',
            status: 'unknown',
            error: err?.message,
          };
        }
      }
    }

    return {
      providerCallId,
      provider: 'mock',
      status: 'completed',
      durationSeconds: 120,
    };
  }
}
