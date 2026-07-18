import type {
  XposedOrNotConfig,
  ResolvedConfig,
  Breach,
  GetBreachesOptions,
  CheckEmailOptions,
  CheckEmailResult,
  GetBreachAnalyticsOptions,
  PasswordCheckResult,
  DomainBreachesResult,
} from './types/index.js';
import { DEFAULT_CONFIG } from './types/config.js';
import { HttpClient } from './utils/http.js';
import { ValidationError } from './errors/index.js';
import { getBreaches } from './endpoints/breaches.js';
import { checkEmail } from './endpoints/check-email.js';
import { getBreachAnalytics, type BreachAnalyticsResult } from './endpoints/breach-analytics.js';
import { checkPassword } from './endpoints/password.js';
import { getDomainBreaches } from './endpoints/domain-breaches.js';

/**
 * XposedOrNot API client
 *
 * @example
 * ```typescript
 * import { XposedOrNot } from 'xposedornot';
 *
 * const xon = new XposedOrNot();
 *
 * // Check if an email has been breached
 * const result = await xon.checkEmail('test@example.com');
 * console.log(result.found ? 'Breached!' : 'Safe');
 *
 * // Get all known breaches
 * const breaches = await xon.getBreaches();
 *
 * // Get detailed analytics
 * const analytics = await xon.getBreachAnalytics('test@example.com');
 * ```
 */
export class XposedOrNot {
  private readonly config: ResolvedConfig;
  private readonly http: HttpClient;

  /**
   * Create a new XposedOrNot client
   *
   * @param config - Optional configuration options
   */
  constructor(config: XposedOrNotConfig = {}) {
    this.config = this.resolveConfig(config);
    this.http = new HttpClient(this.config);
  }

  /**
   * Merge user config with defaults and validate
   */
  private resolveConfig(config: XposedOrNotConfig): ResolvedConfig {
    this.validateApiKey(config.apiKey);

    // Validate and resolve baseUrl
    const baseUrl = config.baseUrl ?? DEFAULT_CONFIG.baseUrl;
    this.validateBaseUrl(baseUrl);

    // Validate and resolve timeout
    const timeout = config.timeout ?? DEFAULT_CONFIG.timeout;
    this.validateTimeout(timeout);

    // Validate and resolve retries
    const retries = config.retries ?? DEFAULT_CONFIG.retries;
    this.validateRetries(retries);

    return {
      apiKey: config.apiKey,
      baseUrl,
      timeout,
      retries,
      headers: {
        ...DEFAULT_CONFIG.headers,
        ...config.headers,
      },
    };
  }

  /**
   * Validate apiKey - must be a non-empty string when provided
   */
  private validateApiKey(apiKey: string | undefined): void {
    if (apiKey === undefined) {
      return;
    }

    if (typeof apiKey !== 'string' || !apiKey.trim()) {
      throw new ValidationError('Invalid apiKey: must be a non-empty string', 'apiKey');
    }
  }

  /**
   * Validate baseUrl - must be HTTPS
   */
  private validateBaseUrl(baseUrl: string): void {
    // Check if it's a valid URL
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
      throw new ValidationError(`Invalid baseUrl: "${baseUrl}" is not a valid URL`, 'baseUrl');
    }

