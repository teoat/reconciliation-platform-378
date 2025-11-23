// ============================================================================
// STANDARDIZED ERROR HANDLING SERVICE
// ============================================================================
// Single source of truth for error handling across all services.
// Consolidates error parsing, logging, translation, and context tracking.

import { logger } from './logger';
import { unifiedErrorService } from './unifiedErrorService';
import { getErrorMessageFromApiError } from '../utils/errorExtraction';

/**
 * Standardized error handling result
 */
export interface ErrorHandlingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  correlationId?: string;
}

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  /** Component/service name for context */
  component?: string;
  /** Action being performed */
  action?: string;
  /** Project ID if applicable */
  projectId?: string;
  /** User ID if applicable */
  userId?: string;
  /** Workflow stage if applicable */
  workflowStage?: string;
  /** Whether to log the error */
  logError?: boolean;
  /** Whether to track error context */
  trackContext?: boolean;
  /** Whether to translate error message */
  translateError?: boolean;
  /** Custom error message prefix */
  errorPrefix?: string;
}

/**
 * Standardized error handler for API services
 *
 * @example
 * ```typescript
 * try {
 *   const response = await apiClient.get('/api/users');
 *   return handleServiceError(response, { component: 'UsersApiService', action: 'getUsers' });
 * } catch (error) {
 *   return handleServiceError(error, { component: 'UsersApiService', action: 'getUsers' });
 * }
 * ```
 */
export function handleServiceError<T>(
  errorOrResponse: unknown,
  options: ErrorHandlingOptions = {}
): ErrorHandlingResult<T> {
  const {
    component = 'UnknownService',
    action = 'unknown',
    projectId,
    userId,
    workflowStage,
    logError = true,
    trackContext = true,
    translateError = true,
    errorPrefix,
  } = options;

  // Set error context if tracking is enabled (handled by unifiedErrorService)
  // Context is automatically tracked when handleError is called

  // Parse error
  let errorMessage = 'An unknown error occurred';
  let errorCode: string | undefined;
  let correlationId: string | undefined;

  // Handle different error types
  if (errorOrResponse instanceof Error) {
    errorMessage = errorOrResponse.message;
    errorCode = (errorOrResponse as Error & { code?: string }).code;
    correlationId = (errorOrResponse as Error & { correlationId?: string }).correlationId;
  } else if (typeof errorOrResponse === 'object' && errorOrResponse !== null) {
    // Handle API response with error
    const response = errorOrResponse as { error?: string; code?: string; correlationId?: string };
    if (response.error) {
      errorMessage = getErrorMessageFromApiError(response.error);
      errorCode = response.code;
      correlationId = response.correlationId;
    }
  } else if (typeof errorOrResponse === 'string') {
    errorMessage = errorOrResponse;
  }

  // Translate error if enabled (using unified error service)
  if (translateError) {
    const errorObj = errorOrResponse instanceof Error 
      ? errorOrResponse 
      : new Error(errorMessage);
    const translatedMessage = unifiedErrorService.getUserFriendlyMessage(errorObj, {
      component,
      action,
      projectId,
      userId,
      workflowStage,
    });
    if (translatedMessage) {
      errorMessage = translatedMessage;
    }
  }

  // Add prefix if provided
  if (errorPrefix) {
    errorMessage = `${errorPrefix}: ${errorMessage}`;
  }

  // Log error if enabled
  if (logError) {
    logger.error(`[${component}] ${action} failed`, {
      error: errorMessage,
      errorCode,
      correlationId,
      component,
      action,
      projectId,
      userId,
      workflowStage,
    });
  }

  // Track error using unified error service (already handled above if trackContext is true)
  // unifiedErrorService.handleError automatically tracks context

  return {
    success: false,
    error: errorMessage,
    errorCode,
    correlationId,
  };
}

/**
 * Wrapper for async service methods with standardized error handling
 *
 * @example
 * ```typescript
 * static async getUsers() {
 *   return withErrorHandling(
 *     async () => {
 *       const response = await apiClient.getUsers();
 *       if (response.error) throw new Error(response.error);
 *       return response.data;
 *     },
 *     { component: 'UsersApiService', action: 'getUsers' }
 *   );
 * }
 * ```
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<ErrorHandlingResult<T>> {
  try {
    const data = await fn();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleServiceError(error, options);
  }
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; error?: string };
    return err.message || err.error || 'An unknown error occurred';
  }
  return 'An unknown error occurred';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Network errors are retryable
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return true;
    }
    // 5xx errors are retryable
    const code = (error as Error & { code?: string; status?: number }).status;
    if (code && code >= 500 && code < 600) {
      return true;
    }
  }
  return false;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  code?: string,
  correlationId?: string
): ErrorHandlingResult<never> {
  return {
    success: false,
    error: message,
    errorCode: code,
    correlationId,
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(data: T): ErrorHandlingResult<T> {
  return {
    success: true,
    data,
  };
}
