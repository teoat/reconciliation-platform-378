// ============================================================================
// UNIFIED ERROR SERVICE - SINGLE SOURCE OF TRUTH
// ============================================================================
// Consolidates error handling from:
// - unifiedErrorService.ts (base implementation)
// - errorContextService.ts (context tracking)
// - errorTranslationService.ts (error translation)
// - utils/errorService.ts (error reporting)
// - serviceIntegrationService.ts (unified error handling)
// ============================================================================

import { logger } from '@/services/logger';
import { errorContextService, type ErrorContext as ErrorContextType } from './errorContextService';
import { errorTranslationService, type ErrorTranslation } from './errorTranslationService';

// ============================================================================
// ERROR TYPES & ENUMS
// ============================================================================

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface UnifiedError {
  id: string;
  code: string;
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  correlationId?: string;
  context?: Record<string, unknown>;
  retryable: boolean;
  stack?: string;
}

export interface UnifiedApiError {
  error: string; // Error type
  message: string; // User-friendly message
  code: string; // Error code
  details?: unknown; // Additional context
  timestamp?: string; // When error occurred
  requestId?: string; // Request identifier
}

export interface ErrorContext {
  userId?: string;
  projectId?: string;
  component?: string;
  action?: string;
  workflowStage?: string;
  retryable?: boolean;
  maxRetries?: number;
  [key: string]: unknown;
}

// Error code to category mapping
const ERROR_CODE_MAP: Record<string, ErrorCategory> = {
  'ERR_BAD_REQUEST': ErrorCategory.VALIDATION,
  'ERR_UNAUTHORIZED': ErrorCategory.AUTHENTICATION,
  'ERR_FORBIDDEN': ErrorCategory.AUTHORIZATION,
  'ERR_NOT_FOUND': ErrorCategory.NOT_FOUND,
  'ERR_INTERNAL_SERVER_ERROR': ErrorCategory.SERVER,
  'ERR_NETWORK': ErrorCategory.NETWORK,
  'ERR_TIMEOUT': ErrorCategory.NETWORK,
  'ERR_SERVICE_UNAVAILABLE': ErrorCategory.EXTERNAL_SERVICE,
  'VALIDATION_ERROR': ErrorCategory.VALIDATION,
  'AUTHENTICATION_ERROR': ErrorCategory.AUTHENTICATION,
  'AUTHORIZATION_ERROR': ErrorCategory.AUTHORIZATION,
  'NETWORK_ERROR': ErrorCategory.NETWORK,
  'SERVER_ERROR': ErrorCategory.SERVER,
};

/**
 * Unified Error Service
 * Single source of truth for all error handling
 * Integrates with errorContextService and errorTranslationService
 */
export class UnifiedErrorService {
  private static instance: UnifiedErrorService;

