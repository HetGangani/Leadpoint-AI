import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { CampaignCreatePayload } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause: any = {};
    if (session.role !== 'ADMIN') {
      whereClause.userId = session.id;
    }

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        voiceCalls: true,
      },
    });

    const formattedCampaigns = campaigns.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      type: c.type,
      status: c.status,
      timezone: c.timezone,
      scheduleCron: c.scheduleCron,
      retryCount: c.retryCount,
      createdAt: c.createdAt,
      voiceCallsCount: c.voiceCalls.length,
      highIntentCount: c.voiceCalls.filter((call) => call.disposition === 'INTERESTED').length,
      unansweredCount: c.voiceCalls.filter((call) => call.disposition === 'BUSY' || call.disposition === 'VOICEMAIL').length,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCampaigns,
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: CampaignCreatePayload = await req.json();

    if (!body.name || !body.type) {
      return NextResponse.json({ success: false, error: 'Campaign name and type are required.' }, { status: 400 });
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        name: body.name.trim(),
        type: body.type,
        scheduleCron: body.scheduleCron || '0 9 * * 1-5',
        timezone: body.timezone || 'America/New_York',
        retryCount: body.retryCount ?? 3,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      data: newCampaign,
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create campaign' }, { status: 500 });
  }
}
