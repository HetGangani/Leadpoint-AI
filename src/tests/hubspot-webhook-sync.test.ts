import crypto from 'crypto';
import {
  verifyHubSpotWebhookSignature,
  processHubSpotWebhookEvents,
  getValidHubSpotAccessToken,
  saveHubSpotConnection,
  encryptToken,
  decryptToken,
  HubSpotWebhookEvent,
} from '../lib/hubspot-service';
import { prisma } from '../lib/prisma';
import { LeadStatus } from '../types';

export async function runHubSpotWebhookSyncTests(): Promise<
  Array<{ name: string; passed: boolean; error?: string }>
> {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message || String(err) });
    }
  };

  const testSecret = 'test-hubspot-app-secret-12345';
  const testPortalId = '247522848';
  const testUrl = 'https://urging-headway-cardinal.ngrok-free.dev/api/webhooks/hubspot';

  // Helper to compute valid signature
  const computeSignature = (method: string, url: string, rawBody: string, timestamp: string) => {
    const dataToSign = `${method.toUpperCase()}${url}${rawBody}${timestamp}`;
    return crypto.createHmac('sha256', testSecret).update(dataToSign, 'utf8').digest('base64');
  };

  // Setup: Ensure a primary tenant User and CompanyProfile exist in database
  const tenantEmail = 'hubspot-webhook-tenant@example.com';
  let tenantUser = await prisma.user.findUnique({
    where: { email: tenantEmail },
    include: { companyProfile: true },
  });

  if (!tenantUser) {
    tenantUser = await prisma.user.create({
      data: {
        email: tenantEmail,
        name: 'HubSpot Webhook Tenant',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'CLIENT',
        companyProfile: {
          create: {
            name: 'Webhook Corp',
            website: 'https://webhookcorp.example.com',
            description: 'Cloud Modernization Solutions',
            targetKeywords: JSON.stringify(['M365', 'Azure', 'SharePoint']),
            offerings: JSON.stringify([{ title: 'Cloud Migration', pricingModel: 'Fixed' }]),
          },
        },
      },
      include: { companyProfile: true },
    });
  }

  // Ensure tenant has connected HubSpot Account integration
  await saveHubSpotConnection({
    userId: tenantUser.id,
    tokens: {
      accessToken: 'test-hubspot-access-token',
      refreshToken: 'test-hubspot-refresh-token',
      expiresIn: 3600,
      tokenType: 'bearer',
      hubId: testPortalId,
    },
    portalId: testPortalId,
  });

  const companyProfileId = tenantUser.companyProfile!.id;

  // ========================================================
  // 1. WEBHOOK SECURITY TESTS
  // ========================================================

  await runTest('HubSpot Webhook Security - Valid Signature & Fresh Timestamp', async () => {
    const timestamp = Date.now().toString();
    const rawBody = JSON.stringify([{ eventId: 1, subscriptionType: 'contact.creation', objectId: 101 }]);
    const signature = computeSignature('POST', testUrl, rawBody, timestamp);

    const verification = verifyHubSpotWebhookSignature({
      method: 'POST',
      requestUrl: testUrl,
      rawBody,
      signatureHeader: signature,
      timestampHeader: timestamp,
      clientSecret: testSecret,
    });

    if (!verification.valid) {
      throw new Error(`Expected signature to be valid, got error: ${verification.error}`);
    }
  });

  await runTest('HubSpot Webhook Security - Missing Signature Header Rejection', async () => {
    const timestamp = Date.now().toString();
    const verification = verifyHubSpotWebhookSignature({
      method: 'POST',
      requestUrl: testUrl,
      rawBody: '{}',
      signatureHeader: null,
      timestampHeader: timestamp,
      clientSecret: testSecret,
    });

    if (verification.valid) {
      throw new Error('Verification should fail when signature header is missing');
    }
    if (!verification.error?.includes('Missing X-HubSpot-Signature-v3')) {
      throw new Error(`Unexpected error message: ${verification.error}`);
    }
  });

  await runTest('HubSpot Webhook Security - Missing Timestamp Header Rejection', async () => {
    const verification = verifyHubSpotWebhookSignature({
      method: 'POST',
      requestUrl: testUrl,
      rawBody: '{}',
      signatureHeader: 'some-signature',
      timestampHeader: null,
      clientSecret: testSecret,
    });

    if (verification.valid) {
      throw new Error('Verification should fail when timestamp header is missing');
    }
  });

  await runTest('HubSpot Webhook Security - Stale Timestamp Rejection (> 5 min skew)', async () => {
    const staleTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes ago
    const rawBody = '{}';
    const signature = computeSignature('POST', testUrl, rawBody, staleTimestamp);

    const verification = verifyHubSpotWebhookSignature({
      method: 'POST',
      requestUrl: testUrl,
      rawBody,
      signatureHeader: signature,
      timestampHeader: staleTimestamp,
      clientSecret: testSecret,
    });

    if (verification.valid) {
      throw new Error('Verification should fail for replay attack with stale timestamp');
    }
    if (!verification.error?.includes('replay window')) {
      throw new Error(`Expected replay window error, got: ${verification.error}`);
    }
  });

  await runTest('HubSpot Webhook Security - Tampered Body Rejection', async () => {
    const timestamp = Date.now().toString();
    const originalBody = '{"message":"hello"}';
    const tamperedBody = '{"message":"tampered"}';
    const signature = computeSignature('POST', testUrl, originalBody, timestamp);

    const verification = verifyHubSpotWebhookSignature({
      method: 'POST',
      requestUrl: testUrl,
      rawBody: tamperedBody,
      signatureHeader: signature,
      timestampHeader: timestamp,
      clientSecret: testSecret,
    });

    if (verification.valid) {
      throw new Error('Verification should fail when body is tampered');
    }
  });

  // ========================================================
  // 2. TOKEN MANAGEMENT & REFRESH TESTS
  // ========================================================

  await runTest('HubSpot Token Management - Valid Token Retrieval', async () => {
    const token = await getValidHubSpotAccessToken(tenantUser.id);
    if (token !== 'test-hubspot-access-token') {
      throw new Error('Failed to retrieve decrypted valid access token');
    }
  });

  await runTest('HubSpot Token Management - Automatic Token Refresh When Expired', async () => {
    // Set account expiration in the past
    await prisma.account.updateMany({
      where: { userId: tenantUser.id, provider: 'hubspot' },
      data: {
        expiresAt: new Date(Date.now() - 10000), // Expired 10s ago
      },
    });

    const originalFetch = global.fetch;
    const origClientId = process.env.HUBSPOT_CLIENT_ID;
    const origClientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    process.env.HUBSPOT_CLIENT_ID = 'test-client-id';
    process.env.HUBSPOT_CLIENT_SECRET = 'test-client-secret';

    global.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          token_type: 'bearer',
          access_token: 'refreshed-hubspot-access-token-999',
          refresh_token: 'refreshed-hubspot-refresh-token-999',
          expires_in: 3600,
          hub_id: 247522848,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const refreshedToken = await getValidHubSpotAccessToken(tenantUser.id);
      if (refreshedToken !== 'refreshed-hubspot-access-token-999') {
        throw new Error(`Expected refreshed token, got: ${refreshedToken}`);
      }

      // Verify DB was updated with new encrypted tokens
      const updatedAccount = await prisma.account.findFirst({
        where: { userId: tenantUser.id, provider: 'hubspot' },
      });
      const decrypted = decryptToken(updatedAccount!.accessTokenEncrypted!);
      if (decrypted !== 'refreshed-hubspot-access-token-999') {
        throw new Error('Database did not persist new encrypted access token');
      }
    } finally {
      global.fetch = originalFetch;
      process.env.HUBSPOT_CLIENT_ID = origClientId;
      process.env.HUBSPOT_CLIENT_SECRET = origClientSecret;
    }
  });

  // ========================================================
  // 3. TENANT ISOLATION TESTS
  // ========================================================

  await runTest('HubSpot Webhook - Unknown Portal ID Rejection (No Tenant Guessing)', async () => {
    const unknownPortalEvent: HubSpotWebhookEvent = {
      eventId: `unknown-portal-${Date.now()}`,
      portalId: '999999999', // Unknown portal
      subscriptionType: 'contact.creation',
      objectId: '888001',
    };

    const initialLeadCount = await prisma.lead.count();

    const res = await processHubSpotWebhookEvents([unknownPortalEvent]);
    if (res.createdLeads !== 0) {
      throw new Error('Leads must not be created for unknown portal ID');
    }
    if (res.skipped !== 1) {
      throw new Error('Event for unknown portal should be skipped');
    }

    const finalLeadCount = await prisma.lead.count();
    if (finalLeadCount !== initialLeadCount) {
      throw new Error('Lead count changed for unknown portal ID!');
    }
  });

  await runTest('HubSpot Webhook - Cross-Tenant Isolation Enforcement', async () => {
    // Create second tenant
    const secondTenantEmail = 'second-tenant@example.com';
    let secondUser = await prisma.user.findUnique({
      where: { email: secondTenantEmail },
      include: { companyProfile: true },
    });
    if (!secondUser) {
      secondUser = await prisma.user.create({
        data: {
          email: secondTenantEmail,
          name: 'Second Tenant',
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          role: 'CLIENT',
          companyProfile: {
            create: {
              name: 'Second Corp',
              website: 'https://secondcorp.example.com',
              description: 'Cybersecurity',
              targetKeywords: JSON.stringify(['Security', 'SOC']),
              offerings: JSON.stringify([]),
            },
          },
        },
        include: { companyProfile: true },
      });
    }

    // Connect second tenant to different portal
    await saveHubSpotConnection({
      userId: secondUser.id,
      tokens: {
        accessToken: 'second-tenant-token',
        refreshToken: 'second-tenant-refresh',
        expiresIn: 3600,
        tokenType: 'bearer',
        hubId: 888777666,
      },
      portalId: 888777666,
    });

    // Send event from tenant 1 portal
    const contactId = `tenant-iso-${Date.now()}`;
    const event: HubSpotWebhookEvent = {
      eventId: `iso-event-${contactId}`,
      portalId: testPortalId,
      subscriptionType: 'contact.creation',
      objectId: contactId,
    };

    // Mock HubSpot contact fetch
    const originalFetch = global.fetch;
    global.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          id: contactId,
          properties: {
            email: `iso-${contactId}@example.com`,
            firstname: 'Isolated',
            lastname: 'Prospect',
            company: 'Isolation Corp',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      await processHubSpotWebhookEvents([event]);

      // Check lead belongs to tenant 1 and NOT tenant 2
      const lead = await prisma.lead.findFirst({
        where: { hubspotContactId: contactId },
      });

      if (!lead) throw new Error('Lead was not created for tenant 1');
      if (lead.companyProfileId !== tenantUser.companyProfile!.id) {
        throw new Error('Lead was not attached to tenant 1 CompanyProfile');
      }
      if (lead.companyProfileId === secondUser.companyProfile!.id) {
        throw new Error('Tenant isolation breach: Lead attached to tenant 2!');
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ========================================================
  // 4. CONTACT SYNCHRONIZATION TESTS
  // ========================================================

  await runTest('HubSpot Webhook - Contact Creation Synchronization', async () => {
    const contactId = `sync-create-${Date.now()}`;
    const testEmail = `sync-${contactId}@cloudenterprise.example.com`;

    const event: HubSpotWebhookEvent = {
      eventId: `create-event-${contactId}`,
      portalId: testPortalId,
      subscriptionType: 'contact.creation',
      objectId: contactId,
    };

    const originalFetch = global.fetch;
    global.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          id: contactId,
          properties: {
            email: testEmail,
            firstname: 'Morgan',
            lastname: 'Vance',
            phone: '+1 (555) 778-9900',
            company: 'Vance Dynamics',
            jobtitle: 'VP of Engineering',
            website: 'https://vancedynamics.example.com',
            hs_lead_status: 'QUALIFIED',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const res = await processHubSpotWebhookEvents([event]);
      if (res.createdLeads !== 1) {
        throw new Error(`Expected 1 created lead, got ${res.createdLeads}`);
      }

      const lead = await prisma.lead.findFirst({
        where: { hubspotContactId: contactId },
      });

      if (!lead) throw new Error('Lead not found in database');
      if (lead.businessEmail !== testEmail) throw new Error('Email mismatch');
      if (lead.name !== 'Morgan Vance') throw new Error('Name mismatch');
      if (lead.phone !== '+1 (555) 778-9900') throw new Error('Phone mismatch');
      if (lead.companyName !== 'Vance Dynamics') throw new Error('Company mismatch');
      if (lead.crmProvider !== 'hubspot') throw new Error('crmProvider mismatch');
      if (lead.crmSyncStatus !== 'SYNCED') throw new Error('crmSyncStatus mismatch');
      if (!lead.crmLastSyncedAt) throw new Error('crmLastSyncedAt not set');
      if (lead.status !== LeadStatus.QUALIFIED) throw new Error('Status not mapped from hs_lead_status');

      const enriched = JSON.parse(lead.enrichedData);
      if (enriched.jobTitle !== 'VP of Engineering') throw new Error('jobTitle not in enrichedData');
      if (enriched.website !== 'https://vancedynamics.example.com') throw new Error('website not in enrichedData');
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runTest('HubSpot Webhook - Property Change Synchronization', async () => {
    const contactId = `sync-prop-${Date.now()}`;
    const initialEmail = `initial-${contactId}@example.com`;

    // Create initial lead
    await prisma.lead.create({
      data: {
        companyProfileId,
        name: 'Initial Name',
        businessEmail: initialEmail,
        phone: '+1 (555) 111-2222',
        companyName: 'Initial Company',
        industry: 'Tech',
        companySize: '100',
        sourcePlatform: 'HubSpot CRM',
        relevanceScore: 0.85,
        status: LeadStatus.NEW,
        enrichedData: JSON.stringify({}),
        hubspotContactId: contactId,
        crmProvider: 'hubspot',
        crmSyncStatus: 'SYNCED',
        crmLastSyncedAt: new Date(),
      },
    });

    const propertyChangeEvent: HubSpotWebhookEvent = {
      eventId: `prop-change-${contactId}`,
      portalId: testPortalId,
      subscriptionType: 'contact.propertyChange',
      objectId: contactId,
      propertyName: 'phone',
      propertyValue: '+1 (555) 999-0000',
    };

    const res = await processHubSpotWebhookEvents([propertyChangeEvent]);
    if (res.updatedLeads !== 1) {
      throw new Error(`Expected 1 updated lead, got ${res.updatedLeads}`);
    }

    const updatedLead = await prisma.lead.findFirst({
      where: { hubspotContactId: contactId },
    });

    if (updatedLead?.phone !== '+1 (555) 999-0000') {
      throw new Error(`Expected updated phone, got ${updatedLead?.phone}`);
    }
    if (updatedLead?.companyName !== 'Initial Company') {
      throw new Error('Unmodified field was erroneously altered');
    }
  });

  await runTest('HubSpot Webhook - Contact Deletion Handling (Soft Marking)', async () => {
    const contactId = `sync-delete-${Date.now()}`;

    // Create initial lead
    const lead = await prisma.lead.create({
      data: {
        companyProfileId,
        name: 'Deletable Contact',
        businessEmail: `del-${contactId}@example.com`,
        companyName: 'Delete Corp',
        industry: 'Tech',
        companySize: '50',
        sourcePlatform: 'HubSpot CRM',
        relevanceScore: 0.85,
        status: LeadStatus.NEW,
        enrichedData: JSON.stringify({}),
        hubspotContactId: contactId,
        crmProvider: 'hubspot',
        crmSyncStatus: 'SYNCED',
        crmLastSyncedAt: new Date(),
      },
    });

    const deleteEvent: HubSpotWebhookEvent = {
      eventId: `del-event-${contactId}`,
      portalId: testPortalId,
      subscriptionType: 'contact.deletion',
      objectId: contactId,
    };

    const res = await processHubSpotWebhookEvents([deleteEvent]);
    if (res.deletedLeads !== 1) {
      throw new Error(`Expected 1 deleted lead, got ${res.deletedLeads}`);
    }

    // Verify lead still exists in database (not hard deleted, preserving history)
    const existing = await prisma.lead.findUnique({ where: { id: lead.id } });
    if (!existing) {
      throw new Error('Lead was hard deleted instead of soft marked');
    }
    if (existing.crmSyncStatus !== 'DELETED_IN_CRM') {
      throw new Error(`Expected crmSyncStatus DELETED_IN_CRM, got ${existing.crmSyncStatus}`);
    }
  });

  await runTest('HubSpot Webhook - Contact Restore Handling', async () => {
    const contactId = `sync-restore-${Date.now()}`;

    const lead = await prisma.lead.create({
      data: {
        companyProfileId,
        name: 'Restorable Contact',
        businessEmail: `restore-${contactId}@example.com`,
        companyName: 'Restore Corp',
        industry: 'Tech',
        companySize: '50',
        sourcePlatform: 'HubSpot CRM',
        relevanceScore: 0.85,
        status: LeadStatus.NEW,
        enrichedData: JSON.stringify({}),
        hubspotContactId: contactId,
        crmProvider: 'hubspot',
        crmSyncStatus: 'DELETED_IN_CRM',
        crmLastSyncedAt: new Date(),
      },
    });

    const restoreEvent: HubSpotWebhookEvent = {
      eventId: `restore-event-${contactId}`,
      portalId: testPortalId,
      subscriptionType: 'contact.restore',
      objectId: contactId,
    };

    const res = await processHubSpotWebhookEvents([restoreEvent]);
    if (res.updatedLeads !== 1) {
      throw new Error(`Expected 1 updated lead on restore, got ${res.updatedLeads}`);
    }

    const restored = await prisma.lead.findUnique({ where: { id: lead.id } });
    if (restored?.crmSyncStatus !== 'SYNCED') {
      throw new Error(`Expected crmSyncStatus SYNCED after restore, got ${restored?.crmSyncStatus}`);
    }
  });

  // ========================================================
  // 5. DURABLE IDEMPOTENCY & DUPLICATE PREVENTION
  // ========================================================

  await runTest('HubSpot Webhook - Durable Idempotency Prevents Duplicate Processing', async () => {
    const contactId = `idempotent-${Date.now()}`;
    const stableEventId = `stable-evt-${contactId}`;

    const event: HubSpotWebhookEvent = {
      eventId: stableEventId,
      portalId: testPortalId,
      subscriptionType: 'contact.creation',
      objectId: contactId,
    };

    const originalFetch = global.fetch;
    global.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          id: contactId,
          properties: {
            email: `idem-${contactId}@example.com`,
            firstname: 'Idempotent',
            lastname: 'Prospect',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      // First delivery: processes and creates lead
      const res1 = await processHubSpotWebhookEvents([event]);
      if (res1.createdLeads !== 1) {
        throw new Error('First delivery should create 1 lead');
      }

      const initialCount = await prisma.lead.count({
        where: { hubspotContactId: contactId },
      });
      if (initialCount !== 1) throw new Error('Expected exactly 1 lead in DB');

      // Second delivery (e.g. HubSpot retry): should be skipped via WebhookEvent table
      const res2 = await processHubSpotWebhookEvents([event]);
      if (res2.skipped !== 1) {
        throw new Error('Second delivery was not skipped via idempotency check');
      }
      if (res2.createdLeads !== 0) {
        throw new Error('Second delivery created duplicate lead!');
      }

      const afterCount = await prisma.lead.count({
        where: { hubspotContactId: contactId },
      });
      if (afterCount !== 1) {
        throw new Error('Duplicate lead was created on retry!');
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ========================================================
  // 6. AI QUALIFICATION INTEGRATION POINT VERIFICATION
  // ========================================================

  await runTest('HubSpot Webhook - Synced Lead AI Qualification Pipeline Readiness', async () => {
    const contactId = `ai-ready-${Date.now()}`;
    const event: HubSpotWebhookEvent = {
      eventId: `ai-ready-evt-${contactId}`,
      portalId: testPortalId,
      subscriptionType: 'contact.creation',
      objectId: contactId,
    };

    const originalFetch = global.fetch;
    global.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          id: contactId,
          properties: {
            email: `ai-${contactId}@corp.example.com`,
            firstname: 'Jordan',
            lastname: 'Lee',
            company: 'FutureTech Corp',
            hs_lead_status: 'OPEN',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      await processHubSpotWebhookEvents([event]);

      const lead = await prisma.lead.findFirst({
        where: { hubspotContactId: contactId },
      });

      if (!lead) throw new Error('Lead not created');

      // Verify lead model is immediately compatible with AI qualification pipeline
      if (lead.status !== LeadStatus.NEW) {
        throw new Error(`Expected initial status NEW, got ${lead.status}`);
      }
      if (lead.relevanceScore <= 0 || lead.relevanceScore > 1) {
        throw new Error('Relevance score out of bounds');
      }

      const enriched = JSON.parse(lead.enrichedData);
      if (enriched.source !== 'HubSpot Dynamic Webhook Sync') {
        throw new Error('Enriched data source missing');
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  return results;
}
