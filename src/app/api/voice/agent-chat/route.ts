import { NextRequest, NextResponse } from 'next/server';
import { processVoiceAgentTurn, extractPhoneNumber } from '@/lib/gemini-voice';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSms } from '@/lib/sms-service';
import { resolveCalendlyUrl, generateCalendlySmsMessage } from '@/lib/calendly-service';
import { AgentTurnRequest, AgentTurnResponse } from '@/types';

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

    // Resolve tenant profile ID
    let profileId = session.companyProfileId;
    if (!profileId && session.role !== 'ADMIN') {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: session.id },
      });
      profileId = profile?.id;
    }

    // Fetch company profile to obtain configured Calendly URL and business profile info
    const companyProfile = profileId
      ? await prisma.companyProfile.findUnique({ where: { id: profileId } })
      : await prisma.companyProfile.findFirst();

    // Authoritative target lead verification (scoped strictly to tenant)
    if (!body.leadId) {
      return NextResponse.json(
        { success: false, error: 'A valid leadId is required to start or continue a voice turn.' },
        { status: 400 }
      );
    }

    if (session.role !== 'ADMIN' && !profileId) {
      return NextResponse.json(
        { success: false, error: 'No company profile found for account.' },
        { status: 400 }
      );
    }

    let lead = await prisma.lead.findFirst({
      where: {
        id: body.leadId,
        ...(session.role !== 'ADMIN' ? { companyProfileId: profileId! } : {}),
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: `Lead with ID "${body.leadId}" not found or unauthorized for this account.` },
        { status: 404 }
      );
    }

    // Temporary server-side logging as requested
    const lastUserMessage = [...(body.conversationHistory || [])]
      .reverse()
      .find((m) => m.sender === 'prospect')?.text || body.userUtterance;

    console.log(
      `[VOICE TURN] leadId=${body.leadId || lead?.id || 'none'} userMessage="${body.userUtterance}" historyLength=${body.conversationHistory?.length || 0} lastUserMessage="${lastUserMessage}"`
    );

    // Process turn with Gemini Voice AI Engine
    const targetLeadName = lead.name;
    const targetCompanyName = lead.companyName;

    const turnResponse: AgentTurnResponse = await processVoiceAgentTurn({
      ...body,
      leadId: lead.id,
      leadName: targetLeadName,
      companyName: targetCompanyName,
      clientBusinessProfile: companyProfile
        ? {
            name: companyProfile.name,
            description: companyProfile.description,
          }
        : body.clientBusinessProfile,
    });

    // Check if prospect provided a phone number in this turn
    const extractedPhone = turnResponse.extractedPhone || extractPhoneNumber(body.userUtterance);
    if (extractedPhone && lead) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: { phone: extractedPhone },
      });
    }

    // If turn stage is HUMAN_HANDOFF, perform SMS dispatch & state update
    if (turnResponse.stage === 'HUMAN_HANDOFF') {
      const calendlyUrl = resolveCalendlyUrl({
        profileCalendlyUrl: companyProfile?.calendlyUrl,
      });

      // Retrieve authoritative phone from database record
      const recipientPhone = lead?.phone || extractedPhone || null;

      if (!recipientPhone) {
        turnResponse.replyText = `I would love to send you our booking link, but I don't have a valid mobile phone number on record for you in our system. Could you please confirm your phone number?`;
        turnResponse.smsDetails = {
          sent: false,
          provider: (process.env.SMS_PROVIDER || 'mock') as any,
          status: 'MISSING_PHONE',
          calendlyUrl,
          error: 'No phone number available on lead record.',
        };
      } else {
        const smsMessage = generateCalendlySmsMessage(targetLeadName, calendlyUrl);

        // Execute SMS sending via provider abstraction (Twilio or Mock)
        const smsResult = await sendSms({
          recipientPhone,
          message: smsMessage,
          leadId: lead?.id,
        });

        if (smsResult.success) {
          turnResponse.replyText = `I'd be happy to connect you with our team, ${targetLeadName}! I've sent a booking link to your phone (${recipientPhone}) where you can choose a convenient time to speak with us.`;
          turnResponse.smsDetails = {
            sent: true,
            provider: smsResult.provider,
            recipient: recipientPhone,
            message: smsMessage,
            calendlyUrl,
            status: 'CALENDLY_LINK_SENT',
          };

          // Update DB if lead exists
          if (lead) {
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
        } else {
          turnResponse.replyText = `I apologize, but I encountered an issue sending the booking link to your phone. I'll make a note for our team to follow up with you directly.`;
          turnResponse.smsDetails = {
            sent: false,
            provider: smsResult.provider,
            recipient: recipientPhone,
            calendlyUrl,
            status: 'SMS_FAILED',
            error: smsResult.error || 'Failed to dispatch SMS.',
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: turnResponse,
    });
  } catch (error: any) {
    console.error('Error in agent-chat API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process voice agent turn' },
      { status: 500 }
    );
  }
}
