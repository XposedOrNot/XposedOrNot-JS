#!/usr/bin/env npx tsx
/**
 * Check if a password has been exposed in data breaches
 * Usage: npx tsx examples/check-password.ts <password>
 *
 * SECURITY: The password is hashed locally with Keccak-512 and only the
 * first 10 characters of the hash are sent to the API (k-anonymity).
 * The password itself never leaves your machine.
 */

import { XposedOrNot, ValidationError, RateLimitError } from '../src/index.js';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function color(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${COLORS.reset}`;
}

async function checkPassword(password: string): Promise<void> {
  const xon = new XposedOrNot();

  const line = '═'.repeat(60);
  console.log(color(line, COLORS.cyan));
  console.log(color('  XposedOrNot - Password Exposure Check', COLORS.bold, COLORS.cyan));
  console.log(color(line, COLORS.cyan));
  console.log();
  console.log(color('  Your password is hashed locally and never transmitted.', COLORS.dim));
  console.log();

  try {
    const result = await xon.checkPassword(password);

    console.log(`  Hash prefix sent: ${color(result.anon, COLORS.dim)}`);
    console.log();

    if (result.found) {
      console.log(color('  ✗ EXPOSED!', COLORS.bold, COLORS.red));
      console.log(
        color(
          `    This password appears ${result.count.toLocaleString('en-US')} time(s) in known breaches.`,
          COLORS.red
        )
      );
      console.log(color('    Do NOT use this password anywhere.', COLORS.red, COLORS.bold));

      if (result.characteristics) {
        const c = result.characteristics;
        console.log();
        console.log(color('  Password characteristics:', COLORS.yellow));
        console.log(`    Length: ${c.length}`);
        console.log(`    Alphabetic: ${c.alphabets}  Digits: ${c.digits}  Special: ${c.special}`);
      }
    } else {
      console.log(color('  ✓ GOOD NEWS!', COLORS.bold, COLORS.green));
      console.log(color('    This password was not found in known breaches.', COLORS.green));
      console.log(color('    (That alone does not make it a strong password.)', COLORS.dim));
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(color(`  ✗ Invalid password: ${error.message}`, COLORS.red));
    } else if (error instanceof RateLimitError) {
      console.log(color('  ✗ Rate limit exceeded. Please try again later.', COLORS.yellow));
    } else {
      console.log(color(`  ✗ Error: ${error}`, COLORS.red));
    }
  }

  console.log();
  console.log(color(line, COLORS.cyan));
  console.log(color('  Powered by XposedOrNot.com', COLORS.dim));
  console.log(color(line, COLORS.cyan));
}

const password = process.argv[2];

if (!password) {
  console.log();
  console.log(color('Usage:', COLORS.bold), 'npx tsx examples/check-password.ts <password>');
  console.log();
  console.log(color('Example:', COLORS.dim));
  console.log('  npx tsx examples/check-password.ts hunter2');
  console.log();
  process.exit(1);
}

checkPassword(password);
