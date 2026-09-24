import { CallDisposition } from '@/types';

export interface TelephonyCallRequest {
  leadId: string;
  leadPhoneNumber: string;
  leadName: string;
  companyName: string;
  agentVoiceId?: string;
  customPrompt?: string;
}

export interface TelephonyCallResponse {
  callId: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  disposition?: CallDisposition;
  durationSeconds?: number;
  transcript?: string;
  summary?: string;
  sentiment?: string;
  nextBestAction?: string;
  audioUrl?: string;
}

/**
 * Mock Telephony Connector for AI Voice Calling (Vapi / Retell AI / Twilio)
 */
export async function initiateVoiceCall(request: TelephonyCallRequest): Promise<TelephonyCallResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const mockCallId = `call_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    callId: mockCallId,
    status: 'COMPLETED',
    disposition: CallDisposition.INTERESTED,
    durationSeconds: 124,
    summary: `Outreach call with ${request.leadName} from ${request.companyName} completed successfully. Expressed strong interest in cloud modernization roadmap.`,
    sentiment: 'Positive & Interested',
    nextBestAction: 'Send follow-up calendar invitation and enterprise brochure.',
    audioUrl: `https://storage.leadpoint.ai/recordings/${mockCallId}.mp3`,
    transcript: `[00:00] AI Agent: "Hello ${request.leadName}, this is Alex calling on behalf of CloudScale Solutions..."
[00:15] ${request.leadName}: "Hi Alex! Thanks for calling. We are actually exploring migration options right now."
[00:35] AI Agent: "That is great to hear! Would Thursday at 2 PM work for a 20-minute strategy overview?"
[00:50] ${request.leadName}: "Yes, Thursday at 2 PM works. Please send the link to my email."
[01:05] AI Agent: "Will do! Have a wonderful day!"`,
  };
}

export async function fetchCallStatus(callId: string): Promise<TelephonyCallResponse> {
  return {
    callId,
    status: 'COMPLETED',
    disposition: CallDisposition.INTERESTED,
    durationSeconds: 120,
    summary: 'Mock call completed and processed.',
    sentiment: 'Positive',
    nextBestAction: 'Schedule follow-up',
    audioUrl: `https://storage.leadpoint.ai/recordings/${callId}.mp3`,
  };
}
