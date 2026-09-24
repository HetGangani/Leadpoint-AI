import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLeadsCSV } from '@/lib/lead-service';
import { getSessionUser } from '@/lib/auth';

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

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const industry = searchParams.get('industry');
    const minScore = searchParams.get('minScore');

    const whereClause: any = {};

    if (session.role !== 'ADMIN' || profileId) {
      if (!profileId) {
        return new NextResponse('', {
          status: 200,
          headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        });
      }
      whereClause.companyProfileId = profileId;
    }

    if (platform && platform !== 'ALL') {
      whereClause.sourcePlatform = {
        contains: platform,
      };
    }

    if (industry && industry !== 'ALL') {
      whereClause.industry = {
        contains: industry,
      };
    }

    if (minScore) {
      const parsedScore = parseFloat(minScore);
      if (!isNaN(parsedScore)) {
        whereClause.relevanceScore = {
          gte: parsedScore > 1 ? parsedScore / 100 : parsedScore,
        };
      }
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      orderBy: { relevanceScore: 'desc' },
    });

    const csvContent = generateLeadsCSV(leads);

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="leadpoint_discovered_leads_${Date.now()}.csv"`);

    return new NextResponse(csvContent, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
