import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { AIVoiceService } from '@/lib/ai-voice-service';
import { sendSms } from '@/lib/sms-service';
import { resolveCalendlyUrl, generateCalendlySmsMessage } from '@/lib/calendly-service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = (formData.get('CallSid') as string) || '';
    const speechResult = (formData.get('SpeechResult') as string) || '';

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    if (!speechResult.trim()) {
      const gather = twiml.gather({
        input: ['speech'],
        action: '/api/voice/twilio/gather',
        method: 'POST',
        timeout: 5,
        speechTimeout: 'auto',
      });
      gather.say({ voice: 'Polly.Stephen' as any }, "I'm sorry, I didn't catch that. Could you please repeat?");
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    // Find VoiceCall record by CallSid
    const voiceCall = await prisma.voiceCall.findFirst({
      where: { providerCallId: callSid },
      include: {
        lead: {
          include: {
            companyProfile: true,
          },
        },
      },
    });

    const lead = voiceCall?.lead;
    const companyProfile = lead?.companyProfile;
    const leadName = lead?.name || 'Prospect';
    const companyName = lead?.companyName || 'Target Enterprise';

    // Process turn with AI Voice Engine
    const turnResponse = await AIVoiceService.processTurn({
      leadId: lead?.id,
      leadName,
      companyName,
      userUtterance: speechResult,
      locale: 'en',
      clientBusinessProfile: companyProfile
        ? {
            name: companyProfile.name,
            description: companyProfile.description,
          }
        : undefined,
    });

    // Handle Human Handoff Intent during live phone call
    if (turnResponse.stage === 'HUMAN_HANDOFF' && lead) {
      const calendlyUrl = resolveCalendlyUrl({
        profileCalendlyUrl: companyProfile?.calendlyUrl,
      });

      const recipientPhone = lead.phone || null;
      if (recipientPhone) {
        const smsMessage = generateCalendlySmsMessage(leadName, calendlyUrl);
        const smsResult = await sendSms({
          recipientPhone,
          message: smsMessage,
          leadId: lead.id,
        });

        if (smsResult.success) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: 'CALENDLY_SENT',
              calendlySentAt: new Date(),
              smsProvider: smsResult.provider,
              smsMessageId: smsResult.messageId || null,
            },
          });
        }
      }
    }

    // Persist turn to VoiceCall record in DB if voiceCall exists
    if (voiceCall) {
      const updatedTranscript = `${voiceCall.transcript}\n[Lead]: ${speechResult}\n[AI]: ${turnResponse.replyText}`;
      await prisma.voiceCall.update({
        where: { id: voiceCall.id },
        data: {
          transcript: updatedTranscript,
          disposition: turnResponse.disposition,
          sentiment: turnResponse.sentiment,
          nextBestAction: turnResponse.nextSuggestedStep,
        },
      });
    }

    // If human handoff or call conclusion, reply and hang up
    if (turnResponse.stage === 'HUMAN_HANDOFF' || turnResponse.disposition === 'HUMAN_HANDOFF') {
      twiml.say({ voice: 'Polly.Stephen' as any }, turnResponse.replyText);
      twiml.hangup();
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
    }

    // Continue interactive turn-taking conversation
    const gather = twiml.gather({
      input: ['speech'],
      action: '/api/voice/twilio/gather',
      method: 'POST',
      timeout: 5,
      speechTimeout: 'auto',
    });

    gather.say({ voice: 'Polly.Stephen' as any }, turnResponse.replyText);

    // Fallback if prospect stays silent after turn response
    twiml.say({ voice: 'Polly.Stephen' as any }, 'Thank you for speaking with us. Have a wonderful day!');
    twiml.hangup();

    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  } catch (error: any) {
    console.error('Error in Twilio gather webhook:', error);
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'Polly.Stephen' as any }, "Thank you for your time. Good bye!");
    twiml.hangup();

    return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } });
  }
}
