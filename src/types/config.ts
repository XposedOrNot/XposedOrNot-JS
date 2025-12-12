/**
 * Configuration options for the XposedOrNot client
 */
export interface XposedOrNotConfig {
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
   * Number of retry attempts for failed requests (0-10)
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
