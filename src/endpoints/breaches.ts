import type { HttpClient } from '../utils/http.js';
import type { Breach, BreachesResponse, GetBreachesOptions } from '../types/breaches.js';

/**
 * Get a list of all known data breaches
 *
 * @param http - HTTP client instance
 * @param options - Optional filters
 * @returns List of breaches
 *
 * @example
 * ```typescript
 * // Get all breaches
 * const breaches = await getBreaches(http);
 *
 * // Filter by domain
 * const adobeBreaches = await getBreaches(http, { domain: 'adobe.com' });
 *
 * // Get specific breach
 * const breach = await getBreaches(http, { breachId: 'adobe' });
 * ```
 */
export async function getBreaches(
  http: HttpClient,
  options: GetBreachesOptions = {}
): Promise<Breach[]> {
  const params: Record<string, string | undefined> = {};

  if (options.domain) {
    params.domain = options.domain;
  }

  if (options.breachId) {
    params.breach_id = options.breachId;
  }

  const response = await http.request<BreachesResponse>('/v1/breaches', {
    params,
  });

  return response.exposedBreaches ?? [];
}
