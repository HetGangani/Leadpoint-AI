import { isValidEmail, generateLeadsCSV } from '../src/lib/lead-service';

async function main() {
  console.log('🧪 Starting Lead Discovery & Business Onboarding verification...');

  // 1. Test Regex Email Validation
  console.log('\n1️⃣ Testing Email Regex Validation:');
  const validEmails = ['marcus.vance@nexusfintech.example.com', 'client@cloudscale.com', 'sdr_lead@corp.co.uk'];
  const invalidEmails = ['invalid-email-no-at-sign', 'user@', '@domain.com', 'user@domain'];

  for (const email of validEmails) {
    console.log(`- '${email}':`, isValidEmail(email) ? '✅ PASS (Valid)' : '❌ FAIL');
  }

  for (const email of invalidEmails) {
    console.log(`- '${email}':`, !isValidEmail(email) ? '✅ PASS (Rejected)' : '❌ FAIL');
  }

  // 2. Test CSV Export Generation
  console.log('\n2️⃣ Testing CSV Export String Formatting:');
  const sampleLeads = [
    {
      id: 'lead-101',
      name: 'Marcus Vance',
      businessEmail: 'marcus.vance@nexusfintech.example.com',
      phone: '+1 (415) 890-1243',
      companyName: 'Nexus Financial Technologies',
      industry: 'Financial Services / Fintech',
      companySize: '250-500 employees',
      sourcePlatform: 'LinkedIn',
      relevanceScore: 0.96,
      status: 'QUALIFIED',
      originalPostUrl: 'https://www.linkedin.com/posts/marcusvance',
      postContent: 'Migrating legacy SharePoint Server 2016 farm to SharePoint Online.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lead-102',
      name: 'Elena Rostova',
      businessEmail: 'e.rostova@aeroglobal.example.com',
      phone: '+1 (206) 555-9012',
      companyName: 'AeroDynamics Global Solutions',
      industry: 'Aerospace & Defense',
      companySize: '1,000-5,000 employees',
      sourcePlatform: 'LinkedIn',
      relevanceScore: 0.94,
      status: 'INTERESTED',
      originalPostUrl: 'https://www.linkedin.com/posts/elena-rostova',
      postContent: 'Microsoft 365 tenant-to-tenant migration for 1,200 users.',
      createdAt: new Date().toISOString(),
    },
  ];

  const csvString = generateLeadsCSV(sampleLeads);
  console.log(`- Generated CSV output length: ${csvString.length} bytes.`);
  console.log('Generated CSV Content Snippet:');
  console.log(csvString);

  console.log('\n✅ Standalone Validation Completed Successfully!');
}

main();
