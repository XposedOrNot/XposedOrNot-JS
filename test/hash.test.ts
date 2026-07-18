import { describe, it, expect } from 'vitest';
import { hashPasswordKeccak512 } from '../src/utils/hash.js';

describe('hashPasswordKeccak512', () => {
  it('produces the original Keccak-512 prefix (not SHA3-512)', () => {
    expect(hashPasswordKeccak512('password')).toBe('a6818b8188');
  });

  it('returns exactly 10 hex characters', () => {
    const prefix = hashPasswordKeccak512('any-password');
    expect(prefix).toMatch(/^[0-9a-f]{10}$/);
  });

  it('produces different prefixes for different passwords', () => {
    expect(hashPasswordKeccak512('password1')).not.toBe(hashPasswordKeccak512('password2'));
  });
});
