import { NextRequest, NextResponse } from 'next/server';
import { processVoiceAgentTurn } from '@/lib/gemini-voice';
import { getSessionUser } from '@/lib/auth';
import { AgentTurnRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: AgentTurnRequest = await req.json();

    if (!body.userUtterance && !body.forceDisposition) {
      return NextResponse.json(
        { success: false, error: 'userUtterance or forceDisposition is required.' },
        { status: 400 }
      );
    }

    const response = await processVoiceAgentTurn(body);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error in agent-chat API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process voice agent turn' },
      { status: 500 }
    );
  }
}