    // Enforce HTTPS
    if (url.protocol !== 'https:') {
      throw new ValidationError(
        `Invalid baseUrl: must use HTTPS protocol (got "${url.protocol}")`,
        'baseUrl'
      );
    }
  }

  /**
   * Validate timeout - must be between 1000ms and 5 minutes
   */
  private validateTimeout(timeout: number): void {
    const MIN_TIMEOUT = 1000; // 1 second
    const MAX_TIMEOUT = 300000; // 5 minutes

    if (typeof timeout !== 'number' || !Number.isFinite(timeout)) {
      throw new ValidationError('Invalid timeout: must be a finite number', 'timeout');
    }

    if (timeout < MIN_TIMEOUT || timeout > MAX_TIMEOUT) {
      throw new ValidationError(
        `Invalid timeout: must be between ${MIN_TIMEOUT}ms and ${MAX_TIMEOUT}ms (got ${timeout}ms)`,
        'timeout'
      );
    }
  }

  /**
   * Validate retries - must be between 0 and 10
   */
  private validateRetries(retries: number): void {
    const MIN_RETRIES = 0;
    const MAX_RETRIES = 10;

    if (typeof retries !== 'number' || !Number.isInteger(retries)) {
      throw new ValidationError('Invalid retries: must be an integer', 'retries');
    }

    if (retries < MIN_RETRIES || retries > MAX_RETRIES) {
      throw new ValidationError(
        `Invalid retries: must be between ${MIN_RETRIES} and ${MAX_RETRIES} (got ${retries})`,
        'retries'
      );
    }
  }

  /**
   * Check if an email address has been exposed in any data breaches
   *
   * @param email - Email address to check
   * @param options - Optional parameters
   * @returns Result indicating if email was found and which breaches
   *
   * @example
   * ```typescript
   * const result = await xon.checkEmail('user@example.com');
   *
   * if (result.found) {
   *   console.log(`Found in ${result.breaches.length} breaches:`);
   *   result.breaches.forEach(breach => console.log(`  - ${breach}`));
   * } else {
   *   console.log('Good news! Email not found in any known breaches.');
   * }
   * ```
   */
  async checkEmail(email: string, options?: CheckEmailOptions): Promise<CheckEmailResult> {
    return checkEmail(this.http, email, options);
  }

  /**
   * Get a list of all known data breaches
   *
   * @param options - Optional filters for domain or specific breach
   * @returns Array of breach information
   *
   * @example
   * ```typescript
   * // Get all breaches
   * const allBreaches = await xon.getBreaches();
   * console.log(`Total breaches: ${allBreaches.length}`);
   *
   * // Filter by domain
   * const adobeBreaches = await xon.getBreaches({ domain: 'adobe.com' });
   *
   * // Get specific breach by ID
   * const linkedIn = await xon.getBreaches({ breachId: 'linkedin' });
   * ```
   */
  async getBreaches(options?: GetBreachesOptions): Promise<Breach[]> {
    return getBreaches(this.http, options);
  }

  /**
   * Get detailed breach analytics for an email address
   *
   * Provides comprehensive information including:
   * - List of breaches where the email was found
   * - Breach summary and metrics
   * - Paste exposures (if any)
   *
   * @param email - Email address to get analytics for
   * @param options - Optional parameters including access token
   * @returns Detailed analytics about breaches and exposures
   *
   * @example
   * ```typescript
   * const result = await xon.getBreachAnalytics('user@example.com');
   *
   * if (result.found && result.analytics) {
   *   const { ExposedBreaches, BreachesSummary, BreachMetrics } = result.analytics;
   *
   *   console.log('Exposed in breaches:', ExposedBreaches);
   *   console.log('Summary:', BreachesSummary);
   *   console.log('Metrics:', BreachMetrics);
   * }
   * ```
   */
  async getBreachAnalytics(
    email: string,
    options?: GetBreachAnalyticsOptions
  ): Promise<BreachAnalyticsResult> {
    return getBreachAnalytics(this.http, email, options);
  }

  /**
   * Check if a password has been exposed in data breaches
   *
   * SECURITY: Your password is NEVER sent over the network.
   * This method uses k-anonymity protection:
   * 1. The password is hashed locally using Keccak-512
   * 2. Only the first 10 characters of the hash are sent to the API
   * 3. The API returns matches for that hash prefix
   * 4. Your actual password never leaves your machine
   *
   * @param password - The password to check (hashed locally, never transmitted)
   * @returns Result with exposure count and password characteristics
   *
   * @example
   * ```typescript
   * const result = await xon.checkPassword('hunter2');
   *
   * if (result.found) {
   *   console.log(`Exposed ${result.count} times - do not use this password!`);
   * } else {
   *   console.log('Password not found in known breaches.');
   * }
   * ```
   */
  async checkPassword(password: string): Promise<PasswordCheckResult> {
    return checkPassword(this.http, password);
  }

  /**
   * Get breach information for domains verified against the API key
   *
   * Requires an API key with verified domains configured at
   * console.xposedornot.com.
   *
   * @returns Metrics and exposed email records for the verified domains
   * @throws {AuthenticationError} If no API key is configured or the key is invalid
   *
   * @example
   * ```typescript
   * const xon = new XposedOrNot({ apiKey: process.env.XON_API_KEY });
   * const result = await xon.getDomainBreaches();
   *
   * console.log(`Exposed records: ${result.breachesDetails.length}`);
   * ```
   */
  async getDomainBreaches(): Promise<DomainBreachesResult> {
    return getDomainBreaches(this.http);
  }
}
