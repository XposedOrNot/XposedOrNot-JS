import jsSha3 from 'js-sha3';

const { keccak512 } = jsSha3;

/**
 * Hash a password using original Keccak-512 and return the k-anonymity prefix.
 *
 * Note: This uses the original Keccak-512 algorithm, NOT SHA3-512 (FIPS 202).
 * Node's built-in `crypto` sha3-512 is FIPS 202 and produces different output.
 *
 * @param password - The password to hash
 * @returns The first 10 characters of the Keccak-512 hash
 */
export function hashPasswordKeccak512(password: string): string {
  return keccak512(password).slice(0, 10);
}
