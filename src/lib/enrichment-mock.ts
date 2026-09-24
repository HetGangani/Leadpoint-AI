import { EnrichedDataJson } from '@/types';

export interface EnrichmentRequest {
  companyName: string;
  website?: string;
  businessEmail?: string;
}

export interface EnrichmentResult {
  relevanceScore: number;
  enrichedData: EnrichedDataJson;
}

/**
 * Mock Enrichment Engine for LinkedIn, Clearbit, and Apollo.io API integrations
 */
export async function enrichLeadData(request: EnrichmentRequest): Promise<EnrichmentResult> {
  // Simulate remote enrichment API roundtrip delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    relevanceScore: 0.92,
    enrichedData: {
      funding: 'Series B ($28M Raised)',
      headquarters: 'Austin, TX',
      techStack: ['SharePoint Online', 'Microsoft 365 Enterprise E5', 'Active Directory', 'Salesforce CRM'],
      hiringSignals: ['Hiring Senior M365 Architect', 'Hiring Cloud Infrastructure Engineer'],
      growthRateYOY: '28%',
      decisionMakerLevel: 'Director / C-Level',
    },
  };
}
