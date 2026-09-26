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

/**
 * Retrieves a valid, unexpired HubSpot access token for a given user.
 * Automatically refreshes expired or expiring tokens using the stored refresh token.
 */
export async function getValidHubSpotAccessToken(userId: string): Promise<string> {
  if (!userId) {
    throw new Error('userId is required to retrieve HubSpot access token');
  }

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'hubspot',
    },
  });

  if (!account || !account.accessTokenEncrypted) {
    throw new Error('No connected HubSpot account found for user');
  }

  // Refresh if token expires within 5 minutes or is already expired
  const bufferMs = 5 * 60 * 1000;
  const isExpiringSoon = account.expiresAt
    ? account.expiresAt.getTime() - bufferMs < Date.now()
    : false;

  if (!isExpiringSoon) {
    return decryptToken(account.accessTokenEncrypted);
  }

  if (!account.refreshTokenEncrypted) {
    return decryptToken(account.accessTokenEncrypted);
  }

  try {
    const plainRefreshToken = decryptToken(account.refreshTokenEncrypted);
    const freshTokens = await refreshHubSpotToken(plainRefreshToken);
    const updatedAccount = await saveHubSpotConnection({
      userId,
      tokens: freshTokens,
      portalId: account.providerAccountId,
    });
    return decryptToken(updatedAccount.accessTokenEncrypted!);
  } catch (err: any) {
    console.error(`[HubSpot Token Auto-Refresh Error] user ${userId}:`, err?.message || err);
    return decryptToken(account.accessTokenEncrypted);
  }
}

export interface HubSpotContactProperties {
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  website?: string;
  hs_lead_status?: string;
  [key: string]: any;
}

export interface HubSpotContactRecord {
  id: string;
  properties: HubSpotContactProperties;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
}

/**
 * Fetches a contact by ID from HubSpot CRM v3 API.
 */
export async function getHubSpotContact(
  contactId: string,
  accessToken: string
): Promise<HubSpotContactRecord | null> {
  if (!contactId || !accessToken) {
    return null;
  }

  const properties = [
    'email',
    'firstname',
    'lastname',
    'phone',
    'company',
    'jobtitle',
    'website',
    'hs_lead_status',
    'createdate',
    'lastmodifieddate',
  ].join(',');

  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=${properties}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    let errDetail = `Status ${response.status}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.message || errDetail;
    } catch {}
    throw new Error(`Failed to fetch contact from HubSpot: ${errDetail}`);
  }

  return response.json();
}

/**
 * Searches contacts in HubSpot CRM v3 API.
 */
export async function searchHubSpotContacts(
  query: string,
  accessToken: string,
  limit = 10
): Promise<HubSpotContactRecord[]> {
  if (!query || !accessToken) return [];

  const url = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      limit,
      properties: [
        'email',
        'firstname',
        'lastname',
        'phone',
        'company',
        'jobtitle',
        'website',
        'hs_lead_status',
      ],
    }),
  });

  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.results || [];
}

/**
 * Creates a contact in HubSpot CRM v3 API.
 */
export async function createHubSpotContact(
  properties: Record<string, string>,
  accessToken: string
): Promise<HubSpotContactRecord> {
  const url = 'https://api.hubapi.com/crm/v3/objects/contacts';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    let errDetail = `Status ${response.status}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.message || errDetail;
    } catch {}
    throw new Error(`Failed to create HubSpot contact: ${errDetail}`);
  }
  return response.json();
}

/**
 * Updates a contact in HubSpot CRM v3 API.
 */
