import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, resolveTenantProfileId } from '@/lib/auth';
import { generateOAuthState, getHubSpotAuthorizationUrl } from '@/lib/hubspot-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      const loginUrl = new URL('/en/login', req.nextUrl.origin);
      loginUrl.searchParams.set('redirect', '/en/settings');
      return NextResponse.redirect(loginUrl);
    }

    const companyProfileId = await resolveTenantProfileId(session);

    // Cryptographically generate state bound to user and companyProfile
    const state = await generateOAuthState(session.id, companyProfileId);

    // Construct HubSpot OAuth authorization URL
    const authUrl = getHubSpotAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error generating HubSpot OAuth authorization URL:', error);
    const settingsUrl = new URL('/en/settings', req.nextUrl.origin);
    settingsUrl.searchParams.set('error', 'hubspot_oauth_init_failed');
    settingsUrl.searchParams.set('message', error.message || 'Failed to initialize HubSpot authorization.');
    return NextResponse.redirect(settingsUrl);
  }
}
