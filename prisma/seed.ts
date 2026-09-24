import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enum constants matching domain specifications
export const UserRole = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  SDR: 'SDR',
} as const;

export const ValidationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const LeadStatus = {
  NEW: 'NEW',
  QUALIFIED: 'QUALIFIED',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  UNRESPONSIVE: 'UNRESPONSIVE',
} as const;

export const CampaignType = {
  CALLING_ONLY: 'CALLING_ONLY',
  LEADS_PLUS_CALLING: 'LEADS_PLUS_CALLING',
} as const;

export const CampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;

export const CallDisposition = {
  INTERESTED: 'INTERESTED',
  CALLBACK: 'CALLBACK',
  VOICEMAIL: 'VOICEMAIL',
  FAILED: 'FAILED',
} as const;

export const PlanTier = {
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  ENTERPRISE: 'ENTERPRISE',
} as const;

async function main() {
  console.log('🌱 Starting AI Sales Agent Platform database seed...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.voiceCall.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.subscriptionUsage.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 1. Create Users with RBAC and Encrypted API Keys
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@leadpoint.ai',
      name: 'Sarah Vance',
      role: UserRole.ADMIN,
      passwordHash: '$2a$12$e8kZJ1pM/0/O38w408gW9uXyE1mE2e3u4i5o6p7q8r9s0t1u2v3w4', // Mock bcrypt hash
      encryptedApiKey: 'enc_api_key_admin_9f8a3b2c1d4e5f6g7h8i9j0k',
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@cloudscale-solutions.com',
      name: 'Michael Ross',
      role: UserRole.CLIENT,
      passwordHash: '$2a$12$e8kZJ1pM/0/O38w408gW9uXyE1mE2e3u4i5o6p7q8r9s0t1u2v3w4',
      encryptedApiKey: 'enc_api_key_client_1a2b3c4d5e6f7g8h9i0j1k2l',
    },
  });

  const sdrUser = await prisma.user.create({
    data: {
      email: 'sdr@cloudscale-solutions.com',
      name: 'David Chen',
      role: UserRole.SDR,
      passwordHash: '$2a$12$e8kZJ1pM/0/O38w408gW9uXyE1mE2e3u4i5o6p7q8r9s0t1u2v3w4',
      encryptedApiKey: 'enc_api_key_sdr_3c4d5e6f7g8h9i0j1k2l3m4n',
    },
  });

  console.log('👤 Created Users (ADMIN, CLIENT, SDR) with encrypted API keys.');

  // 1b. Create Accounts for Third-Party Integrations
  await prisma.account.createMany({
    data: [
      {
        userId: clientUser.id,
        provider: 'linkedin',
        providerAccountId: 'urn:li:developer:98234102',
        encryptedApiKey: 'enc_linkedin_secret_key_88231940123984',
        accessTokenEncrypted: 'enc_access_token_linkedin_v2_991823',
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
      {
        userId: clientUser.id,
        provider: 'retell_voice',
        providerAccountId: 'retell_agent_acc_77123901',
        encryptedApiKey: 'enc_retell_key_live_9912039182039182',
        accessTokenEncrypted: 'enc_retell_bearer_token_129840',
      },
      {
        userId: clientUser.id,
        provider: 'openai',
        providerAccountId: 'org-leadpoint-ai-prod',
        encryptedApiKey: 'enc_sk_proj_99123847192837192837',
      },
    ],
  });

  console.log('🔐 Created Account records for third-party integrations (LinkedIn, Retell Voice, OpenAI).');

  // 2. Create Company Profile with Vector Embedding
  // Generating a realistic 1536-dimensional float array summary mock for vector search
  const mockVectorEmbedding = JSON.stringify(
    Array.from({ length: 32 }, (_, i) => Math.sin(i * 0.15).toFixed(4))
  );

  const companyProfile = await prisma.companyProfile.create({
    data: {
      userId: clientUser.id,
      name: 'CloudScale Consulting Group',
      website: 'https://www.cloudscaleconsulting.example.com',
      description: 'Enterprise IT consulting firm specializing in SharePoint Server 2016/2019 to SharePoint Online modernizations, Microsoft 365 tenant-to-tenant migrations, Azure identity governance, and Zero Trust security architectures.',
      targetKeywords: JSON.stringify([
        'SharePoint Migration',
        'Microsoft 365 Migration',
        'Tenant to Tenant Migration',
        'Cloud Modernization',
        'Azure AD Security',
        'SharePoint On-Premises EOL',
      ]),
      vectorEmbedding: mockVectorEmbedding,
      validationStatus: ValidationStatus.APPROVED,
      offerings: JSON.stringify({
        services: [
          {
            id: 'srv-1',
            title: 'SharePoint Online Migration & Modernization',
            description: 'Seamless transition from legacy SharePoint Server on-premise to Microsoft 365 SharePoint Online with zero downtime.',
            pricingModel: 'Fixed Scope / Project Based',
            avgTimeline: '4-12 weeks',
          },
          {
            id: 'srv-2',
            title: 'M365 Tenant-to-Tenant Consolidation',
            description: 'Post-M&A tenant unification including Exchange Online, Teams, OneDrive, and SharePoint restructuring.',
            pricingModel: 'Per User Tiered ($25-$45/seat)',
            avgTimeline: '2-6 weeks',
          },
          {
            id: 'srv-3',
            title: 'Microsoft 365 Security & Compliance Audit',
            description: 'PIM, Conditional Access, Purview DLP, and Microsoft Defender implementation for migrated environments.',
            pricingModel: 'Fixed Audit Fee ($15,000)',
            avgTimeline: '2 weeks',
          },
        ],
      }),
    },
  });

  console.log('🏢 Created Company Profile with Vector Embeddings & APPROVED status.');

  // 3. Create 5 Realistic Enterprise Leads Sourced from LinkedIn & X/Twitter
  const lead1 = await prisma.lead.create({
    data: {
      companyProfileId: companyProfile.id,
      name: 'Marcus Vance',
      businessEmail: 'marcus.vance@nexusfintech.example.com',
      phone: '+1 (415) 890-1243',
      linkedinUrl: 'https://www.linkedin.com/in/marcusvance-fintech',
      companyName: 'Nexus Financial Technologies',
      industry: 'Financial Services / Fintech',
      companySize: '250-500 employees',
      sourcePlatform: 'LinkedIn',
      originalPostUrl: 'https://www.linkedin.com/posts/marcusvance_sharepoint2016-cloudmigration-itops-activity-71982341209',
      postContent: 'We are currently evaluating vendors to migrate our 4TB legacy SharePoint Server 2016 farm to SharePoint Online before Q4. Any recommendations for Microsoft Gold partners with financial compliance experience?',
      relevanceScore: 0.96,
      status: LeadStatus.QUALIFIED,
      enrichedData: JSON.stringify({
        funding: 'Series C ($45M)',
        headquarters: 'San Francisco, CA',
        techStack: ['SharePoint Server 2016', 'Active Directory', 'Exchange 2019', 'VMware ESXi', 'Oracle DB'],
        hiringSignals: ['Hiring Senior Cloud Architect', 'Hiring M365 Systems Administrator'],
        growthRateYOY: '32%',
        decisionMakerLevel: 'VP of Infrastructure',
      }),
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      companyProfileId: companyProfile.id,
      name: 'Elena Rostova',
      businessEmail: 'e.rostova@aeroglobal.example.com',
      phone: '+1 (206) 555-9012',
      linkedinUrl: 'https://www.linkedin.com/in/elena-rostova-cio',
      companyName: 'AeroDynamics Global Solutions',
      industry: 'Aerospace & Defense Consulting',
      companySize: '1,000-5,000 employees',
      sourcePlatform: 'LinkedIn',
      originalPostUrl: 'https://www.linkedin.com/posts/elena-rostova-cio_m365-tenant-migration-aerospace-activity-719210948301',
      postContent: 'Struggling with our recent acquisition\'s IT setup. Need to execute a Microsoft 365 tenant-to-tenant migration for 1,200 users without interrupting ongoing defense contracting workflows. M365 experts hit me up!',
      relevanceScore: 0.94,
      status: LeadStatus.INTERESTED,
      enrichedData: JSON.stringify({
        funding: 'Private Equity / Subsidiary of AeroCorp',
        headquarters: 'Seattle, WA',
        techStack: ['Microsoft 365 Commercial', 'GCC High', 'Okta', 'ServiceNow', 'AWS Cloud'],
        hiringSignals: ['Recent Acquisition of TechVector Corp', 'Expanding Defense IT Division'],
        growthRateYOY: '18%',
        decisionMakerLevel: 'Chief Information Officer (CIO)',
      }),
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      companyProfileId: companyProfile.id,
      name: 'Robert Sterling',
      businessEmail: 'rsterling@apexhealth.example.org',
      phone: '+1 (312) 774-8831',
      linkedinUrl: 'https://www.linkedin.com/in/robert-sterling-healthit',
      companyName: 'Apex Healthcare Network',
      industry: 'Healthcare & Hospitals',
      companySize: '500-1,000 employees',
      sourcePlatform: 'LinkedIn',
      originalPostUrl: 'https://www.linkedin.com/posts/robert-sterling-it/hipaa-m365-sharepointonline-activity-71899120431',
      postContent: 'Our HIPAA compliance review flagged our legacy on-premise SharePoint 2013 document management system. Looking to engage a specialized MS Gold Partner to migrate us to M365 Purview & SharePoint Online.',
      relevanceScore: 0.91,
      status: LeadStatus.CONTACTED,
      enrichedData: JSON.stringify({
        funding: 'Non-Profit Healthcare System ($120M Annual Rev)',
        headquarters: 'Chicago, IL',
        techStack: ['SharePoint 2013', 'Epic EHR System', 'Windows Server 2012 R2', 'Azure AD Free'],
        hiringSignals: ['Hiring Compliance Specialist', 'Upgrading Hospital IT Infrastructure'],
        growthRateYOY: '12%',
        decisionMakerLevel: 'Director of IT Operations',
      }),
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      companyProfileId: companyProfile.id,
      name: 'Samantha Wu',
      businessEmail: 'sam.wu@omniretail.example.com',
      phone: '+1 (212) 431-9080',
      linkedinUrl: 'https://www.linkedin.com/in/samanthawu-arch',
      companyName: 'OmniRetail Corp',
      industry: 'Retail & E-commerce',
      companySize: '5,000+ employees',
      sourcePlatform: 'X/Twitter',
      originalPostUrl: 'https://x.com/samwu_arch/status/1789012398410293',
      postContent: 'Anyone done a large-scale Google Workspace to Microsoft 365 migration with over 50TB of Drive & SharePoint content? Drop your recommended migration tools or consulting partners below.',
      relevanceScore: 0.88,
      status: LeadStatus.NEW,
      enrichedData: JSON.stringify({
        funding: 'Publicly Traded ($800M Revenue)',
        headquarters: 'New York, NY',
        techStack: ['Google Workspace', 'Shopify Plus', 'Salesforce CRM', 'Workday ERP'],
        hiringSignals: ['Transitioning to Microsoft Ecosystem', 'Hiring Enterprise Architect'],
        growthRateYOY: '24%',
        decisionMakerLevel: 'Head of Enterprise Architecture',
      }),
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      companyProfileId: companyProfile.id,
      name: 'David Thorne',
      businessEmail: 'dthorne@horizonlogistics.example.com',
      phone: '+1 (470) 321-6549',
      linkedinUrl: 'https://www.linkedin.com/in/david-thorne-logistics',
      companyName: 'Horizon Logistics Solutions',
      industry: 'Logistics & Supply Chain',
      companySize: '100-250 employees',
      sourcePlatform: 'LinkedIn',
      originalPostUrl: 'https://www.linkedin.com/posts/david-thorne-logistics/sharepoint-modernization-cloud-activity-71765432109',
      postContent: 'Exploring options to phase out our custom internal intranet built on SharePoint 2019. We want a modern Microsoft Teams + SharePoint portal with automated workflows.',
      relevanceScore: 0.85,
      status: LeadStatus.UNRESPONSIVE,
      enrichedData: JSON.stringify({
        funding: 'Bootstrapped / Profitable',
        headquarters: 'Atlanta, GA',
        techStack: ['SharePoint 2019', 'Power Automate', 'Microsoft Teams', 'QuickBooks Enterprise'],
        hiringSignals: ['Expanding Logistics Hubs in Southeast'],
        growthRateYOY: '15%',
        decisionMakerLevel: 'IT Director',
      }),
    },
  });

  console.log('🎯 Seeded 5 Realistic Enterprise Leads with LinkedIn SharePoint & IT project posts.');

  // 4. Create Outreach Campaigns (CALLING_ONLY & LEADS_PLUS_CALLING)
  const campaign1 = await prisma.campaign.create({
    data: {
      userId: clientUser.id,
      name: 'Q3 Enterprise SharePoint Modernization Outreach',
      type: CampaignType.LEADS_PLUS_CALLING,
      status: CampaignStatus.ACTIVE,
      scheduleCron: '0 9 * * 1-5',
      timezone: 'America/New_York',
      retryCount: 3,
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      userId: clientUser.id,
      name: 'M365 Tenant Migration Urgent Blitz',
      type: CampaignType.CALLING_ONLY,
      status: CampaignStatus.COMPLETED,
      scheduleCron: '0 10 * * 1-5',
      timezone: 'America/Los_Angeles',
      retryCount: 2,
    },
  });

  console.log('📢 Created Sales Campaigns (CALLING_ONLY & LEADS_PLUS_CALLING).');

  // 5. Create Realistic Voice Call Records with Transcripts & Sentiments
  await prisma.voiceCall.create({
    data: {
      leadId: lead2.id,
      campaignId: campaign2.id,
      durationSeconds: 142,
      sentiment: 'Highly Enthusiastic & Urgent',
      disposition: CallDisposition.INTERESTED,
      summary: 'Spoke with Elena Rostova regarding their 1,200-user M365 tenant-to-tenant migration following the TechVector acquisition. She confirmed the timeline is tight (needs completion before end of Q3) and asked for a formal capability statement and technical proposal by Friday.',
      nextBestAction: 'Send M365 Tenant Migration Case Study and schedule a 30-minute discovery call with Principal Migration Architect.',
      audioUrl: 'https://storage.leadpoint.ai/recordings/call_aero_rostova_20260918.mp3',
      transcript: `[00:00] AI Agent: "Hello Elena, this is Alex calling from CloudScale Consulting. I saw your recent post regarding AeroDynamics' upcoming Microsoft 365 tenant-to-tenant migration for 1,200 users. Am I catching you at a good time?"
[00:14] Elena Rostova: "Hi Alex. Yes, perfect timing actually. We just finalized the acquisition details and the migration timeline is extremely tight."
[00:25] AI Agent: "Understood! We specialize in complex M365 tenant consolidations with zero user downtime, including GCC High compliance if needed. Are you looking for end-to-end execution or migration assistance?"
[00:40] Elena Rostova: "We need full end-to-end execution, specifically preserving Teams chat history, SharePoint permissions, and Exchange mailboxes. Can you send over a proposal and case studies?"
[00:55] AI Agent: "Absolutely. I will email our tenant migration blueprint and set up a call with our Principal Migration Architect for Thursday at 2 PM EST. Does that work for you?"
[01:10] Elena Rostova: "Thursday at 2 PM EST works great. Looking forward to it."
[01:22] AI Agent: "Fantastic! Check your email shortly. Have a great day, Elena!"`,
    },
  });

  await prisma.voiceCall.create({
    data: {
      leadId: lead1.id,
      campaignId: campaign1.id,
      durationSeconds: 185,
      sentiment: 'Receptive but Guarded',
      disposition: CallDisposition.CALLBACK,
      summary: 'Marcus validated that Nexus Financial is actively seeking a vendor to migrate 4TB of data off SharePoint 2016. He requested an initial discovery call next Tuesday morning after their internal IT steer-co meeting.',
      nextBestAction: 'Follow up via email on Monday afternoon to confirm Tuesday 10 AM EST meeting.',
      audioUrl: 'https://storage.leadpoint.ai/recordings/call_nexus_vance_20260919.mp3',
      transcript: `[00:00] AI Agent: "Hi Marcus, this is Jordan from CloudScale Consulting. I noticed your post inquiring about SharePoint 2016 to SharePoint Online migration partners for financial services compliance."
[00:15] Marcus Vance: "Hi Jordan. Yes, that's right. We have about 4TB of legacy document libraries with strict audit requirements."
[00:30] AI Agent: "That fits our exact expertise. We have automated migration pathways designed specifically for FINRA and SEC compliance. Would you be open to a 20-minute technical brief?"
[00:50] Marcus Vance: "I have our quarterly steer-co meeting on Monday. Call me back on Tuesday morning around 10 AM EST and we can get into details."
[01:15] AI Agent: "Will do, Marcus. I will send a calendar placeholder for Tuesday at 10 AM EST. Talk to you then!"`,
    },
  });

  await prisma.voiceCall.create({
    data: {
      leadId: lead3.id,
      campaignId: campaign1.id,
      durationSeconds: 45,
      sentiment: 'Neutral / Voicemail',
      disposition: CallDisposition.VOICEMAIL,
      summary: 'Reached Robert Sterling\'s voicemail. Left a concise message introducing CloudScale\'s HIPAA-compliant SharePoint Online migration capabilities.',
      nextBestAction: 'Send follow-up email with HIPAA compliance migration whitepaper.',
      audioUrl: 'https://storage.leadpoint.ai/recordings/call_apex_sterling_voicemail.mp3',
      transcript: `[00:00] Automated System: "You have reached the voicemail of Robert Sterling, Director of IT Operations. Please leave a message after the tone."
[00:08] AI Agent: "Hi Robert, this is Alex from CloudScale Consulting following up on your post regarding HIPAA-compliant SharePoint Online modernization. We specialize in healthcare document migrations with Microsoft Purview DLP enforcement. Please reach us back at 1-800-555-0199 or reply to the email I just sent. Thank you!"`,
    },
  });

  console.log('📞 Seeded Voice Call transcripts and AI call logs.');

  // 6. Subscription & Voice Usage Setup
  const subscription = await prisma.subscription.create({
    data: {
      userId: clientUser.id,
      plan: PlanTier.GROWTH,
      status: 'ACTIVE',
      currentPeriodEnd: new Date('2026-10-31T23:59:59.000Z'),
    },
  });

  await prisma.subscriptionUsage.create({
    data: {
      userId: clientUser.id,
      subscriptionId: subscription.id,
      plan: PlanTier.GROWTH,
      minutesUsed: 145,
      minutesLimit: 1000,
      contactCredits: 320,
      contactCreditsLimit: 2500,
      billingCycleEnd: new Date('2026-10-31T23:59:59.000Z'),
    },
  });

  console.log('💳 Seeded Subscription & VoiceUsage records for GROWTH plan tier.');

  // 7. Initial System Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_BOOTSTRAP',
        ipAddress: '127.0.0.1',
        userAgent: 'LeadPoint-CLI/1.0.0',
        metadata: JSON.stringify({ event: 'Platform database schema initialized and seeded' }),
      },
      {
        userId: clientUser.id,
        action: 'PROFILE_APPROVED',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        metadata: JSON.stringify({ companyProfile: 'CloudScale Consulting Group' }),
      },
      {
        userId: clientUser.id,
        action: 'CAMPAIGN_LAUNCHED',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        metadata: JSON.stringify({ campaignName: 'Q3 Enterprise SharePoint Modernization Outreach' }),
      },
    ],
  });

  console.log('📜 Seeded Audit Logs.');
  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
