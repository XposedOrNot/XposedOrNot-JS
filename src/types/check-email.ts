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
 * Detailed information about a single breach from the Plus API
 */
export interface BreachInfo {
  /** Unique identifier for the breach */
  breach_id: string;

  /** Date when the breach occurred */
  breached_date: string;

  /** URL to the organization's logo */
  logo: string;

  /** Risk level of password exposure (e.g., 'hardtocrack', 'easytocrack') */
  password_risk: string;

  /** Whether the breach is searchable ('Yes'/'No') */
  searchable: string;

  /** Types of data exposed (e.g., 'Email addresses;Usernames;Passwords') */
  xposed_data: string;

  /** Number of records exposed in the breach */
  xposed_records: number;

  /** Description of the breach incident */
  xposure_desc: string;

  /** Domain of the breached organization */
  domain: string;

  /** Seniority information if available */
  seniority?: string | null;
}

/**
 * Response from the Plus API check-email endpoint (requires API key)
 */
export interface CheckEmailDetailedResponse {
  /** Response status ('success' or 'error') */
  status: string;

  /** The email address that was checked */
  email: string;

  /** List of detailed breach information */
  breaches?: BreachInfo[];
}

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

  /**
   * Detailed breach information (only present when the client is
   * configured with an API key and the Plus API was used)
   */
  details?: BreachInfo[];
}
