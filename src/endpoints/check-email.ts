import type { HttpClient } from '../utils/http.js';
import type {
  CheckEmailResponse,
  CheckEmailOptions,
  CheckEmailResult,
} from '../types/check-email.js';
import { validateEmail, sanitizeEmailForPath } from '../utils/validation.js';
import { NotFoundError } from '../errors/index.js';

/**
 * Type guard to check if response indicates email was found
 */
function isFoundResponse(
  response: CheckEmailResponse
): response is { breaches: string[][]; email: string } {
  return 'breaches' in response && Array.isArray(response.breaches);
}

/**
 * Check if an email address has been exposed in any data breaches
 *
 * @param http - HTTP client instance
 * @param email - Email address to check
 * @param options - Optional parameters
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
