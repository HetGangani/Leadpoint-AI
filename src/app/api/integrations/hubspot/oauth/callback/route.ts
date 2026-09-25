import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, resolveTenantProfileId } from '@/lib/auth';
import {
  validateOAuthState,
  exchangeCodeForTokens,
  introspectHubSpotToken,
  saveHubSpotConnection,
} from '@/lib/hubspot-service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const settingsUrl = new URL('/en/settings', req.nextUrl.origin);

  // 1. Handle OAuth provider denial or error
  if (errorParam) {
    console.warn(`[HubSpot OAuth Error] ${errorParam}: ${errorDescription}`);
    settingsUrl.searchParams.set('error', 'oauth_denied');
    settingsUrl.searchParams.set(
      'message',
      errorDescription || 'HubSpot authorization was denied or cancelled.'
    );
    return NextResponse.redirect(settingsUrl);
  }

  // 2. Validate presence of code and state
  if (!code || !state) {
    settingsUrl.searchParams.set('error', 'missing_parameters');
    settingsUrl.searchParams.set('message', 'Authorization code or state parameter missing from callback.');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    // 3. Verify user session
    const session = await getSessionUser(req);
    if (!session) {
      // If session is absent, state verification will still fail if attempted without user
      const loginUrl = new URL('/en/login', req.nextUrl.origin);
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    const companyProfileId = await resolveTenantProfileId(session);

    // 4. Validate cryptographic OAuth state and verify tenant/user binding
    const validatedState = await validateOAuthState(state, session.id, companyProfileId);

    // 5. Exchange authorization code for access and refresh tokens
    const tokens = await exchangeCodeForTokens(code);

    // 6. Retrieve connected portal metadata using current introspection endpoint
    let portalId: string | number | undefined = tokens.hubId;
    if (!portalId) {
      const introspection = await introspectHubSpotToken(tokens.accessToken, 'access_token');
      if (introspection?.hubId) {
        portalId = introspection.hubId;
      } else if (process.env.HUBSPOT_ACCOUNT_ID) {
        portalId = process.env.HUBSPOT_ACCOUNT_ID;
      }
    }

    // 7. Persist integration using existing Account model with AES-256-GCM encrypted tokens
    await saveHubSpotConnection({
      userId: session.id,
      tokens,
      portalId: portalId || 'connected',
    });

    // 8. Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'HUBSPOT_INTEGRATION_CONNECTED',
        timestamp: new Date(),
        metadata: JSON.stringify({
          provider: 'hubspot',
          portalId: String(portalId || 'unknown'),
          connectedAt: new Date().toISOString(),
        }),
      },
    });

    console.log(`[HubSpot OAuth] Successfully connected account ${portalId} for user ${session.id}`);

    settingsUrl.searchParams.set('success', 'hubspot_connected');
    if (portalId) {
      settingsUrl.searchParams.set('account', String(portalId));
    }
    return NextResponse.redirect(settingsUrl);
  } catch (error: any) {
    console.error('Error during HubSpot OAuth callback execution:', error);
    settingsUrl.searchParams.set('error', 'oauth_callback_failed');
    settingsUrl.searchParams.set(
      'message',
      error.message || 'An error occurred while completing HubSpot authentication.'
    );
    return NextResponse.redirect(settingsUrl);
  }
}
