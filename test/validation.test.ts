import { describe, it, expect } from 'vitest';
import { validateEmail, validateDomain, normalizeEmail } from '../src/utils/validation.js';
import { ValidationError } from '../src/errors/index.js';

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(() => validateEmail('test@example.com')).not.toThrow();
    expect(() => validateEmail('user.name@domain.org')).not.toThrow();
    expect(() => validateEmail('user+tag@example.co.uk')).not.toThrow();
  });

  it('rejects non-string input', () => {
    expect(() => validateEmail(null)).toThrow(ValidationError);
    expect(() => validateEmail(undefined)).toThrow(ValidationError);
    expect(() => validateEmail(123)).toThrow(ValidationError);
  });

  it('rejects empty string', () => {
    expect(() => validateEmail('')).toThrow(ValidationError);
    expect(() => validateEmail('   ')).toThrow(ValidationError);
  });

  it('rejects invalid email format', () => {
    expect(() => validateEmail('notanemail')).toThrow(ValidationError);
    expect(() => validateEmail('missing@domain')).toThrow(ValidationError);
    expect(() => validateEmail('@nodomain.com')).toThrow(ValidationError);
  });
});

describe('validateDomain', () => {
  it('accepts valid domains', () => {
    expect(() => validateDomain('example.com')).not.toThrow();
    expect(() => validateDomain('sub.domain.org')).not.toThrow();
  });

  it('rejects invalid domains', () => {
    expect(() => validateDomain('')).toThrow(ValidationError);
    expect(() => validateDomain('invalid')).toThrow(ValidationError);
  });
});

describe('normalizeEmail', () => {
  it('trims whitespace and lowercases', () => {
    expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });
});
