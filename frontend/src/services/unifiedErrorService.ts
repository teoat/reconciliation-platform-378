// ============================================================================
import { logger } from '@/services/logger'
// UNIFIED ERROR SERVICE - SINGLE SOURCE OF TRUTH
// ============================================================================

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
 * Unified error handling service
 * Consolidates error handling from:
 * - utils/errorHandler.ts
 * - utils/errorStandardization.ts
 * - services/errorHandler.ts
 * - services/errorRecoveryTester.ts
 * - services/errorTranslationService.ts
 */
export class UnifiedErrorService {
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
   * Handle error with logging and reporting
   */
  static handleError(error: unknown, context?: ErrorContext): void {
    const parsed = this.parseError(error)
    
    // Log error
    logger.error('Error:', parsed, 'Context:', context)
    
    // Report to monitoring service (if available)
    if (typeof window !== 'undefined') {
      const win = window as Record<string, unknown>
      if (win.monitoring && typeof win.monitoring === 'object') {
        const monitoring = win.monitoring as { reportError?: (error: unknown, context?: unknown) => void }
        monitoring.reportError?.(parsed, context)
      }
    }
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error: UnifiedApiError): string {
    return `${error.error}: ${error.message}`
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: unknown): string {
    const parsed = this.parseError(error)
    
    // Map error codes to user-friendly messages
    const messageMap: Record<string, string> = {
      'VALIDATION_ERROR': 'Please check your input and try again',
      'AUTHENTICATION_ERROR': 'Please log in to continue',
      'AUTHORIZATION_ERROR': 'You do not have permission to perform this action',
      'NOT_FOUND': 'The requested resource was not found',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later',
      'NETWORK_ERROR': 'Network error. Please check your connection',
      'TIMEOUT': 'Request timed out. Please try again',
      'SERVER_ERROR': 'Server error. Please try again later'
    }

    return messageMap[parsed.code] || parsed.message
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

export default UnifiedErrorService

