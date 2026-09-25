import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { disconnectHubSpot } from '@/lib/hubspot-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only the authenticated tenant can disconnect their own integration
    await disconnectHubSpot(session.id);

    return NextResponse.json({
      success: true,
      message: 'HubSpot integration disconnected successfully.',
    });
  } catch (error: any) {
    console.error('Error disconnecting HubSpot integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect HubSpot integration' },
      { status: 500 }
    );
  }
}
