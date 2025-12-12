/**
 * Test config validation
 */
import { XposedOrNot, ValidationError } from '../src/index.js';

console.log('Testing config validation...\n');

// Test 1: HTTP baseUrl (should fail)
try {
  new XposedOrNot({ baseUrl: 'http://api.xposedornot.com' });
  console.log('❌ HTTP should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ HTTP rejected:', e.message);
  }
}

// Test 2: Invalid URL (should fail)
try {
  new XposedOrNot({ baseUrl: 'not-a-url' });
  console.log('❌ Invalid URL should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ Invalid URL rejected:', e.message);
  }
}

// Test 3: Negative timeout (should fail)
try {
  new XposedOrNot({ timeout: -1 });
  console.log('❌ Negative timeout should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ Negative timeout rejected:', e.message);
  }
}

// Test 4: Zero timeout (should fail)
try {
  new XposedOrNot({ timeout: 0 });
  console.log('❌ Zero timeout should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ Zero timeout rejected:', e.message);
  }
}

// Test 5: Excessive timeout (should fail)
try {
  new XposedOrNot({ timeout: 999999999 });
  console.log('❌ Excessive timeout should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ Excessive timeout rejected:', e.message);
  }
}

// Test 6: Negative retries (should fail)
try {
  new XposedOrNot({ retries: -1 });
  console.log('❌ Negative retries should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ Negative retries rejected:', e.message);
  }
}

// Test 7: Excessive retries (should fail)
try {
  new XposedOrNot({ retries: 100 });
  console.log('❌ Excessive retries should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ Excessive retries rejected:', e.message);
  }
}

// Test 8: Float retries (should fail)
try {
  new XposedOrNot({ retries: 3.5 });
  console.log('❌ Float retries should have been rejected');
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('✅ Float retries rejected:', e.message);
  }
}

console.log('\n--- Valid configurations ---\n');

// Test 9: Valid HTTPS URL (should pass)
try {
  new XposedOrNot({ baseUrl: 'https://custom.api.com' });
  console.log('✅ Valid HTTPS URL accepted');
} catch (e) {
  console.log('❌ Valid HTTPS should have been accepted:', e);
}

// Test 10: Valid config (should pass)
try {
  new XposedOrNot({ timeout: 5000, retries: 5 });
  console.log('✅ Valid config accepted (timeout: 5000, retries: 5)');
} catch (e) {
  console.log('❌ Valid config should have been accepted:', e);
}

// Test 11: Edge case - minimum timeout (should pass)
try {
  new XposedOrNot({ timeout: 1000 });
  console.log('✅ Minimum timeout accepted (1000ms)');
} catch (e) {
  console.log('❌ Minimum timeout should have been accepted:', e);
}

// Test 12: Edge case - zero retries (should pass)
try {
  new XposedOrNot({ retries: 0 });
  console.log('✅ Zero retries accepted (disables retry)');
} catch (e) {
  console.log('❌ Zero retries should have been accepted:', e);
}

console.log('\n✅ All validation tests completed!');
