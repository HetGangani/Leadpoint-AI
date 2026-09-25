import { buildVoiceAgentSystemPrompt, processVoiceAgentTurn } from '../lib/gemini-voice';
import { CallDisposition } from '../types';

export async function runGeminiVoiceTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      throw new Error(`Assertion Failed: ${message}`);
    }
  };

  // Test 1: System Prompt Builder with Localization
  try {
    const promptEN = buildVoiceAgentSystemPrompt(
      { name: 'CloudScale AI', description: 'Enterprise Modernization', offerings: ['M365 Migration'] },
      { name: 'Sarah Connor', companyName: 'Cyberdyne Systems' },
      'en'
    );
    assert(promptEN.includes('CloudScale AI'), 'Prompt should include client company name');
    assert(promptEN.includes('Sarah Connor'), 'Prompt should include prospect lead name');
    assert(promptEN.includes('Cyberdyne Systems'), 'Prompt should include prospect company name');
    assert(promptEN.includes('English'), 'Prompt should specify English language requirement');

    const promptES = buildVoiceAgentSystemPrompt(
      { name: 'CloudScale AI', description: 'Enterprise Modernization' },
      { name: 'Carlos Ruiz', companyName: 'Innovatech' },
      'es'
    );
    assert(promptES.includes('Spanish (Español)'), 'Prompt should specify Spanish language for locale es');
    results.push({ name: 'Voice SDR - System Prompt Builder & Localization', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - System Prompt Builder & Localization', passed: false, error: err.message });
  }

  // Test 2: Forced Dispositions (Busy & Voicemail)
  try {
    const busyTurn = await processVoiceAgentTurn({
      userUtterance: '',
      locale: 'en',
      forceDisposition: 'BUSY',
      leadName: 'Victoria Vance',
      companyName: 'Quantum Logistics',
    });
    assert(busyTurn.stage === 'BUSY_CALLBACK', 'Busy call should return BUSY_CALLBACK stage');
    assert(busyTurn.disposition === CallDisposition.BUSY, 'Busy call should return CallDisposition.BUSY');
    assert(busyTurn.isHighIntent === false, 'Busy call should not be high intent');

    const vmTurn = await processVoiceAgentTurn({
      userUtterance: '',
      locale: 'en',
      forceDisposition: 'VOICEMAIL',
      leadName: 'Alex Wright',
      companyName: 'Horizon Fintech',
    });
    assert(vmTurn.stage === 'VOICEMAIL_LEFT', 'Voicemail call should return VOICEMAIL_LEFT stage');
    assert(vmTurn.disposition === CallDisposition.VOICEMAIL, 'Voicemail call should return CallDisposition.VOICEMAIL');
    results.push({ name: 'Voice SDR - Forced Disposition Handlers (Busy & Voicemail)', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - Forced Disposition Handlers (Busy & Voicemail)', passed: false, error: err.message });
  }

  // Test 3: High-Intent Detection & Next-Best-Action Recommendation
  try {
    const intentTurn = await processVoiceAgentTurn({
      userUtterance: 'Yes, we are very interested and budget is approved! Can we schedule a demo?',
      locale: 'en',
      leadName: 'David Miller',
      companyName: 'Apex Capital',
    });

    assert(intentTurn.isHighIntent === true, 'Utterance with budget approved & schedule demo should set isHighIntent to true');
    assert(intentTurn.stage === 'INTENT_AFFIRMED', 'High intent should map to INTENT_AFFIRMED stage');
    assert(intentTurn.sentiment === 'POSITIVE', 'High intent sentiment should be POSITIVE');
    assert(intentTurn.nextSuggestedStep.includes('Auto-flagged Lead as HIGH INTENT'), 'Next best action should suggest calendar booking');

    // Multilingual Intent Detection (Spanish)
    const esIntentTurn = await processVoiceAgentTurn({
      userUtterance: 'Sí, estoy muy interesado en la demostración',
      locale: 'es',
      leadName: 'Juan Perez',
      companyName: 'TechLatam',
    });
    assert(esIntentTurn.isHighIntent === true, 'Spanish utterance with "interesado" and "demostración" should set isHighIntent');
    results.push({ name: 'Voice SDR - Intent Detection & Next-Best-Action Generator', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - Intent Detection & Next-Best-Action Generator', passed: false, error: err.message });
  }

  // Test 4: Objection & FAQ Turn Classification
  try {
    const objectionTurn = await processVoiceAgentTurn({
      userUtterance: 'This sounds too expensive and we already have a vendor.',
      locale: 'en',
      leadName: 'Elena Gilbert',
    });
    assert(objectionTurn.stage === 'OBJECTION', 'Objection keywords should classify as OBJECTION stage');
    assert(objectionTurn.nextSuggestedStep.includes('ROI case study'), 'Objection next action should recommend ROI case study');

    const faqTurn = await processVoiceAgentTurn({
      userUtterance: 'What services and offerings do you provide?',
      locale: 'en',
      leadName: 'Gregory Cole',
    });
    assert(faqTurn.stage === 'FAQ', 'Services inquiry should classify as FAQ stage');
    results.push({ name: 'Voice SDR - Objection Handling & FAQ Classifier', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - Objection Handling & FAQ Classifier', passed: false, error: err.message });
  }

  // Test 5: Phone Number Extraction
  try {
    const { extractPhoneNumber } = await import('../lib/gemini-voice');
    assert(extractPhoneNumber('7861097967') === '+17861097967', 'Standard 10-digit should format to +17861097967');
    assert(extractPhoneNumber('+1-786-109-7967') === '+17861097967', 'Formatted US phone should normalize');
    assert(extractPhoneNumber('+919876543210') === '+919876543210', 'India phone should normalize');
    assert(extractPhoneNumber('no phone number here') === null, 'Non-phone should return null');
    results.push({ name: 'Voice SDR - Phone Number Extraction & Normalization', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - Phone Number Extraction & Normalization', passed: false, error: err.message });
  }

  // Test 6: Multi-Turn Conversation Progression (No Repeated Questions)
  try {
    // Turn 1: AI asked timeline question
    const turn1History = [
      { sender: 'agent' as const, text: 'Thanks for sharing that, Sarah Jenkins. To ensure we tailor the right architecture for Apex Cloud Solutions, what is your target completion timeline for this initiative?' }
    ];

    // Prospect answers: "1 week"
    const turn2Response = await processVoiceAgentTurn({
      userUtterance: '1 week',
      locale: 'en',
      leadName: 'Sarah Jenkins',
      companyName: 'Apex Cloud Solutions',
      conversationHistory: turn1History,
    });

    assert(!turn2Response.replyText.includes('what is your target completion timeline'), 'AI must NOT repeat the timeline question');
    assert(turn2Response.replyText.includes('budget') || turn2Response.replyText.includes('team size'), 'AI should progress to budget/team question');
    results.push({ name: 'Voice SDR - Multi-Turn Non-Repeating Progression', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - Multi-Turn Non-Repeating Progression', passed: false, error: err.message });
  }

  // Test 7: Phone Response after Missing Phone Prompt
  try {
    const handoffPromptHistory = [
      { sender: 'agent' as const, text: "I would love to send you our booking link, but I don't have a valid mobile phone number on record for you. Could you please confirm your phone number?" }
    ];

    const phoneReply = await processVoiceAgentTurn({
      userUtterance: '7861097967',
      locale: 'en',
      leadName: 'Sarah Jenkins',
      companyName: 'Apex Cloud Solutions',
      conversationHistory: handoffPromptHistory,
    });

    assert(phoneReply.stage === 'HUMAN_HANDOFF', 'Phone reply to missing phone prompt should trigger HUMAN_HANDOFF');
    assert(phoneReply.extractedPhone === '+17861097967', 'Phone should be extracted');
    assert(phoneReply.replyText.includes('+17861097967'), 'Reply text should confirm phone number');
    results.push({ name: 'Voice SDR - Phone Response During Handoff', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - Phone Response During Handoff', passed: false, error: err.message });
  }

  return results;
}
