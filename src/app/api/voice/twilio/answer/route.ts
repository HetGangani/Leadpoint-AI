import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const fromNumber = formData.get('From') as string;
    const toNumber = formData.get('To') as string;

    // Update matching VoiceCall in database if present
    if (callSid) {
      await prisma.voiceCall.updateMany({
        where: { providerCallId: callSid },
        data: {
          status: 'answered',
        },
      });
    }

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/voice/twilio/gather',
      method: 'POST',
      timeout: 5,
      speechTimeout: 'auto',
    });

    gather.say(
      { voice: 'Polly.Stephen' as any },
      'Hello! This is Alex calling on behalf of CloudScale AI Solutions. I hope I caught you at a good time. How are you doing today?'
    );

    // Fallback if no speech is detected after timeout
    twiml.say(
      { voice: 'Polly.Stephen' as any },
      "We didn't hear a response. Thank you for your time and have a great day!"
    );
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('Error in Twilio answer webhook:', error);
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say('An error occurred during the call setup. Goodbye!');
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
