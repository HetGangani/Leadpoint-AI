export const DEFAULT_FALLBACK_CALENDLY_URL = 'https://calendly.com/leadpoint-sales-demo/20min';

export interface ResolveCalendlyUrlOptions {
  profileCalendlyUrl?: string | null;
}

/**
 * Resolves the active Calendly URL for a company profile or global configuration.
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

export interface MockCalendlyEvent {
  eventUri: string;
  inviteeEmail: string;
  leadId?: string;
  bookedAt: string;
}

/**
 * Simulates a Calendly webhook payload for demonstration and testing.
 */
export function createMockCalendlyBookingPayload(email: string, leadId?: string): MockCalendlyEvent {
  return {
    eventUri: `https://api.calendly.com/scheduled_events/MOCK_EVT_${Date.now()}`,
    inviteeEmail: email.toLowerCase().trim(),
    leadId,
    bookedAt: new Date().toISOString(),
  };
}
