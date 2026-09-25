import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = (formData.get('CallSid') as string) || '';
    const callStatus = (formData.get('CallStatus') as string) || '';
    const callDuration = formData.get('CallDuration') as string;

    if (!callSid) {
      return NextResponse.json({ success: false, error: 'CallSid missing' }, { status: 400 });
    }

    const durationSeconds = callDuration ? parseInt(callDuration, 10) : undefined;
    const isTerminalStatus = ['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(callStatus.toLowerCase());

    const mappedDisposition =
      callStatus.toLowerCase() === 'busy'
        ? 'BUSY'
        : callStatus.toLowerCase() === 'no-answer'
        ? 'VOICEMAIL'
        : callStatus.toLowerCase() === 'failed'
        ? 'FAILED'
        : undefined;

    await prisma.voiceCall.updateMany({
      where: { providerCallId: callSid },
      data: {
        status: callStatus.toLowerCase(),
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        ...(mappedDisposition ? { disposition: mappedDisposition } : {}),
        ...(isTerminalStatus ? { endedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, callSid, status: callStatus });
  } catch (error: any) {
    console.error('Error in Twilio status webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
