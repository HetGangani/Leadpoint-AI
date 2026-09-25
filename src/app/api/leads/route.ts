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

    // Enforce tenant isolation: non-admins can only see their own company leads
    const whereClause: any = {};
    if (session.role !== 'ADMIN') {
      let profileId = session.companyProfileId;
      if (!profileId) {
        const profile = await prisma.companyProfile.findUnique({
          where: { userId: session.id },
        });
        profileId = profile?.id;
      }
      if (!profileId) {
        return NextResponse.json({ success: true, data: [] });
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
        relevanceScore: 'desc',
      },
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

export async function DELETE(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const { leadIds, filter } = body;

    const { deleteLeadsBulk } = await import('@/lib/lead-service');

    const result = await deleteLeadsBulk({
      leadIds,
      companyProfileId: profileId || undefined,
      isAdmin: session.role === 'ADMIN',
      filter,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} lead(s).`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete leads' },
      { status: 500 }
    );
  }
}

