/**
 * Response when an email is found in breaches
 */
export interface CheckEmailFoundResponse {
  /** List of breach names where the email was found */
  breaches: string[][];

  /** The email address that was checked */
  email: string;
}

/**
 * Response when an email is not found in any breaches
 */
export interface CheckEmailNotFoundResponse {
  /** Error message indicating email was not found */
  Error: string;

  /** The email address that was checked */
  email: string;
}

/**
 * Combined response type for check-email endpoint
 */
export type CheckEmailResponse = CheckEmailFoundResponse | CheckEmailNotFoundResponse;

/**
 * Options for checking an email
 */
export interface CheckEmailOptions {
  /** Include detailed breach information */
  includeDetails?: boolean;
}

/**
 * Normalized result from checkEmail method
 */
export interface CheckEmailResult {
  /** The email address that was checked */
  email: string;

  /** Whether the email was found in any breaches */
  found: boolean;

  /** List of breach names (empty if not found) */
  breaches: string[];
}
