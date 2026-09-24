import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json({ success: false, error: 'alertId and action are required.' }, { status: 400 });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: `FRAUD_ALERT_${String(action).toUpperCase()}`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'LeadPoint-Superadmin/1.0',
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
