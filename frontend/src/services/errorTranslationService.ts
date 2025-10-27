// Error Translation Service - Maps backend error codes to user-friendly messages
// Implements comprehensive error code translation with context preservation

import { ERROR_CODES } from '../config/AppConfig'

export interface ErrorTranslation {
  userMessage: string
  technicalMessage: string
  actionRequired: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  retryable: boolean
  context: {
    projectId?: string
    userId?: string
    workflowStage?: string
    timestamp: Date
  }
}

export interface ErrorContext {
  projectId?: string
  userId?: string
  workflowStage?: string
  component?: string
  action?: string
  data?: any
}

class ErrorTranslationService {
  private static instance: ErrorTranslationService
  private translations: Map<string, ErrorTranslation> = new Map()

  public static getInstance(): ErrorTranslationService {
    if (!ErrorTranslationService.instance) {
      ErrorTranslationService.instance = new ErrorTranslationService()
    }
    return ErrorTranslationService.instance
  }

  constructor() {
    this.initializeTranslations()
  }

  private initializeTranslations(): void {
    // Authentication Errors
    this.translations.set(ERROR_CODES.AUTH_INVALID_CREDENTIALS, {
      userMessage: 'Invalid email or password. Please check your credentials and try again.',
      technicalMessage: 'Authentication failed: Invalid credentials provided',
      actionRequired: 'Please verify your email and password, then try logging in again.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.AUTH_TOKEN_EXPIRED, {
      userMessage: 'Your session has expired. Please log in again to continue.',
      technicalMessage: 'JWT token has expired',
      actionRequired: 'Please log in again to continue your work.',
      severity: 'low',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.AUTH_ACCESS_DENIED, {
      userMessage: 'You don\'t have permission to perform this action.',
      technicalMessage: 'Access denied: Insufficient permissions',
      actionRequired: 'Contact your administrator to request access to this feature.',
      severity: 'high',
      retryable: false,
      context: { timestamp: new Date() }
    })

    // Validation Errors
    this.translations.set(ERROR_CODES.VALIDATION_REQUIRED_FIELD, {
      userMessage: 'Please fill in all required fields.',
      technicalMessage: 'Required field validation failed',
      actionRequired: 'Complete all required fields marked with * and try again.',
      severity: 'low',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.VALIDATION_INVALID_FORMAT, {
      userMessage: 'The data format is incorrect. Please check your input.',
      technicalMessage: 'Data format validation failed',
      actionRequired: 'Verify the format of your data and try again.',
      severity: 'low',
      retryable: true,
      context: { timestamp: new Date() }
    })

    // File Errors
    this.translations.set(ERROR_CODES.FILE_TOO_LARGE, {
      userMessage: 'File is too large. Please choose a smaller file or contact support.',
      technicalMessage: 'File size exceeds maximum allowed limit',
      actionRequired: 'Reduce file size or split into smaller files.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.FILE_INVALID_TYPE, {
      userMessage: 'Invalid file type. Please upload a CSV or Excel file.',
      technicalMessage: 'File type validation failed',
      actionRequired: 'Convert your file to CSV or Excel format and try again.',
      severity: 'low',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.FILE_UPLOAD_FAILED, {
      userMessage: 'File upload failed. Please check your connection and try again.',
      technicalMessage: 'File upload process failed',
      actionRequired: 'Check your internet connection and try uploading again.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })

    // Data Errors
    this.translations.set(ERROR_CODES.DATA_NOT_FOUND, {
      userMessage: 'The requested data was not found.',
      technicalMessage: 'Data not found in database',
      actionRequired: 'Refresh the page or contact support if the issue persists.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.DATA_PROCESSING_FAILED, {
      userMessage: 'Data processing failed. Please check your data and try again.',
      technicalMessage: 'Data processing error occurred',
      actionRequired: 'Verify your data format and try again.',
      severity: 'high',
      retryable: true,
      context: { timestamp: new Date() }
    })

    // Business Logic Errors
    this.translations.set(ERROR_CODES.WORKFLOW_INVALID_STATE, {
      userMessage: 'Cannot perform this action in the current workflow state.',
      technicalMessage: 'Workflow state validation failed',
      actionRequired: 'Complete the current step before proceeding.',
      severity: 'medium',
      retryable: false,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.CONCURRENT_MODIFICATION, {
      userMessage: 'This data was modified by another user. Please refresh and try again.',
      technicalMessage: 'Concurrent modification detected',
      actionRequired: 'Refresh the page to get the latest data, then try again.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })

    // System Errors
    this.translations.set(ERROR_CODES.NETWORK_ERROR, {
      userMessage: 'Network connection issue. Please check your internet connection.',
      technicalMessage: 'Network request failed',
      actionRequired: 'Check your internet connection and try again.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.TIMEOUT_ERROR, {
      userMessage: 'Request timed out. Please try again.',
      technicalMessage: 'Request timeout exceeded',
      actionRequired: 'Try again in a moment.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })

    this.translations.set(ERROR_CODES.RATE_LIMIT_EXCEEDED, {
      userMessage: 'Too many requests. Please wait a moment before trying again.',
      technicalMessage: 'Rate limit exceeded',
      actionRequired: 'Wait a few seconds before trying again.',
      severity: 'low',
      retryable: true,
      context: { timestamp: new Date() }
    })

    // External Service Errors
    this.translations.set(ERROR_CODES.EXTERNAL_SERVICE_ERROR, {
      userMessage: 'External service is temporarily unavailable. Please try again later.',
      technicalMessage: 'External service error',
      actionRequired: 'Try again in a few minutes.',
      severity: 'medium',
      retryable: true,
      context: { timestamp: new Date() }
    })
  }

  public translateError(
    errorCode: string, 
    context: ErrorContext = {},
    customMessage?: string
  ): ErrorTranslation {
    const baseTranslation = this.translations.get(errorCode)
    
    if (!baseTranslation) {
      return {
        userMessage: customMessage || 'An unexpected error occurred. Please try again.',
        technicalMessage: `Unknown error code: ${errorCode}`,
        actionRequired: 'Please try again or contact support if the issue persists.',
        severity: 'medium',
        retryable: true,
        context: {
          ...context,
          timestamp: new Date()
        }
      }
    }

    // Enhance the translation with context
    let enhancedMessage = baseTranslation.userMessage
    
    // Add context-specific information
    if (context.workflowStage) {
      enhancedMessage += ` (Current stage: ${context.workflowStage})`
    }
    
    if (context.component) {
      enhancedMessage += ` (Component: ${context.component})`
    }

    return {
      ...baseTranslation,
      userMessage: enhancedMessage,
      context: {
        ...baseTranslation.context,
        ...context,
        timestamp: new Date()
      }
    }
  }

  public getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000)
  }

  public shouldRetry(errorCode: string, attempt: number): boolean {
    const translation = this.translations.get(errorCode)
    if (!translation) return false
    
    return translation.retryable && attempt < 5
  }

  public getErrorSeverity(errorCode: string): 'low' | 'medium' | 'high' | 'critical' {
    const translation = this.translations.get(errorCode)
    return translation?.severity || 'medium'
  }

  public getAllTranslations(): Map<string, ErrorTranslation> {
    return new Map(this.translations)
  }

  public addCustomTranslation(errorCode: string, translation: ErrorTranslation): void {
    this.translations.set(errorCode, translation)
  }
}

// React hook for error translation
export const useErrorTranslation = () => {
  const service = ErrorTranslationService.getInstance()

  const translateError = (errorCode: string, context?: ErrorContext, customMessage?: string) => {
    return service.translateError(errorCode, context, customMessage)
  }

  const getRetryDelay = (attempt: number) => {
    return service.getRetryDelay(attempt)
  }

  const shouldRetry = (errorCode: string, attempt: number) => {
    return service.shouldRetry(errorCode, attempt)
  }

  const getErrorSeverity = (errorCode: string) => {
    return service.getErrorSeverity(errorCode)
  }

  return {
    translateError,
    getRetryDelay,
    shouldRetry,
    getErrorSeverity
  }
}

// Export singleton instance
export const errorTranslationService = ErrorTranslationService.getInstance()
