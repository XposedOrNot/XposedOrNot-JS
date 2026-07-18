import { describe, it, expect, afterEach, vi } from 'vitest';
import { XposedOrNot } from '../src/client.js';
import { installFetchMock, jsonResponse } from './helpers.js';

const PLUS_BREACH = {
  breach_id: 'Tesco',
  breached_date: '2014-02-13',
  logo: 'https://example.com/tesco.png',
  password_risk: 'plaintext',
  searchable: 'Yes',
  xposed_data: 'Email addresses;Passwords',
  xposed_records: 2240,
  xposure_desc: 'Accounts were posted online.',
  domain: 'tesco.com',
  seniority: null,
};

describe('checkEmail with API key (Plus API)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes to the Plus API with the x-api-key header', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(
      jsonResponse({ status: 'success', email: 'test@example.com', breaches: [PLUS_BREACH] })
    );

    const xon = new XposedOrNot({ apiKey: 'test-key-123' });
    await xon.checkEmail('test@example.com');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      'https://plus-api.xposedornot.com/v3/check-email/test%40example.com?detailed=true'
    );
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('test-key-123');
  });

  it('returns breach names plus detailed breach info', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(
      jsonResponse({ status: 'success', email: 'test@example.com', breaches: [PLUS_BREACH] })
    );

    const xon = new XposedOrNot({ apiKey: 'test-key-123' });
    const result = await xon.checkEmail('test@example.com');

    expect(result.found).toBe(true);
    expect(result.breaches).toEqual(['Tesco']);
    expect(result.details).toHaveLength(1);
    expect(result.details?.[0].xposed_records).toBe(2240);
  });

  it('returns not found on 404 from the Plus API', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ Error: 'Not found' }, 404));

    const xon = new XposedOrNot({ apiKey: 'test-key-123' });
    const result = await xon.checkEmail('clean@example.com');

    expect(result.found).toBe(false);
    expect(result.breaches).toEqual([]);
    expect(result.details).toEqual([]);
  });

  it('uses the free API when no apiKey is configured', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(
      jsonResponse({ breaches: [['Tesco', 'Adobe']], email: 'test@example.com' })
    );

    const xon = new XposedOrNot();
    const result = await xon.checkEmail('test@example.com');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('https://api.xposedornot.com/v1/check-email/');
    expect((init.headers as Record<string, string>)['x-api-key']).toBeUndefined();
    expect(result.breaches).toEqual(['Tesco', 'Adobe']);
    expect(result.details).toBeUndefined();
  });
});
