/**
 * Error Tracking Service
 * Centralized error monitoring and reporting
 */

import { logger } from '../logger';

export interface ErrorContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'api' | 'rendering' | 'other';
}

class ErrorTrackingService {
  private errors: ErrorEvent[] = [];
  private maxErrors = 100;
  private isEnabled = true;

  /**
   * Initialize error tracking
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        severity: 'high',
        category: 'javascript',
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
        severity: 'high',
        category: 'javascript',
      });
    });

    logger.info('Error tracking initialized');
  }

  /**
   * Track an error
   */
  trackError(error: ErrorEvent): void {
    if (!this.isEnabled) return;

    const errorEvent: ErrorEvent = {
      ...error,
      context: {
        ...error.context,
        timestamp: new Date().toISOString(),
        url: error.context?.url || window.location.href,
        userAgent: error.context?.userAgent || navigator.userAgent,
      },
    };

    this.errors.push(errorEvent);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log error
    this.logError(errorEvent);

    // Send to monitoring service (if configured)
    this.sendToMonitoringService(errorEvent);
  }

  /**
   * Track API error
   */
  trackAPIError(url: string, status: number, error: Error | unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.trackError({
      message: `API Error: ${status} ${url}`,
      stack: errorObj.stack,
      context: {
        url,
        status: String(status),
        error: errorObj.message,
      },
      severity: status >= 500 ? 'critical' : status >= 400 ? 'high' : 'medium',
      category: 'api',
    });
  }

  /**
   * Track network error
   */
  trackNetworkError(url: string, error: Error): void {
    this.trackError({
      message: `Network Error: ${url}`,
      stack: error.stack,
      context: {
        url,
        error: error.message,
      },
      severity: 'high',
      category: 'network',
    });
  }

  /**
   * Track rendering error
   */
  trackRenderingError(component: string, error: Error): void {
    this.trackError({
      message: `Rendering Error in ${component}`,
      stack: error.stack,
      context: {
        component,
        error: error.message,
      },
      severity: 'high',
      category: 'rendering',
    });
  }

  /**
   * Log error to console and logger
   */
  private logError(error: ErrorEvent): void {
    const logMessage = `[${error.severity.toUpperCase()}] ${error.message}`;

    switch (error.severity) {
      case 'critical':
        logger.error(logMessage, error.context);
        console.error('🚨 Critical Error:', error);
        break;
      case 'high':
        logger.error(logMessage, error.context);
        console.error('❌ Error:', error);
        break;
      case 'medium':
        logger.warn(logMessage, error.context);
        console.warn('⚠️  Warning:', error);
        break;
      case 'low':
        logger.info(logMessage, error.context);
        console.info('ℹ️  Info:', error);
        break;
    }
  }

  /**
   * Send error to external monitoring service
   */
  private sendToMonitoringService(error: ErrorEvent): void {
    // Only send critical and high severity errors
    if (error.severity !== 'critical' && error.severity !== 'high') {
      return;
    }

    // Check if Sentry or other monitoring service is configured
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        Sentry?: { captureException: (error: Error, options?: unknown) => void };
      };
      if (win.Sentry) {
        try {
          win.Sentry.captureException(new Error(error.message), {
            contexts: {
              custom: error.context,
            },
            tags: {
              category: error.category,
              severity: error.severity,
            },
          });
        } catch (e) {
          // Sentry not available or error sending
        }
      }
    }

    // Could also send to custom API endpoint
    // this.sendToAPI(error);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorEvent[] {
    return this.errors.slice(-limit).reverse();
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorEvent['severity']): ErrorEvent[] {
    return this.errors.filter((e) => e.severity === severity);
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Enable/disable error tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Singleton instance
export const errorTracking = new ErrorTrackingService();

// Initialize on module load
if (typeof window !== 'undefined') {
  errorTracking.init();
}
