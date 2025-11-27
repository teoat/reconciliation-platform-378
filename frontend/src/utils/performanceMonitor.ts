/**
 * Performance Monitoring Utility
 * 
 * Monitors and reports performance metrics for the application
 */

import { checkPerformanceBudget, getPerformanceBudget, type PerformanceBudget } from './performanceBudget';

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToFirstByte?: number;
  resourceSizes?: {
    js: number;
    css: number;
    images: number;
    fonts: number;
    total: number;
  };
  requestCount?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private budget: PerformanceBudget;

  constructor() {
    this.budget = getPerformanceBudget();
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          // Store LCP for later retrieval
          (window as any).__performanceLCP = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        // LCP not supported
      }

      // Observe CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          (window as any).__performanceCLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        // CLS not supported
      }
    }
  }

  /**
   * Collect performance metrics for the current page
   */
  collectMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');

    const lcp = (window as any).__performanceLCP || 0;
    const cls = (window as any).__performanceCLS || 0;

    // Calculate resource sizes
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const resourceSizes = {
      js: 0,
      css: 0,
      images: 0,
      fonts: 0,
      total: 0,
    };

    resources.forEach((resource) => {
      const size = (resource as any).transferSize || 0;
      resourceSizes.total += size;
      
      if (resource.name.endsWith('.js')) {
        resourceSizes.js += size;
      } else if (resource.name.endsWith('.css')) {
        resourceSizes.css += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        resourceSizes.images += size;
      } else if (resource.name.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
        resourceSizes.fonts += size;
      }
    });

    const metrics: PerformanceMetrics = {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: fcp ? fcp.startTime : 0,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      timeToFirstByte: navigation.responseStart - navigation.requestStart,
      resourceSizes: {
        js: resourceSizes.js / 1024, // Convert to KB
        css: resourceSizes.css / 1024,
        images: resourceSizes.images / 1024,
        fonts: resourceSizes.fonts / 1024,
        total: resourceSizes.total / 1024,
      },
      requestCount: resources.length,
    };

    this.metrics.push(metrics);
    return metrics;
  }

  /**
   * Check if current metrics meet budget requirements
   */
  checkBudget(metrics?: PerformanceMetrics): {
    passed: boolean;
    violations: Array<{
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'error';
    }>;
  } {
    const currentMetrics = metrics || this.collectMetrics();
    
    return checkPerformanceBudget(
      {
        loadTime: currentMetrics.loadTime,
        lcp: currentMetrics.largestContentfulPaint,
        cls: currentMetrics.cumulativeLayoutShift,
        fcp: currentMetrics.firstContentfulPaint,
        ttfb: currentMetrics.timeToFirstByte,
        jsSize: currentMetrics.resourceSizes?.js,
        cssSize: currentMetrics.resourceSizes?.css,
        imageSize: currentMetrics.resourceSizes?.images,
        fontSize: currentMetrics.resourceSizes?.fonts,
        totalSize: currentMetrics.resourceSizes?.total,
        requestCount: currentMetrics.requestCount,
      },
      this.budget
    );
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get average metrics
   */
  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) {
      return {};
    }

    const sums = this.metrics.reduce(
      (acc, m) => ({
        loadTime: acc.loadTime + m.loadTime,
        domContentLoaded: acc.domContentLoaded + m.domContentLoaded,
        loadComplete: acc.loadComplete + m.loadComplete,
        firstContentfulPaint: acc.firstContentfulPaint + m.firstContentfulPaint,
        largestContentfulPaint: acc.largestContentfulPaint + m.largestContentfulPaint,
        cumulativeLayoutShift: acc.cumulativeLayoutShift + m.cumulativeLayoutShift,
      }),
      {
        loadTime: 0,
        domContentLoaded: 0,
        loadComplete: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
      }
    );

    const count = this.metrics.length;
    return {
      loadTime: sums.loadTime / count,
      domContentLoaded: sums.domContentLoaded / count,
      loadComplete: sums.loadComplete / count,
      firstContentfulPaint: sums.firstContentfulPaint / count,
      largestContentfulPaint: sums.largestContentfulPaint / count,
      cumulativeLayoutShift: sums.cumulativeLayoutShift / count,
    };
  }

  /**
   * Clear all collected metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Get the performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(): PerformanceMonitor {
  return getPerformanceMonitor();
}

