/**
 * Characteristics of a password found in breaches
 */
export interface PasswordCharacteristics {
  /** Number of digits in the password */
  digits: number;

  /** Number of alphabetic characters in the password */
  alphabets: number;

  /** Number of special characters in the password */
  special: number;

  /** Total length of the password */
  length: number;
}

/**
 * Raw response from the password check endpoint
 *
 * API returns: {"SearchPassAnon": {"anon": "...", "char": "D:3;A:8;S:0;L:11", "count": "62703"}}
 */
export interface PasswordCheckResponse {
  SearchPassAnon?: {
    anon?: string;
    char?: string;
    count?: string | number;
    wordlist?: number;
  };
}

/**
 * Normalized result from checkPassword method
 */
export interface PasswordCheckResult {
  /** The Keccak-512 hash prefix that was used for the k-anonymity check */
  anon: string;

  /** Whether the password was found in any breaches */
  found: boolean;

  /** Number of times this password was found in breaches */
  count: number;

  /** Password characteristics (null if the password was not found) */
  characteristics: PasswordCharacteristics | null;
}
