import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support standard Calendly payload structure or mock simulation structure
    const inviteeEmail = (body?.payload?.email || body?.inviteeEmail || body?.email || '').toLowerCase().trim();
    const leadId = body?.payload?.tracking?.utm_custom_lead_id || body?.leadId;

    if (!inviteeEmail && !leadId) {
      return NextResponse.json(
        { success: false, error: 'Invitee email or leadId is required to match booking to a lead.' },
        { status: 400 }
      );
    }

    // Find lead by leadId or businessEmail
    let lead = null;
    if (leadId) {
      lead = await prisma.lead.findUnique({ where: { id: leadId } });
    }
    if (!lead && inviteeEmail) {
      lead = await prisma.lead.findFirst({
        where: { businessEmail: inviteeEmail },
      });
    }

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: `No matching lead found for email: "${inviteeEmail}" or ID: "${leadId}".`,
        },
        { status: 404 }
      );
    }

    // Idempotent update: if already BOOKED, return success cleanly
    if (lead.status === 'BOOKED') {
      return NextResponse.json({
        success: true,
        isMock: true,
        alreadyProcessed: true,
        message: `Lead ${lead.id} (${lead.name}) is already marked as BOOKED.`,
        data: {
          leadId: lead.id,
          leadName: lead.name,
          status: 'BOOKED',
          bookedAt: lead.calendlyBookedAt || new Date(),
        },
      });
    }

    const bookedAt = new Date();

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'BOOKED',
        calendlyBookedAt: bookedAt,
        followUpRequired: false,
      },
    });

    // Create Audit Log entry for Calendly booking event
    await prisma.auditLog.create({
      data: {
        action: 'CALENDLY_MEETING_BOOKED',
        metadata: JSON.stringify({
          leadId: lead.id,
          leadName: lead.name,
          businessEmail: lead.businessEmail,
          bookedAt: bookedAt.toISOString(),
          provider: 'calendly_webhook_mock',
        }),
      },
    });

    console.log(`[CALENDLY WEBHOOK (MOCK)] Successfully marked lead ${lead.id} (${lead.name}) as BOOKED.`);

    return NextResponse.json({
      success: true,
      isMock: true,
      message: `Calendly booking webhook processed successfully (MOCK).`,
      data: {
        leadId: updatedLead.id,
        leadName: updatedLead.name,
        businessEmail: updatedLead.businessEmail,
        status: updatedLead.status,
        bookedAt: updatedLead.calendlyBookedAt,
      },
    });
  } catch (error: any) {
    console.error('Error in Calendly webhook route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process Calendly webhook event' },
      { status: 500 }
    );
  }
}
