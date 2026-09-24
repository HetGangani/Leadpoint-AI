import { prisma } from '@/lib/prisma';
import { LeadStatus } from '@/types';

// Email validation regex: strict standard format
export const EMAIL_VALIDATION_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_VALIDATION_REGEX.test(email.trim());
}

export interface CSVLeadInput {
  name?: string;
  businessEmail?: string;
  phone?: string;
  linkedinUrl?: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  sourcePlatform?: string;
  originalPostUrl?: string;
  postContent?: string;
  relevanceScore?: number | string;
  status?: string;
  location?: string;
}

export interface ImportResult {
  totalProcessed: number;
  importedCount: number;
  duplicatesSkipped: number;
  invalidEmailsCount: number;
  importedLeads: Array<{
    id: string;
    name: string;
    businessEmail: string;
    companyName: string;
    sourcePlatform: string;
  }>;
  skippedDetails: Array<{
    email: string;
    companyName?: string;
    reason: string;
  }>;
}

/**
 * Validates and imports lead records with email validation regex and duplicate detection.
 */
export async function processAndImportLeads(
  leads: CSVLeadInput[],
  companyProfileId?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    totalProcessed: leads.length,
    importedCount: 0,
    duplicatesSkipped: 0,
    invalidEmailsCount: 0,
    importedLeads: [],
    skippedDetails: [],
  };

  // Find or default company profile
  let targetProfileId = companyProfileId;
  if (!targetProfileId) {
    const profile = await prisma.companyProfile.findFirst();
    if (profile) {
      targetProfileId = profile.id;
    } else {
      throw new Error('No company profile found in database to attach leads to.');
    }
  }

  // Fetch existing leads for duplicate checking
  const existingLeads = await prisma.lead.findMany({
    select: {
      businessEmail: true,
      companyName: true,
      originalPostUrl: true,
    },
  });

  const existingEmails = new Set(
    existingLeads
      .filter((l) => l.businessEmail)
      .map((l) => l.businessEmail.toLowerCase().trim())
  );

  const existingKeys = new Set(
    existingLeads
      .filter((l) => l.companyName && l.originalPostUrl)
      .map((l) => `${l.companyName.toLowerCase().trim()}:${l.originalPostUrl?.toLowerCase().trim()}`)
  );

  const seenInBatch = new Set<string>();

  for (const item of leads) {
    const rawEmail = (item.businessEmail || '').trim();
    const companyName = (item.companyName || 'Unknown Company').trim();
    const originalPostUrl = (item.originalPostUrl || '').trim();

    // 1. Email Regex Validation
    if (!rawEmail || !isValidEmail(rawEmail)) {
      result.invalidEmailsCount++;
      result.skippedDetails.push({
        email: rawEmail || 'MISSING_EMAIL',
        companyName,
        reason: 'Invalid business email format (failed regex pattern).',
      });
      continue;
    }

    const lowerEmail = rawEmail.toLowerCase();
    const compositeKey = `${companyName.toLowerCase()}:${originalPostUrl.toLowerCase()}`;

    // 2. Duplicate Detection (Existing DB or within batch)
    if (existingEmails.has(lowerEmail) || (originalPostUrl && existingKeys.has(compositeKey)) || seenInBatch.has(lowerEmail)) {
      result.duplicatesSkipped++;
      result.skippedDetails.push({
        email: rawEmail,
        companyName,
        reason: 'Duplicate lead detected (email or URL already exists).',
      });
      continue;
    }

    seenInBatch.add(lowerEmail);

    // Parse score safely
    let score = typeof item.relevanceScore === 'number' ? item.relevanceScore : parseFloat(item.relevanceScore as string) || 0.85;
    if (score > 1) score = score / 100; // if percentage like 92

    const location = item.location || 'Remote / Unspecified';
    const enrichedDataJson = JSON.stringify({
      headquarters: location,
      techStack: ['Microsoft 365', 'SharePoint Online', 'Azure AD'],
      hiringSignals: ['Imported via Lead Discovery CSV Engine'],
      decisionMakerLevel: 'Director / Management',
    });

    const newLead = await prisma.lead.create({
      data: {
        companyProfileId: targetProfileId,
        name: item.name?.trim() || 'Key Decision Maker',
        businessEmail: rawEmail,
        phone: item.phone?.trim() || '+1 (800) 555-0199',
        linkedinUrl: item.linkedinUrl?.trim() || `https://linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        companyName,
        industry: item.industry?.trim() || 'Technology & Consulting',
        companySize: item.companySize?.trim() || '100-500 employees',
        sourcePlatform: item.sourcePlatform?.trim() || 'CSV Import',
        originalPostUrl: originalPostUrl || null,
        postContent: item.postContent?.trim() || `Requirement posted by ${companyName} for cloud IT modernization.`,
        relevanceScore: Math.min(1.0, Math.max(0.1, score)),
        status: (item.status?.trim().toUpperCase() as any) || LeadStatus.NEW,
        enrichedData: enrichedDataJson,
      },
    });

    result.importedCount++;
    result.importedLeads.push({
      id: newLead.id,
      name: newLead.name,
      businessEmail: newLead.businessEmail,
      companyName: newLead.companyName,
      sourcePlatform: newLead.sourcePlatform,
    });
  }

  return result;
}

/**
 * Formats lead list to standard CSV string output.
 */
export function generateLeadsCSV(leads: any[]): string {
  const headers = [
    'Lead ID',
    'Name',
    'Business Email',
    'Phone',
    'Company Name',
    'Industry',
    'Company Size',
    'Source Platform',
    'Relevance Score (%)',
    'Status',
    'Original Post URL',
    'Post Content',
    'Discovery Date',
  ];

  const escapeCSV = (field: any) => {
    if (field === null || field === undefined) return '""';
    const stringified = String(field).replace(/"/g, '""');
    return `"${stringified}"`;
  };

  const rows = leads.map((lead) => [
    escapeCSV(lead.id),
    escapeCSV(lead.name),
    escapeCSV(lead.businessEmail),
    escapeCSV(lead.phone || ''),
    escapeCSV(lead.companyName),
    escapeCSV(lead.industry),
    escapeCSV(lead.companySize),
    escapeCSV(lead.sourcePlatform),
    escapeCSV(Math.round((lead.relevanceScore || 0.85) * 100)),
    escapeCSV(lead.status),
    escapeCSV(lead.originalPostUrl || ''),
    escapeCSV(lead.postContent || ''),
    escapeCSV(lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString()),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Public Requirement Harvesting simulation engine across LinkedIn, X/Twitter, Upwork, and RFP Directories
 */
export async function harvestPublicRequirements(options?: {
  platform?: string;
  keywords?: string[];
  industry?: string;
}) {
  const profile = await prisma.companyProfile.findFirst();
  if (!profile) {
    throw new Error('No company profile configured for lead discovery harvesting.');
  }

  const platformFilter = options?.platform && options.platform !== 'ALL' ? options.platform : null;

  const harvestPool = [
    {
      name: 'Victoria Vance',
      businessEmail: 'vvance@quantumlogistics.example.com',
      phone: '+1 (415) 309-8812',
      companyName: 'Quantum Logistics Corp',
      industry: 'Logistics & Supply Chain',
      companySize: '500-1,000 employees',
      sourcePlatform: 'LinkedIn',
      originalPostUrl: 'https://www.linkedin.com/posts/vvance-quantum-sharepoint2019-activity-7281902931',
      postContent: 'We are seeking a Microsoft Gold Partner to migrate our 6TB SharePoint 2019 on-premises document repository to SharePoint Online and configure Teams governance.',
      relevanceScore: 0.95,
      location: 'San Francisco, CA',
    },
    {
      name: 'Alexander Wright',
      businessEmail: 'a.wright@fintechhorizon.example.com',
      phone: '+1 (212) 678-4390',
      companyName: 'Horizon Fintech Labs',
      industry: 'Financial Services / Fintech',
      companySize: '250-500 employees',
      sourcePlatform: 'X/Twitter',
      originalPostUrl: 'https://x.com/awright_fintech/status/1799201938201',
      postContent: 'Urgent: Looking for M365 tenant-to-tenant migration consultants with SEC/FINRA compliance experience for a 400-user post-merger integration.',
      relevanceScore: 0.93,
      location: 'New York, NY',
    },
    {
      name: 'Elena Gilbert',
      businessEmail: 'elena.g@biomedsolutions.example.org',
      phone: '+1 (312) 890-1122',
      companyName: 'BioMed Solutions Alliance',
      industry: 'Healthcare & Hospitals',
      companySize: '1,000-5,000 employees',
      sourcePlatform: 'Upwork',
      originalPostUrl: 'https://www.upwork.com/jobs/SharePoint-Online-Modernization-and-Purview-DLP_~018f920a1b2c3d',
      postContent: 'RFP/Contract: Complete overhaul of legacy SharePoint Server 2016 intranet into modern SharePoint Online with custom Power Automate workflows.',
      relevanceScore: 0.91,
      location: 'Chicago, IL',
    },
    {
      name: 'Gregory Cole',
      businessEmail: 'gcole@stategov-procurement.example.gov',
      phone: '+1 (202) 555-0188',
      companyName: 'Department of IT Services',
      industry: 'Public Sector / Government',
      companySize: '5,000+ employees',
      sourcePlatform: 'RFP Directory',
      originalPostUrl: 'https://rfpdirectory.example.gov/notices/2026-M365-TENANT-MIGRATION-004',
      postContent: 'Official Solicitation: Enterprise Microsoft 365 Cloud Migration, Zero Trust Identity Architecture, and SharePoint Online Document Security Implementation.',
      relevanceScore: 0.89,
      location: 'Washington, DC',
    },
    {
      name: 'Sarah Jenkins',
      businessEmail: 's.jenkins@apexretail.example.com',
      phone: '+1 (206) 441-9920',
      companyName: 'Apex Retail International',
      industry: 'Retail & E-commerce',
      companySize: '1,000-5,000 employees',
      sourcePlatform: 'LinkedIn',
      originalPostUrl: 'https://www.linkedin.com/posts/sarah-jenkins-it/google-to-m365-migration-activity-7290192831',
      postContent: 'Evaluating proposals to migrate 2,500 users from Google Workspace to Microsoft 365 Enterprise E5. Need dedicated migration leads.',
      relevanceScore: 0.92,
      location: 'Seattle, WA',
    },
  ];

  // Filter pool if platform filter selected
  const selectedPool = platformFilter
    ? harvestPool.filter((item) => item.sourcePlatform.toLowerCase().includes(platformFilter.toLowerCase()))
    : harvestPool;

  const harvestedLeads = [];

  for (const item of selectedPool) {
    // Check if duplicate exists
    const existing = await prisma.lead.findFirst({
      where: { businessEmail: item.businessEmail },
    });

    if (!existing) {
      const enrichedDataJson = JSON.stringify({
        funding: 'Verified Corporate Enterprise',
        headquarters: item.location,
        techStack: ['SharePoint Server', 'Active Directory', 'Microsoft 365'],
        hiringSignals: ['Active Requirement Harvested'],
        decisionMakerLevel: 'Director / VP of IT',
      });

      const newLead = await prisma.lead.create({
        data: {
          companyProfileId: profile.id,
          name: item.name,
          businessEmail: item.businessEmail,
          phone: item.phone,
          linkedinUrl: `https://www.linkedin.com/company/${item.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          companyName: item.companyName,
          industry: item.industry,
          companySize: item.companySize,
          sourcePlatform: item.sourcePlatform,
          originalPostUrl: item.originalPostUrl,
          postContent: item.postContent,
          relevanceScore: item.relevanceScore,
          status: LeadStatus.NEW,
          enrichedData: enrichedDataJson,
        },
      });
      harvestedLeads.push(newLead);
    }
  }

  return harvestedLeads;
}
