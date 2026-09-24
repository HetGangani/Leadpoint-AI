import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CampaignCreatePayload } from '@/types';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
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
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CampaignCreatePayload = await req.json();

    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'Campaign name and type are required.' }, { status: 400 });
    }

    // Default to first user in database
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No default user found in system.' }, { status: 500 });
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: body.name,
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
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 });
  }
}
