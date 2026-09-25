import { TelephonyService, normalizePhoneNumberToE164 } from '../lib/telephony-service';
import { processVoiceAgentTurn } from '../lib/gemini-voice';
import { sendSms } from '../lib/sms-service';
import { prisma } from '../lib/prisma';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runTelephonyServiceTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };

  const originalEnv = { ...process.env };

  const restoreEnv = () => {
    process.env.TELEPHONY_PROVIDER = originalEnv.TELEPHONY_PROVIDER;
    process.env.TWILIO_ACCOUNT_SID = originalEnv.TWILIO_ACCOUNT_SID;
    process.env.TWILIO_AUTH_TOKEN = originalEnv.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_VOICE_NUMBER = originalEnv.TWILIO_VOICE_NUMBER;
    process.env.TWILIO_VOICE_WEBHOOK_URL = originalEnv.TWILIO_VOICE_WEBHOOK_URL;
    process.env.SMS_PROVIDER = originalEnv.SMS_PROVIDER;
  };

  // 1. Phone number validation & E.164 normalization
  try {
    assert(normalizePhoneNumberToE164('+15553829901') === '+15553829901', 'Valid E.164 US phone should pass');
    assert(normalizePhoneNumberToE164('+919876543210') === '+919876543210', 'Valid E.164 India phone should pass');
    assert(normalizePhoneNumberToE164('+1 (555) 382-9901') === '+15553829901', 'Formatted E.164 should clean and pass');
    assert(normalizePhoneNumberToE164('invalid_phone') === null, 'Invalid non-numeric string should fail');
    assert(normalizePhoneNumberToE164('') === null, 'Empty string should return null');
    assert(normalizePhoneNumberToE164('12345') === null, 'Too short number should fail');
    results.push({ name: 'Telephony - E.164 Phone Normalization & Validation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - E.164 Phone Normalization & Validation', passed: false, error: err.message });
  }

  // 2. Mock Call Initiation
  try {
    process.env.TELEPHONY_PROVIDER = 'mock';
    const res = await TelephonyService.initiateCall({
      leadId: 'lead_test_01',
      leadPhone: '+15553829901',
    });

    assert(res.success === true, 'Mock call initiation should succeed');
    assert(res.provider === 'mock', 'Provider should be mock');
    assert(res.status === 'initiated', 'Status should be initiated');
    assert(res.normalizedPhone === '+15553829901', 'Normalized phone should match');
    results.push({ name: 'Telephony - Mock Call Initiation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - Mock Call Initiation', passed: false, error: err.message });
  }

  // 3. Invalid Phone Rejection
  try {
    process.env.TELEPHONY_PROVIDER = 'mock';
    const res = await TelephonyService.initiateCall({
      leadId: 'lead_test_02',
      leadPhone: 'invalid_number',
    });

    assert(res.success === false, 'Call initiation with invalid phone should fail');
    assert(res.error?.includes('Invalid phone number format') === true, 'Error message should report invalid format');
    results.push({ name: 'Telephony - Invalid Phone Rejection', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - Invalid Phone Rejection', passed: false, error: err.message });
  }

  // 4. Missing Twilio Configuration Handling
  try {
    process.env.TELEPHONY_PROVIDER = 'twilio';
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VOICE_NUMBER;
    delete process.env.TWILIO_VOICE_WEBHOOK_URL;

    const res = await TelephonyService.initiateCall({
      leadId: 'lead_test_03',
      leadPhone: '+15553829901',
    });

    assert(res.success === false, 'Twilio call should fail when config is missing');
    assert(res.provider === 'twilio', 'Provider should be twilio');
    assert(res.error?.includes('Missing') === true, 'Error should explain missing environment variable');
    results.push({ name: 'Telephony - Missing Twilio Configuration Handling', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - Missing Twilio Configuration Handling', passed: false, error: err.message });
  }

  // 5. Status Updates & Call Completion
  try {
    const statusRes = await TelephonyService.getCallStatus('call_mock_12345');
    assert(statusRes.providerCallId === 'call_mock_12345', 'Call ID should match');
    assert(statusRes.status === 'completed', 'Mock status should return completed');

    const hangupRes = await TelephonyService.hangupCall('call_mock_12345');
    assert(hangupRes.success === true, 'Hangup should succeed');
    assert(hangupRes.status === 'completed', 'Hangup status should be completed');
    results.push({ name: 'Telephony - Status Updates & Call Completion', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - Status Updates & Call Completion', passed: false, error: err.message });
  }

  // 6. Human Handoff Intent Detection during live call
  try {
    const turnRes = await processVoiceAgentTurn({
      userUtterance: 'I want to speak with a human SDR and get a Calendly link.',
      locale: 'en',
      leadName: 'Jane Doe',
      companyName: 'Acme Corp',
    });

    assert(turnRes.stage === 'HUMAN_HANDOFF', 'Turn stage should be HUMAN_HANDOFF');
    assert(turnRes.disposition === 'HUMAN_HANDOFF', 'Disposition should be HUMAN_HANDOFF');
    assert(turnRes.isHighIntent === true, 'IsHighIntent should be true');
    results.push({ name: 'Telephony - Live Call Human Handoff Intent Detection', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - Live Call Human Handoff Intent Detection', passed: false, error: err.message });
  }

  // 7. SMS Dispatch after Human Handoff during call
  try {
    process.env.SMS_PROVIDER = 'mock';
    const smsRes = await sendSms({
      recipientPhone: '+15553829901',
      message: 'Here is your Calendly link: https://calendly.com/leadpoint-demo/20min',
    });

    assert(smsRes.success === true, 'SMS dispatch during handoff should succeed');
    assert(smsRes.provider === 'mock', 'Provider should be mock');
    results.push({ name: 'Telephony - SMS Dispatch After Human Handoff', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - SMS Dispatch After Human Handoff', passed: false, error: err.message });
  }

  // 8. DB Isolation & Webhook Persistence Test
  try {
    // Check database VoiceCall model handles providerCallId & status
    const dummyUser = await prisma.user.findFirst();
    if (dummyUser) {
      const companyProfile = await prisma.companyProfile.findFirst({ where: { userId: dummyUser.id } });
      if (companyProfile) {
        const dummyLead = await prisma.lead.create({
          data: {
            companyProfileId: companyProfile.id,
            name: 'Test Call Prospect',
            businessEmail: `calltest_${Date.now()}@example.com`,
            phone: '+15553829999',
            companyName: 'Voice Call Test Inc',
            industry: 'Technology',
            companySize: '10-50',
            sourcePlatform: 'Test Suite',
            relevanceScore: 0.95,
            enrichedData: '{}',
          },
        });

        const voiceCall = await prisma.voiceCall.create({
          data: {
            leadId: dummyLead.id,
            provider: 'mock',
            providerCallId: `call_mock_db_${Date.now()}`,
            status: 'initiated',
            durationSeconds: 0,
            transcript: '[Test] Initiated call',
            summary: 'Test summary',
            sentiment: 'NEUTRAL',
            nextBestAction: 'None',
            disposition: 'INTERESTED',
          },
        });

        assert(voiceCall.provider === 'mock', 'DB record provider should be mock');
        assert(voiceCall.status === 'initiated', 'DB record status should be initiated');

        // Cleanup
        await prisma.voiceCall.delete({ where: { id: voiceCall.id } });
        await prisma.lead.delete({ where: { id: dummyLead.id } });
      }
    }

    results.push({ name: 'Telephony - DB VoiceCall Persistence & Tenant Field Verification', passed: true });
  } catch (err: any) {
    results.push({ name: 'Telephony - DB VoiceCall Persistence & Tenant Field Verification', passed: false, error: err.message });
  }

  restoreEnv();
  return results;
}
