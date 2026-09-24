import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const whereClause: any = {};
    if (session.role !== 'ADMIN' || profileId) {
      if (!profileId) {
        return NextResponse.json({
          success: true,
          data: {
            metrics: {
              totalLeads: 0,
              qualifiedOrInterestedCount: 0,
              conversionRate: 0,
              minutesUsed: 0,
              minutesLimit: 1000,
              channelBreakdown: [],
            },
            kanbanColumns: { NEW: [], QUALIFIED: [], CONTACTED: [], INTERESTED: [], UNRESPONSIVE: [] },
            leads: [],
          },
        });
      }
      whereClause.companyProfileId = profileId;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        voiceCalls: true,
        companyProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalLeads = leads.length;

    const qualifiedOrInterestedCount = leads.filter(
      (l) => l.status === 'QUALIFIED' || l.status === 'INTERESTED'
    ).length;

    const conversionRate = totalLeads > 0
      ? Math.round((qualifiedOrInterestedCount / totalLeads) * 100)
      : 0;

    const subscriptionUsage = await prisma.subscriptionUsage.findFirst({
      where: session.role === 'ADMIN' ? {} : { userId: session.id },
      orderBy: { updatedAt: 'desc' },
    });

    const minutesUsed = subscriptionUsage?.minutesUsed ?? 0;
    const minutesLimit = subscriptionUsage?.minutesLimit ?? 1000;

    const channelCounts: Record<string, number> = {};
    leads.forEach((lead) => {
      const platform = lead.sourcePlatform || 'LinkedIn';
      channelCounts[platform] = (channelCounts[platform] || 0) + 1;
    });

    const channelBreakdown = Object.entries(channelCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
    }));

    const kanbanColumns = {
      NEW: leads.filter((l) => l.status === 'NEW'),
      QUALIFIED: leads.filter((l) => l.status === 'QUALIFIED'),
      CONTACTED: leads.filter((l) => l.status === 'CONTACTED'),
      INTERESTED: leads.filter((l) => l.status === 'INTERESTED'),
      UNRESPONSIVE: leads.filter((l) => l.status === 'UNRESPONSIVE'),
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalLeads,
          qualifiedOrInterestedCount,
          conversionRate,
          minutesUsed,
          minutesLimit,
          channelBreakdown,
        },
        kanbanColumns,
        leads,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch analytics metrics',
      },
      { status: 500 }
    );
  }
}
