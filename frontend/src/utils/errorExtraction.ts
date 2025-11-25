/**
 * Error Extraction Utilities
 * 
 * @deprecated This file is deprecated. Use `@/utils/common/errorHandling` instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration guide:
 * - `getErrorMessage()` → `@/utils/common/errorHandling::getErrorMessage()`
 * - `getErrorMessageFromApiError()` → `@/utils/common/errorHandling::getErrorMessageFromApiError()`
 * - `extractErrorFromApiResponse()` → `@/utils/common/errorHandling::extractErrorFromApiResponse()`
 * - `toError()` → `@/utils/common/errorHandling::toError()`
 */

/**
 * Extracts error code and correlation ID from an API error response
 */
export interface ExtractedErrorInfo {
  error: Error | string;
  errorCode?: string;
  correlationId?: string;
  statusCode?: number;
  timestamp?: Date;
}

// Re-export complex error extraction functions from common module
export {
  extractErrorFromApiResponse,
  createStandardizedError,
  getErrorCodeFromStatusCode,
  extractCorrelationIdFromResponse,
} from './common/errorHandling';

/**
 * Safely extract error message from ApiErrorValue type (string | { message: string })
 * Used to safely access response.error.message
 */
export function getErrorMessageFromApiError(
  error: string | { message: string } | undefined
): string {
  if (!error) {
    return 'An error occurred';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return error.message || 'An error occurred';
  }
  return 'An error occurred';
}

/**
 * Safely extracts error message from any error type with fallback
 * Consolidates the common pattern: error instanceof Error ? error.message : fallback
 */
export function getErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Creates an Error object from any error type
 * Consolidates the common pattern: error instanceof Error ? error : new Error(String(error))
 */
export function toError(error: unknown, fallbackMessage: string = 'An error occurred'): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === 'string' ? error : fallbackMessage);
}
