import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, resolveTenantProfileId } from '@/lib/auth';

export async function PATCH(
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

    const leadId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Verify lead existence and tenant isolation
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (session.role !== 'ADMIN') {
      const profileId = await resolveTenantProfileId(session);
      if (!profileId || existingLead.companyProfileId !== profileId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Access denied to lead belonging to another tenant' },
          { status: 403 }
        );
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { status },
      include: {
        voiceCalls: true,
      },
    });

    // Create Audit Log entry for lead status change
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'LEAD_STATUS_UPDATED',
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'LeadPoint-Kanban/1.0',
        metadata: JSON.stringify({
          leadId,
          leadName: updatedLead.name,
          newStatus: status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLead,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update lead status',
      },
      { status: 500 }
    );
  }
}

