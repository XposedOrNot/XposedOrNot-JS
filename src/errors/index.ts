/**
 * Base error class for all XposedOrNot errors
 */
export class XposedOrNotError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'XposedOrNotError';
    // V8-specific stack trace capture (Node.js, Chrome)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when the API rate limit is exceeded
 */
export class RateLimitError extends XposedOrNotError {
  constructor(
    message = 'Rate limit exceeded. Please slow down your requests.',
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown when a resource is not found (e.g., email not in any breaches)
 */
export class NotFoundError extends XposedOrNotError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends XposedOrNotError {
  constructor(message = 'Authentication failed. Check your API key.') {
    super(message, 'AUTHENTICATION_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends XposedOrNotError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a network error occurs
 */
export class NetworkError extends XposedOrNotError {
  constructor(
    message = 'A network error occurred',
    public readonly cause?: Error
  ) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when the request times out
 */
export class TimeoutError extends XposedOrNotError {
  constructor(message = 'Request timed out') {
    super(message, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

/**
 * Error thrown when the API returns an unexpected response
 */
export class ApiError extends XposedOrNotError {
  constructor(
    message: string,
    statusCode: number,
    public readonly response?: unknown
  ) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'ApiError';
  }
}
