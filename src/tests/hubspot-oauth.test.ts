import {
  encryptToken,
  decryptToken,
  generateOAuthState,
  validateOAuthState,
  getHubSpotAuthorizationUrl,
  exchangeCodeForTokens,
  introspectHubSpotToken,
  fetchTokenInfo,
  refreshHubSpotToken,
  saveHubSpotConnection,
  getHubSpotIntegrationStatus,
  disconnectHubSpot,
  HUBSPOT_OAUTH_TOKEN_URL,
  HUBSPOT_OAUTH_INTROSPECT_URL,
} from '../lib/hubspot-service';
import { prisma } from '../lib/prisma';

export async function runHubSpotOAuthTests(): Promise<
  Array<{ name: string; passed: boolean; error?: string }>
> {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message || String(err) });
    }
  };

  // 1. Encryption & Decryption (AES-256-GCM)
  await runTest('HubSpot OAuth - Token AES-256-GCM Encryption & Decryption', async () => {
    const sampleToken = 'test-hubspot-token';
    const encrypted = encryptToken(sampleToken);

    if (!encrypted || encrypted === sampleToken) {
      throw new Error('Encrypted token must differ from plain text token');
    }

    if (!encrypted.includes(':')) {
      throw new Error('Encrypted payload must contain IV, authTag, and ciphertext separated by colons');
    }

    const decrypted = decryptToken(encrypted);
    if (decrypted !== sampleToken) {
      throw new Error(`Decrypted token does not match original token: "${decrypted}" !== "${sampleToken}"`);
    }
  });

  // 2. Authorization URL generation
  await runTest('HubSpot OAuth - Authorization URL Generation', async () => {
    process.env.HUBSPOT_CLIENT_ID = 'test-hubspot-client-id-123';
    process.env.HUBSPOT_REDIRECT_URI = 'http://localhost:3000/api/integrations/hubspot/oauth/callback';
    process.env.HUBSPOT_SCOPES = 'crm.objects.contacts.read crm.objects.contacts.write';

    const testState = 'sample-signed-jwt-state';
    const urlString = getHubSpotAuthorizationUrl(testState);

    const parsed = new URL(urlString);
    if (parsed.origin !== 'https://app.hubspot.com') {
      throw new Error(`Expected origin https://app.hubspot.com, got ${parsed.origin}`);
    }
    if (parsed.pathname !== '/oauth/authorize') {
      throw new Error(`Expected pathname /oauth/authorize, got ${parsed.pathname}`);
    }
    if (parsed.searchParams.get('client_id') !== 'test-hubspot-client-id-123') {
      throw new Error('client_id parameter mismatch in authorization URL');
    }
    if (parsed.searchParams.get('state') !== testState) {
      throw new Error('state parameter mismatch in authorization URL');
    }
    if (!parsed.searchParams.get('scope')?.includes('crm.objects.contacts.read')) {
      throw new Error('scope parameter missing required CRM contact scopes');
    }
  });

  // 3. Cryptographically Secure State Generation & Validation
  await runTest('HubSpot OAuth - Secure State Generation and Validation', async () => {
    const testUserId = 'test-user-alpha-99';
    const testCompanyId = 'company-profile-alpha-1';

    const stateToken = await generateOAuthState(testUserId, testCompanyId, 15);
    if (!stateToken || typeof stateToken !== 'string') {
      throw new Error('Generated state token must be a non-empty string');
    }

    const validated = await validateOAuthState(stateToken, testUserId, testCompanyId);
    if (validated.userId !== testUserId) {
      throw new Error(`Expected state userId to be ${testUserId}, got ${validated.userId}`);
    }
    if (validated.companyProfileId !== testCompanyId) {
      throw new Error(`Expected state companyProfileId to be ${testCompanyId}, got ${validated.companyProfileId}`);
    }
    if (!validated.nonce) {
      throw new Error('State payload must contain a random cryptographic nonce');
    }
  });

  // 4. Expired State Rejection
  await runTest('HubSpot OAuth - Rejection of Expired State', async () => {
    const testUserId = 'test-user-expiring';
    // Generate state with negative expiration
    const expiredStateToken = await generateOAuthState(testUserId, 'company-exp', -5);

    let rejected = false;
    try {
      await validateOAuthState(expiredStateToken, testUserId);
    } catch (err: any) {
      if (err.message.includes('expired')) {
        rejected = true;
      }
    }

    if (!rejected) {
      throw new Error('Expired state token must be rejected with an expiration error');
    }
  });

  // 5. Tampered / Invalid State Rejection
  await runTest('HubSpot OAuth - Rejection of Tampered or Invalid State', async () => {
    let rejected = false;
    try {
      await validateOAuthState('malicious.tampered.token-payload', 'user-123');
    } catch {
      rejected = true;
    }

    if (!rejected) {
      throw new Error('Tampered state token was not rejected');
    }
  });

  // 6. Cross-Tenant State Hijack Rejection
  await runTest('HubSpot OAuth - Tenant Isolation & User Mismatch Guard', async () => {
    const legitUserId = 'tenant-user-alpha';
    const attackerUserId = 'tenant-user-beta-attacker';

    const legitState = await generateOAuthState(legitUserId, 'company-alpha', 15);

    let crossTenantBlocked = false;
    try {
      // Attacker attempts to redeem legitimate user's state
      await validateOAuthState(legitState, attackerUserId);
    } catch (err: any) {
      if (err.message.includes('user mismatch') || err.message.includes('Forbidden')) {
        crossTenantBlocked = true;
      }
    }

    if (!crossTenantBlocked) {
      throw new Error('Cross-tenant state reuse was not prevented');
    }
  });

  // 7. Token Persistence in Prisma Account Model
  await runTest('HubSpot OAuth - Encrypted Token Persistence in Account Model', async () => {
    // Ensure test user exists
    const testEmail = 'hubspot-test-tenant@example.com';
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'HubSpot Test Tenant',
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          role: 'CLIENT',
        },
      });
    }

    const testTokens = {
      accessToken: 'pat-mock-access-token-998877',
      refreshToken: 'pat-mock-refresh-token-112233',
      expiresIn: 1800,
      tokenType: 'bearer',
      hubId: 247522848,
    };

    const saved = await saveHubSpotConnection({
      userId: user.id,
      tokens: testTokens,
      portalId: 247522848,
    });

    if (saved.provider !== 'hubspot') {
      throw new Error(`Expected provider to be hubspot, got ${saved.provider}`);
    }
    if (saved.providerAccountId !== '247522848') {
      throw new Error(`Expected providerAccountId to be 247522848, got ${saved.providerAccountId}`);
    }
    if (!saved.accessTokenEncrypted || saved.accessTokenEncrypted === testTokens.accessToken) {
      throw new Error('Access token was not saved as encrypted text');
    }

    // Verify token can be decrypted accurately
    const decryptedAccessToken = decryptToken(saved.accessTokenEncrypted);
    if (decryptedAccessToken !== testTokens.accessToken) {
      throw new Error('Decrypted access token does not match original stored token');
    }

    // Verify sanitized status check
    const status = await getHubSpotIntegrationStatus(user.id);
    if (!status.connected) {
      throw new Error('Integration status should be connected');
    }
    if (status.accountId !== '247522848') {
      throw new Error(`Expected accountId 247522848, got ${status.accountId}`);
    }
  });

  // 8. Tenant Isolation on Disconnect
  await runTest('HubSpot OAuth - Tenant Isolation on Disconnect', async () => {
    const tenantUserEmail = 'hubspot-test-tenant@example.com';
    const user = await prisma.user.findUnique({ where: { email: tenantUserEmail } });
    if (!user) throw new Error('Test user not found');

    const anotherUserEmail = 'other-tenant-user@example.com';
    let anotherUser = await prisma.user.findUnique({ where: { email: anotherUserEmail } });
    if (!anotherUser) {
      anotherUser = await prisma.user.create({
        data: {
          email: anotherUserEmail,
          name: 'Other Tenant',
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          role: 'CLIENT',
        },
      });
    }

    // Attempting disconnect by another user should NOT disconnect the original tenant's integration
    await disconnectHubSpot(anotherUser.id);

    const originalStatus = await getHubSpotIntegrationStatus(user.id);
    if (!originalStatus.connected) {
      throw new Error('Original tenant integration was disconnected by another user!');
    }

    // Legitimate tenant disconnects their own account
    await disconnectHubSpot(user.id);

    const updatedStatus = await getHubSpotIntegrationStatus(user.id);
    if (updatedStatus.connected) {
      throw new Error('Integration should be disconnected after owner disconnect');
    }
  });

  // 9. Error Handling without Exposing Secrets
  await runTest('HubSpot OAuth - Safe Error Messages without Secrets', async () => {
    let errorCaught = false;
    try {
      const origSecret = process.env.HUBSPOT_CLIENT_SECRET;
      delete process.env.HUBSPOT_CLIENT_SECRET;
      try {
        await getHubSpotAuthorizationUrl('test');
      } finally {
        process.env.HUBSPOT_CLIENT_SECRET = origSecret;
      }
    } catch {
      // Expected
    }

    try {
      await saveHubSpotConnection({ userId: '', tokens: null as any });
    } catch (err: any) {
      errorCaught = true;
      if (err.message.includes('secret') || err.message.includes('token')) {
        // Ensure no raw secrets leaked in message
        if (err.message.includes('1234') || err.message.includes('pat-')) {
          throw new Error('Error message exposed secret data!');
        }
      }
    }

    if (!errorCaught) {
      throw new Error('Validation error was not triggered on missing parameters');
    }
  });

  // 10. Current 2026-03 Authorization-Code Token Exchange
  await runTest('HubSpot OAuth - 2026-03 Authorization-Code Token Exchange', async () => {
    const originalFetch = global.fetch;
    const origClientId = process.env.HUBSPOT_CLIENT_ID;
    const origClientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const origRedirectUri = process.env.HUBSPOT_REDIRECT_URI;

    process.env.HUBSPOT_CLIENT_ID = 'test-client-id-abc';
    process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret-xyz';
    process.env.HUBSPOT_REDIRECT_URI = 'http://localhost:3000/api/integrations/hubspot/oauth/callback';

    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = '';

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedMethod = init?.method || 'GET';
      capturedBody = String(init?.body || '');

      return new Response(
        JSON.stringify({
          token_type: 'bearer',
          access_token: 'mock-fresh-access-token-001',
          refresh_token: 'mock-fresh-refresh-token-001',
          expires_in: 1800,
          hub_id: 247522848,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    try {
      const tokens = await exchangeCodeForTokens('sample-auth-code-123');

      if (capturedUrl !== HUBSPOT_OAUTH_TOKEN_URL) {
        throw new Error(
          `Expected token exchange URL to be ${HUBSPOT_OAUTH_TOKEN_URL}, got ${capturedUrl}`
        );
      }
      if (capturedMethod !== 'POST') {
        throw new Error(`Expected POST method, got ${capturedMethod}`);
      }

      const bodyParams = new URLSearchParams(capturedBody);
      if (bodyParams.get('grant_type') !== 'authorization_code') {
        throw new Error('grant_type must be authorization_code');
      }
      if (bodyParams.get('code') !== 'sample-auth-code-123') {
        throw new Error('authorization code mismatch');
      }
      if (bodyParams.get('client_id') !== 'test-client-id-abc') {
        throw new Error('client_id parameter mismatch');
      }

      if (tokens.accessToken !== 'mock-fresh-access-token-001') {
        throw new Error('accessToken mismatch in parsed response');
      }
      if (tokens.refreshToken !== 'mock-fresh-refresh-token-001') {
        throw new Error('refreshToken mismatch in parsed response');
      }
      if (tokens.expiresIn !== 1800) {
        throw new Error('expiresIn mismatch in parsed response');
      }
      if (String(tokens.hubId) !== '247522848') {
        throw new Error('hubId mismatch in parsed response');
      }
    } finally {
      global.fetch = originalFetch;
      process.env.HUBSPOT_CLIENT_ID = origClientId;
      process.env.HUBSPOT_CLIENT_SECRET = origClientSecret;
      process.env.HUBSPOT_REDIRECT_URI = origRedirectUri;
    }
  });

  // 11. Current 2026-03 Token Introspection (No Tokens in URLs)
  await runTest('HubSpot OAuth - 2026-03 Token Introspection (Tokens in Body, Not URLs)', async () => {
    const originalFetch = global.fetch;
    const origClientId = process.env.HUBSPOT_CLIENT_ID;
    const origClientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    process.env.HUBSPOT_CLIENT_ID = 'test-client-id-abc';
    process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret-xyz';

    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = '';

    const testAccessToken = 'pat-secret-access-token-9988';

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedMethod = init?.method || 'GET';
      capturedBody = String(init?.body || '');

      return new Response(
        JSON.stringify({
          active: true,
          hub_id: 247522848,
          hub_domain: 'leadpoint-ai.hubspotpagebuilder.com',
          app_id: 887766,
          scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
          user: 'admin@leadpoint.ai',
          user_id: 54321,
          token_type: 'bearer',
          expires_in: 1750,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    try {
      const introspection = await introspectHubSpotToken(testAccessToken, 'access_token');

      if (capturedUrl !== HUBSPOT_OAUTH_INTROSPECT_URL) {
        throw new Error(
          `Expected introspection URL to be ${HUBSPOT_OAUTH_INTROSPECT_URL}, got ${capturedUrl}`
        );
      }
      if (capturedMethod !== 'POST') {
        throw new Error(`Expected POST method for introspection, got ${capturedMethod}`);
      }

      // Crucial security check: Token must NEVER appear in URL path or query string
      if (capturedUrl.includes(testAccessToken)) {
        throw new Error('Security violation: Access token appeared in request URL!');
      }

      const bodyParams = new URLSearchParams(capturedBody);
      if (bodyParams.get('token') !== testAccessToken) {
        throw new Error('Access token was not passed in request body');
      }
      if (bodyParams.get('token_type_hint') !== 'access_token') {
        throw new Error('token_type_hint mismatch');
      }

      if (!introspection || !introspection.active) {
        throw new Error('Expected introspection result to be active');
      }
      if (String(introspection.hubId) !== '247522848') {
        throw new Error(`Expected hubId 247522848, got ${introspection.hubId}`);
      }
      if (!introspection.scopes?.includes('crm.objects.contacts.read')) {
        throw new Error('Expected scopes to contain crm.objects.contacts.read');
      }

      // Also verify fetchTokenInfo delegates to introspection without URL tokens
      const info = await fetchTokenInfo(testAccessToken);
      if (!info || info.hubId !== 247522848) {
        throw new Error('fetchTokenInfo failed to extract hubId via introspection');
      }
    } finally {
      global.fetch = originalFetch;
      process.env.HUBSPOT_CLIENT_ID = origClientId;
      process.env.HUBSPOT_CLIENT_SECRET = origClientSecret;
    }
  });

  // 12. Current 2026-03 Refresh Token Flow
  await runTest('HubSpot OAuth - 2026-03 Refresh Token Flow', async () => {
    const originalFetch = global.fetch;
    const origClientId = process.env.HUBSPOT_CLIENT_ID;
    const origClientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    process.env.HUBSPOT_CLIENT_ID = 'test-client-id-abc';
    process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret-xyz';

    let capturedUrl = '';
    let capturedBody = '';

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      capturedUrl = String(input);
      capturedBody = String(init?.body || '');

      return new Response(
        JSON.stringify({
          token_type: 'bearer',
          access_token: 'new-refreshed-access-token-999',
          refresh_token: 'new-refreshed-refresh-token-999',
          expires_in: 1800,
          hub_id: 247522848,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    try {
      const refreshed = await refreshHubSpotToken('existing-refresh-token-111');

      if (capturedUrl !== HUBSPOT_OAUTH_TOKEN_URL) {
        throw new Error(
          `Expected refresh token URL to be ${HUBSPOT_OAUTH_TOKEN_URL}, got ${capturedUrl}`
        );
      }

      const bodyParams = new URLSearchParams(capturedBody);
      if (bodyParams.get('grant_type') !== 'refresh_token') {
        throw new Error('grant_type must be refresh_token');
      }
      if (bodyParams.get('refresh_token') !== 'existing-refresh-token-111') {
        throw new Error('refresh_token parameter mismatch');
      }

      if (refreshed.accessToken !== 'new-refreshed-access-token-999') {
        throw new Error('accessToken mismatch in refreshed response');
      }
      if (refreshed.refreshToken !== 'new-refreshed-refresh-token-999') {
        throw new Error('refreshToken mismatch in refreshed response');
      }
    } finally {
      global.fetch = originalFetch;
      process.env.HUBSPOT_CLIENT_ID = origClientId;
      process.env.HUBSPOT_CLIENT_SECRET = origClientSecret;
    }
  });

  // 13. Malformed OAuth Response Handling
  await runTest('HubSpot OAuth - Malformed Response Handling', async () => {
    const originalFetch = global.fetch;
    const origClientId = process.env.HUBSPOT_CLIENT_ID;
    const origClientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    process.env.HUBSPOT_CLIENT_ID = 'test-client-id-abc';
    process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret-xyz';

    global.fetch = async (): Promise<Response> => {
      // 200 OK but missing access_token and refresh_token
      return new Response(JSON.stringify({ status: 'ok', something: 'else' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      let threw = false;
      try {
        await exchangeCodeForTokens('test-code');
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Malformed OAuth response')) {
          throw new Error(`Expected malformed error, got: ${err.message}`);
        }
      }

      if (!threw) {
        throw new Error('Exchange code should throw on missing token payload');
      }

      let refreshThrew = false;
      try {
        await refreshHubSpotToken('test-refresh');
      } catch (err: any) {
        refreshThrew = true;
        if (!err.message.includes('Malformed OAuth response')) {
          throw new Error(`Expected malformed error on refresh, got: ${err.message}`);
        }
      }

      if (!refreshThrew) {
        throw new Error('Refresh token should throw on missing access_token');
      }
    } finally {
      global.fetch = originalFetch;
      process.env.HUBSPOT_CLIENT_ID = origClientId;
      process.env.HUBSPOT_CLIENT_SECRET = origClientSecret;
    }
  });

  // 14. OAuth Error Handling (400 invalid_grant)
  await runTest('HubSpot OAuth - OAuth Error Handling (invalid_grant)', async () => {
    const originalFetch = global.fetch;
    const origClientId = process.env.HUBSPOT_CLIENT_ID;
    const origClientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    process.env.HUBSPOT_CLIENT_ID = 'test-client-id-abc';
    process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret-xyz';

    global.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          error: 'invalid_grant',
          error_description: 'The authorization code provided is invalid or has expired.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    try {
      let threw = false;
      try {
        await exchangeCodeForTokens('expired-code');
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('invalid or has expired')) {
          throw new Error(`Expected error description in message, got: ${err.message}`);
        }
        if (err.message.includes('test-client-secret-xyz')) {
          throw new Error('Client secret was leaked in error message!');
        }
      }

      if (!threw) {
        throw new Error('exchangeCodeForTokens should throw on 400 invalid_grant');
      }
    } finally {
      global.fetch = originalFetch;
      process.env.HUBSPOT_CLIENT_ID = origClientId;
      process.env.HUBSPOT_CLIENT_SECRET = origClientSecret;
    }
  });

  return results;
}
