import { NextResponse } from 'next/server';
import { harvestPublicRequirements } from '@/lib/lead-service';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let profileId = session.companyProfileId;
    if (!profileId) {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: session.id },
      });
      profileId = profile?.id;
    }

    const body = await request.json().catch(() => ({}));
    const { platform, keywords, industry, customUrl } = body;

    const harvested = await harvestPublicRequirements({
      platform,
      keywords,
      industry,
      customUrl,
    });

    const whereClause = profileId ? { companyProfileId: profileId } : {};

    const allLeads = await prisma.lead.findMany({
      where: whereClause,
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

export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let profileId = session.companyProfileId;
    if (!profileId && session.role !== 'ADMIN') {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: session.id },
      });
      profileId = profile?.id;
    }

    const whereClause: any = {};
    if (session.role !== 'ADMIN') {
      if (!profileId) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause.companyProfileId = profileId;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
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
