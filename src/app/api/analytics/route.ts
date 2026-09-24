import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        voiceCalls: true,
        companyProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalLeads = leads.length;

    // Qualified or Interested leads count
    const qualifiedOrInterestedCount = leads.filter(
      (l) => l.status === 'QUALIFIED' || l.status === 'INTERESTED'
    ).length;

    const conversionRate = totalLeads > 0
      ? Math.round((qualifiedOrInterestedCount / totalLeads) * 100)
      : 0;

    // Fetch subscription usage for voice minutes consumed
    const subscriptionUsage = await prisma.subscriptionUsage.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const minutesUsed = subscriptionUsage?.minutesUsed ?? 145;
    const minutesLimit = subscriptionUsage?.minutesLimit ?? 1000;

    // Channel breakdown
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

    // Group leads by status for Kanban columns
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
