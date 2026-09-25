import {
  isValidEmail,
  generateLeadsCSV,
  processAndImportLeads,
  CSVLeadInput,
  transformGoogleSheetUrl,
  parseCSVToLeadInputs,
  deleteLeadById,
  deleteLeadsBulk,
} from '../lib/lead-service';
import { prisma } from '../lib/prisma';

export async function runLeadServiceTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      throw new Error(`Assertion Failed: ${message}`);
    }
  };

  // Test 1: Email Regex Validation
  try {
    assert(isValidEmail('alex.smith@cloudenterprise.io') === true, 'Valid business email should return true');
    assert(isValidEmail('john.doe+tech@subdomain.company.com') === true, 'Valid email with tags and subdomains should return true');
    assert(isValidEmail('invalid-email-address') === false, 'Plain string without @ should return false');
    assert(isValidEmail('user@domain') === false, 'Email without TLD should return false');
    assert(isValidEmail('user@.com') === false, 'Email with missing domain name should return false');
    assert(isValidEmail('') === false, 'Empty string should return false');
    // @ts-ignore
    assert(isValidEmail(null) === false, 'Null value should return false');
    results.push({ name: 'Lead Service - Email Regex Validation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - Email Regex Validation', passed: false, error: err.message });
  }

  // Test 2: CSV Generation & Escaping Logic
  try {
    const sampleLeads = [
      {
        id: 'lead-101',
        name: 'Jane Doe',
        businessEmail: 'jane@acme.example.com',
        phone: '+1 555-0199',
        companyName: 'Acme "Global" Corp',
        industry: 'Software',
        companySize: '50-100',
        sourcePlatform: 'LinkedIn',
        relevanceScore: 0.92,
        status: 'NEW',
        originalPostUrl: 'https://linkedin.com/posts/123',
        postContent: 'Looking for "M365" migration partner.',
        createdAt: new Date('2026-01-15T10:00:00Z'),
      },
    ];

    const csvOutput = generateLeadsCSV(sampleLeads);
    assert(csvOutput.includes('Lead ID,Name,Business Email'), 'CSV should contain correct headers');
    assert(csvOutput.includes('"lead-101"'), 'CSV should contain lead ID wrapped in quotes');
    assert(csvOutput.includes('"Acme ""Global"" Corp"'), 'CSV should properly escape internal double quotes');
    assert(csvOutput.includes('"92"'), 'CSV should convert relevance score to rounded percentage');
    results.push({ name: 'Lead Service - CSV Generation & Escaping', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - CSV Generation & Escaping', passed: false, error: err.message });
  }

  // Test 3: Lead Import Deduplication Logic (Database Integration Test)
  let createdLeadId: string | null = null;
  let testProfileId: string = '';
  try {
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      const user = await prisma.user.create({
        data: {
          email: `test-user-${Date.now()}@test.com`,
          name: 'Test Lead Owner',
          passwordHash: 'hashed-secret',
          role: 'CLIENT',
        },
      });
      profile = await prisma.companyProfile.create({
        data: {
          userId: user.id,
          name: 'Test Cloud Solutions',
          website: 'https://testcloud.example.com',
          description: 'Enterprise IT & Cloud Modernization',
          targetKeywords: '["m365", "azure", "migration"]',
          offerings: '["SharePoint Online", "Tenant Migration"]',
        },
      });
    }
    testProfileId = profile.id;

    const duplicateEmail = `marcus.vance.${Date.now()}@quantum.example.com`;
    const testBatch: CSVLeadInput[] = [
      {
        name: 'Marcus Vance',
        businessEmail: duplicateEmail,
        companyName: 'Quantum Tech',
        originalPostUrl: `https://linkedin.com/posts/marcus-post-${Date.now()}`,
        relevanceScore: 0.95,
      },
      // Invalid email lead
      {
        name: 'Bad Email Lead',
        businessEmail: 'not-an-email',
        companyName: 'Invalid Corp',
      },
      // Batch Duplicate (Same email as first lead)
      {
        name: 'Marcus Duplicate',
        businessEmail: duplicateEmail,
        companyName: 'Quantum Tech',
      },
    ];

    const importResult = await processAndImportLeads(testBatch, profile.id);
    assert(importResult.totalProcessed === 3, 'Should process all 3 input leads');
    assert(importResult.importedCount === 1, 'Should successfully import exactly 1 valid unique lead');
    assert(importResult.invalidEmailsCount === 1, 'Should count 1 invalid email error');
    assert(importResult.duplicatesSkipped === 1, 'Should detect and skip 1 batch duplicate email');
    createdLeadId = importResult.importedLeads[0]?.id || null;
    results.push({ name: 'Lead Service - CSV Import Deduplication & Validation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - CSV Import Deduplication & Validation', passed: false, error: err.message });
  }

  // Test 4: Google Sheets URL Transformation
  try {
    const standardUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
    const transformed = transformGoogleSheetUrl(standardUrl);
    assert(transformed.includes('export?format=csv'), 'Should convert edit URL to export?format=csv');
    assert(transformed.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'), 'Should retain spreadsheet ID');

    const withGid = 'https://docs.google.com/spreadsheets/d/testId123/edit#gid=999888';
    const transformedWithGid = transformGoogleSheetUrl(withGid);
    assert(transformedWithGid.includes('&gid=999888'), 'Should retain sheet GID');

    results.push({ name: 'Lead Service - Google Sheets URL Transformation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - Google Sheets URL Transformation', passed: false, error: err.message });
  }

  // Test 5: Multi-Delimiter CSV & Header Parsing
  try {
    const tsvData = 'Full Name\tWork Email\tPhone\tCompany\tIndustry\nAlice Smith\talice@fintech.test\t+1555123456\tFintech Corp\tFinance';
    const parsedTsv = parseCSVToLeadInputs(tsvData);
    assert(parsedTsv.length === 1, 'Should parse 1 lead from TSV data');
    assert(parsedTsv[0].businessEmail === 'alice@fintech.test', 'Should map Work Email column correctly');
    assert(parsedTsv[0].companyName === 'Fintech Corp', 'Should map Company column correctly');

    const csvFirstLast = 'First Name,Last Name,Email,Organization\nBob,Johnson,bob@acme.test,Acme Enterprises';
    const parsedFirstLast = parseCSVToLeadInputs(csvFirstLast);
    assert(parsedFirstLast.length === 1, 'Should parse 1 lead');
    assert(parsedFirstLast[0].name === 'Bob Johnson', 'Should combine First Name and Last Name');

    results.push({ name: 'Lead Service - Multi-Delimiter & Header Parsing', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - Multi-Delimiter & Header Parsing', passed: false, error: err.message });
  }

  // Test 6: Single Lead Deletion
  try {
    if (!createdLeadId) {
      throw new Error('No lead available to test single deletion');
    }
    const deleteRes = await deleteLeadById(createdLeadId, testProfileId, true);
    assert(deleteRes.success === true, 'Delete operation should succeed');

    const checkLead = await prisma.lead.findUnique({ where: { id: createdLeadId } });
    assert(checkLead === null, 'Lead should no longer exist in database');

    results.push({ name: 'Lead Service - Single Lead Deletion', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - Single Lead Deletion', passed: false, error: err.message });
  }

  // Test 7: Bulk Lead Deletion & Usage Filtering
  try {
    // Create 2 test leads
    const leadA = await prisma.lead.create({
      data: {
        companyProfileId: testProfileId,
        name: 'Bulk Delete Lead A',
        businessEmail: `bulk.a.${Date.now()}@test.com`,
        companyName: 'Delete Corp A',
        industry: 'Tech',
        companySize: '100',
        sourcePlatform: 'CSV Import',
        relevanceScore: 0.9,
        status: 'NEW',
        enrichedData: '{}',
      },
    });

    const leadB = await prisma.lead.create({
      data: {
        companyProfileId: testProfileId,
        name: 'Bulk Delete Lead B (Used)',
        businessEmail: `bulk.b.${Date.now()}@test.com`,
        companyName: 'Delete Corp B',
        industry: 'Finance',
        companySize: '200',
        sourcePlatform: 'CSV Import',
        relevanceScore: 0.88,
        status: 'CONTACTED', // "Used" lead
        enrichedData: '{}',
      },
    });

    // Test filter: 'used'
    const bulkUsedRes = await deleteLeadsBulk({
      companyProfileId: testProfileId,
      filter: 'used',
      isAdmin: true,
    });
    assert(bulkUsedRes.success === true, 'Bulk delete should succeed');
    assert(bulkUsedRes.deletedCount >= 1, 'Should delete at least 1 used lead');

    // Clean up remaining leadA by explicit ID
    const bulkIdRes = await deleteLeadsBulk({
      leadIds: [leadA.id],
      companyProfileId: testProfileId,
      isAdmin: true,
    });
    assert(bulkIdRes.deletedCount === 1, 'Should delete leadA by ID');

    results.push({ name: 'Lead Service - Bulk Deletion & Cleanup', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - Bulk Deletion & Cleanup', passed: false, error: err.message });
  }

  // Test 8: FR-2.2 Intent Requirement Parser (Entity Extraction & Urgency)
  try {
    const { parseIntentRequirement } = await import('../lib/lead-crawler');

    const sampleUnstructuredPost = {
      rawText: 'Urgent requirement: Need an experienced partner to migrate our 5TB SharePoint Server to SharePoint Online and configure Azure AD Conditional Access within 2 weeks.',
      platform: 'LinkedIn' as const,
      authorName: 'David Miller',
      companyName: 'Apex Health Systems',
      industry: 'Healthcare',
    };

    const parsed = parseIntentRequirement(sampleUnstructuredPost, {
      targetKeywords: ['SharePoint', 'Azure AD', 'Migration'],
      offerings: ['SharePoint Modernization', 'Cloud Security'],
    });

    assert(parsed.name === 'David Miller', 'Should extract author name');
    assert(parsed.companyName === 'Apex Health Systems', 'Should extract company name');
    assert(parsed.urgencyLevel === 'CRITICAL', 'Should detect CRITICAL urgency from "urgent" keyword');
    assert(parsed.requiredTechStack.includes('SharePoint Online'), 'Should extract SharePoint Online in required tech stack');
    assert(parsed.requiredTechStack.includes('Azure AD'), 'Should extract Azure AD in required tech stack');
    assert(parsed.relevanceScore >= 0.90, 'Relevance score should be boosted for keyword match + critical urgency');
    assert(parsed.originalPostUrl.includes('linkedin.com'), 'Should construct valid source URL adhering to Transparency Guarantee (FR-2.3)');

    results.push({ name: 'Lead Service - FR-2.2 Intent Requirement Parser', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - FR-2.2 Intent Requirement Parser', passed: false, error: err.message });
  }

  // Test 9: FR-2.1 Multi-Source Crawler (Multi-Platform Scanning)
  try {
    const { crawlMultiSourceRequirements } = await import('../lib/lead-crawler');

    // Test platform-specific scan for Upwork
    const upworkLeads = await crawlMultiSourceRequirements({ platform: 'Upwork' });
    assert(upworkLeads.length >= 1, 'Should crawl at least 1 Upwork requirement');
    assert(upworkLeads[0].sourcePlatform === 'Upwork', 'Should tag source platform as Upwork');

    // Test multi-platform all-sources scan
    const allLeads = await crawlMultiSourceRequirements({ platform: 'ALL', keywords: ['M365', 'Azure'] });
    assert(allLeads.length >= 4, 'Should crawl leads across all 4 platforms');
    const platforms = new Set(allLeads.map((l) => l.sourcePlatform));
    assert(platforms.has('LinkedIn'), 'Should scan LinkedIn');
    assert(platforms.has('X/Twitter'), 'Should scan X/Twitter');
    assert(platforms.has('Upwork'), 'Should scan Upwork');
    assert(platforms.has('RFP Directory'), 'Should scan RFP Directory');

    results.push({ name: 'Lead Service - FR-2.1 Multi-Source Crawler', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - FR-2.1 Multi-Source Crawler', passed: false, error: err.message });
  }

  return results;
}
