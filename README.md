<p align="center">
  <a href="https://xposedornot.com">
    <img src="https://xposedornot.com/static/logos/xon.png" alt="XposedOrNot" width="200">
  </a>
</p>

<h1 align="center">xposedornot</h1>

<p align="center">
  Official Node.js SDK for the <a href="https://xposedornot.com">XposedOrNot</a> API<br>
  <em>Check for data breaches and exposed credentials</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/xposedornot"><img src="https://img.shields.io/npm/v/xposedornot.svg" alt="npm version"></a>
  <a href="https://github.com/XposedOrNot/XposedOrNot-JS/actions"><img src="https://img.shields.io/github/actions/workflow/status/XposedOrNot/XposedOrNot-JS/build.yml?branch=main" alt="Build Status"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/xposedornot.svg" alt="Node.js Version"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript"></a>
</p>

---

> **Note:** This SDK uses the free public API from [XposedOrNot.com](https://xposedornot.com) - a free service to check if your email has been compromised in data breaches. Visit the [XposedOrNot website](https://xposedornot.com) to learn more about the service and check your email manually.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [checkEmail](#checkemailemail-options)
  - [checkPassword](#checkpasswordpassword)
  - [getBreaches](#getbreachesoptions)
  - [getBreachAnalytics](#getbreachanalyticsemail-options)
  - [getDomainBreaches](#getdomainbreaches)
- [Plus API (API Key)](#plus-api-api-key)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [TypeScript Support](#typescript-support)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Simple API** - Easy-to-use methods for checking email breaches
- **Password Check** - k-anonymity password exposure check (your password never leaves your machine)
- **Plus API Support** - Detailed breach data and domain monitoring with an API key
- **Full TypeScript Support** - Complete type definitions included
- **Detailed Analytics** - Get breach details, risk scores, and metrics
- **Error Handling** - Custom error classes for different scenarios
- **Configurable** - Timeout, retries, and custom options
- **Rate-Limit Friendly** - Built-in 1 request/second spacing on the free API, plus automatic retries
- **Secure** - HTTPS enforced, input validation, no sensitive data logging

## Installation

```bash
npm install xposedornot
```

```bash
yarn add xposedornot
```

```bash
pnpm add xposedornot
```

## Requirements

- Node.js 18.0.0 or higher

## Quick Start

```typescript
import { XposedOrNot } from 'xposedornot';

const xon = new XposedOrNot();

// Check if an email has been breached
const result = await xon.checkEmail('test@example.com');

if (result.found) {
  console.log(`Email found in ${result.breaches.length} breaches:`);
  result.breaches.forEach(breach => console.log(`  - ${breach}`));
} else {
  console.log('Good news! Email not found in any known breaches.');
}

// Check if a password has been exposed (hashed locally, never transmitted)
const password = await xon.checkPassword('hunter2');
console.log(password.found ? `Exposed ${password.count} times!` : 'Not found in breaches.');
```

## API Reference

### Constructor

```typescript
const xon = new XposedOrNot(config?: XposedOrNotConfig);
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | - | API key from [console.xposedornot.com](https://console.xposedornot.com) for Plus API access |
| `baseUrl` | `string` | `'https://api.xposedornot.com'` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retries` | `number` | `3` | Number of retries after a failed request |
| `headers` | `Record<string, string>` | `{}` | Custom headers for all requests |

### Methods

#### `checkEmail(email, options?)`

Check if an email address has been exposed in any data breaches.

```typescript
const result = await xon.checkEmail('user@example.com');

// Result type:
// {
//   email: string;
//   found: boolean;
//   breaches: string[];
// }
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `includeDetails` | `boolean` | Include detailed breach information (free API only) |

When the client is configured with an `apiKey`, this method automatically uses the
Plus API and additionally populates `result.details` with rich per-breach objects
(`BreachInfo[]`: breach date, exposed record count, password risk, and more).

#### `checkPassword(password)`

Check if a password has been exposed in data breaches, using k-anonymity.

**SECURITY:** Your password is NEVER sent over the network. It is hashed locally
with Keccak-512 and only the first 10 characters of the hash are sent to the API,
so your actual password never leaves your machine.

```typescript
const result = await xon.checkPassword('hunter2');

// Result type:
// {
//   anon: string;                                  // hash prefix that was sent
//   found: boolean;
//   count: number;                                 // times seen in breaches
//   characteristics: {                             // null if not found
//     digits: number;
//     alphabets: number;
//     special: number;
//     length: number;
//   } | null;
// }

if (result.found) {
  console.log(`Exposed ${result.count} times - do not use this password!`);
}
```

#### `getBreaches(options?)`

Get a list of all known data breaches.

```typescript
// Get all breaches
const breaches = await xon.getBreaches();

// Filter by domain
const adobeBreaches = await xon.getBreaches({ domain: 'adobe.com' });

// Get specific breach by ID
const linkedIn = await xon.getBreaches({ breachId: 'linkedin' });
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `domain` | `string` | Filter breaches by domain |
| `breachId` | `string` | Get a specific breach by ID |

**Returns:** Array of `Breach` objects with properties:
- `breachID` - Unique identifier
- `breachedDate` - Date of the breach
- `domain` - Associated domain
- `industry` - Industry category
- `exposedData` - Types of data exposed
- `exposedRecords` - Number of records exposed
- `verified` - Whether the breach is verified
- And more...

#### `getBreachAnalytics(email, options?)`

Get detailed breach analytics for an email address.

```typescript
const result = await xon.getBreachAnalytics('user@example.com');

if (result.found && result.analytics) {
  console.log('Exposed breaches:', result.analytics.ExposedBreaches);
  console.log('Breach summary:', result.analytics.BreachesSummary);
  console.log('Breach metrics:', result.analytics.BreachMetrics);
  console.log('Paste exposures:', result.analytics.ExposedPastes);
}
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `token` | `string` | Token for accessing sensitive data |

#### `getDomainBreaches()`

Get breach information for domains verified against your API key. Requires an
`apiKey` with verified domains configured at
[console.xposedornot.com](https://console.xposedornot.com); throws
`AuthenticationError` otherwise.

```typescript
const xon = new XposedOrNot({ apiKey: process.env.XON_API_KEY });
const result = await xon.getDomainBreaches();

console.log(`Exposed records: ${result.breachesDetails.length}`);
for (const record of result.breachesDetails) {
  console.log(`  ${record.email} - ${record.breach}`);
}

// Also available: result.yearlyMetrics, result.domainSummary,
// result.breachSummary, result.top10Breaches, result.detailedBreachInfo
```

## Plus API (API Key)

The free API works without any configuration. For detailed breach data, higher
rate limits, and domain monitoring, get an API key at
[console.xposedornot.com](https://console.xposedornot.com) and pass it to the
client:

```typescript
const xon = new XposedOrNot({ apiKey: process.env.XON_API_KEY });

// checkEmail now returns detailed breach info via the Plus API
const result = await xon.checkEmail('user@example.com');
result.details?.forEach(breach => {
  console.log(`${breach.breach_id}: ${breach.xposed_records} records (${breach.password_risk})`);
});

// Domain monitoring becomes available
const domains = await xon.getDomainBreaches();
```

Commercial plans are available at [plus.xposedornot.com](https://plus.xposedornot.com/products/api).

## Error Handling

The library provides custom error classes for different scenarios:

```typescript
import {
  XposedOrNot,
  XposedOrNotError,
  RateLimitError,
  ValidationError,
  NetworkError,
  TimeoutError,
} from 'xposedornot';

const xon = new XposedOrNot();

try {
  const result = await xon.checkEmail('invalid-email');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof XposedOrNotError) {
    console.error('API error:', error.message, error.code);
  }
}
```

### Error Types

| Error Class | Description |
|-------------|-------------|
| `XposedOrNotError` | Base error class |
| `ValidationError` | Invalid input (e.g., malformed email) |
| `RateLimitError` | API rate limit exceeded |
| `NotFoundError` | Resource not found |
| `AuthenticationError` | Authentication failed |
| `NetworkError` | Network connectivity issues |
| `TimeoutError` | Request timed out |
| `ServerError` | Server error (5xx) |
| `ApiError` | General API error |

## Rate Limits

The free XposedOrNot API is limited to 1 request per second, plus hourly and
daily limits. The client automatically spaces free-API requests at least one
second apart and retries rate-limited requests with exponential backoff.

When an `apiKey` is configured, client-side spacing is disabled - Plus API
tier-based limits are enforced server-side. For higher rate limits, commercial
plans are available at [plus.xposedornot.com](https://plus.xposedornot.com/products/api).

## TypeScript Support

This library is written in TypeScript and includes full type definitions:

```typescript
import type {
  Breach,
  BreachInfo,
  CheckEmailResult,
  BreachAnalyticsResult,
  PasswordCheckResult,
  DomainBreachesResult,
  XposedOrNotConfig,
} from 'xposedornot';
```

## CommonJS Usage

```javascript
const { XposedOrNot } = require('xposedornot');

const xon = new XposedOrNot();
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/XposedOrNot/XposedOrNot-JS.git
cd XposedOrNot-JS

# Install dependencies
npm install

# Run tests
npm run test:run

# Build
npm run build

# Lint
npm run lint
```

## Projects Using This

<!-- Add your project here! Submit a PR to be featured. -->

> Using `xposedornot` in your project? [Let us know!](https://github.com/XposedOrNot/XposedOrNot-JS/issues/new)

## Support

- **Issues**: [GitHub Issues](https://github.com/XposedOrNot/XposedOrNot-JS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/XposedOrNot/XposedOrNot-JS/discussions)
- **API Status**: [XposedOrNot Status](https://xposedornot.com)

## Show Your Support

If you find this package useful, give it a ⭐ on [GitHub](https://github.com/XposedOrNot/XposedOrNot-JS)!

## License

MIT - see the [LICENSE](LICENSE) file for details.

## Links

- [XposedOrNot Website](https://xposedornot.com)
- [API Documentation](https://xposedornot.com/api_doc)
- [npm Package](https://www.npmjs.com/package/xposedornot)
- [GitHub Repository](https://github.com/XposedOrNot/XposedOrNot-JS)
- [XposedOrNot API Repository](https://github.com/XposedOrNot/XposedOrNot-API)

---

<p align="center">
  Made with ❤️ by <a href="https://xposedornot.com">XposedOrNot</a>
</p>
