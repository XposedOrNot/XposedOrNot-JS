/**
 * Configuration options for the XposedOrNot client
 */
export interface XposedOrNotConfig {
  /**
   * API key from console.xposedornot.com for Plus API access.
   * When provided, checkEmail() uses the Plus API with detailed breach
   * information and higher rate limits, and getDomainBreaches() becomes
   * available. Sent as the `x-api-key` header on every request.
   * @throws {ValidationError} If not a non-empty string
   */
  apiKey?: string;

  /**
   * Base URL for the API (must use HTTPS)
   * @default 'https://api.xposedornot.com'
   * @throws {ValidationError} If not a valid HTTPS URL
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds (1000-300000)
   * @default 30000
   * @throws {ValidationError} If outside valid range
   */
  timeout?: number;

  /**
   * Number of retries after a failed request (0-10), so a request makes
   * at most `retries + 1` attempts
   * @default 3
   * @throws {ValidationError} If outside valid range
   */
  retries?: number;

  /**
   * Custom headers to include in all requests
   */
  headers?: Record<string, string>;
}

/**
 * Internal resolved configuration with all defaults applied
 */
export interface ResolvedConfig {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export const DEFAULT_CONFIG: ResolvedConfig = {
  baseUrl: 'https://api.xposedornot.com',
  timeout: 30000,
  retries: 3,
  headers: {},
};
