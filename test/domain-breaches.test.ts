import { describe, it, expect, afterEach, vi } from 'vitest';
import { XposedOrNot } from '../src/client.js';
import { AuthenticationError } from '../src/errors/index.js';
import { installFetchMock, jsonResponse } from './helpers.js';

describe('getDomainBreaches', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws AuthenticationError without an API key, before any network call', async () => {
    const fetchMock = installFetchMock();

    const xon = new XposedOrNot();
    await expect(xon.getDomainBreaches()).rejects.toThrow(AuthenticationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs to /v1/domain-breaches and normalizes the metrics', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: 'success',
        metrics: {
          Breaches_Details: [{ email: 'a@corp.com', domain: 'corp.com', breach: 'Adobe' }],
          Yearly_Metrics: { '2023': 5 },
          Domain_Summary: { 'corp.com': 5 },
          Breach_Summary: { Adobe: 5 },
          Top10_Breaches: { Adobe: 5 },
          Detailed_Breach_Info: { Adobe: { details: '...' } },
        },
      })
    );

    const xon = new XposedOrNot({ apiKey: 'test-key-123' });
    const result = await xon.getDomainBreaches();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.xposedornot.com/v1/domain-breaches');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('test-key-123');

    expect(result.status).toBe('success');
    expect(result.breachesDetails).toEqual([
      { email: 'a@corp.com', domain: 'corp.com', breach: 'Adobe' },
    ]);
    expect(result.yearlyMetrics).toEqual({ '2023': 5 });
    expect(result.top10Breaches).toEqual({ Adobe: 5 });
  });

  it('handles a response without metrics', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ status: 'success' }));

    const xon = new XposedOrNot({ apiKey: 'test-key-123' });
    const result = await xon.getDomainBreaches();

    expect(result.breachesDetails).toEqual([]);
    expect(result.domainSummary).toEqual({});
  });
});
