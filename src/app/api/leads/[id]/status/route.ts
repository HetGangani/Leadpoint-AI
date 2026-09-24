import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
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
        action: 'LEAD_STATUS_UPDATED',
        ipAddress: '127.0.0.1',
        userAgent: 'LeadPoint-Kanban/1.0',
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
