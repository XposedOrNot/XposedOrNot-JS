#!/usr/bin/env npx tsx
/**
 * Check a single email for data breaches
 * Usage: npx tsx examples/check-single-email.ts <email>
 */

import { XposedOrNot, ValidationError, RateLimitError } from '../src/index.js';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

function color(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${COLORS.reset}`;
}

function printHeader(title: string): void {
  const line = '═'.repeat(60);
  console.log(color(line, COLORS.cyan));
  console.log(color(`  ${title}`, COLORS.bold, COLORS.cyan));
  console.log(color(line, COLORS.cyan));
}

function printSection(title: string): void {
  console.log();
  console.log(color(`▸ ${title}`, COLORS.bold, COLORS.yellow));
  console.log(color('─'.repeat(40), COLORS.dim));
}

function printKeyValue(key: string, value: string | number, indent = 2): void {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}${color(key + ':', COLORS.dim)} ${value}`);
}

function getRiskColor(riskLabel: string): string {
  switch (riskLabel.toLowerCase()) {
    case 'low':
      return COLORS.green;
    case 'medium':
      return COLORS.yellow;
    case 'high':
      return COLORS.red;
    case 'critical':
      return COLORS.bgRed + COLORS.white;
    default:
      return COLORS.white;
  }
}

function getPasswordRiskLabel(risk: string): string {
  switch (risk.toLowerCase()) {
    case 'plaintext':
      return color('⚠ Plain Text (Critical!)', COLORS.red, COLORS.bold);
    case 'easytocrack':
      return color('⚠ Easy to Crack', COLORS.yellow);
    case 'hardtocrack':
      return color('✓ Hard to Crack', COLORS.green);
    default:
      return risk;
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

async function checkEmail(email: string): Promise<void> {
  const xon = new XposedOrNot();

  printHeader(`XposedOrNot - Email Breach Check`);
  console.log();
  console.log(`  Checking: ${color(email, COLORS.bold, COLORS.white)}`);
  console.log();

  try {
    // Get breach analytics (more detailed than checkEmail)
    const result = await xon.getBreachAnalytics(email);

    if (!result.found || !result.analytics) {
      console.log(color('  ✓ GOOD NEWS!', COLORS.bold, COLORS.green));
      console.log(color('    This email was not found in any known data breaches.', COLORS.green));
      console.log();
      return;
    }

    const { analytics } = result;
    const breaches = analytics.ExposedBreaches?.breaches_details ?? [];
    const risk = analytics.BreachMetrics?.risk?.[0];
    const passwordStrength = analytics.BreachMetrics?.passwords_strength?.[0];
    const summary = analytics.BreachesSummary;

    // Risk Summary
    printSection('Risk Assessment');
    if (risk) {
      const riskColor = getRiskColor(risk.risk_label);
      console.log(
        `  Risk Level: ${color(risk.risk_label.toUpperCase(), riskColor, COLORS.bold)} (Score: ${risk.risk_score}/100)`
      );
    }

    // Breach Summary
    printSection(`Breaches Found (${breaches.length})`);
    if (summary?.site) {
      const sites = summary.site.split(';');
      console.log(`  Affected sites: ${color(sites.join(', '), COLORS.white)}`);
    }

    // Password Analysis
    if (passwordStrength) {
      printSection('Password Exposure Analysis');
      if (passwordStrength.PlainText > 0) {
        printKeyValue(
          'Plain Text',
          `${passwordStrength.PlainText} breach(es) - ${color('CRITICAL', COLORS.red, COLORS.bold)}`
        );
      }
      if (passwordStrength.EasyToCrack > 0) {
        printKeyValue(
          'Easy to Crack',
          `${passwordStrength.EasyToCrack} breach(es) - ${color('HIGH RISK', COLORS.yellow)}`
        );
      }
      if (passwordStrength.StrongHash > 0) {
        printKeyValue(
          'Strong Hash',
          `${passwordStrength.StrongHash} breach(es) - ${color('Lower Risk', COLORS.green)}`
        );
      }
      if (passwordStrength.Unknown > 0) {
        printKeyValue('Unknown', `${passwordStrength.Unknown} breach(es)`);
      }
    }

    // Detailed Breach Information
    printSection('Breach Details');
    console.log();

    for (let i = 0; i < breaches.length; i++) {
      const breach = breaches[i];
      if (!breach) continue;

      console.log(color(`  [${i + 1}] ${breach.breach}`, COLORS.bold, COLORS.magenta));
      console.log(color(`      ${breach.domain}`, COLORS.dim));
      console.log();

      printKeyValue('Date', breach.xposed_date, 6);
      printKeyValue('Industry', breach.industry, 6);
      printKeyValue('Records Exposed', formatNumber(breach.xposed_records), 6);
      printKeyValue('Password Risk', getPasswordRiskLabel(breach.password_risk), 6);
      printKeyValue(
        'Verified',
        breach.verified === 'Yes' ? color('Yes', COLORS.green) : color('No', COLORS.yellow),
        6
      );

      // Exposed data types
      const exposedData = breach.xposed_data.split(';').map((d) => d.trim());
      printKeyValue('Data Exposed', '', 6);
      exposedData.forEach((data) => {
        console.log(`        • ${data}`);
      });

      // Description (truncated)
      if (breach.details) {
        console.log();
        const maxLen = 200;
        const desc =
          breach.details.length > maxLen
            ? breach.details.substring(0, maxLen) + '...'
            : breach.details;
        console.log(color(`      "${desc}"`, COLORS.dim));
      }

      if (breach.references) {
        console.log(color(`      More info: ${breach.references}`, COLORS.dim, COLORS.cyan));
      }

      console.log();
      if (i < breaches.length - 1) {
        console.log(color('      ' + '·'.repeat(50), COLORS.dim));
        console.log();
      }
    }

    // Recommendations
    printSection('Recommendations');
    console.log(color('  1. Change your password immediately on affected sites', COLORS.white));
    console.log(color('  2. Enable two-factor authentication (2FA) where possible', COLORS.white));
    console.log(color('  3. Use a unique password for each account', COLORS.white));
    console.log(color('  4. Consider using a password manager', COLORS.white));
    if (passwordStrength?.PlainText && passwordStrength.PlainText > 0) {
      console.log(
        color('  5. URGENT: Some passwords were stored in plain text!', COLORS.red, COLORS.bold)
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(color(`  ✗ Invalid email: ${error.message}`, COLORS.red));
    } else if (error instanceof RateLimitError) {
      console.log(color('  ✗ Rate limit exceeded. Please try again later.', COLORS.yellow));
    } else {
      console.log(color(`  ✗ Error: ${error}`, COLORS.red));
    }
  }

  console.log();
  console.log(color('═'.repeat(60), COLORS.cyan));
  console.log(color('  Powered by XposedOrNot.com', COLORS.dim));
  console.log(color('═'.repeat(60), COLORS.cyan));
}

// Main
const email = process.argv[2];

if (!email) {
  console.log();
  console.log(color('Usage:', COLORS.bold), 'npx tsx examples/check-single-email.ts <email>');
  console.log();
  console.log(color('Example:', COLORS.dim));
  console.log('  npx tsx examples/check-single-email.ts test@example.com');
  console.log();
  process.exit(1);
}

checkEmail(email);
