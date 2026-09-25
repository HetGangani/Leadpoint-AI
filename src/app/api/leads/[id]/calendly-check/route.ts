import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const leadId = params.id;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Tenant isolation verification
    let profileId = session.companyProfileId;
    if (!profileId && session.role !== 'ADMIN') {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: session.id },
      });
      profileId = profile?.id;
    }

    if (session.role !== 'ADMIN' && lead.companyProfileId !== profileId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access denied to lead belonging to another tenant' },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const forceFlagFollowUp = searchParams.get('flagFollowUp') === 'true';

    let currentStatus = lead.status;
    let isFollowUpRequired = lead.followUpRequired;

    // If CALENDLY_SENT and flagged for follow-up evaluation
    if (currentStatus === 'CALENDLY_SENT' && forceFlagFollowUp) {
      currentStatus = 'FOLLOW_UP_REQUIRED';
      isFollowUpRequired = true;

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 'FOLLOW_UP_REQUIRED',
          followUpRequired: true,
          followUpScheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Schedule follow-up in 2 hours
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        leadName: lead.name,
        companyName: lead.companyName,
        status: currentStatus,
        isBooked: currentStatus === 'BOOKED',
        calendlySentAt: lead.calendlySentAt,
        calendlyBookedAt: lead.calendlyBookedAt,
        followUpRequired: isFollowUpRequired,
        followUpScheduledAt: lead.followUpScheduledAt,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/leads/[id]/calendly-check:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check Calendly status' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return GET(req, { params });
}
