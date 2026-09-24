import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VoiceCallWebhookPayload, CallDisposition, CallWebhookResult } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: VoiceCallWebhookPayload = await req.json();

    const { leadId, campaignId, durationSeconds, transcript, audioUrl, manualDisposition } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required.' }, { status: 400 });
    }

    // Fetch lead details from Prisma
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: `Lead with ID ${leadId} not found.` }, { status: 404 });
    }

    // Format transcript string
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

    // Affirmation keywords for auto-flagging High Intent
    const affirmationKeywords = [
      'yes', 'interested', 'budget approved', 'start next month', 'schedule a demo',
      'send proposal', 'send contract', 'we need this', 'looking for vendor', 'hire us',
      'si', 'interesado', 'demostración', 'presupuesto', 'ja', 'interessiert', 'termin',
      'हाँ', 'दिलचस्प', 'बजट', 'डेमो', 'oui', 'intéressé', 'démonstration', 'devis',
      'requirement affirmed', 'affirm project requirement'
    ];

    const isAffirmed = affirmationKeywords.some(kw => fullTranscriptLower.includes(kw));

    // Determine Call Disposition
    let disposition: CallDisposition = manualDisposition || CallDisposition.INTERESTED;

    if (isAffirmed) {
      disposition = CallDisposition.INTERESTED;
    } else if (fullTranscriptLower.includes('busy') || fullTranscriptLower.includes('call back')) {
      disposition = CallDisposition.BUSY;
    } else if (fullTranscriptLower.includes('voicemail')) {
      disposition = CallDisposition.VOICEMAIL;
    }

    // Determine Sentiment
    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    if (isAffirmed || disposition === CallDisposition.INTERESTED) {
      sentiment = 'POSITIVE';
    } else if (fullTranscriptLower.includes('not interested') || fullTranscriptLower.includes('too expensive')) {
      sentiment = 'NEGATIVE';
    }

    // Auto-flag Lead Status in DB if prospect affirmed project requirement
    let updatedLeadStatus = lead.status;
    let isHighIntentFlagged = false;

    if (isAffirmed || disposition === CallDisposition.INTERESTED) {
      isHighIntentFlagged = true;
      updatedLeadStatus = 'INTERESTED';

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'INTERESTED',
        },
      });
    }

    // Generate bulleted summary
    const summaryBulletPoints = [
      `• Executed voice discovery call with ${lead.name} (${lead.companyName}, ${lead.industry}).`,
      isAffirmed
        ? `• 🔥 Prospect explicitly affirmed project requirements and requested next steps.`
        : `• Explored cloud modernization roadmap & qualified timeline.`,
      disposition === CallDisposition.BUSY
        ? `• Line busy / call requested callback. SDR callback scheduled.`
        : disposition === CallDisposition.VOICEMAIL
        ? `• Automated voicemail left with enterprise value proposition.`
        : `• Call completed with ${sentiment.toLowerCase()} engagement level.`
    ];

    const summaryText = summaryBulletPoints.join('\n');

    // Determine Next Best Action
    let nextBestAction = 'Send follow-up introduction email with company overview deck.';
    if (isAffirmed) {
      nextBestAction = '🔥 HIGH INTENT: Send calendar invite for 20-min Solution Architecture Demo & draft preliminary proposal.';
    } else if (disposition === CallDisposition.BUSY) {
      nextBestAction = 'Schedule priority SDR callback in 4 hours.';
    } else if (disposition === CallDisposition.VOICEMAIL) {
      nextBestAction = 'Trigger automated Email Drip Sequence #1 for unreached prospects.';
    }

    // Write VoiceCall log to Database
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
      { error: error.message || 'Failed to process voice call webhook' },
      { status: 500 }
    );
  }
}
