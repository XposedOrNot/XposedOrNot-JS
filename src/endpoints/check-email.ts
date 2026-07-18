import type { HttpClient } from '../utils/http.js';
import type {
  CheckEmailResponse,
  CheckEmailDetailedResponse,
  CheckEmailOptions,
  CheckEmailResult,
} from '../types/check-email.js';
import { validateEmail, sanitizeEmailForPath } from '../utils/validation.js';
import { NotFoundError } from '../errors/index.js';

/** Base URL for the Plus API (authenticated requests) */
const PLUS_API_BASE = 'https://plus-api.xposedornot.com';

/**
 * Type guard to check if response indicates email was found
 */
function isFoundResponse(
  response: CheckEmailResponse
): response is { breaches: string[][]; email: string } {
  return 'breaches' in response && Array.isArray(response.breaches);
}

/**
 * Check an email against the Plus API (requires an API key).
 * Returns detailed breach information with higher rate limits.
 */
async function checkEmailPlus(http: HttpClient, email: string): Promise<CheckEmailResult> {
  const sanitizedEmail = sanitizeEmailForPath(email);

  try {
    const response = await http.request<CheckEmailDetailedResponse>(
      `/v3/check-email/${sanitizedEmail}`,
      {
        baseUrl: PLUS_API_BASE,
        params: { detailed: 'true' },
      }
    );

    const details = response.breaches ?? [];

    return {
      email: response.email || email,
      found: details.length > 0,
      breaches: details.map((breach) => breach.breach_id),
      details,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        email,
        found: false,
        breaches: [],
        details: [],
      };
    }

    throw error;
  }
}

/**
 * Check if an email address has been exposed in any data breaches
 *
 * When the client is configured with an API key, this uses the Plus API
 * (plus-api.xposedornot.com) which returns detailed breach information
 * in `result.details`. Without an API key, the free API is used and only
 * breach names are returned.
 *
 * @param http - HTTP client instance
 * @param email - Email address to check
 * @param options - Optional parameters (ignored when an API key is set)
 * @returns Result indicating if email was found and which breaches
 *
 * @example
 * ```typescript
 * const result = await checkEmail(http, 'test@example.com');
 *
 * if (result.found) {
 *   console.log(`Found in ${result.breaches.length} breaches`);
 *   console.log(result.breaches);
 * } else {
 *   console.log('Email not found in any breaches');
 * }
 * ```
 */
export async function checkEmail(
  http: HttpClient,
  email: string,
  options: CheckEmailOptions = {}
): Promise<CheckEmailResult> {
  validateEmail(email);

  if (http.hasApiKey) {
    return checkEmailPlus(http, email);
  }

  const sanitizedEmail = sanitizeEmailForPath(email);
  const params: Record<string, string | boolean | undefined> = {};

  if (options.includeDetails) {
    params.include_details = options.includeDetails;
  }

  try {
    const response = await http.request<CheckEmailResponse>(`/v1/check-email/${sanitizedEmail}`, {
      params,
    });

    if (isFoundResponse(response)) {
      // Flatten the nested array of breaches
      const breaches = response.breaches.flat();

      return {
        email: response.email,
        found: true,
        breaches,
      };
    }

    // Response indicates not found
    return {
      email: response.email,
      found: false,
      breaches: [],
    };
  } catch (error) {
    // 404 means email not found in any breaches (this is expected)
    if (error instanceof NotFoundError) {
      return {
        email,
        found: false,
        breaches: [],
      };
    }

    throw error;
  }
}
