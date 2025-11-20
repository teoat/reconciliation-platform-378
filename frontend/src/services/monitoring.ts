// ============================================================================
import { logger } from '@/services/logger';
// MONITORING SERVICE
// ============================================================================

import { monitoringConfig } from '../config/monitoring';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

class MonitoringService {
  private metrics: Metric[] = [];
  private errors: ErrorReport[] = [];
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled =
      monitoringConfig.performance.enabled ||
      monitoringConfig.errors.enabled ||
      monitoringConfig.analytics.enabled;

    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeMonitoring() {
    // Initialize performance monitoring
    if (monitoringConfig.performance.enabled) {
      this.initializePerformanceMonitoring();
    }

    // Initialize error monitoring
    if (monitoringConfig.errors.enabled) {
      this.initializeErrorMonitoring();
    }

    // Initialize analytics
    if (monitoringConfig.analytics.enabled) {
      this.initializeAnalytics();
    }

    // Start periodic reporting
    this.startPeriodicReporting();
  }

  private initializePerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('cls', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.recordMetric('pageLoadTime', loadTime);
    });

    // Monitor API response times
    this.interceptFetch();
  }

  private initializeErrorMonitoring() {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (monitoringConfig.errors.captureUnhandledRejections) {
        this.recordError({
          message: event.reason?.message || 'Unhandled promise rejection',
          stack: event.reason?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          userId: this.userId,
          sessionId: this.sessionId,
        });
      }
    });

    // Capture uncaught exceptions
    window.addEventListener('error', (event) => {
      if (monitoringConfig.errors.captureUncaughtExceptions) {
        this.recordError({
          message: event.message,
          stack: event.error?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          userId: this.userId,
          sessionId: this.sessionId,
        });
      }
    });
  }

  private initializeAnalytics() {
    // Track page views
    if (monitoringConfig.analytics.trackPageViews) {
      this.trackEvent('page_view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      });
    }

    // Track user interactions
    if (monitoringConfig.analytics.trackUserInteractions) {
      this.trackUserInteractions();
    }
  }

  // ============================================================================
  // METRIC RECORDING
  // ============================================================================

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    if (!this.isEnabled) return;

    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Check thresholds
    const threshold = monitoringConfig.performance.metrics[name]?.threshold;
    if (threshold && value > threshold) {
      logger.warn(`Performance metric ${name} exceeded threshold: ${value} > ${threshold}`);
    }
  }

  recordError(error: ErrorReport) {
    if (!this.isEnabled) return;

    // Filter out common non-critical errors
    const shouldFilter = monitoringConfig.errors.filters.some((filter) =>
      error.message.includes(filter)
    );

    if (!shouldFilter) {
      this.errors.push(error);
    }
  }

  trackEvent(event: string, properties: Record<string, unknown>) {
    if (!this.isEnabled || !monitoringConfig.analytics.trackCustomEvents) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric('apiResponseTime', duration, {
          url: args[0] as string,
          method: args[1]?.method || 'GET',
          status: response.status.toString(),
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric('apiResponseTime', duration, {
          url: args[0] as string,
          method: args[1]?.method || 'GET',
          status: 'error',
        });

        throw error;
      }
    };
  }

  private trackUserInteractions() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackEvent('click', {
        element: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 100),
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form_submit', {
        formId: form.id,
        formAction: form.action,
        formMethod: form.method,
      });
    });
  }

  private startPeriodicReporting() {
    // Report performance metrics
    if (monitoringConfig.performance.enabled) {
      setInterval(() => {
        this.reportMetrics();
      }, monitoringConfig.performance.reporting.flushInterval);
    }

    // Report errors
    if (monitoringConfig.errors.enabled) {
      setInterval(() => {
        this.reportErrors();
      }, monitoringConfig.errors.reporting.flushInterval);
    }

    // Report analytics events
    if (monitoringConfig.analytics.enabled) {
      setInterval(() => {
        this.reportEvents();
      }, monitoringConfig.analytics.reporting.flushInterval);
    }
  }

  // ============================================================================
  // REPORTING
  // ============================================================================

  private async reportMetrics() {
    if (this.metrics.length === 0) return;

    const batchSize = monitoringConfig.performance.reporting.batchSize;
    const batch = this.metrics.splice(0, batchSize);

    try {
      await fetch(monitoringConfig.performance.reporting.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: batch,
          sessionId: this.sessionId,
          userId: this.userId,
        }),
      });
    } catch (error) {
      logger.error('Failed to report metrics:', error);
      // Re-add metrics to queue for retry
      this.metrics.unshift(...batch);
    }
  }

  private async reportErrors() {
    if (this.errors.length === 0) return;

    const maxErrors = monitoringConfig.errors.reporting.maxErrors;
    const batch = this.errors.splice(0, maxErrors);

    try {
      await fetch(monitoringConfig.errors.reporting.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors: batch,
          sessionId: this.sessionId,
          userId: this.userId,
        }),
      });
    } catch (error) {
      logger.error('Failed to report errors:', error);
      // Re-add errors to queue for retry
      this.errors.unshift(...batch);
    }
  }

  private async reportEvents() {
    if (this.events.length === 0) return;

    const batchSize = monitoringConfig.analytics.reporting.batchSize;
    const batch = this.events.splice(0, batchSize);

    try {
      await fetch(monitoringConfig.analytics.reporting.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: batch,
          sessionId: this.sessionId,
          userId: this.userId,
        }),
      });
    } catch (error) {
      logger.error('Failed to report events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...batch);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  setUserId(userId: string) {
    this.userId = userId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearData() {
    this.metrics = [];
    this.errors = [];
    this.events = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const monitoringService = new MonitoringService();
export default monitoringService;
