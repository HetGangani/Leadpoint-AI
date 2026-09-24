import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, sanitizeUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        companyProfile: true,
        subscription: true,
        subscriptionUsage: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User session invalid or user deleted' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        companyProfile: user.companyProfile,
        subscription: user.subscription,
        subscriptionUsage: user.subscriptionUsage,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user session' },
      { status: 500 }
    );
  }
}
