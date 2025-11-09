// Error handling utilities and types

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code: string
  details?: any
  recoverable: boolean
  retryable: boolean
  timestamp: Date
  userId?: string
  projectId?: string
  stackTrace?: string
}

export interface ErrorHandlerConfig {
  enableLogging: boolean
  enableReporting: boolean
  enableRecovery: boolean
  maxRetries: number
  retryDelay: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export class ErrorHandler {
  private config: ErrorHandlerConfig
  private errorLog: AppError[] = []
  private retryCounts: Map<string, number> = new Map()

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: 'error',
      ...config
    }
  }

  public handleError(error: Error | AppError, context?: any): AppError {
    const appError = this.normalizeError(error, context)
    
    if (this.config.enableLogging) {
      this.logError(appError)
    }
    
    if (this.config.enableReporting) {
      this.reportError(appError)
    }
    
    if (this.config.enableRecovery && appError.recoverable) {
      this.attemptRecovery(appError)
    }
    
    return appError
  }

  private normalizeError(error: Error | AppError, context?: any): AppError {
    if (this.isAppError(error)) {
      return error
    }

    const errorType = this.determineErrorType(error)
    const severity = this.determineSeverity(error, errorType)
    
    return {
      type: errorType,
      severity,
      message: error.message || 'An unknown error occurred',
      code: this.generateErrorCode(error),
      details: context,
      recoverable: this.isRecoverable(error, errorType),
      retryable: this.isRetryable(error, errorType),
      timestamp: new Date(),
      stackTrace: error.stack
    }
  }

  private isAppError(error: any): error is AppError {
    return error && typeof error.type === 'string' && typeof error.severity === 'string'
  }

  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorType.NETWORK
    }
    
    if (message.includes('server') || message.includes('internal')) {
      return ErrorType.SERVER
    }
    
    return ErrorType.UNKNOWN
  }

  private determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
    if (type === ErrorType.AUTHENTICATION || type === ErrorType.AUTHORIZATION) {
      return ErrorSeverity.HIGH
    }
    
    if (type === ErrorType.SERVER) {
      return ErrorSeverity.CRITICAL
    }
    
    if (type === ErrorType.NETWORK) {
      return ErrorSeverity.MEDIUM
    }
    
    return ErrorSeverity.LOW
  }

  private generateErrorCode(error: Error): string {
    const name = error.name || 'Error'
    const message = error.message || ''
    return `${name.toUpperCase()}_${message.replace(/\s+/g, '_').toUpperCase()}`
  }

  private isRecoverable(error: Error, type: ErrorType): boolean {
    return type === ErrorType.NETWORK || type === ErrorType.VALIDATION
  }

  private isRetryable(error: Error, type: ErrorType): boolean {
    return type === ErrorType.NETWORK || type === ErrorType.SERVER
  }

  private logError(error: AppError): void {
    this.errorLog.push(error)
    
    const logMessage = `[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage, error)
        break
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, error)
        break
      case ErrorSeverity.LOW:
        console.info(logMessage, error)
        break
    }
  }

  private reportError(error: AppError): void {
    // In a real application, this would send the error to a monitoring service
    // like Sentry, LogRocket, or a custom error reporting endpoint
    console.log('Reporting error:', error)
  }

  private attemptRecovery(error: AppError): void {
    if (!error.retryable) {
      return
    }

    const retryKey = `${error.type}_${error.code}`
    const currentRetries = this.retryCounts.get(retryKey) || 0

    if (currentRetries < this.config.maxRetries) {
      this.retryCounts.set(retryKey, currentRetries + 1)
      
      setTimeout(() => {
        this.retryOperation(error)
      }, this.config.retryDelay * Math.pow(2, currentRetries)) // Exponential backoff
    }
  }

  private retryOperation(error: AppError): void {
    // In a real application, this would retry the failed operation
    console.log('Retrying operation for error:', error)
  }

  public getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  public clearErrorLog(): void {
    this.errorLog = []
    this.retryCounts.clear()
  }

  public getErrorStats(): {
    total: number
    byType: Record<ErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
    recent: AppError[]
  } {
    const byType = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = this.errorLog.filter(e => e.type === type).length
      return acc
    }, {} as Record<ErrorType, number>)

    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorLog.filter(e => e.severity === severity).length
      return acc
    }, {} as Record<ErrorSeverity, number>)

    const recent = this.errorLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recent
    }
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler()

// Error boundary for React components
export class ErrorBoundary extends Error {
  public componentStack?: string
  public errorInfo?: any

  constructor(message: string, componentStack?: string, errorInfo?: any) {
    super(message)
    this.name = 'ErrorBoundary'
    this.componentStack = componentStack
    this.errorInfo = errorInfo
  }
}

// Utility functions
export const createError = (
  type: ErrorType,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  details?: any
): AppError => {
  return {
    type,
    severity,
    message,
    code: `${type.toUpperCase()}_${message.replace(/\s+/g, '_').toUpperCase()}`,
    details,
    recoverable: type === ErrorType.NETWORK || type === ErrorType.VALIDATION,
    retryable: type === ErrorType.NETWORK || type === ErrorType.SERVER,
    timestamp: new Date()
  }
}

export const isNetworkError = (error: any): boolean => {
  return error instanceof TypeError && error.message.includes('fetch')
}

export const isValidationError = (error: any): boolean => {
  return error && error.type === ErrorType.VALIDATION
}

export const isAuthenticationError = (error: any): boolean => {
  return error && error.type === ErrorType.AUTHENTICATION
}

export const isAuthorizationError = (error: any): boolean => {
  return error && error.type === ErrorType.AUTHORIZATION
}

export const isServerError = (error: any): boolean => {
  return error && error.type === ErrorType.SERVER
}

export const isRetryableError = (error: any): boolean => {
  return error && error.retryable === true
}

export const isRecoverableError = (error: any): boolean => {
  return error && error.recoverable === true
}

// Error message mapping
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'Please check your input and try again',
  [ErrorType.AUTHENTICATION]: 'Please log in to continue',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action',
  [ErrorType.NETWORK]: 'Network error. Please check your connection and try again',
  [ErrorType.SERVER]: 'Server error. Please try again later',
  [ErrorType.CLIENT]: 'An error occurred in the application',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred'
}

export const getErrorMessage = (error: AppError): string => {
  return ERROR_MESSAGES[error.type] || error.message
}

export const getErrorTitle = (error: AppError): string => {
  const titles: Record<ErrorSeverity, string> = {
    [ErrorSeverity.LOW]: 'Information',
    [ErrorSeverity.MEDIUM]: 'Warning',
    [ErrorSeverity.HIGH]: 'Error',
    [ErrorSeverity.CRITICAL]: 'Critical Error'
  }
  
  return titles[error.severity]
}

export const formatErrorForDisplay = (error: AppError): {
  title: string
  message: string
  severity: ErrorSeverity
  retryable: boolean
  timestamp: Date
} => {
  return {
    title: getErrorTitle(error),
    message: getErrorMessage(error),
    severity: error.severity,
    retryable: error.retryable,
    timestamp: error.timestamp
  }
}

export default ErrorHandler
