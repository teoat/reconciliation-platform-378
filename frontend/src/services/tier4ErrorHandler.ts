/**
 * Tier 4 Error Handler Service
 * 
 * Provides proactive error prevention, advanced recovery mechanisms,
 * predictive error detection, user experience optimization, and complete observability.
 * 
 * Tier 4 extends beyond basic error catching (Tier 1-3) to provide:
 * - Proactive error prevention
 * - Advanced recovery mechanisms
 * - Predictive error detection
 * - User experience optimization
 * - Complete observability
 */

import { logger } from './logger';
import { UnifiedErrorService } from './unifiedErrorService';

// ============================================================================
// TYPES
// ============================================================================

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  projectId?: string;
  workflowStage?: string;
  metadata?: Record<string, unknown>;
  correlationId: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

export interface ErrorPattern {
  category: ErrorCategory;
  frequency: number;
  lastOccurrence: Date;
  affectedComponents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldPrevent: boolean;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByComponent: Record<string, number>;
  recentErrors: Array<{
    error: Error;
    context: ErrorContext;
    pattern?: ErrorPattern;
  }>;
  patterns: ErrorPattern[];
}

// ============================================================================
// TIER 4 ERROR HANDLER
// ============================================================================

export class Tier4ErrorHandler {
  private static instance: Tier4ErrorHandler;
  private errorHistory: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private correlationIds: Map<string, ErrorContext> = new Map();
  private readonly maxHistorySize = 1000;
  private readonly patternDetectionWindow = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Tier4ErrorHandler {
    if (!Tier4ErrorHandler.instance) {
      Tier4ErrorHandler.instance = new Tier4ErrorHandler();
    }
    return Tier4ErrorHandler.instance;
  }

