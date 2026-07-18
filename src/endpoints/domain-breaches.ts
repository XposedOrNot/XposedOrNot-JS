import type { HttpClient } from '../utils/http.js';
import type { DomainBreachesResponse, DomainBreachesResult } from '../types/domain-breaches.js';
import { AuthenticationError } from '../errors/index.js';

/**
 * Get breach information for domains verified against the API key
 *
 * Requires an API key with verified domains configured at
 * console.xposedornot.com.
 *
 * @param http - HTTP client instance
 * @returns Metrics and exposed email records for the verified domains
 * @throws {AuthenticationError} If no API key is configured or the key is invalid
 *
 * @example
 * ```typescript
 * const result = await getDomainBreaches(http);
 *
 * console.log(`Exposed records: ${result.breachesDetails.length}`);
 * for (const record of result.breachesDetails) {
 *   console.log(`  ${record.email} (${record.breach})`);
 * }
 * ```
 */
export async function getDomainBreaches(http: HttpClient): Promise<DomainBreachesResult> {
  if (!http.hasApiKey) {
    throw new AuthenticationError(
      'An API key is required for domain breach monitoring. Get one at console.xposedornot.com'
    );
  }

  const response = await http.request<DomainBreachesResponse>('/v1/domain-breaches', {
    method: 'POST',
  });

  const metrics = response.metrics ?? {};

  return {
    status: response.status ?? '',
    breachesDetails: metrics.Breaches_Details ?? [],
    yearlyMetrics: metrics.Yearly_Metrics ?? {},
    domainSummary: metrics.Domain_Summary ?? {},
    breachSummary: metrics.Breach_Summary ?? {},
    top10Breaches: metrics.Top10_Breaches ?? {},
    detailedBreachInfo: metrics.Detailed_Breach_Info ?? {},
  };
}
