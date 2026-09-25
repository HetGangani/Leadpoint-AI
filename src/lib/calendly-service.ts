export const DEFAULT_FALLBACK_CALENDLY_URL = 'https://calendly.com/leadpoint-sales-demo/20min';
export const CALENDLY_API_BASE_URL = 'https://api.calendly.com';

export interface ResolveCalendlyUrlOptions {
  profileCalendlyUrl?: string | null;
}

/**
 * Resolves active Calendly booking URL for a company profile or global fallback.
 */
export function resolveCalendlyUrl(options?: ResolveCalendlyUrlOptions): string {
  if (options?.profileCalendlyUrl && options.profileCalendlyUrl.trim() !== '') {
    return options.profileCalendlyUrl.trim();
  }
  if (process.env.NEXT_PUBLIC_CALENDLY_URL && process.env.NEXT_PUBLIC_CALENDLY_URL.trim() !== '') {
    return process.env.NEXT_PUBLIC_CALENDLY_URL.trim();
  }
  return DEFAULT_FALLBACK_CALENDLY_URL;
}

/**
 * Formats standard SMS message containing the Calendly booking link.
 */
export function generateCalendlySmsMessage(leadName: string, calendlyUrl: string): string {
  const sanitizedName = leadName ? leadName.trim() : 'there';
  return `Thanks for your time, ${sanitizedName}! You can book a convenient time to speak with our team here: ${calendlyUrl}`;
}

export interface CalendlyUserResource {
  uri: string;
  name: string;
  email: string;
  schedulingUrl: string;
  currentOrganization: string;
}

export interface CalendlyWebhookSubscription {
  uri: string;
  callbackUrl: string;
  state: 'active' | 'disabled';
  events: string[];
  scope: 'user' | 'organization';
  organization: string;
  user: string;
}

