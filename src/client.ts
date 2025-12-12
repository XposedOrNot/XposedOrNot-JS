import type {
  XposedOrNotConfig,
  ResolvedConfig,
  Breach,
  GetBreachesOptions,
  CheckEmailOptions,
  CheckEmailResult,
  GetBreachAnalyticsOptions,
} from './types/index.js';
import { DEFAULT_CONFIG } from './types/config.js';
import { HttpClient } from './utils/http.js';
import { ValidationError } from './errors/index.js';
import { getBreaches } from './endpoints/breaches.js';
import { checkEmail } from './endpoints/check-email.js';
import { getBreachAnalytics, type BreachAnalyticsResult } from './endpoints/breach-analytics.js';

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
}
