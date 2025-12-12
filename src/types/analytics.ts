/**
 * Summary of breaches for an email
 */
export interface BreachesSummary {
  /** Semicolon-separated list of breach sites */
  site?: string;

  /** Additional summary fields */
  [key: string]: unknown;
}

/**
 * Risk assessment for the email
 */
export interface RiskAssessment {
  risk_label: string;
  risk_score: number;
}

/**
 * Password strength breakdown
 */
export interface PasswordStrength {
  EasyToCrack: number;
  PlainText: number;
  StrongHash: number;
  Unknown: number;
}

/**
 * Metrics about breaches
 */
export interface BreachMetrics {
  /** Industry breakdown */
  industry?: unknown[][];

  /** Password strength analysis */
  passwords_strength?: PasswordStrength[];

  /** Risk assessment */
  risk?: RiskAssessment[];

  /** Exposed data categories */
  xposed_data?: unknown[];

  /** Year-wise breakdown */
  yearwise_details?: Record<string, number>[];

  /** Additional details */
  get_details?: unknown[];

  [key: string]: unknown;
}

/**
 * Summary of paste exposures
 */
export interface PastesSummary {
  /** Count of pastes */
  cnt?: number;

  /** Domain */
  domain?: string;

  /** Timestamp */
  tmpstmp?: string;

  [key: string]: unknown;
}

/**
 * Metrics about paste exposures
 */
export type PasteMetrics = Record<string, unknown>;

/**
 * Individual exposed breach details
 */
export interface BreachDetails {
  /** Breach name/identifier */
  breach: string;

  /** Description of the breach */
  details: string;

  /** Domain associated with the breach */
  domain: string;

  /** Industry category */
  industry: string;

  /** URL to breach logo */
  logo: string;

  /** Password risk level */
  password_risk: string;

  /** Reference URLs */
  references: string;

  /** Whether the breach is searchable */
  searchable: string;

  /** Whether the breach is verified */
  verified: string;

  /** Types of data exposed (semicolon-separated) */
  xposed_data: string;

  /** Date of the breach */
  xposed_date: string;

  /** Number of records exposed */
  xposed_records: number;

  /** Date added to database */
  added: string;
}

/**
 * Container for exposed breaches
 */
export interface ExposedBreaches {
  breaches_details: BreachDetails[];
}

/**
 * Individual exposed paste details
 */
export type ExposedPaste = Record<string, unknown>;

/**
 * Response from the /v1/breach-analytics endpoint
 */
export interface BreachAnalyticsResponse {
  /** Exposed breaches container with details */
  ExposedBreaches: ExposedBreaches | null;

  /** Summary of all breaches */
  BreachesSummary: BreachesSummary | null;

  /** Metrics about breaches */
  BreachMetrics: BreachMetrics | null;

  /** Summary of paste exposures */
  PastesSummary: PastesSummary | null;

  /** List of exposed pastes */
  ExposedPastes: ExposedPaste[] | null;

  /** Metrics about paste exposures */
  PasteMetrics: PasteMetrics | null;
}

/**
 * Options for getting breach analytics
 */
export interface GetBreachAnalyticsOptions {
  /** Token for accessing sensitive data */
  token?: string;
}
