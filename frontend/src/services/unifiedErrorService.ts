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

import { logger } from '@/services/logger'
import { errorContextService, type ErrorContext as ErrorContextType } from './errorContextService'
import { errorTranslationService, type ErrorTranslation } from './errorTranslationService'

export interface UnifiedApiError {
  error: string           // Error type
  message: string         // User-friendly message
  code: string           // Error code
  details?: unknown      // Additional context
  timestamp?: string     // When error occurred
  requestId?: string     // Request identifier
}

export interface ErrorContext {
  userId?: string
  projectId?: string
  component?: string
  action?: string
  [key: string]: unknown
}

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
        timestamp: new Date().toISOString()
      }
    }

    // Handle API error responses
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>
      return {
        error: (err.error as string) || 'Error',
        message: (err.message as string) || 'An error occurred',
        code: (err.code as string) || 'UNKNOWN_ERROR',
        details: err.details,
        timestamp: (err.timestamp as string) || new Date().toISOString(),
        requestId: (err.request_id as string) || (err.requestId as string)
      }
    }

    // Fallback
    return {
      error: 'Unknown Error',
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Handle error with logging, context tracking, translation, and reporting
   */
  static handleError(error: unknown, context?: ErrorContext): void {
    const parsed = this.parseError(error)
    
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
        const monitoring = win.monitoring as { reportError?: (error: unknown, context?: unknown) => void };
        monitoring.reportError?.(parsed, context);
      }
    }
  }

  /**
   * Handle error with translation (returns user-friendly message)
   */
  static handleErrorWithTranslation(
    error: unknown,
    context?: ErrorContext
  ): { parsed: UnifiedApiError; translation?: ErrorTranslation; userMessage: string } {
    const parsed = this.parseError(error);
    
    // Get translation
    const translation = errorTranslationService.translateError(parsed.code, {
      component: context?.component,
      action: context?.action,
      data: context,
    });

    // Handle error (logging, context tracking, etc.)
    this.handleError(error, context);

    return {
      parsed,
      translation,
      userMessage: translation?.userMessage || parsed.message,
    };
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error: UnifiedApiError): string {
    return `${error.error}: ${error.message}`
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
   * Check if error is retryable
   */
  static isRetryable(error: unknown): boolean {
    const parsed = this.parseError(error)
    
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'SERVICE_UNAVAILABLE'
    ]

    return retryableCodes.includes(parsed.code)
  }

  /**
   * Get appropriate HTTP status code
   */
  static getStatusCode(error: UnifiedApiError): number {
    const codeMap: Record<string, number> = {
      'VALIDATION_ERROR': 400,
      'AUTHENTICATION_ERROR': 401,
      'AUTHORIZATION_ERROR': 403,
      'NOT_FOUND': 404,
      'CONFLICT': 409,
      'RATE_LIMIT_EXCEEDED': 429,
      'SERVER_ERROR': 500,
      'SERVICE_UNAVAILABLE': 503
    }

    return codeMap[error.code] || 500
  }
}

// Export singleton instance
export const unifiedErrorService = UnifiedErrorService.getInstance();

// Export for convenience
export default unifiedErrorService;