  public static getInstance(): UnifiedErrorService {
    if (!UnifiedErrorService.instance) {
      UnifiedErrorService.instance = new UnifiedErrorService();
    }
    return UnifiedErrorService.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }
  /**
   * Parse error into standardized format
   */
  static parseError(error: unknown): UnifiedApiError {
    // Handle Error objects
    if (error instanceof Error) {
      return {
        error: error.name || 'Error',
        message: error.message || 'An error occurred',
        code: 'ERROR',
        timestamp: new Date().toISOString(),
      };
    }

    // Handle API error responses
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        error: (err.error as string) || 'Error',
        message: (err.message as string) || 'An error occurred',
        code: (err.code as string) || 'UNKNOWN_ERROR',
        details: err.details,
        timestamp: (err.timestamp as string) || new Date().toISOString(),
        requestId: (err.request_id as string) || (err.requestId as string),
      };
    }

    // Fallback
    return {
      error: 'Unknown Error',
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle error with full context and return UnifiedError
   */
  static async handleError(
    error: unknown,
    options: ErrorContext = {}
  ): Promise<UnifiedError> {
    const parsed = this.parseError(error);
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = options.correlationId as string || `corr_${Date.now()}`;
    
    // Determine category and severity
    const category = ERROR_CODE_MAP[parsed.code] || ErrorCategory.UNKNOWN;
    const severity = this.determineSeverity(category, parsed.code);
    
    // Get translation
    const translation = errorTranslationService.translateError(parsed.code, {
      component: options.component,
      action: options.action,
      data: options,
    });
    
    // Create unified error
    const unifiedError: UnifiedError = {
      id: errorId,
      code: parsed.code,
      message: parsed.message,
      userMessage: translation?.userMessage || parsed.message,
      category,
      severity,
      timestamp: new Date(),
      correlationId,
      context: {
        ...options,
        requestId: parsed.requestId,
        details: parsed.details,
      },
      retryable: this.isRetryable(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    // Set error context if provided
    if (options.component || options.action || options.projectId || options.userId) {
      errorContextService.setContext({
        component: options.component,
        action: options.action,
        projectId: options.projectId as string,
        userId: options.userId as string,
      });
    }
    
    // Track error in context service
    const errorObj = error instanceof Error ? error : new Error(String(error));
    errorContextService.trackError(errorObj, {
      component: options.component,
      action: options.action,
      data: options,
    });
    
    // Log error with structured data
    logger.error('Error occurred', {
      errorId: unifiedError.id,
      correlationId: unifiedError.correlationId,
      category: unifiedError.category,
      severity: unifiedError.severity,
      component: options.component,
      action: options.action,
      context: unifiedError.context,
      stack: unifiedError.stack,
    });
    
    // Report to monitoring service (if available)
    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      if (win.monitoring && typeof win.monitoring === 'object') {
        const monitoring = win.monitoring as {
          reportError?: (error: unknown, context?: unknown) => void;
        };
        monitoring.reportError?.(unifiedError, options);
      }
    }
    
    return unifiedError;
  }
  
  /**
   * Handle error with logging, context tracking, translation, and reporting (legacy method)
   */
  static handleErrorLegacy(error: unknown, context?: ErrorContext): void {
    const parsed = this.parseError(error);

    // Set error context if provided
    if (context) {
      errorContextService.setContext({
        component: context.component,
        action: context.action,
        projectId: context.projectId,
        userId: context.userId,
      });
    }

    // Track error in context service
    const errorObj = error instanceof Error ? error : new Error(String(error));
    errorContextService.trackError(errorObj, {
      component: context?.component,
      action: context?.action,
      data: context,
    });

    // Log error
    logger.error('Error occurred', { error: parsed, context });

    // Report to monitoring service (if available)
    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      if (win.monitoring && typeof win.monitoring === 'object') {
        const monitoring = win.monitoring as {
          reportError?: (error: unknown, context?: unknown) => void;
        };
        monitoring.reportError?.(parsed, context);
      }
    }
  }

  /**
   * Handle error with translation (returns user-friendly message)
   */
  static async handleErrorWithTranslation(
    error: unknown,
    context?: ErrorContext
  ): Promise<{ parsed: UnifiedApiError; translation?: ErrorTranslation; userMessage: string; unifiedError: UnifiedError }> {
    const parsed = this.parseError(error);

    // Get translation
    const translation = errorTranslationService.translateError(parsed.code, {
      component: context?.component,
      action: context?.action,
      data: context,
    });

    // Handle error (logging, context tracking, etc.)
    const unifiedError = await this.handleError(error, context);

    return {
      parsed,
      translation,
      userMessage: translation?.userMessage || parsed.message,
      unifiedError,
    };
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error: UnifiedApiError): string {
    return `${error.error}: ${error.message}`;
  }

  /**
   * Get user-friendly error message (uses translation service)
   */
  static getUserFriendlyMessage(error: unknown, context?: ErrorContext): string {
    const parsed = this.parseError(error);

    // Use translation service for better messages
    const translation = errorTranslationService.translateError(parsed.code, {
      component: context?.component,
      action: context?.action,
      data: context,
    });

    return translation?.userMessage || parsed.message;
  }

  /**
   * Get current error context
   */
  static getCurrentContext(): ErrorContextType | null {
    return errorContextService.getCurrentContext();
  }

  /**
   * Determine error severity based on category and code
   */
  private static determineSeverity(category: ErrorCategory, code: string): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.SERVER && code.includes('CRITICAL')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity
    if ([ErrorCategory.AUTHENTICATION, ErrorCategory.AUTHORIZATION, ErrorCategory.SERVER].includes(category)) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity
    if ([ErrorCategory.VALIDATION, ErrorCategory.NETWORK, ErrorCategory.EXTERNAL_SERVICE].includes(category)) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Low severity
    return ErrorSeverity.LOW;
  }
  
  /**
   * Check if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    const parsed = this.parseError(error);

    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR', 'SERVICE_UNAVAILABLE', 'ERR_NETWORK', 'ERR_TIMEOUT'];

    return retryableCodes.includes(parsed.code);
  }
  
  /**
   * Generate correlation ID
   */
  static generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get appropriate HTTP status code
   */
  static getStatusCode(error: UnifiedApiError): number {
    const codeMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      AUTHENTICATION_ERROR: 401,
      AUTHORIZATION_ERROR: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      RATE_LIMIT_EXCEEDED: 429,
      SERVER_ERROR: 500,
      SERVICE_UNAVAILABLE: 503,
    };

    return codeMap[error.code] || 500;
  }
}

// Export singleton instance
export const unifiedErrorService = UnifiedErrorService.getInstance();

// Export for convenience
export default unifiedErrorService;
