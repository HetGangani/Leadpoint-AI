import { isValidEmail, generateLeadsCSV, processAndImportLeads, CSVLeadInput } from '../lib/lead-service';
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
  try {
    // Find or create test profile
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      const user = await prisma.user.create({
        data: {
          email: `test-user-${Date.now()}@test.com`,
          name: 'Test Lead Owner',
          passwordHash: 'hashed-secret',
          role: 'CLIENT',
        }
      });
      profile = await prisma.companyProfile.create({
        data: {
          userId: user.id,
          name: 'Test Cloud Solutions',
          website: 'https://testcloud.example.com',
          description: 'Enterprise IT & Cloud Modernization',
          targetKeywords: '["m365", "azure", "migration"]',
          offerings: '["SharePoint Online", "Tenant Migration"]',
        }
      });
    }

    const testBatch: CSVLeadInput[] = [
      {
        name: 'Marcus Vance',
        businessEmail: `marcus.vance.${Date.now()}@quantum.example.com`,
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
        businessEmail: `marcus.vance.${Date.now()}@quantum.example.com`,
        companyName: 'Quantum Tech',
      }
    ];

    const importResult = await processAndImportLeads(testBatch, profile.id);
    assert(importResult.totalProcessed === 3, 'Should process all 3 input leads');
    assert(importResult.importedCount === 1, 'Should successfully import exactly 1 valid unique lead');
    assert(importResult.invalidEmailsCount === 1, 'Should count 1 invalid email error');
    assert(importResult.duplicatesSkipped === 1, 'Should detect and skip 1 batch duplicate email');
    results.push({ name: 'Lead Service - CSV Import Deduplication & Validation', passed: true });
  } catch (err: any) {
    results.push({ name: 'Lead Service - CSV Import Deduplication & Validation', passed: false, error: err.message });
  }

  return results;
}
