/**
 * Basic usage example for xposedornot package
 * Run with: npx tsx examples/basic-usage.ts
 */

import { XposedOrNot, ValidationError, RateLimitError } from '../src/index.js';

async function main() {
  const xon = new XposedOrNot();

  console.log('=== XposedOrNot Package Test ===\n');

  // Test 1: Get all breaches
  console.log('1. Fetching all breaches...');
  try {
    const breaches = await xon.getBreaches();
    console.log(`   ✓ Found ${breaches.length} breaches in database`);
    if (breaches.length > 0) {
      console.log(`   Sample: ${breaches[0]?.breachID} (${breaches[0]?.domain})`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error}`);
  }

  console.log('');

  // Test 2: Check a test email
  console.log('2. Checking email for breaches...');
  const testEmail = 'test@example.co';
  try {
    const result = await xon.checkEmail(testEmail);
    if (result.found) {
      console.log(`   ✓ Email found in ${result.breaches.length} breaches`);
      console.log(
        `   Breaches: ${result.breaches.slice(0, 5).join(', ')}${result.breaches.length > 5 ? '...' : ''}`
      );
    } else {
      console.log(`   ✓ Email not found in any breaches`);
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`   ✗ Rate limited - try again later`);
    } else {
      console.log(`   ✗ Error: ${error}`);
    }
  }

  console.log('');

  // Test 3: Validation error handling
  console.log('3. Testing validation (invalid email)...');
  try {
    await xon.checkEmail('not-an-email');
    console.log('   ✗ Should have thrown validation error');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(`   ✓ Correctly caught validation error: ${error.message}`);
    } else {
      console.log(`   ✗ Unexpected error: ${error}`);
    }
  }

  console.log('');

  // Test 4: Get breach analytics
  console.log('4. Fetching breach analytics...');
  try {
    const analytics = await xon.getBreachAnalytics(testEmail);
    if (analytics.found && analytics.analytics) {
      const breachCount = analytics.analytics.ExposedBreaches?.breaches_details?.length ?? 0;
      console.log(`   ✓ Analytics retrieved`);
      console.log(`   Exposed breaches: ${breachCount}`);
      console.log(
        `   Risk: ${analytics.analytics.BreachMetrics?.risk?.[0]?.risk_label ?? 'Unknown'} (${analytics.analytics.BreachMetrics?.risk?.[0]?.risk_score ?? 0})`
      );
    } else {
      console.log(`   ✓ No analytics data found for this email`);
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`   ✗ Rate limited - try again later`);
    } else {
      console.log(`   ✗ Error: ${error}`);
    }
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
