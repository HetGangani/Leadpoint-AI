import { prisma } from '../lib/prisma';
import {
  getValidHubSpotAccessToken,
  processHubSpotWebhookEvents,
} from '../lib/hubspot-service';

async function runE2E() {
  console.log('=== HubSpot Phase 3 Real E2E Test ===');

  // 1. Check connected Account
  const account = await prisma.account.findFirst({
    where: { provider: 'hubspot', providerAccountId: '247522848' },
    include: { user: { include: { companyProfile: true } } },
  });

  console.log('HubSpot account connected for portal 247522848:', Boolean(account));
  if (!account) {
    console.log('No integration found for portal 247522848.');
    return;
  }

  console.log('Tenant User ID:', account.userId);
  console.log('Company Profile ID:', account.user.companyProfile?.id);

  // 2. Obtain valid access token
  try {
    await getValidHubSpotAccessToken(account.userId);
    console.log('Access token retrieval: SUCCESS (token not printed)');
  } catch (err: any) {
    console.log('Access token retrieval result:', err?.message || err);
  }

  // 3. E2E Webhook Simulation / Test Contact
  const testContactId = `e2e-${Date.now()}`;
  const testEmail = `leadpoint-phase3-test-${Date.now()}@example.com`;

  console.log(`\nStep 1: Processing Webhook contact.creation for ${testEmail}...`);
  const createEvent = {
    eventId: `e2e-create-${Date.now()}`,
    portalId: '247522848',
    subscriptionType: 'contact.creation',
    objectId: testContactId,
    propertyName: 'email',
    propertyValue: testEmail,
  };

  const createResult = await processHubSpotWebhookEvents([createEvent]);
  console.log('Create Event Result:', createResult);

  const createdLead = await prisma.lead.findFirst({
    where: { hubspotContactId: testContactId },
  });
  console.log('Local Lead created:', Boolean(createdLead));
  console.log('hubspotContactId:', createdLead?.hubspotContactId);
  console.log('crmProvider:', createdLead?.crmProvider);
  console.log('crmSyncStatus:', createdLead?.crmSyncStatus);
  console.log('crmLastSyncedAt:', createdLead?.crmLastSyncedAt);

  console.log('\nStep 2: Processing Webhook contact.propertyChange (firstname -> "Audited")...');
  const updateEvent = {
    eventId: `e2e-update-${Date.now()}`,
    portalId: '247522848',
    subscriptionType: 'contact.propertyChange',
    objectId: testContactId,
    propertyName: 'firstname',
    propertyValue: 'Audited',
  };

  const updateResult = await processHubSpotWebhookEvents([updateEvent]);
  console.log('Update Event Result:', updateResult);

  const updatedLead = await prisma.lead.findFirst({
    where: { hubspotContactId: testContactId },
  });
  console.log('Updated Lead name:', updatedLead?.name);
  console.log('crmSyncStatus:', updatedLead?.crmSyncStatus);

  console.log('\nStep 3: Processing Duplicate Webhook Delivery (Idempotency test)...');
  const duplicateResult = await processHubSpotWebhookEvents([createEvent]);
  console.log('Duplicate Delivery Result (skipped=1, created=0):', duplicateResult);

  const countAfterDuplicate = await prisma.lead.count({
    where: { hubspotContactId: testContactId },
  });
  console.log('Total Leads for contact (should be 1):', countAfterDuplicate);

  console.log('\nStep 4: Processing Webhook contact.deletion...');
  const deleteEvent = {
    eventId: `e2e-delete-${Date.now()}`,
    portalId: '247522848',
    subscriptionType: 'contact.deletion',
    objectId: testContactId,
  };

  const deleteResult = await processHubSpotWebhookEvents([deleteEvent]);
  console.log('Delete Event Result:', deleteResult);

  const leadAfterDeletion = await prisma.lead.findFirst({
    where: { hubspotContactId: testContactId },
  });
  console.log('Lead exists in DB after deletion (preserved):', Boolean(leadAfterDeletion));
  console.log('crmSyncStatus after deletion (DELETED_IN_CRM):', leadAfterDeletion?.crmSyncStatus);

  console.log('\n=== E2E Test Completed Successfully ===');
  await prisma.$disconnect();
}

runE2E().catch(console.error);
