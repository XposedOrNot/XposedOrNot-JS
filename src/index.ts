// Main client export
export { XposedOrNot } from './client.js';

// Type exports
export type {
  // Config types
  XposedOrNotConfig,

  // Breach types
  Breach,
  BreachesResponse,
  GetBreachesOptions,

  // Check email types
  CheckEmailOptions,
  CheckEmailResult,
  CheckEmailResponse,
  CheckEmailFoundResponse,
  CheckEmailNotFoundResponse,

  // Analytics types
  BreachAnalyticsResponse,
  GetBreachAnalyticsOptions,
  BreachesSummary,
  BreachMetrics,
  PastesSummary,
  PasteMetrics,
  ExposedBreaches,
  BreachDetails,
  ExposedPaste,
  RiskAssessment,
  PasswordStrength,
} from './types/index.js';

// Re-export analytics result type
export type { BreachAnalyticsResult } from './endpoints/breach-analytics.js';

// Error exports
export {
  XposedOrNotError,
  RateLimitError,
  NotFoundError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  TimeoutError,
  ApiError,
} from './errors/index.js';
