// Comprehensive Error Handling System
// Centralized error management with monitoring, logging, and user feedback

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { toast } from 'react-hot-toast'
// Note: addNotification is available from '@/store/unifiedStore' if needed in the future

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: any
  timestamp: Date
  userId?: string
  projectId?: string
  component?: string
  stack?: string
  userMessage?: string
  retryable: boolean
  retryCount?: number
  maxRetries?: number
}

// ============================================================================
// ERROR HANDLER CLASS
// ============================================================================

class ErrorHandler {
  private errors: AppError[] = []
  private maxErrors = 1000
  private retryDelays = [1000, 3000, 5000, 10000] // Progressive delays

  // Create a new error
  createError(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity
      details?: any
      userId?: string
      projectId?: string
      component?: string
      stack?: string
      userMessage?: string
      retryable?: boolean
      maxRetries?: number
    } = {}
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      type,
      severity: options.severity || ErrorSeverity.MEDIUM,
      message,
      details: options.details,
      timestamp: new Date(),
      userId: options.userId,
      projectId: options.projectId,
      component: options.component,
      stack: options.stack,
      userMessage: options.userMessage || this.getDefaultUserMessage(type),
      retryable: options.retryable || false,
      retryCount: 0,
      maxRetries: options.maxRetries || 3
    }

    this.addError(error)
    return error
  }

  // Add error to the collection
  private addError(error: AppError): void {
    this.errors.unshift(error)
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Log error
    this.logError(error)

    // Send to monitoring service
    this.sendToMonitoring(error)

    // Show user notification
    this.showUserNotification(error)
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get default user message based on error type
  private getDefaultUserMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.NETWORK]: 'Network connection issue. Please check your internet connection.',
      [ErrorType.VALIDATION]: 'Please check your input and try again.',
      [ErrorType.AUTHENTICATION]: 'Please log in again to continue.',
      [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
      [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorType.SERVER]: 'Server error occurred. Please try again later.',
      [ErrorType.CLIENT]: 'An error occurred in the application.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred.'
    }
    return messages[type] || messages[ErrorType.UNKNOWN]
  }

  // Log error to console and external service
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity)
    const logMessage = `[${error.type}] ${error.message}`
    
    console[logLevel](logMessage, {
      errorId: error.id,
      details: error.details,
      stack: error.stack,
      userId: error.userId,
      projectId: error.projectId,
      component: error.component
    })

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(error)
    }
  }

  // Get console log level based on severity
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error'
      default:
        return 'log'
    }
  }

  // Send error to monitoring service
  private sendToMonitoring(error: AppError): void {
    // Only send high and critical errors to monitoring
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      // Send to Sentry, New Relic, or other monitoring service
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(error.message), {
          tags: {
            errorType: error.type,
            severity: error.severity,
            component: error.component
          },
          extra: {
            errorId: error.id,
            details: error.details,
            userId: error.userId,
            projectId: error.projectId
          }
        })
      }
    }
  }

  // Send error to logging service
  private sendToLoggingService(error: AppError): void {
    // Send to external logging service (e.g., LogRocket, Loggly)
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...error,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: error.timestamp.toISOString()
      })
    }).catch(() => {
      // Silently fail if logging service is unavailable
    })
  }

  // Show user notification
  private showUserNotification(error: AppError): void {
    const notificationType = this.getNotificationType(error.severity)
    
    // Show toast notification
    toast[notificationType](error.userMessage || error.message, {
      duration: this.getNotificationDuration(error.severity),
      id: error.id
    })

    // Add to notification system
    if (typeof window !== 'undefined') {
      // This would be dispatched to Redux store
      // dispatch(addNotification({
      //   id: error.id,
      //   type: notificationType,
      //   title: this.getNotificationTitle(error.type),
      //   message: error.userMessage || error.message,
      //   timestamp: error.timestamp,
      //   dismissible: error.severity !== ErrorSeverity.CRITICAL
      // }))
    }
  }

  // Get notification type based on severity
  private getNotificationType(severity: ErrorSeverity): 'success' | 'error' | 'loading' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'success'
      case ErrorSeverity.MEDIUM:
        return 'loading'
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error'
      default:
        return 'loading'
    }
  }

  // Get notification duration based on severity
  private getNotificationDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000
      case ErrorSeverity.MEDIUM:
        return 5000
      case ErrorSeverity.HIGH:
        return 8000
      case ErrorSeverity.CRITICAL:
        return 0 // Don't auto-dismiss critical errors
      default:
        return 5000
    }
  }

  // Get notification title based on error type
  private getNotificationTitle(type: ErrorType): string {
    const titles = {
      [ErrorType.NETWORK]: 'Connection Error',
      [ErrorType.VALIDATION]: 'Validation Error',
      [ErrorType.AUTHENTICATION]: 'Authentication Error',
      [ErrorType.AUTHORIZATION]: 'Permission Error',
      [ErrorType.NOT_FOUND]: 'Not Found',
      [ErrorType.SERVER]: 'Server Error',
      [ErrorType.CLIENT]: 'Application Error',
      [ErrorType.UNKNOWN]: 'Unknown Error'
    }
    return titles[type] || 'Error'
  }

  // Retry failed operation
  async retryOperation<T>(
    operation: () => Promise<T>,
    error: AppError,
    context?: string
  ): Promise<T> {
    if (!error.retryable || (error.retryCount || 0) >= (error.maxRetries || 3)) {
      throw error
    }

    const retryCount = (error.retryCount || 0) + 1
    const delay = this.retryDelays[Math.min(retryCount - 1, this.retryDelays.length - 1)]

      errorId: error.id,
      context
    })

    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      const result = await operation()
      
      // Success - remove error from collection
      this.removeError(error.id)
      
      toast.success(`Operation succeeded after ${retryCount} retries`)
      return result
    } catch (newError) {
      // Update retry count
      error.retryCount = retryCount
      
      if (retryCount >= (error.maxRetries || 3)) {
        // Max retries reached
        error.userMessage = `Operation failed after ${retryCount} attempts. Please try again later.`
        this.showUserNotification(error)
        throw error
      } else {
        // Retry again
        return this.retryOperation(operation, error, context)
      }
    }
  }

  // Remove error from collection
  removeError(errorId: string): void {
    this.errors = this.errors.filter(error => error.id !== errorId)
  }

  // Get all errors
  getErrors(): AppError[] {
    return [...this.errors]
  }

  // Get errors by type
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errors.filter(error => error.type === type)
  }

  // Get errors by severity
  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(error => error.severity === severity)
  }

  // Get errors by component
  getErrorsByComponent(component: string): AppError[] {
    return this.errors.filter(error => error.component === component)
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = []
  }

  // Get error statistics
  getErrorStats(): {
    total: number
    byType: Record<ErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
    recent: number
  } {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const stats = {
      total: this.errors.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errors.filter(error => error.timestamp > oneHourAgo).length
    }

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0
    })

    // Count errors
    this.errors.forEach(error => {
      stats.byType[error.type]++
      stats.bySeverity[error.severity]++
    })

    return stats
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler = new ErrorHandler()

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.errorHandler.createError(
      ErrorType.CLIENT,
      error.message,
      {
        severity: ErrorSeverity.HIGH,
        details: errorInfo,
        stack: error.stack,
        component: 'ErrorBoundary',
        userMessage: 'An unexpected error occurred. Please refresh the page.'
      }
    )

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

