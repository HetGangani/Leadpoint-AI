import { sendSms, sendTwilioSms, validatePhoneNumber } from '../lib/sms-service';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runSmsServiceTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };

  const originalEnv = { ...process.env };

  // Restore env after tests
  const restoreEnv = () => {
    process.env.SMS_PROVIDER = originalEnv.SMS_PROVIDER;
    process.env.TWILIO_ACCOUNT_SID = originalEnv.TWILIO_ACCOUNT_SID;
    process.env.TWILIO_AUTH_TOKEN = originalEnv.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_PHONE_NUMBER = originalEnv.TWILIO_PHONE_NUMBER;
  };

  // 1. Phone number validation
  try {
    assert(validatePhoneNumber('+15553829901').isValid === true, 'Valid phone should pass validation');
    assert(validatePhoneNumber('').isValid === false, 'Empty phone should fail validation');
    results.push({ name: 'SMS Service - Phone Number Validation', passed: true });
  } catch (err: any) {
    results.push({ name: 'SMS Service - Phone Number Validation', passed: false, error: err.message });
  }

  // 2. Mock SMS Provider Fallback
  try {
    process.env.SMS_PROVIDER = 'mock';
    const res = await sendSms({
      recipientPhone: '+1 (555) 382-9901',
      message: 'Test mock message',
    });

    assert(res.success === true, 'Mock SMS dispatch should succeed');
    assert(res.provider === 'mock', 'Provider should be mock');
    assert(res.recipient === '+1 (555) 382-9901', 'Recipient should match');
    results.push({ name: 'SMS Service - Mock Provider Fallback Execution', passed: true });
  } catch (err: any) {
    results.push({ name: 'SMS Service - Mock Provider Fallback Execution', passed: false, error: err.message });
  }

  // 3. Twilio Configuration Missing Error
  try {
    process.env.SMS_PROVIDER = 'twilio';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;

    const res = await sendSms({
      recipientPhone: '+1 (555) 382-9901',
      message: 'Test message',
    });

    assert(res.success === false, 'Twilio dispatch should fail when credentials are missing');
    assert(res.provider === 'twilio', 'Provider should explicitly be twilio');
    assert(res.error?.includes('Missing required environment variables') === true, 'Error should specify missing config');
    results.push({ name: 'SMS Service - Twilio Configuration Missing Handling', passed: true });
  } catch (err: any) {
    results.push({ name: 'SMS Service - Twilio Configuration Missing Handling', passed: false, error: err.message });
  }

  // 4. Twilio Successful Response using Mocked SDK Client
  try {
    process.env.SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC_test_account_sid_12345';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token_67890';
    process.env.TWILIO_PHONE_NUMBER = '+18005550199';

    const mockTwilioClient = {
      messages: {
        create: async (params: { body: string; from: string; to: string }) => {
          assert(params.to === '+1 (555) 382-9901', 'Recipient to field should match');
          assert(params.from === '+18005550199', 'From phone field should match env');
          return { sid: 'SM_mock_twilio_sid_99887766' };
        },
      },
    };

    const res = await sendTwilioSms(
      { recipientPhone: '+1 (555) 382-9901', message: 'Calendly booking link: https://calendly.com' },
      mockTwilioClient
    );

    assert(res.success === true, 'Twilio dispatch with valid client should succeed');
    assert(res.provider === 'twilio', 'Provider should be twilio');
    assert(res.messageId === 'SM_mock_twilio_sid_99887766', 'Message ID should equal SID');
    results.push({ name: 'SMS Service - Twilio Success with Mocked SDK', passed: true });
  } catch (err: any) {
    results.push({ name: 'SMS Service - Twilio Success with Mocked SDK', passed: false, error: err.message });
  }

  // 5. Twilio API Error Normalization & Security (No Secret Leakage)
  try {
    process.env.SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC_test_account_sid_12345';
    process.env.TWILIO_AUTH_TOKEN = 'test_secret_auth_token_DO_NOT_LEAK';
    process.env.TWILIO_PHONE_NUMBER = '+18005550199';

    const mockFailingTwilioClient = {
      messages: {
        create: async () => {
          throw new Error('Twilio API Error 21211: The To number is not a valid phone number.');
        },
      },
    };

    const res = await sendTwilioSms(
      { recipientPhone: '+1000000', message: 'Test message' },
      mockFailingTwilioClient
    );

    assert(res.success === false, 'Twilio dispatch should return success: false on SDK error');
    assert(res.error?.includes('21211') === true, 'Error message should be normalized');
    assert(!res.error?.includes('DO_NOT_LEAK'), 'Error message must not leak credentials');
    results.push({ name: 'SMS Service - Twilio API Error Normalization & Security', passed: true });
  } catch (err: any) {
    results.push({ name: 'SMS Service - Twilio API Error Normalization & Security', passed: false, error: err.message });
  }

  restoreEnv();
  return results;
}
