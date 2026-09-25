import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Standard Calendly API v2 webhook event structure or mock simulation payload
    const eventType = body?.event || 'invitee.created';
    const payload = body?.payload || body;

    // Extract stable identifiers
    const inviteeEmail = (
      payload?.email ||
      payload?.invitee?.email ||
      body?.inviteeEmail ||
      body?.email ||
      ''
    )
      .toLowerCase()
      .trim();

    const inviteeUri =
      payload?.uri ||
      payload?.invitee?.uri ||
      body?.inviteeUri ||
      body?.invitee_uri ||
      null;

    const eventUri =
      payload?.event ||
      payload?.scheduled_event?.uri ||
      body?.eventUri ||
      body?.event_uri ||
      null;

    const leadId =
      payload?.tracking?.utm_custom_lead_id ||
      payload?.tracking?.salesforce_uuid ||
      body?.leadId;

    if (!inviteeEmail && !leadId && !inviteeUri) {
      return NextResponse.json(
        { success: false, error: 'Invitee email, leadId, or invitee URI is required to identify the lead.' },
        { status: 400 }
      );
    }

    // Match lead by leadId or businessEmail
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
          error: `No matching lead found for email: "${inviteeEmail}" or leadId: "${leadId}".`,
        },
        { status: 404 }
      );
    }

    const providerMode = (process.env.CALENDLY_PROVIDER || 'mock').toLowerCase().trim();

    // Idempotency check: If already BOOKED, return 200 OK without duplicating state changes
    if (lead.status === 'BOOKED') {
      return NextResponse.json({
        success: true,
        provider: providerMode,
        alreadyProcessed: true,
        message: `Lead ${lead.id} (${lead.name}) is already marked as BOOKED.`,
        data: {
          leadId: lead.id,
          leadName: lead.name,
          status: 'BOOKED',
          bookedAt: lead.calendlyBookedAt || new Date(),
          inviteeUri: lead.calendlyInviteeUri || inviteeUri,
          eventUri: lead.calendlyEventUri || eventUri,
        },
      });
    }

    const bookedAt = new Date();

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'BOOKED',
        calendlyBookedAt: bookedAt,
        calendlyInviteeUri: inviteeUri || lead.calendlyInviteeUri || null,
        calendlyEventUri: eventUri || lead.calendlyEventUri || null,
        followUpRequired: false,
      },
    });

    // Create Audit Log entry for meeting booking event
    await prisma.auditLog.create({
      data: {
        action: 'CALENDLY_MEETING_BOOKED',
        metadata: JSON.stringify({
          leadId: lead.id,
          leadName: lead.name,
          businessEmail: lead.businessEmail,
          eventType,
          inviteeUri: updatedLead.calendlyInviteeUri,
          eventUri: updatedLead.calendlyEventUri,
          provider: providerMode,
        }),
      },
    });

    console.log(
      `[CALENDLY WEBHOOK (${providerMode.toUpperCase()})] Marked lead ${lead.id} (${lead.name}) as BOOKED. Invitee: ${updatedLead.calendlyInviteeUri || 'N/A'}`
    );

    return NextResponse.json({
      success: true,
      provider: providerMode,
      message: `Calendly booking webhook processed successfully (${providerMode.toUpperCase()}).`,
      data: {
        leadId: updatedLead.id,
        leadName: updatedLead.name,
        businessEmail: updatedLead.businessEmail,
        status: updatedLead.status,
        bookedAt: updatedLead.calendlyBookedAt,
        inviteeUri: updatedLead.calendlyInviteeUri,
        eventUri: updatedLead.calendlyEventUri,
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
