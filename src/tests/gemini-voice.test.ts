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

  // Test 8: Full Multi-Turn Conversation Progression Flow
  try {
    // Turn 1: User asks "What do you need?"
    const turn1 = await processVoiceAgentTurn({
      userUtterance: 'What do you need?',
      locale: 'en',
      leadName: 'Marcus Vance',
      companyName: 'Nexus Financial',
      conversationHistory: [],
    });
    assert(turn1.stage === 'QUALIFYING', 'Initial question should qualify');
    assert(turn1.replyText.includes('timeline'), 'First turn should ask about timeline');

    // Turn 2: User answers "We need it within one week."
    const turn2 = await processVoiceAgentTurn({
      userUtterance: 'We need it within one week.',
      locale: 'en',
      leadName: 'Marcus Vance',
      companyName: 'Nexus Financial',
      conversationHistory: [
        { sender: 'prospect', text: 'What do you need?' },
        { sender: 'agent', text: turn1.replyText },
      ],
    });
    assert(!turn2.replyText.includes('what is your target completion timeline'), 'Must not repeat timeline question');
    assert(turn2.replyText.includes('budget') || turn2.replyText.includes('team size'), 'Must progress to budget/team size');

    // Turn 3: User provides budget "$50,000"
    const turn3 = await processVoiceAgentTurn({
      userUtterance: 'We have $50,000 allocated for this.',
      locale: 'en',
      leadName: 'Marcus Vance',
      companyName: 'Nexus Financial',
      conversationHistory: [
        { sender: 'prospect', text: 'What do you need?' },
        { sender: 'agent', text: turn1.replyText },
        { sender: 'prospect', text: 'We need it within one week.' },
        { sender: 'agent', text: turn2.replyText },
      ],
    });
    assert(turn3.stage === 'INTENT_AFFIRMED', 'Stage should be INTENT_AFFIRMED');
    assert(turn3.replyText.includes('demo') || turn3.replyText.includes('Tuesday or Thursday'), 'Must propose architecture demo');

    // Turn 4: User accepts demo "Thursday at 2 PM works great."
    const turn4 = await processVoiceAgentTurn({
      userUtterance: 'Thursday at 2 PM works great.',
      locale: 'en',
      leadName: 'Marcus Vance',
      companyName: 'Nexus Financial',
      conversationHistory: [
        { sender: 'prospect', text: 'What do you need?' },
        { sender: 'agent', text: turn1.replyText },
        { sender: 'prospect', text: 'We need it within one week.' },
        { sender: 'agent', text: turn2.replyText },
        { sender: 'prospect', text: 'We have $50,000 allocated for this.' },
        { sender: 'agent', text: turn3.replyText },
      ],
    });
    assert(turn4.replyText.includes('Fantastic! I have noted') || turn4.replyText.includes('noted Thursday'), 'Must confirm meeting');
    assert(turn4.isHighIntent === true, 'Meeting confirmation must be high intent');

    results.push({ name: 'Voice SDR - 4-Turn Complete Dynamic Progression Flow', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - 4-Turn Complete Dynamic Progression Flow', passed: false, error: err.message });
  }

  // Test 9: Conversation History Compatibility with role/content format
  try {
    const roleContentResponse = await processVoiceAgentTurn({
      userUtterance: '1 week',
      locale: 'en',
      leadName: 'Samantha Wu',
      companyName: 'OmniRetail',
      conversationHistory: [
        { role: 'assistant', content: 'What is your target completion timeline for this initiative?' } as any,
      ],
    });
    assert(!roleContentResponse.replyText.includes('what is your target completion timeline'), 'Must recognize previous question in role/content format');
    assert(roleContentResponse.replyText.includes('budget') || roleContentResponse.replyText.includes('team size'), 'Must progress to budget');
    results.push({ name: 'Voice SDR - History Schema Compatibility (role/content & sender/text)', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - History Schema Compatibility (role/content & sender/text)', passed: false, error: err.message });
  }

  // Test 10: Part 10 Acceptance Test - No Repetition on "Team of 4 members and budget is 50 lakh"
  try {
    const historyWithBudget = [
      { sender: 'agent' as const, text: 'Hello John! To ensure we tailor the right architecture for Acme Corp, what is your target completion timeline for this initiative?' },
      { sender: 'prospect' as const, text: 'One week.' },
      { sender: 'agent' as const, text: 'Great, One week gives us a clear runway to plan deployment for Acme Corp. To help tailor the right architecture, what is your team size or estimated budget allocated for this initiative?' },
    ];

    const turnResponse = await processVoiceAgentTurn({
      userUtterance: 'Team of 4 members and budget is 50 lakh',
      locale: 'en',
      leadName: 'John Doe',
      companyName: 'Acme Corp',
      conversationHistory: [
        ...historyWithBudget,
        { sender: 'prospect' as const, text: 'Team of 4 members and budget is 50 lakh' },
      ],
    });

    assert(!turnResponse.replyText.toLowerCase().includes('what is your target completion timeline'), 'Must NOT repeat timeline question');
    assert(!turnResponse.replyText.toLowerCase().includes('what is your team size or estimated budget'), 'Must NOT repeat budget/team size question');
    assert(turnResponse.replyText.toLowerCase().includes('demo') || turnResponse.replyText.toLowerCase().includes('tuesday or thursday'), 'Must propose architecture demo');
    assert(turnResponse.stage === 'INTENT_AFFIRMED', 'Stage must be INTENT_AFFIRMED');
    assert(turnResponse.isHighIntent === true, 'Must flag high intent');

    results.push({ name: 'Voice SDR - Part 10 Non-Repeating Budget Response Test', passed: true });
  } catch (err: any) {
    results.push({ name: 'Voice SDR - Part 10 Non-Repeating Budget Response Test', passed: false, error: err.message });
  }

  return results;
}
