import type { ResolvedConfig } from '../types/config.js';
import {
  XposedOrNotError,
  RateLimitError,
  NotFoundError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  ServerError,
  ApiError,
} from '../errors/index.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | boolean | undefined>;
  /** Override the base URL for this request (e.g., Plus or passwords API) */
  baseUrl?: string;
}

/** Minimum spacing between requests on the free API (1 request/second) */
const RATE_LIMIT_DELAY_MS = 1000;

/**
 * HTTP client for making API requests
 */
export class HttpClient {
  private lastRequestTime = 0;

  constructor(private readonly config: ResolvedConfig) {}

  /**
   * Whether an API key is configured (Plus API access)
   */
  get hasApiKey(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Make an HTTP request to the API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params, baseUrl } = options;

    const url = this.buildUrl(endpoint, params, baseUrl);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.config.headers,
      ...headers,
    };

    if (this.config.apiKey) {
      requestHeaders['x-api-key'] = this.config.apiKey;
    }

    let lastError: Error | undefined;
    const maxAttempts = this.config.retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.waitForRateLimit();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.config.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        this.lastRequestTime = Date.now();

        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        if (error instanceof XposedOrNotError) {
          // Don't retry on client errors (4xx) except rate limits
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            if (!(error instanceof RateLimitError)) {
              throw error;
            }
          }
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new TimeoutError(`Request timed out after ${this.config.timeout}ms`);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxAttempts) {
          const retryAfter = error instanceof RateLimitError ? error.retryAfter : undefined;
          const delay = retryAfter
            ? retryAfter * 1000
            : Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // All retries exhausted
    if (lastError instanceof XposedOrNotError) {
      throw lastError;
    }

    throw new NetworkError(
      `Request failed after ${maxAttempts} attempts: ${lastError?.message}`,
      lastError
    );
  }

  /**
   * Wait if necessary to respect the free API rate limit (1 request/second).
   * Skipped for Plus API users, whose tier-based limits are enforced server-side.
   */
  private async waitForRateLimit(): Promise<void> {
    if (this.config.apiKey) {
      return;
    }

    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_DELAY_MS) {
      await this.sleep(RATE_LIMIT_DELAY_MS - elapsed);
    }
  }

  /**
   * Build the full URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | boolean | undefined>,
    baseUrl?: string
  ): string {
    const url = new URL(endpoint, baseUrl ?? this.config.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Handle the API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 304) {
      // Not modified - return empty response
      return {} as T;
    }

    let data: unknown;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      data = await response.text();
    }

    if (response.ok) {
      return data as T;
    }

    // Handle error responses
    this.handleErrorResponse(response.status, data);
  }

  /**
   * Handle error responses from the API
   */
  private handleErrorResponse(status: number, data: unknown): never {
    const message = this.extractErrorMessage(data);

    switch (status) {
      case 401:
        throw new AuthenticationError(message);
      case 404:
        throw new NotFoundError(message);
      case 429: {
        const retryAfter = this.extractRetryAfter(data);
        throw new RateLimitError(message, retryAfter);
      }
      default:
        if (status >= 500) {
          throw new ServerError(message || `Server error: ${status}`, status);
        }
        throw new ApiError(message || `API error: ${status}`, status, data);
    }
  }

  /**
   * Extract error message from response data
   */
  private extractErrorMessage(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }

    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (typeof obj.Error === 'string') return obj.Error;
      if (typeof obj.error === 'string') return obj.error;
      if (typeof obj.message === 'string') return obj.message;
    }

    return 'An unknown error occurred';
  }

  /**
   * Extract retry-after value from response
   */
  private extractRetryAfter(data: unknown): number | undefined {
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (typeof obj.retry_after === 'number') return obj.retry_after;
      if (typeof obj.retryAfter === 'number') return obj.retryAfter;
    }
    return undefined;
  }

  /**
   * Sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
