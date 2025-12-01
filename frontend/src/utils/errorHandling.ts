// Consolidated Error Handling Utilities
// Provides consistent error handling patterns across the application

import React from 'react';
import { logger } from '@/services/logger';

// Type declaration for V8's captureStackTrace
declare global {
  interface ErrorConstructor {
    captureStackTrace?(targetObject: object, constructorOpt?: (...args: unknown[]) => unknown): void;
  }
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
  EXTERNAL_SERVICE = 'external_service',
}

// ============================================================================
// ENHANCED ERROR CLASSES
// ============================================================================

export class ApplicationError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly sessionId?: string;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.category = category;
    this.severity = severity;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();

    // Capture stack trace (V8 specific)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ApplicationError);
    }
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCategory.NETWORK, ErrorSeverity.HIGH, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApplicationError {
  public readonly field?: string;

  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, 'AUTH_ERROR', context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH, 'AUTHZ_ERROR', context);
    this.name = 'AuthorizationError';
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Centralized error handler with logging and user feedback
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log application errors
   */
  handle(error: unknown, context?: Record<string, unknown>): ApplicationError {
    const appError = this.normalizeError(error, context);

    // Log the error
    this.logError(appError);

    // Handle user feedback
    this.handleUserFeedback(appError);

    return appError;
  }

  /**
   * Normalize any error type to ApplicationError
   */
  private normalizeError(error: unknown, context?: Record<string, unknown>): ApplicationError {
    if (error instanceof ApplicationError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new NetworkError(error.message, { ...context, originalError: error });
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return new ValidationError(error.message, undefined, { ...context, originalError: error });
      }

      return new ApplicationError(
        error.message,
        ErrorCategory.SYSTEM,
        ErrorSeverity.MEDIUM,
        undefined,
        {
          ...context,
          originalError: error,
          stack: error.stack,
        }
      );
    }

    // Handle non-Error objects
    const message = typeof error === 'string' ? error : 'An unknown error occurred';
    return new ApplicationError(message, ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM, undefined, {
      ...context,
      originalError: error,
    });
  }

  /**
   * Log error with appropriate level based on severity
   */
  private logError(error: ApplicationError): void {
    const logData = {
      message: error.message,
      category: error.category,
      severity: error.severity,
      code: error.code,
      context: error.context,
      userId: error.userId,
      sessionId: error.sessionId,
      stack: error.stack,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`Critical error: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`High severity error: ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`Medium severity error: ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
      default:
        logger.info(`Low severity error: ${error.message}`, logData);
        break;
    }
  }

  /**
   * Handle user feedback based on error type
   */
  private handleUserFeedback(error: ApplicationError): void {
    // This would integrate with your notification system
    // For now, we'll just log that user feedback should be shown
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      logger.logUserAction('error-displayed', 'ErrorHandler', {
        error: error.message,
        category: error.category,
        severity: error.severity,
      });
    }
  }
}

// ============================================================================
// REACT ERROR BOUNDARY UTILITIES
// ============================================================================

/**
 * Enhanced error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: ApplicationError;
  errorInfo?: {
    componentStack: string;
  };
  retryCount: number;
  lastErrorTime?: Date;
}

/**
 * Error boundary error handler
 */
export function handleBoundaryError(
  error: Error,
  errorInfo: { componentStack: string },
  state: ErrorBoundaryState,
  setState: React.Dispatch<React.SetStateAction<ErrorBoundaryState>>
): void {
  const appError = ErrorHandler.getInstance().handle(error, {
    componentStack: errorInfo.componentStack,
    boundaryState: state,
  });

  setState({
    hasError: true,
    error: appError,
    errorInfo,
    retryCount: state.retryCount,
    lastErrorTime: new Date(),
  });
}

/**
 * Error boundary recovery handler
 */
export function handleBoundaryRecovery(
  setState: React.Dispatch<React.SetStateAction<ErrorBoundaryState>>
): void {
  setState({
    hasError: false,
    error: undefined,
    errorInfo: undefined,
    retryCount: 0,
    lastErrorTime: undefined,
  });

  logger.logUserAction('error-boundary-recovery', 'ErrorBoundary', {
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// ASYNC ERROR HANDLING
// ============================================================================

/**
 * Wrap async operations with consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw ErrorHandler.getInstance().handle(error, context);
  }
}

/**
 * Retry async operations with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryCondition(error)) {
        throw ErrorHandler.getInstance().handle(error, {
          attempt,
          maxRetries,
          operation: operation.name,
        });
      }

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));

      logger.info(`Retrying operation after ${delay}ms delay`, {
        attempt: attempt + 1,
        maxRetries,
        delay,
      });
    }
  }

  throw lastError;
}

// ============================================================================
// API ERROR HANDLING
// ============================================================================

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, unknown>
): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network request failed', {
      ...context,
      originalError: error,
    });
  }

  // Handle HTTP errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const httpError = error as { status: number; message?: string };

    switch (httpError.status) {
      case 401:
        return new AuthenticationError(httpError.message || 'Authentication required', {
          ...context,
          status: httpError.status,
        });
      case 403:
        return new AuthorizationError(httpError.message || 'Access denied', {
          ...context,
          status: httpError.status,
        });
      case 400:
      case 422:
        return new ValidationError(httpError.message || 'Validation failed', undefined, {
          ...context,
          status: httpError.status,
        });
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApplicationError(
          httpError.message || 'Server error',
          ErrorCategory.EXTERNAL_SERVICE,
          ErrorSeverity.HIGH,
          `HTTP_${httpError.status}`,
          { ...context, status: httpError.status }
        );
      default:
        return new ApplicationError(
          httpError.message || 'API request failed',
          ErrorCategory.NETWORK,
          ErrorSeverity.MEDIUM,
          `HTTP_${httpError.status}`,
          { ...context, status: httpError.status }
        );
    }
  }

  return ErrorHandler.getInstance().handle(error, context);
}

// ============================================================================
// HOOKS FOR ERROR HANDLING
// ============================================================================

/**
 * React hook for error handling in components
 */
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = React.useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      return errorHandler.handle(error, context);
    },
    [errorHandler]
  );

  const handleAsync = React.useCallback(
    async <T>(operation: () => Promise<T>, context?: Record<string, unknown>): Promise<T> => {
      return withErrorHandling(operation, context);
    },
    []
  );

  const handleApiError = React.useCallback((error: unknown, context?: Record<string, unknown>) => {
    return handleApiError(error, context);
  }, []);

  return {
    handleError,
    handleAsync,
    handleApiError,
  };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const errorUtils = {
  ErrorHandler,
  ApplicationError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ErrorSeverity,
  ErrorCategory,
  handleBoundaryError,
  handleBoundaryRecovery,
  withErrorHandling,
  withRetry,
  handleApiError,
  useErrorHandler,
};

export default errorUtils;