export async function updateHubSpotContact(
  contactId: string,
  properties: Record<string, string>,
  accessToken: string
): Promise<HubSpotContactRecord> {
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    let errDetail = `Status ${response.status}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.message || errDetail;
    } catch {}
    throw new Error(`Failed to update HubSpot contact: ${errDetail}`);
  }
  return response.json();
}

/**
 * Constant-time string equality helper to mitigate timing attacks.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export interface VerifySignatureOptions {
  method: string;
  requestUrl: string;
  rawBody: string;
  signatureHeader?: string | null;
  timestampHeader?: string | null;
  clientSecret?: string;
  maxTimestampSkewMs?: number;
}

/**
 * Verifies HubSpot Webhook v3 signature using HMAC-SHA256 and replay protection.
 * Format: HMAC-SHA256(ClientSecret, Method + URI + Body + Timestamp) -> Base64
 */
export function verifyHubSpotWebhookSignature(options: VerifySignatureOptions): {
  valid: boolean;
  error?: string;
} {
  const {
    method,
    requestUrl,
    rawBody,
    signatureHeader,
    timestampHeader,
    clientSecret = process.env.HUBSPOT_CLIENT_SECRET,
    maxTimestampSkewMs = 300000, // 5 minutes
  } = options;

  if (!signatureHeader) {
    return { valid: false, error: 'Missing X-HubSpot-Signature-v3 header' };
  }

  if (!timestampHeader) {
    return { valid: false, error: 'Missing X-HubSpot-Request-Timestamp header' };
  }

  const timestampNum = Number(timestampHeader);
  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid X-HubSpot-Request-Timestamp format' };
  }

  const now = Date.now();
  if (Math.abs(now - timestampNum) > maxTimestampSkewMs) {
    return {
      valid: false,
      error: 'Webhook request timestamp is outside the allowed 5-minute replay window',
    };
  }

  if (!clientSecret) {
    return { valid: false, error: 'HUBSPOT_CLIENT_SECRET is not configured on server' };
  }

  // Candidate URLs to test against (supports proxy/ngrok target URL configuration)
  const candidateUrls = [requestUrl];
  if (process.env.HUBSPOT_WEBHOOK_URL && process.env.HUBSPOT_WEBHOOK_URL !== requestUrl) {
    candidateUrls.push(process.env.HUBSPOT_WEBHOOK_URL);
  }

  // Also check without query string if present
  for (const cUrl of [...candidateUrls]) {
    try {
      const parsed = new URL(cUrl);
      if (parsed.search) {
        candidateUrls.push(`${parsed.origin}${parsed.pathname}`);
      }
    } catch {}
  }

  for (const urlToVerify of candidateUrls) {
    const dataToSign = `${method.toUpperCase()}${urlToVerify}${rawBody}${timestampHeader}`;
    const calculatedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(dataToSign, 'utf8')
      .digest('base64');

    if (timingSafeEqualStr(calculatedSignature, signatureHeader.trim())) {
      return { valid: true };
    }
  }

  return { valid: false, error: 'Invalid HubSpot webhook signature' };
}

/**
 * Maps HubSpot hs_lead_status to LeadPoint-AI LeadStatus enum string.
 */
export function mapHubSpotStatusToLeadStatus(hsStatus?: string | null): string {
  if (!hsStatus) return 'NEW';
  const s = hsStatus.toUpperCase().trim();
  switch (s) {
    case 'NEW':
    case 'OPEN':
      return 'NEW';
    case 'IN_PROGRESS':
    case 'CONNECTED':
    case 'ATTEMPTED_TO_CONTACT':
      return 'CONTACTED';
    case 'OPEN_DEAL':
      return 'INTERESTED';
    case 'UNQUALIFIED':
      return 'UNRESPONSIVE';
    case 'QUALIFIED':
      return 'QUALIFIED';
    case 'BAD_TIMING':
      return 'FOLLOW_UP_REQUIRED';
    default:
      return 'NEW';
  }
}

export interface HubSpotWebhookEvent {
  eventId?: string | number;
  subscriptionId?: number;
  portalId?: number | string;
  appId?: number;
  occurredAt?: number;
  subscriptionType: string;
  attemptNumber?: number;
  objectId: number | string;
  propertyName?: string;
  propertyValue?: string | null;
  changeSource?: string;
  changeFlag?: string;
  [key: string]: any;
}

export interface ProcessEventsResult {
  totalEvents: number;
  processed: number;
  skipped: number;
  createdLeads: number;
  updatedLeads: number;
  deletedLeads: number;
  errors: string[];
}

/**
 * Processes incoming HubSpot webhook events with tenant isolation, durable idempotency,
 * and atomic database state updates.
 */
export async function processHubSpotWebhookEvents(
  events: HubSpotWebhookEvent[],
  options?: { rawBody?: string }
): Promise<ProcessEventsResult> {
  const result: ProcessEventsResult = {
    totalEvents: events.length,
    processed: 0,
    skipped: 0,
    createdLeads: 0,
    updatedLeads: 0,
    deletedLeads: 0,
    errors: [],
  };

  for (const event of events) {
    try {
      if (!event.objectId) {
        result.skipped++;
        result.errors.push('Event missing objectId (contact ID)');
        continue;
      }

      const contactId = String(event.objectId);
      const portalId = event.portalId
        ? String(event.portalId)
        : process.env.HUBSPOT_ACCOUNT_ID;

      if (!portalId) {
        result.skipped++;
        result.errors.push(`Missing portalId for contact ${contactId}`);
        continue;
      }

      // 1. Durable Idempotency Check
      const eventKey = String(
        event.eventId ||
          `hubspot-${portalId}-${contactId}-${event.subscriptionType}-${event.occurredAt || ''}`
      );

      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { eventId: eventKey },
      });

      if (existingEvent) {
        result.skipped++;
        continue;
      }

      // 2. Strict Tenant Isolation: Look up connected HubSpot integration account
      const account = await prisma.account.findFirst({
        where: {
          provider: 'hubspot',
          providerAccountId: portalId,
        },
        include: {
          user: {
            include: {
              companyProfile: true,
            },
          },
        },
      });

      if (!account) {
        await prisma.auditLog.create({
          data: {
            action: 'HUBSPOT_WEBHOOK_UNKNOWN_PORTAL',
            metadata: JSON.stringify({
              portalId,
              contactId,
              subscriptionType: event.subscriptionType,
              receivedAt: new Date().toISOString(),
            }),
          },
        });
        result.skipped++;
        result.errors.push(`No local integration found for HubSpot portal ID: ${portalId}`);
        continue;
      }

      const userId = account.userId;
      let companyProfileId = account.user?.companyProfile?.id;
      if (!companyProfileId) {
        const profile = await prisma.companyProfile.findUnique({
          where: { userId },
        });
        companyProfileId = profile?.id;
      }

      if (!companyProfileId) {
        result.skipped++;
        result.errors.push(`User ${userId} does not have an active CompanyProfile`);
        continue;
      }

      const subType = (event.subscriptionType || '').toLowerCase();

      // 3. Handle Contact Deletion (Soft marking, preserves call/campaign/audit history)
      if (subType.includes('deletion')) {
        const existingLead = await prisma.lead.findFirst({
          where: {
            companyProfileId,
            hubspotContactId: contactId,
          },
        });

        if (existingLead) {
          await prisma.$transaction([
            prisma.lead.update({
              where: { id: existingLead.id },
              data: {
                crmSyncStatus: 'DELETED_IN_CRM',
                crmLastSyncedAt: new Date(),
              },
            }),
            prisma.webhookEvent.create({
              data: {
                eventId: eventKey,
                provider: 'hubspot',
                eventType: event.subscriptionType,
                processedAt: new Date(),
                metadata: JSON.stringify({
                  portalId,
                  contactId,
                  action: 'DELETED_IN_CRM',
                }),
              },
            }),
            prisma.auditLog.create({
              data: {
                userId,
                action: 'HUBSPOT_CONTACT_DELETED',
                metadata: JSON.stringify({
                  leadId: existingLead.id,
                  hubspotContactId: contactId,
                  portalId,
                }),
              },
            }),
          ]);
          result.deletedLeads++;
          result.processed++;
        } else {
          // Record idempotency even if lead wasn't found
          await prisma.webhookEvent.create({
            data: {
              eventId: eventKey,
              provider: 'hubspot',
              eventType: event.subscriptionType,
              processedAt: new Date(),
              metadata: JSON.stringify({ portalId, contactId, notFound: true }),
            },
          });
          result.skipped++;
        }
        continue;
      }

      // 4. Handle Contact Restore
      if (subType.includes('restore')) {
        const existingLead = await prisma.lead.findFirst({
          where: {
            companyProfileId,
            hubspotContactId: contactId,
          },
        });

        if (existingLead) {
          await prisma.$transaction([
            prisma.lead.update({
              where: { id: existingLead.id },
              data: {
                crmSyncStatus: 'SYNCED',
                crmLastSyncedAt: new Date(),
              },
            }),
            prisma.webhookEvent.create({
              data: {
                eventId: eventKey,
                provider: 'hubspot',
                eventType: event.subscriptionType,
                processedAt: new Date(),
                metadata: JSON.stringify({ portalId, contactId, action: 'RESTORED' }),
              },
            }),
            prisma.auditLog.create({
              data: {
                userId,
                action: 'HUBSPOT_CONTACT_RESTORED',
                metadata: JSON.stringify({
                  leadId: existingLead.id,
                  hubspotContactId: contactId,
                  portalId,
                }),
              },
            }),
          ]);
          result.updatedLeads++;
          result.processed++;
        } else {
          result.skipped++;
        }
        continue;
      }

      // 5. Contact Creation or Property Change
      // Retrieve full contact details from HubSpot if needed
      let contactData: HubSpotContactRecord | null = null;
      try {
        const accessToken = await getValidHubSpotAccessToken(userId);
        contactData = await getHubSpotContact(contactId, accessToken);
      } catch (err: any) {
        console.warn(`[HubSpot Webhook] Failed to fetch contact ${contactId} from API:`, err?.message || err);
      }

      const props: HubSpotContactProperties = contactData?.properties || {};

      // Overlay specific property from event if available
      if (event.propertyName && event.propertyValue !== undefined) {
        props[event.propertyName] = event.propertyValue;
      }

      // Locate existing lead: Primary by hubspotContactId, Secondary by businessEmail
      let existingLead = await prisma.lead.findFirst({
        where: {
          companyProfileId,
          hubspotContactId: contactId,
        },
      });

      if (!existingLead && props.email) {
        const emailMatches = await prisma.lead.findMany({
          where: {
            companyProfileId,
            businessEmail: props.email.toLowerCase().trim(),
          },
        });
        if (emailMatches.length === 1) {
          existingLead = emailMatches[0];
        }
      }

      if (existingLead) {
        // Update existing lead
        const updateData: any = {
          hubspotContactId: contactId,
          crmProvider: 'hubspot',
          crmLastSyncedAt: new Date(),
          crmSyncStatus: 'SYNCED',
        };

        if (props.email && props.email.trim()) {
          updateData.businessEmail = props.email.toLowerCase().trim();
        }
        if (props.phone && props.phone.trim()) {
          updateData.phone = props.phone.trim();
        }
        if (props.company && props.company.trim()) {
          updateData.companyName = props.company.trim();
        }

        if (props.firstname || props.lastname) {
          const first = props.firstname || '';
          const last = props.lastname || '';
          const combined = `${first} ${last}`.trim();
          if (combined) updateData.name = combined;
        }

        if (props.hs_lead_status) {
          updateData.status = mapHubSpotStatusToLeadStatus(props.hs_lead_status);
        }

        // Update enrichedData if jobtitle or website provided
        if (props.jobtitle || props.website) {
          let currentEnriched: any = {};
          try {
            currentEnriched = JSON.parse(existingLead.enrichedData || '{}');
          } catch {}
          if (props.jobtitle) currentEnriched.jobTitle = props.jobtitle;
          if (props.website) currentEnriched.website = props.website;
          updateData.enrichedData = JSON.stringify(currentEnriched);
        }

        await prisma.$transaction([
          prisma.lead.update({
            where: { id: existingLead.id },
            data: updateData,
          }),
          prisma.webhookEvent.create({
            data: {
              eventId: eventKey,
              provider: 'hubspot',
              eventType: event.subscriptionType,
              processedAt: new Date(),
              metadata: JSON.stringify({
                portalId,
                contactId,
                leadId: existingLead.id,
                action: 'UPDATED',
              }),
            },
          }),
          prisma.auditLog.create({
            data: {
              userId,
              action: 'HUBSPOT_CONTACT_UPDATED',
              metadata: JSON.stringify({
                leadId: existingLead.id,
                hubspotContactId: contactId,
                portalId,
                updatedFields: Object.keys(updateData),
              }),
            },
          }),
        ]);

        result.updatedLeads++;
        result.processed++;
      } else {
        // Create new Lead
        const rawEmail = (props.email || '').toLowerCase().trim();
        const first = props.firstname || '';
        const last = props.lastname || '';
        const name = `${first} ${last}`.trim() || rawEmail.split('@')[0] || `HubSpot Contact ${contactId}`;
        const companyName = props.company?.trim() || 'Unknown Company';
        const phone = props.phone?.trim() || null;
        const status = mapHubSpotStatusToLeadStatus(props.hs_lead_status);

        const enrichedData = JSON.stringify({
          jobTitle: props.jobtitle || 'Contact',
          website: props.website || '',
          source: 'HubSpot Dynamic Webhook Sync',
          importedAt: new Date().toISOString(),
        });

        // Initial relevanceScore is set to the application baseline default (0.85),
        // consistent with lead-service.ts, prior to AI qualification execution in Phase 4.
        const baselineScore = 0.85;

        await prisma.$transaction([
          prisma.lead.create({
            data: {
              companyProfileId,
              name,
              businessEmail: rawEmail || `hubspot-${contactId}@leadpoint.internal`,
              phone,
              companyName,
              industry: 'Technology & Services',
              companySize: 'Unknown',
              sourcePlatform: 'HubSpot CRM',
              relevanceScore: baselineScore,
              status,
              enrichedData,
              hubspotContactId: contactId,
              crmProvider: 'hubspot',
              crmLastSyncedAt: new Date(),
              crmSyncStatus: 'SYNCED',
            },
          }),
          prisma.webhookEvent.create({
            data: {
              eventId: eventKey,
              provider: 'hubspot',
              eventType: event.subscriptionType,
              processedAt: new Date(),
              metadata: JSON.stringify({
                portalId,
                contactId,
                action: 'CREATED',
              }),
            },
          }),
          prisma.auditLog.create({
            data: {
              userId,
              action: 'HUBSPOT_CONTACT_CREATED',
              metadata: JSON.stringify({
                hubspotContactId: contactId,
                portalId,
                name,
              }),
            },
          }),
        ]);

        result.createdLeads++;
        result.processed++;
      }
    } catch (err: any) {
      console.error('[HubSpot Webhook Event Processing Error]:', err?.message || err);
      result.errors.push(err?.message || String(err));
    }
  }

  return result;
}

