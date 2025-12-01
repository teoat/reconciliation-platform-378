// ============================================================================
// UNIFIED ERROR HANDLING SYSTEM - SINGLE SOURCE OF TRUTH
// ============================================================================
// Consolidates functionality from:
// - ErrorHandler (basic error handling)
// - Tier4ErrorHandler (advanced analytics & pattern detection)
// - UnifiedErrorService (comprehensive error processing)
// ============================================================================

// Simple logger - replace with proper logging service when available
const logger = {
  error: (message: string, data?: unknown) => {
    console.error(`[ERROR] ${message}`, data);
  },
  warning: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },
  info: (message: string, data?: unknown) => {
    console.info(`[INFO] ${message}`, data);
  },
  debug: (message: string, data?: unknown) => {
    console.debug(`[DEBUG] ${message}`, data);
  },
};

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  NOT_FOUND = 'not_found',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_SERVICE = 'external_service',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  id: string;
  type: ErrorType;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  code: string;
  userMessage: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  retryable: boolean;
  timestamp: Date;
  correlationId: string;
  userId?: string;
  projectId?: string;
  component?: string;
  action?: string;
  stackTrace?: string;
  pattern?: ErrorPattern;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  projectId?: string;
  workflowStage?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
}

export interface ErrorPattern {
  category: ErrorCategory;
  frequency: number;
  lastOccurrence: Date;
  affectedComponents: string[];
  severity: ErrorSeverity;
  shouldPrevent: boolean;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByComponent: Record<string, number>;
  recentErrors: Array<{
    error: AppError;
    context: ErrorContext;
    pattern?: ErrorPattern;
  }>;
  patterns: ErrorPattern[];
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableRecovery: boolean;
  maxRetries: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// UNIFIED ERROR HANDLER
// ============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  private errorLog: AppError[] = [];
  private retryCounts: Map<string, number> = new Map();

  // Advanced features from Tier4ErrorHandler
  private errorHistory: Array<{ error: AppError; context: ErrorContext; timestamp: Date }> = [];
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private correlationIds: Map<string, ErrorContext> = new Map();
  private readonly maxHistorySize = 1000;
  // private readonly patternDetectionWindow = 5 * 60 * 1000; // 5 minutes

