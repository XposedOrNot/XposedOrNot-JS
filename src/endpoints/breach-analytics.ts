import type { HttpClient } from '../utils/http.js';
import type { BreachAnalyticsResponse, GetBreachAnalyticsOptions } from '../types/analytics.js';
import { validateEmail, normalizeEmail } from '../utils/validation.js';
import { NotFoundError } from '../errors/index.js';

/**
 * Normalized breach analytics result
 */
export interface BreachAnalyticsResult {
  /** The email address that was checked */
  email: string;

  /** Whether the email was found in any breaches */
  found: boolean;

  /** Raw analytics data from the API */
  analytics: BreachAnalyticsResponse | null;
}

/**
 * Get detailed breach analytics for an email address
 *
 * @param http - HTTP client instance
 * @param email - Email address to get analytics for
 * @param options - Optional parameters
 * @returns Detailed analytics about breaches and paste exposures
 *
 * @example
 * ```typescript
 * const result = await getBreachAnalytics(http, 'test@example.com');
 *
 * if (result.found && result.analytics) {
 *   console.log('Breaches:', result.analytics.ExposedBreaches);
 *   console.log('Summary:', result.analytics.BreachesSummary);
 *   console.log('Metrics:', result.analytics.BreachMetrics);
 * }
 * ```
 */
export async function getBreachAnalytics(
  http: HttpClient,
  email: string,
  options: GetBreachAnalyticsOptions = {}
): Promise<BreachAnalyticsResult> {
  validateEmail(email);

  const normalizedEmail = normalizeEmail(email);
  const params: Record<string, string | undefined> = {
    email: normalizedEmail,
  };

  if (options.token) {
    params.token = options.token;
  }

  try {
    const response = await http.request<BreachAnalyticsResponse>('/v1/breach-analytics', {
      params,
    });

    // Check if there's actual data
    const breachDetails = response.ExposedBreaches?.breaches_details;
    const hasBreaches = breachDetails !== undefined && breachDetails.length > 0;
    const hasPastes = Array.isArray(response.ExposedPastes) && response.ExposedPastes.length > 0;

    return {
      email,
      found: hasBreaches || hasPastes,
      analytics: response,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        email,
        found: false,
        analytics: null,
      };
    }

    throw error;
  }
}