export interface CalendlyApiResponse<T> {
  success: boolean;
  provider: 'real' | 'mock';
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Helper to fetch from Calendly API v2 using Personal Access Token (PAT).
 */
async function calendlyFetch(
  endpoint: string,
  options?: RequestInit,
  fetchOverride?: typeof fetch
): Promise<{ status: number; ok: boolean; data: any }> {
  const token = process.env.CALENDLY_ACCESS_TOKEN?.trim();
  const provider = (process.env.CALENDLY_PROVIDER || 'mock').toLowerCase().trim();

  if (provider === 'real' && !token) {
    throw new Error('Calendly configuration error: Missing required CALENDLY_ACCESS_TOKEN when CALENDLY_PROVIDER=real.');
  }

  const customFetch = fetchOverride || globalThis.fetch;
  if (!customFetch) {
    throw new Error('Global fetch is unavailable in runtime environment.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${CALENDLY_API_BASE_URL}${endpoint}`;
  const response = await customFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

/**
 * Calendly API v2 Service Implementation
 */
export class CalendlyService {
  /**
   * Fetches current authenticated Calendly user profile (GET /users/me).
   */
  static async getCurrentUser(fetchOverride?: typeof fetch): Promise<CalendlyApiResponse<CalendlyUserResource>> {
    const provider = (process.env.CALENDLY_PROVIDER || 'mock').toLowerCase().trim();

    if (provider === 'mock') {
      return {
        success: true,
        provider: 'mock',
        statusCode: 200,
        data: {
          uri: 'https://api.calendly.com/users/MOCK_USER_123',
          name: 'LeadPoint Executive SDR',
          email: 'sdr@leadpoint.example.com',
          schedulingUrl: DEFAULT_FALLBACK_CALENDLY_URL,
          currentOrganization: 'https://api.calendly.com/organizations/MOCK_ORG_456',
        },
      };
    }

    try {
      const res = await calendlyFetch('/users/me', { method: 'GET' }, fetchOverride);

      if (!res.ok || !res.data?.resource) {
        const errMsg = res.data?.message || (res.status === 401 ? 'Unauthorized: Invalid Calendly Personal Access Token' : `Calendly API error (${res.status})`);
        return {
          success: false,
          provider: 'real',
          statusCode: res.status,
          error: errMsg,
        };
      }

      const raw = res.data.resource;
      return {
        success: true,
        provider: 'real',
        statusCode: res.status,
        data: {
          uri: raw.uri,
          name: raw.name,
          email: raw.email,
          schedulingUrl: raw.scheduling_url || DEFAULT_FALLBACK_CALENDLY_URL,
          currentOrganization: raw.current_organization,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'real',
        statusCode: 500,
        error: err.message || 'Network failure connecting to Calendly API.',
      };
    }
  }

  /**
   * Creates a webhook subscription (POST /webhook_subscriptions).
   */
  static async createWebhookSubscription(
    options: {
      url: string;
      events?: string[];
      organizationUri: string;
      userUri?: string;
    },
    fetchOverride?: typeof fetch
  ): Promise<CalendlyApiResponse<CalendlyWebhookSubscription>> {
    const provider = (process.env.CALENDLY_PROVIDER || 'mock').toLowerCase().trim();

    if (provider === 'mock') {
      return {
        success: true,
        provider: 'mock',
        statusCode: 201,
        data: {
          uri: `https://api.calendly.com/webhook_subscriptions/MOCK_SUB_${Date.now()}`,
          callbackUrl: options.url,
          state: 'active',
          events: options.events || ['invitee.created', 'invitee.canceled'],
          scope: 'user',
          organization: options.organizationUri,
          user: options.userUri || 'https://api.calendly.com/users/MOCK_USER_123',
        },
      };
    }

    try {
      const payload = {
        url: options.url,
        events: options.events || ['invitee.created', 'invitee.canceled'],
        organization: options.organizationUri,
        scope: options.userUri ? 'user' : 'organization',
        ...(options.userUri ? { user: options.userUri } : {}),
      };

      const res = await calendlyFetch(
        '/webhook_subscriptions',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        fetchOverride
      );

      if (!res.ok || !res.data?.resource) {
        return {
          success: false,
          provider: 'real',
          statusCode: res.status,
          error: res.data?.message || `Failed to create webhook subscription (${res.status}).`,
        };
      }

      const raw = res.data.resource;
      return {
        success: true,
        provider: 'real',
        statusCode: res.status,
        data: {
          uri: raw.uri,
          callbackUrl: raw.callback_url,
          state: raw.state,
          events: raw.events,
          scope: raw.scope,
          organization: raw.organization,
          user: raw.user,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'real',
        statusCode: 500,
        error: err.message || 'Failed to connect to Calendly API.',
      };
    }
  }

  /**
   * Lists webhook subscriptions (GET /webhook_subscriptions).
   */
  static async listWebhookSubscriptions(
    organizationUri: string,
    fetchOverride?: typeof fetch
  ): Promise<CalendlyApiResponse<CalendlyWebhookSubscription[]>> {
    const provider = (process.env.CALENDLY_PROVIDER || 'mock').toLowerCase().trim();

    if (provider === 'mock') {
      return {
        success: true,
        provider: 'mock',
        statusCode: 200,
        data: [
          {
            uri: 'https://api.calendly.com/webhook_subscriptions/MOCK_SUB_001',
            callbackUrl: 'http://localhost:3000/api/webhooks/calendly',
            state: 'active',
            events: ['invitee.created', 'invitee.canceled'],
            scope: 'user',
            organization: organizationUri,
            user: 'https://api.calendly.com/users/MOCK_USER_123',
          },
        ],
      };
    }

    try {
      const endpoint = `/webhook_subscriptions?organization=${encodeURIComponent(organizationUri)}&scope=organization`;
      const res = await calendlyFetch(endpoint, { method: 'GET' }, fetchOverride);

      if (!res.ok || !Array.isArray(res.data?.collection)) {
        return {
          success: false,
          provider: 'real',
          statusCode: res.status,
          error: res.data?.message || `Failed to list webhook subscriptions (${res.status}).`,
        };
      }

      const list = res.data.collection.map((raw: any) => ({
        uri: raw.uri,
        callbackUrl: raw.callback_url,
        state: raw.state,
        events: raw.events,
        scope: raw.scope,
        organization: raw.organization,
        user: raw.user,
      }));

      return {
        success: true,
        provider: 'real',
        statusCode: res.status,
        data: list,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'real',
        statusCode: 500,
        error: err.message || 'Failed to list Calendly webhook subscriptions.',
      };
    }
  }
}

export interface MockCalendlyEvent {
  eventUri: string;
  inviteeUri: string;
  inviteeEmail: string;
  leadId?: string;
  bookedAt: string;
}

/**
 * Creates a mock Calendly booking payload for testing and demonstration.
 */
export function createMockCalendlyBookingPayload(email: string, leadId?: string): MockCalendlyEvent {
  const timestamp = Date.now();
  return {
    eventUri: `https://api.calendly.com/scheduled_events/MOCK_EVT_${timestamp}`,
    inviteeUri: `https://api.calendly.com/scheduled_events/MOCK_EVT_${timestamp}/invitees/MOCK_INV_${timestamp}`,
    inviteeEmail: email.toLowerCase().trim(),
    leadId,
    bookedAt: new Date().toISOString(),
  };
}
