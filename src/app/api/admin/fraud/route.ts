import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId, action } = body;

    // Log the Superadmin action in AuditLog
    await prisma.auditLog.create({
      data: {
        action: `FRAUD_ALERT_${action.toUpperCase()}`,
        ipAddress: '127.0.0.1',
        userAgent: 'LeadPoint-Superadmin/1.0',
        metadata: JSON.stringify({
          alertId,
          actionTaken: action,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Fraud alert ${alertId} marked as ${action}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process alert action' },
      { status: 500 }
    );
  }
}
