/**
 * Sentry Error Tracking Integration
 * 
 * Provides Sentry integration for error tracking and monitoring.
 * Falls back gracefully if Sentry is not configured.
 */

import { logger } from '../logger';

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  enabled?: boolean;
  sampleRate?: number;
  tracesSampleRate?: number;
}

class SentryService {
  private isInitialized = false;
  private config: SentryConfig = {};

  /**
   * Initialize Sentry
   */
  async init(config?: SentryConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.config = {
      dsn: config?.dsn || import.meta.env.VITE_SENTRY_DSN,
      environment: config?.environment || import.meta.env.MODE || 'development',
      release: config?.release || import.meta.env.VITE_APP_VERSION,
      enabled: config?.enabled ?? true,
      sampleRate: config?.sampleRate ?? 1.0,
      tracesSampleRate: config?.tracesSampleRate ?? 0.1,
    };

    // Only initialize if DSN is provided
    if (!this.config.dsn || !this.config.enabled) {
      logger.info('Sentry not configured - error tracking disabled');
      return;
    }

    try {
      // Dynamic import to avoid bundling Sentry if not needed
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        enabled: this.config.enabled,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Performance monitoring
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/.*\.example\.com/],
          }),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        
        // Error filtering
        beforeSend(event, hint) {
          // Filter out known non-critical errors
          const error = hint.originalException;
          if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (
              message.includes('resizeobserver') ||
              message.includes('non-error promise rejection') ||
              message.includes('script error')
            ) {
              return null; // Don't send to Sentry
            }
          }
          return event;
        },
        
        // Ignore specific errors
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection',
          'Script error',
        ],
      });

      this.isInitialized = true;
      logger.info('Sentry initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize Sentry', { error });
      // Continue without Sentry - graceful degradation
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Dynamic import
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            custom: context || {},
          },
        });
      }).catch(() => {
        // Sentry not available
      });
    } catch (e) {
      // Ignore errors in error tracking
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureMessage(message, {
          level: level === 'info' ? 'info' : level === 'warning' ? 'warning' : 'error',
        });
      }).catch(() => {
        // Sentry not available
      });
    } catch (e) {
      // Ignore errors in error tracking
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser(user);
      }).catch(() => {
        // Sentry not available
      });
    } catch (e) {
      // Ignore errors in error tracking
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser(null);
      }).catch(() => {
        // Sentry not available
      });
    } catch (e) {
      // Ignore errors in error tracking
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, unknown>;
  }): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      import('@sentry/react').then((Sentry) => {
        Sentry.addBreadcrumb({
          message: breadcrumb.message,
          category: breadcrumb.category,
          level: breadcrumb.level || 'info',
          data: breadcrumb.data,
        });
      }).catch(() => {
        // Sentry not available
      });
    } catch (e) {
      // Ignore errors in error tracking
    }
  }
}

// Singleton instance
export const sentryService = new SentryService();

// Initialize on module load if DSN is available
if (typeof window !== 'undefined' && import.meta.env.VITE_SENTRY_DSN) {
  sentryService.init().catch(() => {
    // Ignore initialization errors
  });
}

