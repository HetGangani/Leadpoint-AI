import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { deleteLeadById } from '@/lib/lead-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        voiceCalls: true,
        companyProfile: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    await deleteLeadById(id, profileId || undefined, session.role === 'ADMIN');

    return NextResponse.json({
      success: true,
      message: 'Lead and associated records deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