  private constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableReporting: true,
      enableRecovery: true,
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: 'error',
      ...config,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<ErrorHandlerConfig>): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  /**
   * Collect comprehensive error context
   */
  private collectContext(
    _error: Error | AppError,
    metadata?: Record<string, unknown>
  ): ErrorContext {
    const correlationId = this.generateCorrelationId();
    const timestamp = new Date();

    const context: ErrorContext = {
      correlationId,
      timestamp,
      metadata: metadata || {},
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    // Extract metadata
    if (metadata) {
      context.component = metadata.component as string;
      context.action = metadata.action as string;
      context.userId = metadata.userId as string;
      context.projectId = metadata.projectId as string;
      context.workflowStage = metadata.workflowStage as string;
    }

    // Store correlation ID
    this.correlationIds.set(correlationId, context);

    return context;
  }

  /**
   * Record error with context and pattern detection
   */
  private recordError(error: AppError, context: ErrorContext): void {
    // Add to history
    this.errorHistory.push({
      error,
      context,
      timestamp: new Date(),
    });

    // Limit history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Detect pattern
    const pattern = this.detectPattern(error, context);
    if (pattern) {
      error.pattern = pattern;
    }
  }

  /**
   * Detect error patterns
   */
  private detectPattern(error: AppError, context: ErrorContext): ErrorPattern | null {
    const patternKey = `${error.category}-${context.component || 'unknown'}`;

    // Get or create pattern
    let pattern = this.errorPatterns.get(patternKey);
    const now = new Date();

    if (!pattern) {
      pattern = {
        category: error.category,
        frequency: 1,
        lastOccurrence: now,
        affectedComponents: context.component ? [context.component] : [],
        severity: error.severity,
        shouldPrevent: false,
      };
    } else {
      // Update pattern
      pattern.frequency += 1;
      pattern.lastOccurrence = now;
      if (context.component && !pattern.affectedComponents.includes(context.component)) {
        pattern.affectedComponents.push(context.component);
      }
      pattern.severity = this.determineSeverityFromFrequency(error.severity, pattern.frequency);
    }

    // Determine if error should be prevented
    pattern.shouldPrevent = this.shouldPreventError(pattern);

    // Store pattern
    this.errorPatterns.set(patternKey, pattern);

    return pattern;
  }

  /**
   * Determine if error should be prevented based on pattern
   */
  private shouldPreventError(pattern: ErrorPattern): boolean {
    // Prevent if high frequency in short time
    if (pattern.frequency > 10 && pattern.severity === 'critical') {
      return true;
    }

    // Prevent if medium frequency with high severity
    if (pattern.frequency > 5 && pattern.severity === 'high') {
      return true;
    }

    return false;
  }

  /**
   * Determine severity based on frequency
   */
  private determineSeverityFromFrequency(
    baseSeverity: ErrorSeverity,
    frequency: number
  ): ErrorSeverity {
    if (frequency > 10) {
      return ErrorSeverity.CRITICAL;
    }
    if (frequency > 5) {
      return baseSeverity === ErrorSeverity.LOW ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH;
    }
    return baseSeverity;
  }

  public handleError(error: Error | AppError, context?: Record<string, unknown>): AppError {
    const appError = this.normalizeError(error, context);
    const errorContext = this.collectContext(error, context);

    // Record error with advanced context
    this.recordError(appError, errorContext);

    if (this.config.enableLogging) {
      this.logError(appError);
    }

    if (this.config.enableReporting) {
      this.reportError(appError);
    }

    if (this.config.enableRecovery && appError.recoverable) {
      this.attemptRecovery(appError);
    }

    return appError;
  }

  private normalizeError(error: Error | AppError, context?: Record<string, unknown>): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    const errorType = this.determineErrorType(error);
    const category = this.mapTypeToCategory(errorType);
    const severity = this.determineSeverity(error, errorType);
    const correlationId = (context?.correlationId as string) || this.generateCorrelationId();

    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: errorType,
      category,
      severity,
      message: error.message || 'An unknown error occurred',
      code: this.generateErrorCode(error),
      userMessage: this.getUserMessage(errorType, error.message),
      details: context,
      recoverable: this.isRecoverable(error, errorType),
      retryable: this.isRetryable(error, errorType),
      timestamp: new Date(),
      correlationId,
      stackTrace: error.stack,
    };
  }

  private isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'severity' in error &&
      typeof (error as { type?: unknown }).type === 'string' &&
      typeof (error as { severity?: unknown }).severity === 'string'
    );
  }

  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION;
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }

    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }

    if (message.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorType.RATE_LIMIT;
    }

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }

    if (message.includes('server') || message.includes('internal') || message.includes('500')) {
      return ErrorType.SERVER;
    }

    return ErrorType.UNKNOWN;
  }

  private determineSeverity(_error: Error, type: ErrorType): ErrorSeverity {
    if (type === ErrorType.AUTHENTICATION || type === ErrorType.AUTHORIZATION) {
      return ErrorSeverity.HIGH;
    }

    if (type === ErrorType.SERVER) {
      return ErrorSeverity.CRITICAL;
    }

    if (type === ErrorType.NETWORK || type === ErrorType.TIMEOUT) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  private generateErrorCode(error: Error): string {
    const name = error.name || 'Error';
    const message = error.message || '';
    return `${name.toUpperCase()}_${message.replace(/\s+/g, '_').toUpperCase()}`;
  }

  private isRecoverable(_error: Error, type: ErrorType): boolean {
    return (
      type === ErrorType.NETWORK || type === ErrorType.VALIDATION || type === ErrorType.TIMEOUT
    );
  }

  private isRetryable(_error: Error, type: ErrorType): boolean {
    return type === ErrorType.NETWORK || type === ErrorType.SERVER || type === ErrorType.TIMEOUT;
  }

  private mapTypeToCategory(type: ErrorType): ErrorCategory {
    const mapping: Record<ErrorType, ErrorCategory> = {
      [ErrorType.VALIDATION]: ErrorCategory.VALIDATION,
      [ErrorType.AUTHENTICATION]: ErrorCategory.AUTHENTICATION,
      [ErrorType.AUTHORIZATION]: ErrorCategory.AUTHORIZATION,
      [ErrorType.NETWORK]: ErrorCategory.NETWORK,
      [ErrorType.SERVER]: ErrorCategory.SERVER,
      [ErrorType.CLIENT]: ErrorCategory.CLIENT,
      [ErrorType.NOT_FOUND]: ErrorCategory.NOT_FOUND,
      [ErrorType.TIMEOUT]: ErrorCategory.TIMEOUT,
      [ErrorType.RATE_LIMIT]: ErrorCategory.RATE_LIMIT,
      [ErrorType.EXTERNAL_SERVICE]: ErrorCategory.EXTERNAL_SERVICE,
      [ErrorType.UNKNOWN]: ErrorCategory.UNKNOWN,
    };
    return mapping[type] || ErrorCategory.UNKNOWN;
  }

  private generateCorrelationId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private getUserMessage(type: ErrorType, originalMessage: string): string {
    return ERROR_MESSAGES[type] || originalMessage;
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);

    const logMessage = `[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`;
    const errorData: Record<string, unknown> = {
      id: error.id,
      type: error.type,
      category: error.category,
      message: error.message,
      severity: error.severity,
      code: error.code,
      retryable: error.retryable,
      recoverable: error.recoverable,
      correlationId: error.correlationId,
      component: error.component,
      action: error.action,
      timestamp: error.timestamp,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(logMessage, errorData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warning(logMessage, errorData);
        break;
      case ErrorSeverity.LOW:
        logger.info(logMessage, errorData);
        break;
    }
  }

  private reportError(error: AppError): void {
    // In a real application, this would send the error to a monitoring service
    const errorData: Record<string, unknown> = {
      id: error.id,
      type: error.type,
      message: error.message,
      severity: error.severity,
      code: error.code,
      correlationId: error.correlationId,
    };
    logger.info('Reporting error', errorData);
  }

  private attemptRecovery(error: AppError): void {
    if (!error.retryable) {
      return;
    }

    const retryKey = `${error.type}_${error.code}`;
    const currentRetries = this.retryCounts.get(retryKey) || 0;

    if (currentRetries < this.config.maxRetries) {
      this.retryCounts.set(retryKey, currentRetries + 1);

      setTimeout(
        () => {
          this.retryOperation(error);
        },
        this.config.retryDelay * Math.pow(2, currentRetries)
      ); // Exponential backoff
    }
  }

  private retryOperation(error: AppError): void {
    // In a real application, this would retry the failed operation
    logger.info('Retrying operation for error', { errorId: error.id, code: error.code });
  }

  public getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
    this.retryCounts.clear();
  }

  public getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byType = Object.values(ErrorType).reduce(
      (acc, type) => {
        acc[type] = this.errorLog.filter((e) => e.type === type).length;
        return acc;
      },
      {} as Record<ErrorType, number>
    );

    const bySeverity = Object.values(ErrorSeverity).reduce(
      (acc, severity) => {
        acc[severity] = this.errorLog.filter((e) => e.severity === severity).length;
        return acc;
      },
      {} as Record<ErrorSeverity, number>
    );

    const recent = this.errorLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recent,
    };
  }

  /**
   * Get error analytics with pattern detection
   */
  public getErrorAnalytics(): ErrorAnalytics {
    const errorsByCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.AUTHORIZATION]: 0,
      [ErrorCategory.NOT_FOUND]: 0,
      [ErrorCategory.SERVER]: 0,
      [ErrorCategory.CLIENT]: 0,
      [ErrorCategory.TIMEOUT]: 0,
      [ErrorCategory.RATE_LIMIT]: 0,
      [ErrorCategory.EXTERNAL_SERVICE]: 0,
      [ErrorCategory.UNKNOWN]: 0,
    };

    const errorsByComponent: Record<string, number> = {};

    // Analyze history
    this.errorHistory.forEach(({ error, context }) => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;

      if (context.component) {
        errorsByComponent[context.component] = (errorsByComponent[context.component] || 0) + 1;
      }
    });

    // Get recent errors (last 50)
    const recentErrors = this.errorHistory.slice(-50).map(({ error, context }) => ({
      error,
      context,
      pattern: error.pattern,
    }));

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsByComponent,
      recentErrors,
      patterns: Array.from(this.errorPatterns.values()),
    };
  }

  /**
   * Get correlation context
   */
  public getCorrelationContext(correlationId: string): ErrorContext | undefined {
    return this.correlationIds.get(correlationId);
  }

  /**
   * Clear all error data
   */
  public clearAll(): void {
    this.errorLog = [];
    this.errorHistory = [];
    this.errorPatterns.clear();
    this.correlationIds.clear();
    this.retryCounts.clear();
  }
}

