/**
 * Performance Monitoring Service
 * Tracks and reports performance metrics
 */

import { logger } from '../logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: string;
  url?: string;
}

export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private isEnabled = true;
  private observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();

    // Monitor resource loading
    this.observeResources();

    // Monitor long tasks
    this.observeLongTasks();

    logger.info('Performance monitoring initialized');
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        
        this.recordMetric({
          name: 'LCP',
          value: lcp,
          unit: 'ms',
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });

        // Log if LCP is slow
        if (lcp > 2500) {
          logger.warn(`Slow LCP: ${lcp.toFixed(2)}ms`, { url: window.location.href });
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (e) {
      // LCP not supported
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          
          this.recordMetric({
            name: 'FID',
            value: fid,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            url: window.location.href,
          });

          // Log if FID is slow
          if (fid > 100) {
            logger.warn(`Slow FID: ${fid.toFixed(2)}ms`, { url: window.location.href });
          }
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (e) {
      // FID not supported
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          unit: 'count',
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });

        // Log if CLS is high
        if (clsValue > 0.1) {
          logger.warn(`High CLS: ${clsValue.toFixed(4)}`, { url: window.location.href });
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      // CLS not supported
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   */
  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime;
            
            this.recordMetric({
              name: 'FCP',
              value: fcp,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              url: window.location.href,
            });

            // Log if FCP is slow
            if (fcp > 1800) {
              logger.warn(`Slow FCP: ${fcp.toFixed(2)}ms`, { url: window.location.href });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (e) {
      // Paint timing not supported
    }
  }

  /**
   * Observe resource loading performance
   */
  private observeResources(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          const duration = resourceEntry.responseEnd - resourceEntry.requestStart;

          // Log slow resources
          if (duration > 1000) {
            logger.warn(`Slow resource: ${resourceEntry.name} (${duration.toFixed(2)}ms)`);
          }

          this.recordMetric({
            name: 'resource-load',
            value: duration,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            url: resourceEntry.name,
          });
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      // Resource timing not supported
    }
  }

  /**
   * Observe long tasks
   */
  private observeLongTasks(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;
          
          // Log long tasks (> 50ms)
          if (duration > 50) {
            logger.warn(`Long task detected: ${duration.toFixed(2)}ms`);
          }

          this.recordMetric({
            name: 'long-task',
            value: duration,
            unit: 'ms',
            timestamp: new Date().toISOString(),
            url: window.location.href,
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      // Long task timing not supported
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): CoreWebVitals {
    const lcp = this.metrics.find(m => m.name === 'LCP');
    const fid = this.metrics.find(m => m.name === 'FID');
    const cls = this.metrics.find(m => m.name === 'CLS');
    const fcp = this.metrics.find(m => m.name === 'FCP');

    return {
      lcp: lcp?.value,
      fid: fid?.value,
      cls: cls?.value,
      fcp: fcp?.value,
    };
  }

  /**
   * Get page load performance
   */
  getPageLoadPerformance(): {
    domContentLoaded: number;
    loadComplete: number;
    ttfb: number;
  } | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!perfData) {
      return null;
    }

    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
      loadComplete: perfData.loadEventEnd - perfData.fetchStart,
      ttfb: perfData.responseStart - perfData.fetchStart,
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-limit).reverse();
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.disconnect();
    } else {
      this.init();
    }
  }
}

// Singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Initialize on module load
if (typeof window !== 'undefined') {
  performanceMonitoring.init();
}

