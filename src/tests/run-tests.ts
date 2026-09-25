import { runLeadServiceTests } from './lead-service.test';
import { runGeminiVoiceTests } from './gemini-voice.test';
import { runAuthMiddlewareTests } from './auth-middleware.test';
import { runAuthPhase1Tests } from './auth.test';
import { runCalendlyHandoffTests } from './calendly-handoff.test';

async function main() {
  console.log('====================================================');
  console.log('🚀 Running LeadPoint-AI Workflow Automated Test Suite');
  console.log('====================================================\n');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  const allSuiteResults = [
    await runLeadServiceTests(),
    await runGeminiVoiceTests(),
    await runAuthMiddlewareTests(),
    await runAuthPhase1Tests(),
    await runCalendlyHandoffTests(),
  ];

  for (const suite of allSuiteResults) {
    for (const test of suite) {
      totalTests++;
      if (test.passed) {
        totalPassed++;
        console.log(` ✅ PASS: ${test.name}`);
      } else {
        totalFailed++;
        console.log(` ❌ FAIL: ${test.name}`);
        console.log(`    Error: ${test.error}\n`);
      }
    }
  }

  console.log('\n====================================================');
  console.log(`📊 Test Execution Summary:`);
  console.log(`   Total Tests Run: ${totalTests}`);
  console.log(`   Passed:          ${totalPassed}`);
  console.log(`   Failed:          ${totalFailed}`);
  console.log('====================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All Workflow Unit & Integration Tests Passed Successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unhandled test execution error:', err);
  process.exit(1);
});
