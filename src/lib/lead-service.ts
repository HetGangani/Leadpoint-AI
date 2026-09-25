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
 * Public Requirement Harvesting & Web Crawler Engine (FR-2.1 & FR-2.2)
 * Discovers and parses high-intent posts across LinkedIn, X/Twitter, Upwork, and RFP directories
 */
export async function harvestPublicRequirements(options?: {
  platform?: string;
  keywords?: string[];
  industry?: string;
  customUrl?: string;
}) {
  const profile = await prisma.companyProfile.findFirst();
  if (!profile) {
    throw new Error('No company profile configured for lead discovery harvesting.');
  }

  let targetKeywords: string[] = [];
  try {
    targetKeywords = JSON.parse(profile.targetKeywords || '[]');
  } catch (e) {}

  let offerings: string[] = [];
  try {
    offerings = JSON.parse(profile.offerings || '[]');
  } catch (e) {}

  const { crawlMultiSourceRequirements } = await import('@/lib/lead-crawler');

  const crawledLeads = await crawlMultiSourceRequirements({
    platform: options?.platform,
    keywords: options?.keywords || targetKeywords,
    industry: options?.industry,
    customUrl: options?.customUrl,
    clientContext: { targetKeywords, offerings },
  });

  const harvestedLeads = [];

  for (const item of crawledLeads) {
    // Check if duplicate exists
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          { businessEmail: item.businessEmail },
          { originalPostUrl: item.originalPostUrl },
        ],
      },
    });

    if (!existing) {
      const newLead = await prisma.lead.create({
        data: {
          companyProfileId: profile.id,
          name: item.name,
          businessEmail: item.businessEmail,
          phone: item.phone,
          linkedinUrl: item.linkedinUrl,
          companyName: item.companyName,
          industry: item.industry,
          companySize: item.companySize,
          sourcePlatform: item.sourcePlatform,
          originalPostUrl: item.originalPostUrl,
          postContent: item.postContent,
          relevanceScore: item.relevanceScore,
          status: LeadStatus.NEW,
          enrichedData: JSON.stringify(item.enrichedData),
        },
      });
      harvestedLeads.push(newLead);
    }
  }

  return harvestedLeads;
}

/**
 * Transforms standard Google Sheet URLs to CSV export endpoints
 */
export function transformGoogleSheetUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();

  // If already an export or pub format, return as is
  if (trimmed.includes('format=csv') || trimmed.includes('/pub?output=csv')) {
    return trimmed;
  }

  // Check for docs.google.com/spreadsheets/d/{ID}
  const match = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const spreadsheetId = match[1];
    // Check if gid is present e.g. gid=123456
    const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Fetches raw CSV data from a remote URL (Google Sheets, S3, CDN, or Web API)
 */
export async function fetchCSVFromUrl(rawUrl: string, timeoutMs: number = 10000): Promise<string> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('A valid remote CSV URL is required.');
  }

  const targetUrl = transformGoogleSheetUrl(rawUrl);

  // Validate URL protocol
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS URLs are supported.');
    }
  } catch (err: any) {
    throw new Error(`Invalid URL provided: ${err.message}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, application/csv, */*',
        'User-Agent': 'LeadPoint-AI/1.0 CSV Ingestion Engine',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Remote source responded with status ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Remote source returned empty content.');
    }

    return text;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Fetching remote CSV timed out after ${timeoutMs / 1000}s`);
    }
    throw new Error(`Failed to fetch CSV from remote source: ${err.message}`);
  }
}

/**
 * Robust CSV/TSV parser converting text data to normalized CSVLeadInput records
 */
