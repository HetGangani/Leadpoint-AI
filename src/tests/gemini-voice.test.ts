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

  return results;
}
