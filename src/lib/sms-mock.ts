export interface SmsSendOptions {
  recipientPhone: string;
  message: string;
  leadId?: string;
  callId?: string;
}

export interface SmsSendResult {
  success: boolean;
  provider: 'mock';
  message: string;
  recipient: string;
  timestamp: string;
  error?: string;
}

/**
 * Mock SMS Dispatcher Service
 * Note: Clearly identified as mock provider for demonstration. Does NOT deliver actual cellular SMS.
 */
export async function sendSmsMock(options: SmsSendOptions): Promise<SmsSendResult> {
  const { recipientPhone, message } = options;
  const timestamp = new Date().toISOString();

  if (!recipientPhone || recipientPhone.trim().length === 0) {
    console.warn('[SMS MOCK FAILED] Reason: Missing recipient phone number.');
    return {
      success: false,
      provider: 'mock',
      message: message || '',
      recipient: '',
      timestamp,
      error: 'Recipient phone number is required.',
    };
  }

  const cleanPhone = recipientPhone.trim();

  // Console logging for product demo visibility
  console.log(`========================================`);
  console.log(`[SMS SENT (MOCK)]`);
  console.log(`Provider: MOCK TELEPHONY SMS GATEWAY`);
  console.log(`Recipient: ${cleanPhone}`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Message:\n"${message}"`);
  console.log(`========================================`);

  return {
    success: true,
    provider: 'mock',
    message,
    recipient: cleanPhone,
    timestamp,
  };
}
