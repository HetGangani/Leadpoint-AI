import { processVoiceAgentTurn } from '@/lib/gemini-voice';
import { AgentTurnRequest, AgentTurnResponse } from '@/types';

export type AIVoiceProviderType = 'mock' | 'real';

/**
 * AI Voice Service Abstraction
 * Handles interactive voice turn processing, intent recognition, human handoff detection, and speech generation setup.
 * Supports AI_VOICE_PROVIDER=mock and AI_VOICE_PROVIDER=real
 */
export class AIVoiceService {
  public static getProvider(): AIVoiceProviderType {
    const provider = (process.env.AI_VOICE_PROVIDER || 'mock').toLowerCase();
    return provider === 'real' ? 'real' : 'mock';
  }

  public static async processTurn(request: AgentTurnRequest): Promise<AgentTurnResponse> {
    const provider = this.getProvider();

    // If real provider configured with API Key, process using Gemini / real AI pipeline
    if (provider === 'real') {
      const apiKey = process.env.AI_VOICE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('AI_VOICE_PROVIDER set to "real" but no AI_VOICE_API_KEY found. Falling back to structured heuristic processor.');
      }
    }

    // Process turn with core conversational AI turn engine
    return processVoiceAgentTurn(request);
  }
}
