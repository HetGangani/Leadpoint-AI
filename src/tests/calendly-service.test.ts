import { CalendlyService, createMockCalendlyBookingPayload } from '../lib/calendly-service';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runCalendlyServiceTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };

  const originalEnv = { ...process.env };

  const restoreEnv = () => {
    process.env.CALENDLY_PROVIDER = originalEnv.CALENDLY_PROVIDER;
    process.env.CALENDLY_ACCESS_TOKEN = originalEnv.CALENDLY_ACCESS_TOKEN;
  };

  // 1. Mock Calendly Provider
  try {
    process.env.CALENDLY_PROVIDER = 'mock';
    const res = await CalendlyService.getCurrentUser();

    assert(res.success === true, 'Mock getCurrentUser should succeed');
    assert(res.provider === 'mock', 'Provider should be mock');
    assert(Boolean(res.data?.email && res.data.email.includes('@')), 'Should return mock user email');
    assert(Boolean(res.data?.currentOrganization && res.data.currentOrganization.includes('organizations')), 'Should return organization URI');
    results.push({ name: 'Calendly Service - Mock Provider Execution', passed: true });
  } catch (err: any) {
    results.push({ name: 'Calendly Service - Mock Provider Execution', passed: false, error: err.message });
  }

  // 2. Real Provider Configuration Validation (Missing Access Token)
  try {
    process.env.CALENDLY_PROVIDER = 'real';
    delete process.env.CALENDLY_ACCESS_TOKEN;

    const res = await CalendlyService.getCurrentUser();
    assert(res.success === false, 'Real provider without token should fail');
    assert(res.provider === 'real', 'Provider should be real');
    assert(res.error?.includes('CALENDLY_ACCESS_TOKEN') === true, 'Error should state missing access token');
    results.push({ name: 'Calendly Service - Missing Access Token Validation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Calendly Service - Missing Access Token Validation', passed: false, error: err.message });
  }

  // 3. Successful API v2 Response using Mocked HTTP Fetch
  try {
    process.env.CALENDLY_PROVIDER = 'real';
    process.env.CALENDLY_ACCESS_TOKEN = 'test_pat_token_12345';

    const mockFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = String(input);
      assert(urlStr.includes('/users/me'), 'Fetch URL should target /users/me');
      assert(Boolean(init?.headers && (init.headers as any).Authorization === 'Bearer test_pat_token_12345'), 'Should include Bearer token header');

      return {
        status: 200,
        ok: true,
        json: async () => ({
          resource: {
            uri: 'https://api.calendly.com/users/REAL_USER_999',
            name: 'Alex Executive',
            email: 'alex@enterprise.com',
            scheduling_url: 'https://calendly.com/alex-enterprise/20min',
            current_organization: 'https://api.calendly.com/organizations/REAL_ORG_888',
          },
        }),
      } as any;
    };

    const res = await CalendlyService.getCurrentUser(mockFetch);

    assert(res.success === true, 'Real provider with valid mock fetch should succeed');
    assert(res.data?.uri === 'https://api.calendly.com/users/REAL_USER_999', 'Should parse user URI');
    assert(Boolean(res.data?.schedulingUrl?.includes('alex-enterprise')), 'Should parse scheduling URL');
    results.push({ name: 'Calendly Service - Real Provider API v2 Success (Mocked Fetch)', passed: true });
  } catch (err: any) {
    results.push({ name: 'Calendly Service - Real Provider API v2 Success (Mocked Fetch)', passed: false, error: err.message });
  }

  // 4. Invalid API Response / 401 Unauthorized Handling
  try {
    process.env.CALENDLY_PROVIDER = 'real';
    process.env.CALENDLY_ACCESS_TOKEN = 'invalid_pat_token';

    const mock401Fetch: typeof fetch = async () => {
      return {
        status: 401,
        ok: false,
        json: async () => ({
          title: 'Unauthorized',
          message: 'The access token is invalid',
        }),
      } as any;
    };

    const res = await CalendlyService.getCurrentUser(mock401Fetch);

    assert(res.success === false, 'Invalid token fetch should return success: false');
    assert(res.statusCode === 401, 'Status code should be 401');
    assert(Boolean(res.error?.includes('invalid') || res.error?.includes('Unauthorized')), 'Error message should be normalized');
    results.push({ name: 'Calendly Service - 401 Unauthorized API Error Normalization', passed: true });
  } catch (err: any) {
    results.push({ name: 'Calendly Service - 401 Unauthorized API Error Normalization', passed: false, error: err.message });
  }

  // 5. Booking Payload Generation & Identifier Extraction
  try {
    const payload = createMockCalendlyBookingPayload('lead@company.com', 'lead_123');
    assert(payload.inviteeEmail === 'lead@company.com', 'Invitee email should match');
    assert(payload.eventUri.includes('scheduled_events'), 'Event URI should be formatted');
    assert(payload.inviteeUri.includes('invitees'), 'Invitee URI should be formatted');
    results.push({ name: 'Calendly Service - Booking Payload & Identifier Generation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Calendly Service - Booking Payload & Identifier Generation', passed: false, error: err.message });
  }

  restoreEnv();
  return results;
}
