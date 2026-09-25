import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export interface HubSpotOAuthState {
  userId: string;
  companyProfileId?: string | null;
  nonce: string;
  expiresAt: number;
}

export interface HubSpotTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  hubId?: number | string;
}

export interface HubSpotTokenInfo {
  token: string;
  user: string;
  hubDomain: string;
  scopes: string[];
  hubId: number;
  appId: number;
  expiresIn: number;
}

export interface HubSpotIntegrationStatus {
  connected: boolean;
  accountId: string | null;
  expiresAt: Date | null;
}

/**
 * Derives a 32-byte key for AES-256-GCM authenticated encryption.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    process.env.JWT_SECRET ||
    'leadpoint-hubspot-oauth-encryption-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Returns JWT secret buffer for signing OAuth state parameters.
 */
function getStateSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    process.env.ENCRYPTION_SECRET ||
    'leadpoint-hubspot-oauth-state-signing-key-2026';
  return new TextEncoder().encode(secret);
}

/**
 * Encrypts sensitive OAuth token strings using AES-256-GCM.
 * Output format: iv:authTag:encryptedData (hex encoded)
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted tokens.
 */
export function decryptToken(encryptedString: string): string {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generates a signed, tamper-proof OAuth state token binding the user and tenant.
 */
export async function generateOAuthState(
  userId: string,
  companyProfileId?: string | null,
  expiresInMinutes = 15
): Promise<string> {
  if (!userId) {
    throw new Error('userId is required to generate OAuth state');
  }

  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const nonce = crypto.randomBytes(16).toString('hex');

  const payload = {
    userId,
    companyProfileId: companyProfileId || null,
    nonce,
    expiresAt,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(getStateSecret());
}

/**
 * Verifies and validates the OAuth state token and ensures tenant binding.
 */
export async function validateOAuthState(
  stateToken: string,
  expectedUserId?: string,
  expectedCompanyProfileId?: string | null
): Promise<HubSpotOAuthState> {
  if (!stateToken || typeof stateToken !== 'string') {
    throw new Error('Missing or invalid OAuth state parameter');
  }

  let payload: any;
  try {
    const verified = await jwtVerify(stateToken, getStateSecret());
    payload = verified.payload;
  } catch (err: any) {
    if (err.code === 'ERR_JWT_EXPIRED' || err.message?.toLowerCase().includes('expired')) {
      throw new Error('OAuth state has expired. Please initiate connection again.');
    }
    throw new Error('OAuth state verification failed: invalid or tampered signature');
  }

  if (!payload || !payload.userId || !payload.expiresAt) {
    throw new Error('OAuth state payload is malformed');
  }

  if (Date.now() > payload.expiresAt) {
    throw new Error('OAuth state has expired. Please initiate connection again.');
  }

  // Cross-tenant attack prevention: Verify state belongs to current user
  if (expectedUserId && payload.userId !== expectedUserId) {
    throw new Error('Forbidden: OAuth state user mismatch. Cross-tenant access denied.');
  }

  if (
    expectedCompanyProfileId &&
    payload.companyProfileId &&
    payload.companyProfileId !== expectedCompanyProfileId
  ) {
    throw new Error('Forbidden: OAuth state tenant mismatch.');
  }

  return {
    userId: payload.userId,
    companyProfileId: payload.companyProfileId || null,
    nonce: payload.nonce,
    expiresAt: payload.expiresAt,
  };
}

/**
 * Generates the official HubSpot OAuth 2.0 authorization URL.
 */
export function getHubSpotAuthorizationUrl(state: string): string {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirectUri =
    process.env.HUBSPOT_REDIRECT_URI ||
    'http://localhost:3000/api/integrations/hubspot/oauth/callback';
  const scopes =
    process.env.HUBSPOT_SCOPES || 'crm.objects.contacts.read crm.objects.contacts.write';

  if (!clientId) {
    throw new Error('Missing required environment variable: HUBSPOT_CLIENT_ID');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

export const HUBSPOT_OAUTH_TOKEN_URL = 'https://api.hubapi.com/oauth/2026-03/token';
export const HUBSPOT_OAUTH_INTROSPECT_URL = 'https://api.hubapi.com/oauth/2026-03/token/introspect';

export interface HubSpotTokenIntrospection {
  active: boolean;
  hubId?: number | string;
  hubDomain?: string;
  appId?: number;
  scopes?: string[];
  user?: string;
  userId?: number | string;
  tokenType?: string;
  expiresIn?: number;
  exp?: number;
}

/**
 * Exchanges authorization code for HubSpot access and refresh tokens using current endpoint:
 * POST https://api.hubapi.com/oauth/2026-03/token
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUriOverride?: string
): Promise<HubSpotTokenResponse> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const redirectUri =
    redirectUriOverride ||
    process.env.HUBSPOT_REDIRECT_URI ||
    'http://localhost:3000/api/integrations/hubspot/oauth/callback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing required HubSpot OAuth configuration: HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET must be configured in environment variables.'
    );
  }

  if (!code) {
    throw new Error('Authorization code is required for token exchange');
  }

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(HUBSPOT_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    let errorDetail = `Status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail =
        errorJson.error_description || errorJson.message || errorJson.error || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(`HubSpot token exchange failed: ${errorDetail}`);
  }

  const data = await response.json();

  if (!data || typeof data !== 'object' || !data.access_token || !data.refresh_token) {
    throw new Error('Malformed OAuth response from HubSpot: missing access_token or refresh_token');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 1800,
    tokenType: data.token_type || 'bearer',
    hubId: data.hub_id ?? data.hubId ?? data.account_id,
  };
}

/**
 * Introspects access or refresh tokens using HubSpot's current OAuth introspection endpoint:
 * POST https://api.hubapi.com/oauth/2026-03/token/introspect
 *
 * Security note: Access tokens are transmitted securely in the request body (application/x-www-form-urlencoded),
 * never in URLs or paths.
 */
export async function introspectHubSpotToken(
  token: string,
  tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
): Promise<HubSpotTokenIntrospection | null> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing HubSpot credentials in environment variables');
  }

  if (!token) {
    throw new Error('Token is required for introspection');
  }

  try {
    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: tokenTypeHint,
    });

    const response = await fetch(HUBSPOT_OAUTH_INTROSPECT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      let errorDetail = `Status ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail =
          errorJson.error_description || errorJson.message || errorJson.error || errorDetail;
      } catch {
        // ignore
      }
      console.warn(`[HubSpot Token Introspection] Error response: ${errorDetail}`);
      return null;
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Malformed introspection response from HubSpot');
    }

    return {
      active: Boolean(data.active),
      hubId: data.hub_id ?? data.hubId ?? data.account_id,
      hubDomain: data.hub_domain ?? data.hubDomain,
      appId: data.app_id ?? data.appId,
      scopes: Array.isArray(data.scopes) ? data.scopes : [],
      user: data.user,
      userId: data.user_id ?? data.userId,
      tokenType: data.token_type ?? data.tokenType,
      expiresIn: data.expires_in ?? data.expiresIn,
      exp: data.exp,
    };
  } catch (err: any) {
    console.error('Failed to introspect token with HubSpot:', err?.message || err);
    return null;
  }
}

/**
 * Retrieves token metadata from HubSpot using the current introspection endpoint.
 * Preserved for backwards compatibility while delegating to introspectHubSpotToken.
 * Does NOT place access tokens in URLs or paths.
 */
export async function fetchTokenInfo(accessToken: string): Promise<HubSpotTokenInfo | null> {
  const result = await introspectHubSpotToken(accessToken, 'access_token');
  if (!result || !result.active) {
    return null;
  }
  return {
    token: '', // Never expose token string in metadata
    user: result.user || '',
    hubDomain: result.hubDomain || '',
    scopes: result.scopes || [],
    hubId: Number(result.hubId) || 0,
    appId: result.appId || 0,
    expiresIn: result.expiresIn || 0,
  };
}

/**
 * Refreshes an expired HubSpot access token using the stored refresh token via current endpoint:
 * POST https://api.hubapi.com/oauth/2026-03/token
 */
export async function refreshHubSpotToken(refreshToken: string): Promise<HubSpotTokenResponse> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing HubSpot credentials in environment variables');
  }

  if (!refreshToken) {
    throw new Error('Refresh token is required to refresh access token');
  }

  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(HUBSPOT_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    let errorDetail = `Status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail =
        errorJson.error_description || errorJson.message || errorJson.error || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(`Failed to refresh HubSpot token: ${errorDetail}`);
  }

  const data = await response.json();

  if (!data || typeof data !== 'object' || !data.access_token) {
    throw new Error('Malformed OAuth response from HubSpot: missing access_token');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in || 1800,
    tokenType: data.token_type || 'bearer',
    hubId: data.hub_id ?? data.hubId ?? data.account_id,
  };
}

/**
 * Persists the connected HubSpot account with encrypted tokens into the Prisma Account model.
 */
export async function saveHubSpotConnection(params: {
  userId: string;
  tokens: HubSpotTokenResponse;
  portalId?: string | number;
}) {
  const { userId, tokens, portalId } = params;

  if (!userId) {
    throw new Error('userId is required to persist HubSpot connection');
  }

  const resolvedAccountId =
    portalId !== undefined
      ? String(portalId)
      : tokens.hubId !== undefined
      ? String(tokens.hubId)
      : process.env.HUBSPOT_ACCOUNT_ID || 'hubspot-connected';

  const accessTokenEncrypted = encryptToken(tokens.accessToken);
  const refreshTokenEncrypted = encryptToken(tokens.refreshToken);
  const expiresAt = new Date(Date.now() + (tokens.expiresIn || 1800) * 1000);

  // Check if this user already has an existing HubSpot integration
  const existingUserHubSpot = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'hubspot',
    },
  });

  if (existingUserHubSpot) {
    return prisma.account.update({
      where: {
        id: existingUserHubSpot.id,
      },
      data: {
        providerAccountId: resolvedAccountId,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt,
        updatedAt: new Date(),
      },
    });
  }

  // Create new Account record for this tenant
  return prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'hubspot',
        providerAccountId: resolvedAccountId,
      },
    },
    update: {
      userId,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      expiresAt,
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider: 'hubspot',
      providerAccountId: resolvedAccountId,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      expiresAt,
    },
  });
}

/**
 * Resolves current HubSpot integration status for a specific authenticated tenant user.
 * Never returns access tokens, refresh tokens, or secrets.
 */
export async function getHubSpotIntegrationStatus(
  userId: string
): Promise<HubSpotIntegrationStatus> {
  if (!userId) {
    return { connected: false, accountId: null, expiresAt: null };
  }

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'hubspot',
    },
    select: {
      providerAccountId: true,
      expiresAt: true,
    },
  });

  if (!account) {
    return { connected: false, accountId: null, expiresAt: null };
  }

  return {
    connected: true,
    accountId: account.providerAccountId,
    expiresAt: account.expiresAt,
  };
}

/**
 * Safely disconnects the HubSpot integration for an authenticated user.
 */
export async function disconnectHubSpot(userId: string): Promise<{ success: boolean }> {
  if (!userId) {
    throw new Error('userId is required to disconnect integration');
  }

  await prisma.account.deleteMany({
    where: {
      userId,
      provider: 'hubspot',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'HUBSPOT_INTEGRATION_DISCONNECTED',
      timestamp: new Date(),
      metadata: JSON.stringify({
        provider: 'hubspot',
        disconnectedAt: new Date().toISOString(),
      }),
    },
  });

  return { success: true };
}