// ============================================================================
// UTILITY FUNCTIONS & CONSTANTS
// ============================================================================

// Error message mapping
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'Please check your input and try again',
  [ErrorType.AUTHENTICATION]: 'Please log in to continue',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action',
  [ErrorType.NETWORK]: 'Network error. Please check your connection and try again',
  [ErrorType.SERVER]: 'Server error. Please try again later',
  [ErrorType.CLIENT]: 'An error occurred in the application',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found',
  [ErrorType.TIMEOUT]: 'Request timed out. Please try again',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait and try again',
  [ErrorType.EXTERNAL_SERVICE]: 'External service is currently unavailable',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred',
};

export const createError = (
  type: ErrorType,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  details?: Record<string, unknown>
): AppError => {
  const category = (() => {
    const mapping: Record<ErrorType, ErrorCategory> = {
      [ErrorType.VALIDATION]: ErrorCategory.VALIDATION,
      [ErrorType.AUTHENTICATION]: ErrorCategory.AUTHENTICATION,
      [ErrorType.AUTHORIZATION]: ErrorCategory.AUTHORIZATION,
      [ErrorType.NETWORK]: ErrorCategory.NETWORK,
      [ErrorType.SERVER]: ErrorCategory.SERVER,
      [ErrorType.CLIENT]: ErrorCategory.CLIENT,
      [ErrorType.NOT_FOUND]: ErrorCategory.NOT_FOUND,
      [ErrorType.TIMEOUT]: ErrorCategory.TIMEOUT,
      [ErrorType.RATE_LIMIT]: ErrorCategory.RATE_LIMIT,
      [ErrorType.EXTERNAL_SERVICE]: ErrorCategory.EXTERNAL_SERVICE,
      [ErrorType.UNKNOWN]: ErrorCategory.UNKNOWN,
    };
    return mapping[type] || ErrorCategory.UNKNOWN;
  })();

  return {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    category,
    severity,
    message,
    code: `${type.toUpperCase()}_${message.replace(/\s+/g, '_').toUpperCase()}`,
    userMessage: ERROR_MESSAGES[type] || message,
    details,
    recoverable:
      type === ErrorType.NETWORK || type === ErrorType.VALIDATION || type === ErrorType.TIMEOUT,
    retryable:
      type === ErrorType.NETWORK || type === ErrorType.SERVER || type === ErrorType.TIMEOUT,
    timestamp: new Date(),
    correlationId: `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof TypeError && error.message.includes('fetch');
};

export const isValidationError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === ErrorType.VALIDATION
  );
};

export const isAuthenticationError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === ErrorType.AUTHENTICATION
  );
};

export const isAuthorizationError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === ErrorType.AUTHORIZATION
  );
};

export const isServerError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === ErrorType.SERVER
  );
};

export const isRetryableError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'retryable' in error &&
    (error as { retryable?: boolean }).retryable === true
  );
};

export const isRecoverableError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'recoverable' in error &&
    (error as { recoverable?: boolean }).recoverable === true
  );
};

export const getErrorMessage = (error: AppError): string => {
  return ERROR_MESSAGES[error.type] || error.message;
};

export const getErrorTitle = (error: AppError): string => {
  const titles: Record<ErrorSeverity, string> = {
    [ErrorSeverity.LOW]: 'Information',
    [ErrorSeverity.MEDIUM]: 'Warning',
    [ErrorSeverity.HIGH]: 'Error',
    [ErrorSeverity.CRITICAL]: 'Critical Error',
  };

  return titles[error.severity];
};

export const formatErrorForDisplay = (
  error: AppError
): {
  title: string;
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
  timestamp: Date;
} => {
  return {
    title: getErrorTitle(error),
    message: getErrorMessage(error),
    severity: error.severity,
    retryable: error.retryable,
    timestamp: error.timestamp,
  };
};

// ============================================================================
// GLOBAL INSTANCES & EXPORTS
// ============================================================================

// Global error handler instance - use singleton
export const globalErrorHandler = ErrorHandler.getInstance();

// Error boundary for React components
export class ErrorBoundary extends Error {
  public componentStack?: string;
  public errorInfo?: Record<string, unknown>;

  constructor(message: string, componentStack?: string, errorInfo?: Record<string, unknown>) {
    super(message);
    this.name = 'ErrorBoundary';
    this.componentStack = componentStack;
    this.errorInfo = errorInfo;
  }
}

export default ErrorHandler;
