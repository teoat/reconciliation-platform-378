// Error Standardization - User-friendly error translation
// SSOT for frontend error handling and display

interface StandardizedError {
  title: string
  message: string
  action: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  retryable: boolean
}

/**
 * Standardized error translation service
 * Converts backend/technical errors to user-friendly messages
 */
export class ErrorStandardization {
  private static translations = new Map<string, StandardizedError>([
    // 400 - Bad Request
    ['400', {
      title: 'Invalid Request',
      message: 'Please check your input and try again.',
      action: 'Review and correct the highlighted fields',
      severity: 'warning',
      retryable: false
    }],
    
    // 401 - Unauthorized
    ['401', {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      action: 'Click to log in',
      severity: 'warning',
      retryable: false
    }],
    
    // 403 - Forbidden
    ['403', {
      title: 'Access Denied',
      message: "You don't have permission to perform this action.",
      action: 'Contact your administrator for access',
      severity: 'error',
      retryable: false
    }],
    
    // 404 - Not Found
    ['404', {
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      action: 'Return to dashboard',
      severity: 'info',
      retryable: false
    }],
    
    // 422 - Validation Error
    ['422', {
      title: 'Validation Error',
      message: 'Some fields need your attention.',
      action: 'Please check the form and correct the errors',
      severity: 'warning',
      retryable: false
    }],
    
    // 429 - Rate Limited
    ['429', {
      title: 'Too Many Requests',
      message: 'You\'re making requests too quickly. Please slow down.',
      action: 'Wait a moment and try again',
      severity: 'warning',
      retryable: true
    }],
    
    // 500 - Server Error
    ['500', {
      title: 'Service Unavailable',
      message: 'We\'re experiencing technical difficulties. Our team has been notified.',
      action: 'Please try again in a few moments',
      severity: 'error',
      retryable: true
    }],
    
    // 503 - Service Unavailable
    ['503', {
      title: 'Service Temporarily Down',
      message: 'The service is temporarily unavailable due to maintenance.',
      action: 'Please check back shortly',
      severity: 'warning',
      retryable: true
    }],
    
    // Network errors
    ['NETWORK_ERROR', {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection.',
      action: 'Retry connection',
      severity: 'error',
      retryable: true
    }],
    
    ['TIMEOUT', {
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      action: 'Please try again',
      severity: 'warning',
      retryable: true
    }]
  ])

  /**
   * Translate an error to user-friendly format
   */
  static translateError(error: unknown): StandardizedError {
    // Check for specific status code
    const statusCode = this.extractStatusCode(error)
    if (statusCode && this.translations.has(statusCode)) {
      return this.translations.get(statusCode)!
    }
    
    // Check error type
    const err = error as { message?: string };
    if (err?.message?.includes('network')) {
      return this.translations.get('NETWORK_ERROR')!
    }
    
    if (err?.message?.includes('timeout')) {
      return this.translations.get('TIMEOUT')!
    }
    
    // Default error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      action: 'Retry or contact support if the problem persists',
      severity: 'error',
      retryable: true
    }
  }

  /**
   * Extract HTTP status code from error
   */
  private static extractStatusCode(error: unknown): string | null {
    const err = error as { status?: number; statusCode?: number; response?: { status?: number } };
    if (err?.status) return err.status.toString()
    if (err?.statusCode) return err.statusCode.toString()
    if (err?.response?.status) return err.response.status.toString()
    return null
  }

  /**
   * Get error color based on severity
   */
  static getErrorColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'red'
      case 'error': return 'red'
      case 'warning': return 'yellow'
      case 'info': return 'blue'
      default: return 'gray'
    }
  }

  /**
   * Get icon for error severity
   */
  static getErrorIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'AlertTriangle'
      case 'error': return 'XCircle'
      case 'warning': return 'AlertCircle'
      case 'info': return 'Info'
      default: return 'AlertCircle'
    }
  }
}

export default ErrorStandardization

