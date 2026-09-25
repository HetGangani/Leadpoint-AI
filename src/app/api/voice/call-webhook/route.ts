import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isHumanHandoffRequested } from '@/lib/gemini-voice';
import { VoiceCallWebhookPayload, CallDisposition, CallWebhookResult } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: VoiceCallWebhookPayload = await req.json();
    const { leadId, campaignId, durationSeconds, transcript, audioUrl, manualDisposition } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required.' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: `Lead with ID ${leadId} not found.` }, { status: 404 });
    }

    // Tenant authorization check
    let profileId = session.companyProfileId;
    if (!profileId && session.role !== 'ADMIN') {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: session.id },
      });
      profileId = profile?.id;
    }

    if (session.role !== 'ADMIN' && lead.companyProfileId !== profileId) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to lead belonging to another tenant' }, { status: 403 });
    }

    let formattedTranscript = '';
    let rawTextArray: string[] = [];

    if (Array.isArray(transcript)) {
      rawTextArray = transcript.map(t => t.text);
      formattedTranscript = transcript
        .map(t => `[${t.timestamp || '00:00'}] ${t.speaker === 'agent' ? 'AI Agent' : lead.name}: "${t.text}"`)
        .join('\n');
    } else if (typeof transcript === 'string') {
      formattedTranscript = transcript;
      rawTextArray = [transcript];
    } else {
      formattedTranscript = 'Transcript unavailable.';
    }

    const fullTranscriptLower = rawTextArray.join(' ').toLowerCase();

    const affirmationKeywords = [
      'yes', 'interested', 'budget approved', 'start next month', 'schedule a demo',
      'send proposal', 'send contract', 'we need this', 'looking for vendor', 'hire us',
      'si', 'interesado', 'demostración', 'presupuesto', 'ja', 'interessiert', 'termin',
      'हाँ', 'दिलचस्प', 'बजट', 'डेमो', 'oui', 'intéressé', 'démonstration', 'devis',
      'requirement affirmed', 'affirm project requirement'
    ];

    const isHumanHandoff = isHumanHandoffRequested(fullTranscriptLower) || manualDisposition === CallDisposition.HUMAN_HANDOFF;
    const isAffirmed = !isHumanHandoff && affirmationKeywords.some(kw => fullTranscriptLower.includes(kw));

    let disposition: CallDisposition = manualDisposition || CallDisposition.INTERESTED;

    if (isHumanHandoff) {
      disposition = CallDisposition.HUMAN_HANDOFF;
    } else if (isAffirmed) {
      disposition = CallDisposition.INTERESTED;
    } else if (fullTranscriptLower.includes('busy') || fullTranscriptLower.includes('call back')) {
      disposition = CallDisposition.BUSY;
    } else if (fullTranscriptLower.includes('voicemail')) {
      disposition = CallDisposition.VOICEMAIL;
    }

    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (isHumanHandoff || isAffirmed || disposition === CallDisposition.INTERESTED) {
      sentiment = 'POSITIVE';
    } else if (fullTranscriptLower.includes('not interested') || fullTranscriptLower.includes('too expensive')) {
      sentiment = 'NEGATIVE';
    }

    let updatedLeadStatus = lead.status;
    let isHighIntentFlagged = false;

    if (isHumanHandoff) {
      isHighIntentFlagged = true;
      updatedLeadStatus = 'CALENDLY_SENT';

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'CALENDLY_SENT',
          calendlySentAt: lead.calendlySentAt || new Date(),
        },
      });
    } else if (isAffirmed || disposition === CallDisposition.INTERESTED) {
      isHighIntentFlagged = true;
      updatedLeadStatus = 'INTERESTED';

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'INTERESTED',
        },
      });
    }

    const summaryBulletPoints = [
      `• Executed voice discovery call with ${lead.name} (${lead.companyName}, ${lead.industry}).`,
      isHumanHandoff
        ? `• 📱 Prospect requested Human Handoff / SDR interaction. Calendly SMS link dispatched.`
        : isAffirmed
        ? `• 🔥 Prospect explicitly affirmed project requirements and requested next steps.`
        : `• Explored cloud modernization roadmap & qualified timeline.`,
      disposition === CallDisposition.BUSY
        ? `• Line busy / call requested callback. SDR callback scheduled.`
        : disposition === CallDisposition.VOICEMAIL
        ? `• Automated voicemail left with enterprise value proposition.`
        : `• Call completed with ${sentiment.toLowerCase()} engagement level.`
    ];

    const summaryText = summaryBulletPoints.join('\n');

    let nextBestAction = 'Send follow-up introduction email with company overview deck.';
    if (isHumanHandoff) {
      nextBestAction = '📱 HUMAN HANDOFF: Calendly SMS dispatched. Await lead booking or trigger follow-up if unbooked.';
    } else if (isAffirmed) {
      nextBestAction = '🔥 HIGH INTENT: Send calendar invite for 20-min Solution Architecture Demo & draft preliminary proposal.';
    } else if (disposition === CallDisposition.BUSY) {
      nextBestAction = 'Schedule priority SDR callback in 4 hours.';
    } else if (disposition === CallDisposition.VOICEMAIL) {
      nextBestAction = 'Trigger automated Email Drip Sequence #1 for unreached prospects.';
    }

    const voiceCall = await prisma.voiceCall.create({
      data: {
        leadId,
        campaignId: campaignId || null,
        durationSeconds: durationSeconds || 60,
        transcript: formattedTranscript,
        summary: summaryText,
        sentiment: sentiment === 'POSITIVE' ? 'Positive & Interested' : sentiment === 'NEGATIVE' ? 'Unfavorable / Objected' : 'Neutral',
        nextBestAction,
        disposition,
        audioUrl: audioUrl || `https://storage.leadpoint.ai/recordings/call_${Date.now()}.mp3`,
      },
    });

    const result: CallWebhookResult = {
      callId: voiceCall.id,
      leadId: lead.id,
      leadName: lead.name,
      companyName: lead.companyName,
      status: updatedLeadStatus,
      sentiment,
      disposition,
      isHighIntentFlagged,
      summaryBulletPoints,
      nextBestAction,
      structuredTranscript: formattedTranscript,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/voice/call-webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process voice call webhook' },
      { status: 500 }
    );
  }
}
