import { describe, it, expect, afterEach, vi } from 'vitest';
import { XposedOrNot } from '../src/client.js';
import { ValidationError } from '../src/errors/index.js';
import { installFetchMock, jsonResponse } from './helpers.js';

describe('checkPassword', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends only the Keccak-512 hash prefix, never the password', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(
      jsonResponse({ SearchPassAnon: { anon: 'a6818b8188', char: 'D:0;A:8;S:0;L:8', count: '100' } })
    );

    const xon = new XposedOrNot();
    await xon.checkPassword('password');

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toBe('https://passwords.xposedornot.com/api/v1/pass/anon/a6818b8188');

    await xon.checkPassword('MySecretHunter42!');
    const secretUrl = String(fetchMock.mock.calls[1][0]);
    expect(secretUrl).not.toContain('MySecretHunter42');
    expect(secretUrl).not.toContain(encodeURIComponent('MySecretHunter42!'));
  });

  it('parses the SearchPassAnon response', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(
      jsonResponse({
        SearchPassAnon: { anon: 'a6818b8188', char: 'D:3;A:8;S:1;L:12', count: '62703' },
      })
    );

    const xon = new XposedOrNot();
    const result = await xon.checkPassword('password');

    expect(result.found).toBe(true);
    expect(result.count).toBe(62703);
    expect(result.anon).toBe('a6818b8188');
    expect(result.characteristics).toEqual({
      digits: 3,
      alphabets: 8,
      special: 1,
      length: 12,
    });
  });

  it('returns not found on 404', async () => {
    const fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ Error: 'Not found' }, 404));

    const xon = new XposedOrNot();
    const result = await xon.checkPassword('some-unique-password');

    expect(result.found).toBe(false);
    expect(result.count).toBe(0);
    expect(result.characteristics).toBeNull();
    expect(result.anon).toMatch(/^[0-9a-f]{10}$/);
  });

  it('rejects empty or non-string passwords without any network call', async () => {
    const fetchMock = installFetchMock();

    const xon = new XposedOrNot();
    await expect(xon.checkPassword('')).rejects.toThrow(ValidationError);
    await expect(xon.checkPassword(123 as unknown as string)).rejects.toThrow(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
