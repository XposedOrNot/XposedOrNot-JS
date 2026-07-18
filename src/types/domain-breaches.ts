/**
 * A single exposed email record from the domain-breaches endpoint
 */
export interface DomainBreachDetail {
  /** Email address exposed in the breach */
  email: string;

  /** Verified domain the email belongs to */
  domain: string;

  /** Name of the breach the email was found in */
  breach: string;
}

/**
 * Raw response from the /v1/domain-breaches endpoint
 */
export interface DomainBreachesResponse {
  status?: string;
  metrics?: {
    Breaches_Details?: DomainBreachDetail[];
    Yearly_Metrics?: Record<string, unknown>;
    Domain_Summary?: Record<string, unknown>;
    Breach_Summary?: Record<string, unknown>;
    Top10_Breaches?: Record<string, unknown>;
    Detailed_Breach_Info?: Record<string, unknown>;
  };
}

/**
 * Normalized result from getDomainBreaches method
 */
export interface DomainBreachesResult {
  /** Response status ('success' or 'error') */
  status: string;

  /** Exposed email records across the verified domains */
  breachesDetails: DomainBreachDetail[];

  /** Breach counts by year */
  yearlyMetrics: Record<string, unknown>;

  /** Summary of breaches by domain */
  domainSummary: Record<string, unknown>;

  /** Summary of all breaches */
  breachSummary: Record<string, unknown>;

  /** Top 10 largest breaches affecting the domains */
  top10Breaches: Record<string, unknown>;

  /** Detailed information about each breach */
  detailedBreachInfo: Record<string, unknown>;
}