export function parseCSVToLeadInputs(csvText: string, defaultPlatform = 'CSV Import'): CSVLeadInput[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter from first row (comma, tab, semicolon)
  const firstLine = lines[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  // Parse header line respecting quotes
  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        // Handle escaped double quote ""
        if (insideQuote && line[c + 1] === '"') {
          currentCell += '"';
          c++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === delimiter && !insideQuote) {
        cells.push(currentCell.replace(/^["']|["']$/g, '').trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.replace(/^["']|["']$/g, '').trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());

  const getFieldIndex = (names: string[]) => {
    return headers.findIndex((h) => names.some((n) => h.includes(n) || h === n));
  };

  // Header column index matching
  const firstNameIdx = getFieldIndex(['first name', 'firstname', 'fname', 'first']);
  const lastNameIdx = getFieldIndex(['last name', 'lastname', 'lname', 'last', 'surname']);
  const nameIdx = headers.findIndex(
    (h, idx) =>
      idx !== firstNameIdx &&
      idx !== lastNameIdx &&
      ['full name', 'contact name', 'contact', 'name', 'person', 'lead name'].some((n) => h.includes(n) || h === n)
  );
  const emailIdx = getFieldIndex(['business email', 'work email', 'email address', 'email', 'e-mail', 'mail']);
  const phoneIdx = getFieldIndex(['phone number', 'phone', 'mobile', 'telephone', 'tel', 'cell']);
  const companyIdx = getFieldIndex(['company name', 'company', 'organization', 'org', 'business', 'employer', 'account']);
  const industryIdx = getFieldIndex(['industry', 'sector', 'vertical', 'domain']);
  const sizeIdx = getFieldIndex(['company size', 'size', 'employees', 'employee count', 'headcount']);
  const platformIdx = getFieldIndex(['platform', 'source platform', 'source', 'channel']);
  const urlIdx = getFieldIndex(['original post url', 'post url', 'post link', 'url', 'link', 'website', 'linkedin']);
  const contentIdx = getFieldIndex(['requirement', 'post content', 'post text', 'content', 'notes', 'description']);
  const scoreIdx = getFieldIndex(['relevance score', 'relevance', 'score', 'intent score', 'rating']);
  const statusIdx = getFieldIndex(['lead status', 'status', 'state']);
  const locationIdx = getFieldIndex(['headquarters', 'location', 'city', 'country', 'hq', 'state']);

  const parsedLeads: CSVLeadInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const getVal = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx] : undefined);

    const email = getVal(emailIdx);
    if (!email) continue;

    // Resolve name from first + last name or full name
    let name: string | undefined;
    if (firstNameIdx >= 0 || lastNameIdx >= 0) {
      const fName = getVal(firstNameIdx) || '';
      const lName = getVal(lastNameIdx) || '';
      const combined = `${fName} ${lName}`.trim();
      if (combined.length > 0) {
        name = combined;
      }
    }
    if (!name) {
      name = getVal(nameIdx) || 'Key Executive';
    }

    parsedLeads.push({
      name,
      businessEmail: email,
      phone: getVal(phoneIdx),
      companyName: getVal(companyIdx) || 'Target Enterprise',
      industry: getVal(industryIdx) || 'Technology Services',
      companySize: getVal(sizeIdx) || '250-500 employees',
      sourcePlatform: getVal(platformIdx) || defaultPlatform,
      originalPostUrl: getVal(urlIdx),
      postContent: getVal(contentIdx),
      relevanceScore: getVal(scoreIdx),
      status: getVal(statusIdx),
      location: getVal(locationIdx),
    });
  }

  return parsedLeads;
}

/**
 * Deletes a single lead and its associated call history
 */
export async function deleteLeadById(
  leadId: string,
  companyProfileId?: string,
  isAdmin = false
): Promise<{ success: boolean; leadId: string }> {
  if (!leadId) {
    throw new Error('Lead ID is required.');
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error('Lead not found.');
  }

  if (!isAdmin && companyProfileId && lead.companyProfileId !== companyProfileId) {
    throw new Error('Unauthorized to delete this lead.');
  }

  // Delete dependent voice calls
  await prisma.voiceCall.deleteMany({
    where: { leadId },
  });

  await prisma.lead.delete({
    where: { id: leadId },
  });

  return { success: true, leadId };
}

/**
 * Bulk deletes leads (by ID array or by usage filter e.g. "used")
 */
export async function deleteLeadsBulk(params: {
  leadIds?: string[];
  companyProfileId?: string;
  isAdmin?: boolean;
  filter?: 'all' | 'used';
}): Promise<{ success: boolean; deletedCount: number }> {
  const { leadIds, companyProfileId, isAdmin = false, filter } = params;

  const whereClause: any = {};
  if (!isAdmin && companyProfileId) {
    whereClause.companyProfileId = companyProfileId;
  }

  if (leadIds && Array.isArray(leadIds) && leadIds.length > 0) {
    whereClause.id = { in: leadIds };
  } else if (filter === 'used') {
    // "Used" leads: contacted, called, or moved beyond 'NEW'
    whereClause.OR = [
      { status: { in: ['CONTACTED', 'INTERESTED', 'UNRESPONSIVE', 'CALENDLY_SENT', 'BOOKED', 'FOLLOW_UP_REQUIRED'] } },
      { voiceCalls: { some: {} } },
    ];
  } else if (filter === 'all') {
    // Matches all leads within scope
  } else {
    throw new Error('Either leadIds array or a valid filter ("all" | "used") must be provided.');
  }

  const matchingLeads = await prisma.lead.findMany({
    where: whereClause,
    select: { id: true },
  });

  const idsToDelete = matchingLeads.map((l) => l.id);
  if (idsToDelete.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  // Delete related voice calls first to guarantee integrity
  await prisma.voiceCall.deleteMany({
    where: { leadId: { in: idsToDelete } },
  });

  const deleteResult = await prisma.lead.deleteMany({
    where: { id: { in: idsToDelete } },
  });

  return {
    success: true,
    deletedCount: deleteResult.count,
  };
}
