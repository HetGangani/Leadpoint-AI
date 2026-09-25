import { isHumanHandoffRequested, processVoiceAgentTurn } from '../lib/gemini-voice';
import { sendSmsMock } from '../lib/sms-mock';
import { resolveCalendlyUrl, generateCalendlySmsMessage } from '../lib/calendly-service';
import { CallDisposition } from '../types';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runCalendlyHandoffTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };

  // 1. Human-handoff keyword detection
  try {
    assert(
      isHumanHandoffRequested('I want to speak with a human SDR please'),
      'Should detect "speak with a human"'
    );
    assert(
      isHumanHandoffRequested('Can you send me a Calendly link?'),
      'Should detect "send me a Calendly link"'
    );
    assert(
      isHumanHandoffRequested('Connect me to an agent right now'),
      'Should detect "connect me to an agent"'
    );
    results.push({ name: 'Human Handoff Intent Detection - Positive Phrases', passed: true });
  } catch (err: any) {
    results.push({ name: 'Human Handoff Intent Detection - Positive Phrases', passed: false, error: err.message });
  }

  // 2. Normal conversation does not trigger handoff
  try {
    assert(
      !isHumanHandoffRequested('What are your company service offerings?'),
      'Normal FAQ should not trigger handoff'
    );
    assert(
      !isHumanHandoffRequested('I spoke with a human yesterday about cloud migration'),
      'Past tense observational sentence should not trigger handoff'
    );
    assert(
      !isHumanHandoffRequested('Is your pricing within our budget?'),
      'Pricing inquiry should not trigger handoff'
    );
    results.push({ name: 'Human Handoff Intent Detection - Negative/Normal Phrases', passed: true });
  } catch (err: any) {
    results.push({ name: 'Human Handoff Intent Detection - Negative/Normal Phrases', passed: false, error: err.message });
  }

  // 3. HUMAN_HANDOFF stage & disposition generation in Voice Turn Processor
  try {
    const turnRes = await processVoiceAgentTurn({
      userUtterance: 'Please transfer me to a real person and text me your Calendly booking link',
      locale: 'en',
      leadName: 'Jane Doe',
      companyName: 'Acme Corp',
    });

    assert(turnRes.stage === 'HUMAN_HANDOFF', `Stage should be HUMAN_HANDOFF, got ${turnRes.stage}`);
    assert(
      turnRes.disposition === CallDisposition.HUMAN_HANDOFF,
      `Disposition should be HUMAN_HANDOFF, got ${turnRes.disposition}`
    );
    assert(turnRes.isHighIntent === true, 'Human handoff should flag high intent');
    assert(turnRes.replyText.includes('booking link'), 'Reply should mention booking link');
    results.push({ name: 'Voice Agent Turn Processor - HUMAN_HANDOFF Stage', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice Agent Turn Processor - HUMAN_HANDOFF Stage', passed: false, error: err.message });
  }

  // 4. Mock SMS Service Success
  try {
    const smsRes = await sendSmsMock({
      recipientPhone: '+1 (415) 890-1234',
      message: 'Thanks for calling! Book here: https://calendly.com/demo/20min',
    });

    assert(smsRes.success === true, 'SMS send should succeed');
    assert(smsRes.provider === 'mock', 'Provider should explicitly be mock');
    assert(smsRes.recipient === '+1 (415) 890-1234', 'Recipient should match input');
    assert(smsRes.message.includes('https://calendly.com'), 'Message content should be preserved');
    results.push({ name: 'Mock SMS Service - Success Execution', passed: true });
  } catch (err: any) {
    results.push({ name: 'Mock SMS Service - Success Execution', passed: false, error: err.message });
  }

  // 5. Mock SMS Service Failure (Missing Phone)
  try {
    const smsRes = await sendSmsMock({
      recipientPhone: '',
      message: 'Booking link',
    });

    assert(smsRes.success === false, 'SMS should fail when recipient phone is empty');
    assert(smsRes.provider === 'mock', 'Provider should identify as mock on failure');
    assert(smsRes.error !== undefined, 'Should include descriptive error message');
    results.push({ name: 'Mock SMS Service - Missing Phone Failure', passed: true });
  } catch (err: any) {
    results.push({ name: 'Mock SMS Service - Missing Phone Failure', passed: false, error: err.message });
  }

  // 6. Calendly URL Resolution & Fallback
  try {
    const customUrl = resolveCalendlyUrl({ profileCalendlyUrl: 'https://calendly.com/custom-profile/demo' });
    assert(customUrl === 'https://calendly.com/custom-profile/demo', 'Should prefer profile Calendly URL');

    const fallbackUrl = resolveCalendlyUrl({});
    assert(fallbackUrl.includes('calendly.com'), 'Should return safe development fallback URL');

    const msg = generateCalendlySmsMessage('Sarah', fallbackUrl);
    assert(msg.includes('Sarah'), 'SMS message should include lead name');
    assert(msg.includes(fallbackUrl), 'SMS message should include Calendly URL');
    results.push({ name: 'Calendly Service - URL Resolution & Message Formatting', passed: true });
  } catch (err: any) {
    results.push({ name: 'Calendly Service - URL Resolution & Message Formatting', passed: false, error: err.message });
  }

  return results;
}
