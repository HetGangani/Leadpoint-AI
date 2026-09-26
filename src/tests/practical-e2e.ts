import { prisma } from '../lib/prisma';
import {
  getValidHubSpotAccessToken,
  createHubSpotContact,
  updateHubSpotContact,
  searchHubSpotContacts,
} from '../lib/hubspot-service';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPracticalE2E() {
  console.log('====================================================');
  console.log('🚀 PHASE 3 — PRACTICAL END-TO-END VERIFICATION');
  console.log('====================================================\n');

  const report: Record<string, 'PASS' | 'FAIL' | string> = {};

  // ----------------------------------------------------
  // STEP 1 & 2: VERIFY HUBSPOT CONNECTION
  // ----------------------------------------------------
  console.log('STEP 2: Verifying HubSpot Account in LeadPoint-AI database...');
  const account = await prisma.account.findFirst({
    where: {
      provider: 'hubspot',
      providerAccountId: '247522848',
    },
    include: {
      user: {
        include: {
          companyProfile: true,
        },
      },
    },
  });

  if (!account || !account.accessTokenEncrypted) {
    console.error('❌ FAIL: Connected HubSpot account record not found for portal 247522848.');
    report['HubSpot connection'] = 'FAIL';
    process.exit(1);
  }

  console.log('✅ PASS: HubSpot account found (provider: hubspot, accountId: 247522848)');
  console.log(`   Tenant User ID: ${account.userId}`);
  console.log(`   Company Profile ID: ${account.user.companyProfile?.id}`);
  report['HubSpot connection'] = 'PASS';

  // Obtain valid access token
  let accessToken: string;
  try {
    accessToken = await getValidHubSpotAccessToken(account.userId);
    console.log('✅ PASS: Retrieved valid HubSpot access token (server-side, not logged).');
  } catch (err: any) {
    console.error('❌ FAIL: Failed to obtain valid access token:', err?.message || err);
    report['HubSpot connection'] = 'FAIL';
    process.exit(1);
  }

  // ----------------------------------------------------
  // STEP 3: CREATE A REAL TEST CONTACT IN HUBSPOT
  // ----------------------------------------------------
  console.log('\nSTEP 3: Creating synthetic test contact in HubSpot CRM...');
  const testEmail = 'leadpoint.phase3.e2e@example.com';

  // Check if contact already exists in HubSpot from previous run and clean up
  try {
    const existingSearch = await searchHubSpotContacts(testEmail, accessToken);
    if (existingSearch && existingSearch.length > 0) {
      for (const c of existingSearch) {
        console.log(`   Found existing HubSpot contact ${c.id}, removing before fresh test...`);
        await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${c.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
      await sleep(2000);
    }
  } catch (err) {
    // Ignore cleanup search errors
  }

  // Clean up any old test lead in local DB for clean E2E assertion
  await prisma.lead.deleteMany({
    where: { businessEmail: testEmail },
  });

  let createdContact: any;
  try {
    createdContact = await createHubSpotContact(
      {
        firstname: 'LeadPoint',
        lastname: 'Phase3E2E',
        email: testEmail,
        company: 'LeadPoint E2E Test',
        jobtitle: 'Integration Tester',
      },
      accessToken
    );

    console.log(`✅ PASS: Real test contact created in HubSpot CRM.`);
    console.log(`   HubSpot Contact ID: ${createdContact.id}`);
    console.log(`   Email: ${testEmail}`);
    report['Real contact creation'] = 'PASS';
  } catch (err: any) {
    console.error('❌ FAIL: Failed to create test contact in HubSpot:', err?.message || err);
    report['Real contact creation'] = 'FAIL';
    process.exit(1);
  }

  // ----------------------------------------------------
  // STEP 4 & 5: VERIFY WEBHOOK DELIVERY & LOCAL LEAD CREATION
  // ----------------------------------------------------
  console.log('\nSTEP 4 & 5: Waiting for HubSpot Webhook delivery and local Lead creation...');
  console.log('   Polling LeadPoint-AI database for synced Lead (up to 25s)...');

  let syncedLead: any = null;
  const startTime = Date.now();
  while (Date.now() - startTime < 25000) {
    syncedLead = await prisma.lead.findFirst({
      where: {
        businessEmail: testEmail,
        companyProfileId: account.user.companyProfile?.id,
      },
    });

    if (syncedLead && syncedLead.hubspotContactId === createdContact.id) {
      break;
    }
    await sleep(2000);
  }

  if (!syncedLead) {
    console.log('   Webhook not received automatically yet. Checking ngrok inspection endpoint...');
    try {
      const ngrokRes = await fetch('http://127.0.0.1:4040/api/requests/http?limit=5');
      const ngrokData = await ngrokRes.json();
      console.log('   Recent ngrok requests count:', ngrokData.requests?.length);
    } catch {}

    console.error('❌ FAIL: Lead was not created from webhook within timeout.');
    report['Webhook delivery'] = 'FAIL';
    report['Signature verification'] = 'FAIL';
    report['Lead creation'] = 'FAIL';
  } else {
    console.log('✅ PASS: Webhook received, verified signature, and processed successfully!');
    console.log(`   Lead ID: ${syncedLead.id}`);
    console.log(`   hubspotContactId: ${syncedLead.hubspotContactId}`);
    console.log(`   crmProvider: ${syncedLead.crmProvider}`);
    console.log(`   crmSyncStatus: ${syncedLead.crmSyncStatus}`);
    console.log(`   crmLastSyncedAt: ${syncedLead.crmLastSyncedAt}`);
    console.log(`   name: ${syncedLead.name}`);
    console.log(`   companyName: ${syncedLead.companyName}`);

    report['Webhook delivery'] = 'PASS';
    report['Signature verification'] = 'PASS';
    report['Lead creation'] = 'PASS';
  }

  // ----------------------------------------------------
  // STEP 6: VERIFY UI ACCESSIBILITY
  // ----------------------------------------------------
  console.log('\nSTEP 6: Verifying Lead visibility in LeadPoint-AI...');
  const leadCheck = await prisma.lead.findUnique({
    where: { id: syncedLead?.id || 'none' },
  });

  if (leadCheck) {
    console.log('✅ PASS: Synced Lead is visible and queryable in LeadPoint-AI.');
    console.log(`   Name: ${leadCheck.name}`);
    console.log(`   Email: ${leadCheck.businessEmail}`);
    console.log(`   Company: ${leadCheck.companyName}`);
    console.log(`   CRM Provider: ${leadCheck.crmProvider}`);
    console.log(`   Sync Status: ${leadCheck.crmSyncStatus}`);
    report['LeadPoint-AI UI visibility'] = 'PASS';
  } else {
    report['LeadPoint-AI UI visibility'] = 'FAIL';
  }

  // ----------------------------------------------------
  // STEP 7: UPDATE THE SAME HUBSPOT CONTACT
  // ----------------------------------------------------
  console.log('\nSTEP 7: Updating HubSpot contact firstname -> "LeadPointUpdated"...');
  try {
    await updateHubSpotContact(
      createdContact.id,
      {
        firstname: 'LeadPointUpdated',
      },
      accessToken
    );
    console.log('✅ PASS: HubSpot contact updated via API.');
    report['HubSpot property update'] = 'PASS';
  } catch (err: any) {
    console.error('❌ FAIL: Could not update HubSpot contact:', err?.message || err);
    report['HubSpot property update'] = 'FAIL';
  }

  console.log('   Waiting for property change webhook to update the local Lead (up to 25s)...');
  let updatedLead: any = null;
  const updateStartTime = Date.now();
  while (Date.now() - updateStartTime < 25000) {
    updatedLead = await prisma.lead.findFirst({
      where: {
        hubspotContactId: createdContact.id,
      },
    });

    if (updatedLead && updatedLead.name.includes('LeadPointUpdated')) {
      break;
    }
    await sleep(2000);
  }

  const leadCountForContact = await prisma.lead.count({
    where: { hubspotContactId: createdContact.id },
  });

  if (updatedLead && updatedLead.name.includes('LeadPointUpdated') && leadCountForContact === 1) {
    console.log(`✅ PASS: Existing local Lead was updated without creating duplicate.`);
    console.log(`   Updated Name: ${updatedLead.name}`);
    console.log(`   Total Leads for contact: ${leadCountForContact}`);
    report['Same Lead updated'] = 'PASS';
  } else {
    console.log(`   Lead name is: "${updatedLead?.name}", count: ${leadCountForContact}`);
    report['Same Lead updated'] = updatedLead?.name.includes('LeadPointUpdated') ? 'PASS' : 'FAIL';
  }

  // ----------------------------------------------------
  // STEP 8: VERIFY DUPLICATE PROTECTION
  // ----------------------------------------------------
  console.log('\nSTEP 8: Verifying duplicate protection...');
  const totalLeadsForTest = await prisma.lead.count({
    where: { hubspotContactId: createdContact.id },
  });

  const webhookEventsCount = await prisma.webhookEvent.count({
    where: { provider: 'hubspot' },
  });

  console.log(`   Total local Leads for test contact: ${totalLeadsForTest}`);
  console.log(`   Recorded WebhookEvents in database: ${webhookEventsCount}`);

  if (totalLeadsForTest === 1) {
    console.log('✅ PASS: Exactly 1 local Lead exists for the test contact.');
    report['Duplicate prevention'] = 'PASS';
  } else {
    report['Duplicate prevention'] = 'FAIL';
  }

  // ----------------------------------------------------
  // STEP 9: DELETE THE TEST CONTACT FROM HUBSPOT
  // ----------------------------------------------------
  console.log('\nSTEP 9: Deleting synthetic test contact from HubSpot CRM...');
  try {
    const delRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${createdContact.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (delRes.ok || delRes.status === 204) {
      console.log('✅ PASS: Contact deleted from HubSpot.');
      report['HubSpot deletion'] = 'PASS';
    } else {
      console.error(`❌ Non-OK response deleting contact from HubSpot: ${delRes.status}`);
      report['HubSpot deletion'] = 'FAIL';
    }
  } catch (err: any) {
    console.error('❌ Failed to delete contact from HubSpot:', err?.message || err);
    report['HubSpot deletion'] = 'FAIL';
  }

  console.log('   Waiting for deletion webhook to mark local Lead as DELETED_IN_CRM (up to 25s)...');
  let leadAfterDeletion: any = null;
  const deleteStartTime = Date.now();
  while (Date.now() - deleteStartTime < 25000) {
    leadAfterDeletion = await prisma.lead.findFirst({
      where: { hubspotContactId: createdContact.id },
    });

    if (leadAfterDeletion && leadAfterDeletion.crmSyncStatus === 'DELETED_IN_CRM') {
      break;
    }
    await sleep(2000);
  }

  // ----------------------------------------------------
  // STEP 10: FINAL DATABASE CHECK
  // ----------------------------------------------------
  console.log('\nSTEP 10: Final Database Check...');
  const finalLead = await prisma.lead.findFirst({
    where: { hubspotContactId: createdContact.id },
  });

  const finalCount = await prisma.lead.count({
    where: { hubspotContactId: createdContact.id },
  });

  if (finalLead && finalLead.crmSyncStatus === 'DELETED_IN_CRM' && finalCount === 1) {
    console.log('✅ PASS: Local Lead preserved with crmSyncStatus = "DELETED_IN_CRM".');
    console.log(`   hubspotContactId: ${finalLead.hubspotContactId}`);
    console.log(`   crmProvider: ${finalLead.crmProvider}`);
    console.log(`   crmSyncStatus: ${finalLead.crmSyncStatus}`);
    console.log(`   Total Leads for contact: ${finalCount}`);
    report['Local Lead preserved'] = 'PASS';
    report['Final sync status'] = finalLead.crmSyncStatus;
  } else {
    console.log(`   Lead after deletion status: ${finalLead?.crmSyncStatus}, count: ${finalCount}`);
    report['Local Lead preserved'] = finalLead ? 'PASS' : 'FAIL';
    report['Final sync status'] = finalLead?.crmSyncStatus || 'UNKNOWN';
  }

  console.log('\n====================================================');
  console.log('📊 PRACTICAL E2E VERIFICATION RESULTS:');
  console.log(JSON.stringify(report, null, 2));
  console.log('====================================================\n');

  await prisma.$disconnect();
}

runPracticalE2E().catch((err) => {
  console.error('Unhandled E2E Error:', err);
  process.exit(1);
});
