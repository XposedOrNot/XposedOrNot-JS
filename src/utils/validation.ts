import { ValidationError } from '../errors/index.js';

/**
 * Regular expression for validating email addresses
 * This is a simplified pattern that covers most common cases
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address
 * @param email - The email address to validate
 * @throws {ValidationError} If the email is invalid
 */
export function validateEmail(email: unknown): asserts email is string {
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string', 'email');
  }

  const trimmed = email.trim();

  if (!trimmed) {
    throw new ValidationError('Email is required', 'email');
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    throw new ValidationError('Invalid email format', 'email');
  }

  if (trimmed.length > 254) {
    throw new ValidationError('Email is too long (max 254 characters)', 'email');
  }
}

/**
 * Validate a domain string
 * @param domain - The domain to validate
 * @throws {ValidationError} If the domain is invalid
 */
export function validateDomain(domain: unknown): asserts domain is string {
  if (typeof domain !== 'string') {
    throw new ValidationError('Domain must be a string', 'domain');
  }

  const trimmed = domain.trim();

  if (!trimmed) {
    throw new ValidationError('Domain is required', 'domain');
  }

  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(trimmed)) {
    throw new ValidationError('Invalid domain format', 'domain');
  }
}

/**
 * Normalize an email address (trim and lowercase)
 * @param email - The email address to normalize
 * @returns The normalized email
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Sanitize an email address for use in URL paths
 * @param email - The email address to sanitize
 * @returns The URL-encoded email for path segments
 */
export function sanitizeEmailForPath(email: string): string {
  return encodeURIComponent(normalizeEmail(email));
}
