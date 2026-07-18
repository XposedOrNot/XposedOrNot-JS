import { describe, it, expect, afterEach, vi } from 'vitest';
import { HttpClient } from '../src/utils/http.js';
import { DEFAULT_CONFIG } from '../src/types/config.js';
import { ServerError, ApiError } from '../src/errors/index.js';
import { installFetchMock, jsonResponse } from './helpers.js';

describe('HttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('spaces free-API requests at least 1 second apart', async () => {
    vi.useFakeTimers();
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    const http = new HttpClient({ ...DEFAULT_CONFIG });

    await http.request('/v1/breaches');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    let secondDone = false;
    const second = http.request('/v1/breaches').then(() => {
      secondDone = true;
    });

    await vi.advanceTimersByTimeAsync(900);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(secondDone).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    await second;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not rate limit when an API key is configured', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    const http = new HttpClient({ ...DEFAULT_CONFIG, apiKey: 'test-key' });

    const start = Date.now();
    await http.request('/v1/breaches');
    await http.request('/v1/breaches');
    expect(Date.now() - start).toBeLessThan(500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws ServerError on 5xx responses', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, 503));

    const http = new HttpClient({ ...DEFAULT_CONFIG, apiKey: 'k', retries: 0 });

    await expect(http.request('/v1/breaches')).rejects.toThrow(ServerError);
  });

  it('makes exactly one attempt when retries is 0', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, 500));

    const http = new HttpClient({ ...DEFAULT_CONFIG, apiKey: 'k', retries: 0 });

    await expect(http.request('/v1/breaches')).rejects.toThrow(ServerError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries 5xx errors and succeeds on a later attempt', async () => {
    vi.useFakeTimers();
    const fetchMock = installFetchMock();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const http = new HttpClient({ ...DEFAULT_CONFIG, apiKey: 'k', retries: 1 });

    const promise = http.request<{ ok: boolean }>('/v1/breaches');
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-429 4xx errors', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ error: 'bad request' }, 400));

    const http = new HttpClient({ ...DEFAULT_CONFIG, apiKey: 'k', retries: 3 });

    await expect(http.request('/v1/breaches')).rejects.toThrow(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('overrides the base URL per request', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    const http = new HttpClient({ ...DEFAULT_CONFIG, apiKey: 'k' });
    await http.request('/api/v1/pass/anon/abc', { baseUrl: 'https://passwords.xposedornot.com' });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://passwords.xposedornot.com/api/v1/pass/anon/abc'
    );
  });
});
