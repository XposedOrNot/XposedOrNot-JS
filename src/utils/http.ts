import type { ResolvedConfig } from '../types/config.js';
import {
  XposedOrNotError,
  RateLimitError,
  NotFoundError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  ApiError,
} from '../errors/index.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | boolean | undefined>;
}

/**
 * HTTP client for making API requests
 */
export class HttpClient {
  constructor(private readonly config: ResolvedConfig) {}

  /**
   * Make an HTTP request to the API
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params } = options;

    const url = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.timeout);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.config.headers,
      ...headers,
    };

    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < this.config.retries) {
      attempt++;

      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
        if (attempt < this.config.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    if (lastError instanceof XposedOrNotError) {
      throw lastError;
    }

    throw new NetworkError(
      `Request failed after ${this.config.retries} attempts: ${lastError?.message}`,
      lastError
    );
  }

  /**
   * Build the full URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | boolean | undefined>
  ): string {
    const url = new URL(endpoint, this.config.baseUrl);

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
