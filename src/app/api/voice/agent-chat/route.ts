import { NextRequest, NextResponse } from 'next/server';
import { processVoiceAgentTurn } from '@/lib/gemini-voice';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSmsMock } from '@/lib/sms-mock';
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

    // Process turn with Gemini Voice AI Engine
    const turnResponse: AgentTurnResponse = await processVoiceAgentTurn(body);

    // If turn stage is HUMAN_HANDOFF, perform SMS dispatch & state update
    if (turnResponse.stage === 'HUMAN_HANDOFF') {
      let profileId = session.companyProfileId;
      if (!profileId && session.role !== 'ADMIN') {
        const profile = await prisma.companyProfile.findUnique({
          where: { userId: session.id },
        });
        profileId = profile?.id;
      }

      // Fetch company profile to obtain configured Calendly URL
      const companyProfile = profileId
        ? await prisma.companyProfile.findUnique({ where: { id: profileId } })
        : await prisma.companyProfile.findFirst();

      const calendlyUrl = resolveCalendlyUrl({
        profileCalendlyUrl: companyProfile?.calendlyUrl,
      });

      // Find target lead (scoped strictly to tenant)
      let lead = null;
      if (body.leadId) {
        lead = await prisma.lead.findFirst({
          where: {
            id: body.leadId,
            ...(session.role !== 'ADMIN' && profileId ? { companyProfileId: profileId } : {}),
          },
        });
      }

      // Fallback if leadId not specified or simulation mode
      if (!lead && profileId) {
        lead = await prisma.lead.findFirst({
          where: { companyProfileId: profileId },
          orderBy: { createdAt: 'desc' },
        });
      }

      const recipientPhone = lead?.phone || body.clientBusinessProfile?.name ? (lead?.phone || '+1 (800) 555-0199') : null;
      const targetLeadName = lead?.name || body.leadName || 'Prospect';

      if (!recipientPhone) {
        turnResponse.replyText = `I would love to send you our booking link, but I don't have a valid mobile phone number on record for you. Could you please confirm your phone number?`;
        turnResponse.smsDetails = {
          sent: false,
          provider: 'mock',
          status: 'MISSING_PHONE',
          calendlyUrl,
          error: 'No phone number available on lead record.',
        };
      } else {
        const smsMessage = generateCalendlySmsMessage(targetLeadName, calendlyUrl);

        // Execute SMS sending via mock provider
        const smsResult = await sendSmsMock({
          recipientPhone,
          message: smsMessage,
          leadId: lead?.id,
        });

        if (smsResult.success) {
          turnResponse.replyText = `I'd be happy to connect you with our team, ${targetLeadName}! I've sent a link to your phone (${recipientPhone}) where you can choose a convenient time to speak with us.`;
          turnResponse.smsDetails = {
            sent: true,
            provider: 'mock',
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
              },
            });
          }
        } else {
          turnResponse.replyText = `I apologize, but I encountered an issue sending the booking link to your phone. I'll make a note for our team to follow up with you directly.`;
          turnResponse.smsDetails = {
            sent: false,
            provider: 'mock',
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