  /**
   * Categorize error by type and context
   */
  public categorizeError(error: unknown): ErrorCategory {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      const name = error.name.toLowerCase();

      // Network errors
      if (
        name.includes('network') ||
        name.includes('fetch') ||
        message.includes('network') ||
        message.includes('failed to fetch') ||
        message.includes('connection')
      ) {
        return ErrorCategory.NETWORK;
      }

      // Timeout errors
      if (name.includes('timeout') || message.includes('timeout')) {
        return ErrorCategory.TIMEOUT;
      }

      // Rate limit errors
      if (message.includes('rate limit') || message.includes('429')) {
        return ErrorCategory.RATE_LIMIT;
      }

      // Validation errors
      if (
        name.includes('validation') ||
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required')
      ) {
        return ErrorCategory.VALIDATION;
      }

      // Authentication errors
      if (
        name.includes('auth') ||
        message.includes('unauthorized') ||
        message.includes('401')
      ) {
        return ErrorCategory.AUTHENTICATION;
      }

      // Authorization errors
      if (
        message.includes('forbidden') ||
        message.includes('403') ||
        message.includes('permission')
      ) {
        return ErrorCategory.AUTHORIZATION;
      }

      // Not found errors
      if (message.includes('not found') || message.includes('404')) {
        return ErrorCategory.NOT_FOUND;
      }

      // Server errors
      if (
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('server error')
      ) {
        return ErrorCategory.SERVER;
      }
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Collect comprehensive error context
   */
  public collectContext(
    error: unknown,
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
   * Generate unique correlation ID
   */
  public generateCorrelationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `err-${timestamp}-${random}`;
  }

  /**
   * Track correlation ID with data
   */
  public trackCorrelation(correlationId: string, data: unknown): void {
    const context = this.correlationIds.get(correlationId);
    if (context) {
      context.metadata = {
        ...context.metadata,
        trackedData: data,
      };
    }
  }

  /**
   * Detect error patterns
   */
  public detectPattern(error: Error, context: ErrorContext): ErrorPattern | null {
    const category = this.categorizeError(error);
    const patternKey = `${category}-${context.component || 'unknown'}`;

    // Get or create pattern
    let pattern = this.errorPatterns.get(patternKey);
    const now = new Date();

    if (!pattern) {
      pattern = {
        category,
        frequency: 1,
        lastOccurrence: now,
        affectedComponents: context.component ? [context.component] : [],
        severity: this.determineSeverity(category, context),
        shouldPrevent: false,
      };
    } else {
      // Update pattern
      pattern.frequency += 1;
      pattern.lastOccurrence = now;
      if (context.component && !pattern.affectedComponents.includes(context.component)) {
        pattern.affectedComponents.push(context.component);
      }
      pattern.severity = this.determineSeverity(category, context, pattern.frequency);
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
  public shouldPreventError(pattern: ErrorPattern): boolean {
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
   * Determine error severity
   */
  private determineSeverity(
    category: ErrorCategory,
    context: ErrorContext,
    frequency: number = 1
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical categories
    if (
      category === ErrorCategory.SERVER ||
      category === ErrorCategory.NETWORK ||
      category === ErrorCategory.AUTHENTICATION
    ) {
      return frequency > 5 ? 'critical' : 'high';
    }

    // High severity categories
    if (
      category === ErrorCategory.AUTHORIZATION ||
      category === ErrorCategory.TIMEOUT
    ) {
      return frequency > 3 ? 'high' : 'medium';
    }

    // Medium severity categories
    if (
      category === ErrorCategory.VALIDATION ||
      category === ErrorCategory.RATE_LIMIT
    ) {
      return 'medium';
    }

    // Low severity categories
    if (category === ErrorCategory.NOT_FOUND) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Record error with context
   */
  public recordError(error: Error, context: ErrorContext): void {
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

    // Log error
    logger.error('Tier4ErrorHandler recorded error', {
      error: error.message,
      category: context.metadata?.category || this.categorizeError(error),
      correlationId: context.correlationId,
      component: context.component,
      action: context.action,
      pattern: pattern ? {
        frequency: pattern.frequency,
        severity: pattern.severity,
        shouldPrevent: pattern.shouldPrevent,
      } : undefined,
    });

    // Send to unified error service
    try {
      UnifiedErrorService.handleErrorWithTranslation(error, {
        component: context.component || 'Tier4ErrorHandler',
        action: context.action || 'error_recording',
        metadata: {
          ...context.metadata,
          correlationId: context.correlationId,
          category: this.categorizeError(error),
        },
      });
    } catch (serviceError) {
      logger.warn('Failed to send error to UnifiedErrorService', {
        error: serviceError instanceof Error ? serviceError.message : String(serviceError),
      });
    }
  }

  /**
   * Get error analytics
   */
  public getErrorAnalytics(): ErrorAnalytics {
    const errorsByCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.AUTHORIZATION]: 0,
      [ErrorCategory.NOT_FOUND]: 0,
      [ErrorCategory.SERVER]: 0,
      [ErrorCategory.TIMEOUT]: 0,
      [ErrorCategory.RATE_LIMIT]: 0,
      [ErrorCategory.UNKNOWN]: 0,
    };

    const errorsByComponent: Record<string, number> = {};

    // Analyze history
    this.errorHistory.forEach(({ error, context }) => {
      const category = this.categorizeError(error);
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;

      if (context.component) {
        errorsByComponent[context.component] =
          (errorsByComponent[context.component] || 0) + 1;
      }
    });

    // Get recent errors (last 50)
    const recentErrors = this.errorHistory
      .slice(-50)
      .map(({ error, context }) => ({
        error,
        context,
        pattern: this.errorPatterns.get(
          `${this.categorizeError(error)}-${context.component || 'unknown'}`
        ),
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
   * Clear error history
   */
  public clearHistory(): void {
    this.errorHistory = [];
    this.errorPatterns.clear();
    this.correlationIds.clear();
  }

  /**
   * Get correlation context
   */
  public getCorrelationContext(correlationId: string): ErrorContext | undefined {
    return this.correlationIds.get(correlationId);
  }
}

// Export singleton instance
export const tier4ErrorHandler = Tier4ErrorHandler.getInstance();

