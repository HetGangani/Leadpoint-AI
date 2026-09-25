import twilio from 'twilio';
import { sendSmsMock, SmsSendOptions, SmsSendResult } from './sms-mock';

export type { SmsSendOptions, SmsSendResult };

export interface SMSProvider {
  sendSms(options: SmsSendOptions): Promise<SmsSendResult>;
}

/**
 * Validates whether recipient phone number is provided and clean.
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; cleanPhone: string; error?: string } {
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    return { isValid: false, cleanPhone: '', error: 'Recipient phone number is required.' };
  }
  const cleanPhone = phone.trim();
  return { isValid: true, cleanPhone };
}

/**
 * Twilio SMS Provider Implementation
 */
export async function sendTwilioSms(
  options: SmsSendOptions,
  twilioClientOverride?: any
): Promise<SmsSendResult> {
  const { recipientPhone, message } = options;
  const timestamp = new Date().toISOString();

  const phoneValidation = validatePhoneNumber(recipientPhone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      provider: 'twilio',
      message: message || '',
      recipient: '',
      timestamp,
      error: phoneValidation.error || 'Invalid recipient phone number.',
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKey = process.env.TWILIO_API_KEY?.trim();
  const apiSecret = process.env.TWILIO_API_SECRET?.trim();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim();

  // Check required credentials (either AccountSID + AuthToken or AccountSID + ApiKey + ApiSecret)
  const hasAuth = !!accountSid && (!!authToken || (!!apiKey && !!apiSecret));

  if (!hasAuth || !fromPhone) {
    const missingKeys = [];
    if (!accountSid) missingKeys.push('TWILIO_ACCOUNT_SID');
    if (!authToken && (!apiKey || !apiSecret)) missingKeys.push('TWILIO_AUTH_TOKEN or TWILIO_API_KEY/TWILIO_API_SECRET');
    if (!fromPhone) missingKeys.push('TWILIO_PHONE_NUMBER');

    const errMessage = `Twilio configuration error: Missing required environment variables (${missingKeys.join(', ')}).`;
    console.error(`[SMS TWILIO FAILED] ${errMessage}`);

    return {
      success: false,
      provider: 'twilio',
      message,
      recipient: phoneValidation.cleanPhone,
      timestamp,
      error: errMessage,
    };
  }

  try {
    // Initialize Twilio client or use injected mock client for unit tests
    const client = twilioClientOverride || (apiKey && apiSecret ? twilio(apiKey, apiSecret, { accountSid }) : twilio(accountSid, authToken));

    const twilioResponse = await client.messages.create({
      body: message,
      from: fromPhone,
      to: phoneValidation.cleanPhone,
    });

    console.log(`[SMS SENT (TWILIO)] Message SID: ${twilioResponse.sid} | Recipient: ${phoneValidation.cleanPhone}`);

    return {
      success: true,
      provider: 'twilio',
      message,
      recipient: phoneValidation.cleanPhone,
      messageId: twilioResponse.sid,
      timestamp,
    };
  } catch (error: any) {
    const safeErrorMessage = error.message || 'Twilio SMS dispatch failed.';
    console.error(`[SMS TWILIO ERROR] Recipient: ${phoneValidation.cleanPhone} | Error: ${safeErrorMessage}`);

    return {
      success: false,
      provider: 'twilio',
      message,
      recipient: phoneValidation.cleanPhone,
      timestamp,
      error: safeErrorMessage,
    };
  }
}

/**
 * Unified SMS Dispatcher
 * Dispatches via Twilio if SMS_PROVIDER=twilio, otherwise uses Mock provider.
 */
export async function sendSms(
  options: SmsSendOptions,
  twilioClientOverride?: any
): Promise<SmsSendResult> {
  const providerType = (process.env.SMS_PROVIDER || 'mock').toLowerCase().trim();

  if (providerType === 'twilio') {
    return sendTwilioSms(options, twilioClientOverride);
  }

  return sendSmsMock(options);
}
