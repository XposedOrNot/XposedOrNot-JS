<p align="center">
  <a href="https://xposedornot.com">
    <img src="https://xposedornot.com/static/logos/xon.png" alt="XposedOrNot" width="200">
  </a>
</p>

<h1 align="center">xposedornot</h1>

<p align="center">
  Official Node.js SDK for the <a href="https://xposedornot.com">XposedOrNot</a> API<br>
  <em>Check if your email has been exposed in data breaches</em>
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
  - [getBreaches](#getbreachesoptions)
  - [getBreachAnalytics](#getbreachanalyticsemail-options)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [TypeScript Support](#typescript-support)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Simple API** - Easy-to-use methods for checking email breaches
- **Full TypeScript Support** - Complete type definitions included
- **Detailed Analytics** - Get breach details, risk scores, and metrics
- **Error Handling** - Custom error classes for different scenarios
- **Configurable** - Timeout, retries, and custom options
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
```

## API Reference

### Constructor

```typescript
const xon = new XposedOrNot(config?: XposedOrNotConfig);
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `'https://api.xposedornot.com'` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retries` | `number` | `3` | Number of retry attempts |
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
| `includeDetails` | `boolean` | Include detailed breach information |

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
| `ApiError` | General API error |

## Rate Limits

The XposedOrNot API has the following rate limits:

- 2 requests per second
- 50-100 requests per hour
- 100-1000 requests per day

The client includes automatic retry with exponential backoff for transient failures.

## TypeScript Support

This library is written in TypeScript and includes full type definitions:

```typescript
import type {
  Breach,
  CheckEmailResult,
  BreachAnalyticsResult,
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
