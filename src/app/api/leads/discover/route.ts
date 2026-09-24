import { NextResponse } from 'next/server';
import { harvestPublicRequirements } from '@/lib/lead-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { platform, keywords, industry } = body;

    const harvested = await harvestPublicRequirements({
      platform,
      keywords,
      industry,
    });

    // Also fetch current leads in system to return updated state
    const allLeads = await prisma.lead.findMany({
      orderBy: { relevanceScore: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully harvested ${harvested.length} new high-intent lead postings across platforms.`,
      newLeadsCount: harvested.length,
      newLeads: harvested,
      allLeads,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to harvest public lead requirements' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { relevanceScore: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
