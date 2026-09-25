import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TelephonyService, normalizePhoneNumberToE164 } from '@/lib/telephony-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required.' },
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

    // Tenant-scoped Lead query (enforcing tenant isolation)
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ...(session.role !== 'ADMIN' && profileId ? { companyProfileId: profileId } : {}),
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or access denied.' },
        { status: 404 }
      );
    }

    if (!lead.phone) {
      return NextResponse.json(
        { success: false, error: 'Lead does not have a phone number on record.' },
        { status: 400 }
      );
    }

    // Validate and normalize phone number to E.164
    const normalizedPhone = normalizePhoneNumberToE164(lead.phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid phone number format: "${lead.phone}". Phone numbers must be in valid E.164 format (e.g., +15553829901 or +919876543210).`,
        },
        { status: 400 }
      );
    }

    // Initiate call via Telephony Provider Abstraction
    const callResult = await TelephonyService.initiateCall({
      leadId: lead.id,
      leadPhone: normalizedPhone,
    });

    if (!callResult.success) {
      return NextResponse.json(
        {
          success: false,
          provider: callResult.provider,
          error: callResult.error || 'Failed to initiate outbound call.',
        },
        { status: 500 }
      );
    }

    // Persist VoiceCall record
    const voiceCall = await prisma.voiceCall.create({
      data: {
        leadId: lead.id,
        provider: callResult.provider,
        providerCallId: callResult.providerCallId,
        status: callResult.status || 'initiated',
        durationSeconds: 0,
        transcript: `[Initiated] Outbound call requested to ${lead.name} (${normalizedPhone}).`,
        summary: `Outbound AI call initiated to ${lead.name} at ${lead.companyName}.`,
        sentiment: 'NEUTRAL',
        nextBestAction: 'Await lead response on active call line.',
        disposition: 'INTERESTED',
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        callId: voiceCall.id,
        providerCallId: voiceCall.providerCallId,
        provider: voiceCall.provider,
        status: voiceCall.status,
        leadId: lead.id,
        leadName: lead.name,
        phone: normalizedPhone,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/voice/call route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error initiating call' },
      { status: 500 }
    );
  }
}
