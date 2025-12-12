/**
 * Information about a single data breach
 */
export interface Breach {
  /** Unique identifier for the breach */
  breachID: string;

  /** Date when the breach occurred */
  breachedDate: string;

  /** Domain associated with the breach */
  domain: string;

  /** Industry category of the breached organization */
  industry: string;

  /** URL to the breach logo */
  logo: string;

  /** Risk level associated with password exposure */
  passwordRisk: string;

  /** Whether the breach is searchable */
  searchable: boolean;

  /** Whether the breach contains sensitive data */
  sensitive: boolean;

  /** Whether the breach has been verified */
  verified: boolean;

  /** Types of data exposed in the breach */
  exposedData: string[];

  /** Number of records exposed */
  exposedRecords: number;

  /** Description of what was exposed */
  exposureDescription: string;

  /** Reference URL for more information */
  referenceURL: string;
}

/**
 * Response from the /v1/breaches endpoint
 */
export interface BreachesResponse {
  status: string;
  exposedBreaches: Breach[] | null;
}

/**
 * Options for filtering breaches
 */
export interface GetBreachesOptions {
  /** Filter breaches by domain */
  domain?: string;

  /** Get a specific breach by ID */
  breachId?: string;
}