// Create error from API response
export function createErrorFromResponse(response: Response, context?: string): AppError {
  const errorHandler = new ErrorHandler()
  
  let errorType = ErrorType.SERVER
  let severity = ErrorSeverity.MEDIUM
  
  if (response.status >= 400 && response.status < 500) {
    errorType = ErrorType.CLIENT
    if (response.status === 401) {
      errorType = ErrorType.AUTHENTICATION
      severity = ErrorSeverity.HIGH
    } else if (response.status === 403) {
      errorType = ErrorType.AUTHORIZATION
      severity = ErrorSeverity.HIGH
    } else if (response.status === 404) {
      errorType = ErrorType.NOT_FOUND
    }
  } else if (response.status >= 500) {
    errorType = ErrorType.SERVER
    severity = ErrorSeverity.HIGH
  }

  return errorHandler.createError(
    errorType,
    `HTTP ${response.status}: ${response.statusText}`,
    {
      severity,
      details: { status: response.status, statusText: response.statusText },
      component: context,
      retryable: response.status >= 500
    }
  )
}

// Create error from network failure
export function createNetworkError(error: Error, context?: string): AppError {
  const errorHandler = new ErrorHandler()
  
  return errorHandler.createError(
    ErrorType.NETWORK,
    error.message,
    {
      severity: ErrorSeverity.MEDIUM,
      details: { name: error.name, message: error.message },
      component: context,
      retryable: true,
      userMessage: 'Network connection failed. Please check your internet connection.'
    }
  )
}

// Create validation error
export function createValidationError(message: string, details?: any, context?: string): AppError {
  const errorHandler = new ErrorHandler()
  
  return errorHandler.createError(
    ErrorType.VALIDATION,
    message,
    {
      severity: ErrorSeverity.LOW,
      details,
      component: context,
      retryable: false
    }
  )
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const errorHandler = new ErrorHandler()

// Export types and utilities
export { ErrorHandler }

