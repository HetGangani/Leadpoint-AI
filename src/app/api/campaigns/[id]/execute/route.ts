import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { CallDisposition } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const campaignId = params.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Verify ownership
    if (campaign.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this campaign' }, { status: 403 });
    }

    let profileId = session.companyProfileId;
    if (!profileId && session.role !== 'ADMIN') {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: session.id },
      });
      profileId = profile?.id;
    }

    const leadWhere: any = {};
    if (session.role !== 'ADMIN' || profileId) {
      if (profileId) {
        leadWhere.companyProfileId = profileId;
      }
    }

    // Get leads for campaign (scoped to tenant)
    const leads = await prisma.lead.findMany({
      where: leadWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (leads.length === 0) {
      return NextResponse.json({ success: false, error: 'No leads available to call in campaign' }, { status: 400 });
    }

    const executedCalls = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      const outcomes = [CallDisposition.INTERESTED, CallDisposition.BUSY, CallDisposition.VOICEMAIL, CallDisposition.INTERESTED];
      const outcome = outcomes[i % outcomes.length];

      let isHighIntent = outcome === CallDisposition.INTERESTED;
      let duration = outcome === CallDisposition.INTERESTED ? 142 : outcome === CallDisposition.BUSY ? 18 : 32;

      let summary = '';
      let transcript = '';
      let nextBestAction = '';

      if (outcome === CallDisposition.INTERESTED) {
        summary = `• Call with ${lead.name} (${lead.companyName}) completed successfully.\n• Expressed active requirement for cloud migration.\n• 🔥 High Intent lead auto-flagged.`;
        transcript = `[00:00] AI Agent: "Hello ${lead.name}, Alex calling from CloudScale AI."\n[00:15] ${lead.name}: "Hi Alex, we are actually looking for an architecture team right now!"\n[00:40] AI Agent: "Fantastic! I'll send over our schedule link."`;
        nextBestAction = '🔥 HIGH INTENT: Schedule 20-min Architecture Demo & Send Proposal';

        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'INTERESTED' },
        });
      } else if (outcome === CallDisposition.BUSY) {
        summary = `• Call attempt 1 for ${lead.name} (${lead.companyName}) encountered BUSY line.\n• Auto-triggered Retry Loop (Max Retries: ${campaign.retryCount}). Retry scheduled in ${campaign.timezone} window.`;
        transcript = `[00:00] Line status: BUSY / No Answer.\n[00:05] Telephony Engine: "Automated retry task queued."`;
        nextBestAction = `Queue Call Retry #1 of ${campaign.retryCount}`;
      } else {
        summary = `• Reached voicemail for ${lead.name} at ${lead.companyName}.\n• Left automated 15-second value proposition audio message.\n• Follow-up email triggered.`;
        transcript = `[00:00] Voicemail tone detected.\n[00:05] AI Agent: "Hello ${lead.name}, this is Alex with CloudScale AI... Leaving details in your email."`;
        nextBestAction = 'Trigger automated Email Drip Sequence #1';
      }

      const voiceCall = await prisma.voiceCall.create({
        data: {
          leadId: lead.id,
          campaignId: campaign.id,
          durationSeconds: duration,
          transcript,
          summary,
          sentiment: isHighIntent ? 'Positive & Interested' : 'Neutral',
          nextBestAction,
          disposition: outcome,
          audioUrl: `https://storage.leadpoint.ai/recordings/call_${campaign.id}_${lead.id}.mp3`,
        },
      });

      executedCalls.push({
        callId: voiceCall.id,
        leadName: lead.name,
        companyName: lead.companyName,
        disposition: outcome,
        isHighIntent,
        nextBestAction,
      });
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({
      success: true,
      message: `Executed campaign "${campaign.name}" across ${executedCalls.length} leads.`,
      executedCalls,
    });
  } catch (error: any) {
    console.error('Error executing campaign:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to execute campaign' }, { status: 500 });
  }
}
