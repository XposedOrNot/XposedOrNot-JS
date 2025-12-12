#!/usr/bin/env npx tsx
/**
 * Bulk email breach checker - Check multiple emails from CSV or TXT file
 *
 * Usage:
 *   npx tsx examples/check-bulk-emails.ts <input-file> [--output results.csv] [--delay 1000]
 *
 * Input formats supported:
 *   - TXT: One email per line
 *   - CSV: Expects 'email' column header, or first column if no header
 */

import { XposedOrNot, RateLimitError } from '../src/index.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface EmailResult {
  email: string;
  status: 'safe' | 'breached' | 'error';
  breachCount: number;
  breaches: string[];
  riskLevel: string;
  riskScore: number;
  exposedData: string[];
  error?: string;
}

interface SummaryStats {
  total: number;
  safe: number;
  breached: number;
  errors: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

// ============================================================================
// Colors & Formatting
// ============================================================================

const C = {
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
};

const color = (text: string, ...codes: string[]): string => `${codes.join('')}${text}${C.reset}`;

const printLine = (char = '─', len = 70) => {
  console.log(color(char.repeat(len), C.dim));
};

const printHeader = (title: string) => {
  console.log();
  console.log(color('╔' + '═'.repeat(68) + '╗', C.cyan));
  console.log(
    color('║', C.cyan) + color(` ${title}`.padEnd(68), C.bold, C.white) + color('║', C.cyan)
  );
  console.log(color('╚' + '═'.repeat(68) + '╝', C.cyan));
};

const printSection = (title: string) => {
  console.log();
  console.log(color(`▸ ${title}`, C.bold, C.yellow));
  printLine();
};

// ============================================================================
// File Parsing
// ============================================================================

async function parseInputFile(filePath: string): Promise<string[]> {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');
  const emails: string[] = [];

  if (ext === '.csv') {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return emails;

    // Check if first line is header
    const firstLine = lines[0]!.toLowerCase();
    const hasHeader = firstLine.includes('email') || !firstLine.includes('@');

    // Find email column index
    let emailColIndex = 0;
    if (hasHeader) {
      const headers = firstLine.split(',').map((h) => h.trim().toLowerCase());
      const idx = headers.findIndex((h) => h === 'email' || h === 'e-mail' || h === 'mail');
      if (idx !== -1) emailColIndex = idx;
    }

    const startLine = hasHeader ? 1 : 0;
    for (let i = startLine; i < lines.length; i++) {
      const cols = lines[i]!.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const email = cols[emailColIndex];
      if (email?.includes('@')) {
        emails.push(email.toLowerCase());
      }
    }
  } else {
    // TXT or other - one email per line
    const lines = content.split('\n');
    for (const line of lines) {
      const email = line.trim().toLowerCase();
      if (email && email.includes('@') && !email.startsWith('#')) {
        emails.push(email);
      }
    }
  }

  // Remove duplicates
  return [...new Set(emails)];
}

// ============================================================================
// Progress Display
// ============================================================================

function updateProgress(current: number, total: number, email: string, status: string): void {
  const percent = Math.round((current / total) * 100);
  const barLen = 30;
  const filled = Math.round((current / total) * barLen);
  const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

  const statusIcon =
    status === 'safe'
      ? color('✓', C.green)
      : status === 'breached'
        ? color('⚠', C.red)
        : color('✗', C.yellow);

  // Clear line and print progress
  process.stdout.write(
    `\r  [${color(bar, C.cyan)}] ${percent}% (${current}/${total}) ${statusIcon} ${email.substring(0, 30).padEnd(30)}`
  );
}

function clearProgress(): void {
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
}

// ============================================================================
// CSV Export
// ============================================================================

function exportToCsv(results: EmailResult[], outputPath: string): void {
  const headers = [
    'email',
    'status',
    'breach_count',
    'risk_level',
    'risk_score',
    'breaches',
    'exposed_data',
    'error',
  ];
  const rows = results.map((r) => [
    r.email,
    r.status,
    r.breachCount.toString(),
    r.riskLevel,
    r.riskScore.toString(),
    r.breaches.join('; '),
    r.exposedData.join('; '),
    r.error || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  fs.writeFileSync(outputPath, csvContent);
}

// ============================================================================
// Main Check Logic
// ============================================================================

async function checkEmails(emails: string[], delayMs: number): Promise<EmailResult[]> {
  const xon = new XposedOrNot();
  const results: EmailResult[] = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]!;

    try {
      const analytics = await xon.getBreachAnalytics(email);

      if (!analytics.found || !analytics.analytics) {
        results.push({
          email,
          status: 'safe',
          breachCount: 0,
          breaches: [],
          riskLevel: 'None',
          riskScore: 0,
          exposedData: [],
        });
        updateProgress(i + 1, emails.length, email, 'safe');
      } else {
        const { analytics: data } = analytics;
        const breachDetails = data.ExposedBreaches?.breaches_details ?? [];
        const risk = data.BreachMetrics?.risk?.[0];

        // Collect all exposed data types
        const exposedDataSet = new Set<string>();
        breachDetails.forEach((b) => {
          b.xposed_data.split(';').forEach((d) => exposedDataSet.add(d.trim()));
        });

        results.push({
          email,
          status: 'breached',
          breachCount: breachDetails.length,
          breaches: breachDetails.map((b) => b.breach),
          riskLevel: risk?.risk_label ?? 'Unknown',
          riskScore: risk?.risk_score ?? 0,
          exposedData: [...exposedDataSet],
        });
        updateProgress(i + 1, emails.length, email, 'breached');
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Wait longer on rate limit
        clearProgress();
        console.log(color(`  ⏳ Rate limited. Waiting 60 seconds...`, C.yellow));
        await sleep(60000);
        i--; // Retry this email
        continue;
      }

      results.push({
        email,
        status: 'error',
        breachCount: 0,
        breaches: [],
        riskLevel: 'Unknown',
        riskScore: 0,
        exposedData: [],
        error: error instanceof Error ? error.message : String(error),
      });
      updateProgress(i + 1, emails.length, email, 'error');
    }

    // Delay between requests to avoid rate limiting
    if (i < emails.length - 1) {
      await sleep(delayMs);
    }
  }

  clearProgress();
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Summary & Report
// ============================================================================

function printSummary(results: EmailResult[]): void {
  const stats: SummaryStats = {
    total: results.length,
    safe: results.filter((r) => r.status === 'safe').length,
    breached: results.filter((r) => r.status === 'breached').length,
    errors: results.filter((r) => r.status === 'error').length,
    highRisk: results.filter((r) => r.riskLevel.toLowerCase() === 'high' || r.riskScore >= 70)
      .length,
    mediumRisk: results.filter(
      (r) => r.riskLevel.toLowerCase() === 'medium' || (r.riskScore >= 40 && r.riskScore < 70)
    ).length,
    lowRisk: results.filter(
      (r) => r.riskLevel.toLowerCase() === 'low' || (r.riskScore > 0 && r.riskScore < 40)
    ).length,
  };

  printSection('Summary');
  console.log(`  Total emails checked:  ${color(stats.total.toString(), C.bold)}`);
  console.log(`  Safe (no breaches):    ${color(stats.safe.toString(), C.green, C.bold)}`);
  console.log(`  Breached:              ${color(stats.breached.toString(), C.red, C.bold)}`);
  if (stats.errors > 0) {
    console.log(`  Errors:                ${color(stats.errors.toString(), C.yellow)}`);
  }

  if (stats.breached > 0) {
    printSection('Risk Distribution');
    console.log(`  ${color('●', C.red)} High Risk:    ${stats.highRisk}`);
    console.log(`  ${color('●', C.yellow)} Medium Risk:  ${stats.mediumRisk}`);
    console.log(`  ${color('●', C.green)} Low Risk:     ${stats.lowRisk}`);
  }

  // Top breached emails
  const breachedEmails = results
    .filter((r) => r.status === 'breached')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  if (breachedEmails.length > 0) {
    printSection('Most At-Risk Emails');
    breachedEmails.forEach((r, i) => {
      const riskColor = r.riskScore >= 70 ? C.red : r.riskScore >= 40 ? C.yellow : C.green;
      console.log(`  ${(i + 1).toString().padStart(2)}. ${r.email}`);
      console.log(
        `      ${color(`Risk: ${r.riskLevel} (${r.riskScore})`, riskColor)} | Breaches: ${r.breachCount}`
      );
      console.log(
        `      ${color(r.breaches.slice(0, 5).join(', ') + (r.breaches.length > 5 ? '...' : ''), C.dim)}`
      );
    });
  }

  // Most common breaches
  const breachCounts = new Map<string, number>();
  results.forEach((r) => {
    r.breaches.forEach((b) => {
      breachCounts.set(b, (breachCounts.get(b) || 0) + 1);
    });
  });

  const topBreaches = [...breachCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (topBreaches.length > 0) {
    printSection('Most Common Breaches');
    topBreaches.forEach(([breach, count], i) => {
      const bar = '█'.repeat(Math.ceil((count / results.length) * 20));
      console.log(
        `  ${(i + 1).toString().padStart(2)}. ${breach.padEnd(25)} ${color(bar, C.magenta)} ${count} emails`
      );
    });
  }
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): { inputFile: string; outputFile?: string; delay: number } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
${color('Bulk Email Breach Checker', C.bold, C.cyan)}

${color('Usage:', C.bold)}
  npx tsx examples/check-bulk-emails.ts <input-file> [options]

${color('Options:', C.bold)}
  --output, -o <file>    Export results to CSV file
  --delay, -d <ms>       Delay between requests in ms (default: 1000)
  --help, -h             Show this help message

${color('Input formats:', C.bold)}
  TXT:  One email per line
  CSV:  Must have 'email' column header, or emails in first column

${color('Examples:', C.bold)}
  npx tsx examples/check-bulk-emails.ts emails.txt
  npx tsx examples/check-bulk-emails.ts users.csv --output results.csv
  npx tsx examples/check-bulk-emails.ts emails.txt -d 2000 -o report.csv
`);
    process.exit(0);
  }

  const inputFile = args[0]!;
  let outputFile: string | undefined;
  let delay = 1000;

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
      outputFile = args[++i];
    } else if ((args[i] === '--delay' || args[i] === '-d') && args[i + 1]) {
      delay = parseInt(args[++i]!, 10) || 1000;
    }
  }

  return { inputFile, outputFile, delay };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const { inputFile, outputFile, delay } = parseArgs();

  // Validate input file
  if (!fs.existsSync(inputFile)) {
    console.log(color(`\n  ✗ File not found: ${inputFile}`, C.red));
    process.exit(1);
  }

  printHeader('XposedOrNot - Bulk Email Breach Checker');

  // Parse emails
  console.log();
  console.log(`  Input file: ${color(inputFile, C.white)}`);

  const emails = await parseInputFile(inputFile);

  if (emails.length === 0) {
    console.log(color('\n  ✗ No valid emails found in file', C.red));
    process.exit(1);
  }

  console.log(`  Emails found: ${color(emails.length.toString(), C.bold, C.white)}`);
  console.log(`  Request delay: ${color(delay + 'ms', C.dim)}`);

  if (outputFile) {
    console.log(`  Output file: ${color(outputFile, C.white)}`);
  }

  printSection('Processing');
  console.log();

  const startTime = Date.now();
  const results = await checkEmails(emails, delay);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log();
  console.log(`  ${color('✓', C.green)} Completed in ${duration}s`);

  // Print summary
  printSummary(results);

  // Export if requested
  if (outputFile) {
    exportToCsv(results, outputFile);
    printSection('Export');
    console.log(`  ${color('✓', C.green)} Results exported to: ${color(outputFile, C.cyan)}`);
  }

  console.log();
  console.log(color('═'.repeat(70), C.cyan));
  console.log(color('  Powered by XposedOrNot.com', C.dim));
  console.log(color('═'.repeat(70), C.cyan));
  console.log();
}

main().catch((err) => {
  console.error(color(`\n  ✗ Error: ${err.message}`, C.red));
  process.exit(1);
});
