import type { HttpClient } from '../utils/http.js';
import type {
  PasswordCheckResponse,
  PasswordCheckResult,
  PasswordCharacteristics,
} from '../types/password.js';
import { hashPasswordKeccak512 } from '../utils/hash.js';
import { validatePassword } from '../utils/validation.js';
import { NotFoundError } from '../errors/index.js';

/**
 * Base URL for the passwords API. The `/api` path prefix is included in the
 * endpoint path because `new URL(path, base)` discards base path segments.
 */
const PASSWORD_API_BASE = 'https://passwords.xposedornot.com';

/**
 * Parse the characteristics string ("D:3;A:8;S:0;L:11") into an object
 */
function parseCharacteristics(charString: string): PasswordCharacteristics | null {
  const keyMap: Record<string, keyof PasswordCharacteristics> = {
    D: 'digits',
    A: 'alphabets',
    S: 'special',
    L: 'length',
  };

  const characteristics: Partial<PasswordCharacteristics> = {};

  for (const part of charString.split(';')) {
    const [key, value] = part.split(':', 2);
    const mapped = key ? keyMap[key] : undefined;
    if (mapped && value !== undefined) {
      characteristics[mapped] = Number.parseInt(value, 10) || 0;
    }
  }

  if (Object.keys(characteristics).length === 0) {
    return null;
  }

  return {
    digits: characteristics.digits ?? 0,
    alphabets: characteristics.alphabets ?? 0,
    special: characteristics.special ?? 0,
    length: characteristics.length ?? 0,
  };
}

/**
 * Check if a password has been exposed in data breaches
 *
 * SECURITY: Your password is NEVER sent over the network.
 * This function uses k-anonymity protection:
 * 1. The password is hashed locally using Keccak-512
 * 2. Only the first 10 characters of the hash are sent to the API
 * 3. The API returns matches for that hash prefix
 * 4. Your actual password never leaves your machine
 *
 * @param http - HTTP client instance
 * @param password - The password to check (hashed locally, never transmitted)
 * @returns Result with exposure count and password characteristics
 *
 * @example
 * ```typescript
 * const result = await checkPassword(http, 'hunter2');
 *
 * if (result.found) {
 *   console.log(`Exposed ${result.count} times - do not use this password!`);
 * } else {
 *   console.log('Password not found in known breaches');
 * }
 * ```
 */
export async function checkPassword(
  http: HttpClient,
  password: string
): Promise<PasswordCheckResult> {
  validatePassword(password);

  const hashPrefix = hashPasswordKeccak512(password);

  try {
    const response = await http.request<PasswordCheckResponse>(`/api/v1/pass/anon/${hashPrefix}`, {
      baseUrl: PASSWORD_API_BASE,
    });

    const passData = response.SearchPassAnon ?? {};
    const count = Number.parseInt(String(passData.count ?? '0'), 10) || 0;

    return {
      anon: passData.anon ?? hashPrefix,
      found: count > 0,
      count,
      characteristics: passData.char ? parseCharacteristics(passData.char) : null,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        anon: hashPrefix,
        found: false,
        count: 0,
        characteristics: null,
      };
    }

    throw error;
  }
}
