import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getHubSpotIntegrationStatus } from '@/lib/hubspot-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getHubSpotIntegrationStatus(session.id);
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error fetching HubSpot integration status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve HubSpot status' },
      { status: 500 }
    );
  }
}
