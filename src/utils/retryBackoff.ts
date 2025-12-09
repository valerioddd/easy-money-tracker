/**
 * Retry and Backoff Utilities
 *
 * Provides exponential backoff and retry logic for handling transient errors
 * and rate limiting in API calls.
 */

/**
 * Calculate exponential backoff delay
 * @param retryCount Number of retries attempted (0-based)
 * @param baseDelayMs Base delay in milliseconds (default 1000ms)
 * @param maxDelayMs Maximum delay in milliseconds (default 30000ms)
 * @returns Delay in milliseconds with jitter
 */
export const exponentialBackoff = (
  retryCount: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): number => {
  // Calculate exponential delay: baseDelay * 2^retryCount
  const exponentialDelay = baseDelayMs * Math.pow(2, retryCount);
  
  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  
  // Add jitter (±25%) to avoid thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  
  // Ensure delay is never negative
  return Math.max(0, Math.floor(cappedDelay + jitter));
};

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default 1000) */
  baseDelayMs?: number;
  /** Maximum delay in milliseconds (default 30000) */
  maxDelayMs?: number;
  /** Predicate to determine if error is retryable (default: always true) */
  shouldRetry?: (error: any) => boolean;
  /** Callback called before each retry */
  onRetry?: (error: any, retryCount: number, delayMs: number) => void;
}

/**
 * Execute a function with exponential backoff retry logic
 * @param fn Async function to execute
 * @param options Retry configuration options
 * @returns Result of the function
 * @throws Last error if all retries are exhausted
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Calculate backoff delay
      const delayMs = exponentialBackoff(attempt, baseDelayMs, maxDelayMs);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, delayMs);
      }
      
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  
  // All retries exhausted, throw last error
  throw lastError;
};

/**
 * Check if an error is a transient error that should be retried
 * @param error The error to check
 * @returns True if the error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'AbortError') {
    return true;
  }
  
  // HTTP status codes that are retryable
  if (error.statusCode) {
    const retryableStatusCodes = [
      408, // Request Timeout
      429, // Too Many Requests (rate limit)
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504, // Gateway Timeout
    ];
    return retryableStatusCodes.includes(error.statusCode);
  }
  
  return false;
};
