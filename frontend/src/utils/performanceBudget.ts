/**
 * Performance Budget Configuration
 * 
 * Defines performance thresholds and budgets for the application
 */

export interface PerformanceBudget {
  // Load time budgets (in milliseconds)
  loadTime: {
    p50: number; // 50th percentile (median)
    p75: number; // 75th percentile
    p95: number; // 95th percentile
    p99: number; // 99th percentile
  };
  
  // Core Web Vitals
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint (ms)
    fid: number; // First Input Delay (ms)
    cls: number; // Cumulative Layout Shift (score)
    fcp: number; // First Contentful Paint (ms)
    ttfb: number; // Time to First Byte (ms)
  };
  
  // Resource budgets
  resources: {
    js: number; // JavaScript bundle size (KB)
    css: number; // CSS bundle size (KB)
    images: number; // Total image size (KB)
    fonts: number; // Font size (KB)
    total: number; // Total page weight (KB)
  };
  
  // Network budgets
  network: {
    requests: number; // Maximum number of HTTP requests
    connections: number; // Maximum concurrent connections
  };
}

/**
 * Default Performance Budget
 * Based on industry standards and user experience targets
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  loadTime: {
    p50: 2000, // 2 seconds median
    p75: 3000, // 3 seconds at 75th percentile
    p95: 5000, // 5 seconds at 95th percentile
    p99: 8000, // 8 seconds at 99th percentile
  },
  coreWebVitals: {
    lcp: 2500, // 2.5 seconds (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    fid: 100, // 100ms (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    cls: 0.1, // 0.1 (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    fcp: 1800, // 1.8 seconds (Good: <1.8s, Needs Improvement: 1.8-3s, Poor: >3s)
    ttfb: 800, // 800ms (Good: <800ms, Needs Improvement: 800-1800ms, Poor: >1800ms)
  },
  resources: {
    js: 300, // 300KB JavaScript
    css: 50, // 50KB CSS
    images: 500, // 500KB images
    fonts: 100, // 100KB fonts
    total: 1000, // 1MB total page weight
  },
  network: {
    requests: 50, // Maximum 50 HTTP requests
    connections: 6, // Maximum 6 concurrent connections
  },
};

/**
 * Strict Performance Budget
 * For production environments with higher performance requirements
 */
export const STRICT_PERFORMANCE_BUDGET: PerformanceBudget = {
  loadTime: {
    p50: 1500, // 1.5 seconds median
    p75: 2000, // 2 seconds at 75th percentile
    p95: 3000, // 3 seconds at 95th percentile
    p99: 5000, // 5 seconds at 99th percentile
  },
  coreWebVitals: {
    lcp: 2000, // 2 seconds
    fid: 50, // 50ms
    cls: 0.05, // 0.05
    fcp: 1500, // 1.5 seconds
    ttfb: 600, // 600ms
  },
  resources: {
    js: 200, // 200KB JavaScript
    css: 30, // 30KB CSS
    images: 300, // 300KB images
    fonts: 50, // 50KB fonts
    total: 600, // 600KB total page weight
  },
  network: {
    requests: 30, // Maximum 30 HTTP requests
    connections: 6, // Maximum 6 concurrent connections
  },
};

/**
 * Check if performance metrics meet budget requirements
 */
export function checkPerformanceBudget(
  metrics: {
    loadTime?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    jsSize?: number;
    cssSize?: number;
    imageSize?: number;
    fontSize?: number;
    totalSize?: number;
    requestCount?: number;
  },
  budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET
): {
  passed: boolean;
  violations: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'error';
  }>;
} {
  const violations: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'error';
  }> = [];

  // Check Core Web Vitals
  if (metrics.lcp !== undefined && metrics.lcp > budget.coreWebVitals.lcp) {
    violations.push({
      metric: 'LCP',
      value: metrics.lcp,
      threshold: budget.coreWebVitals.lcp,
      severity: metrics.lcp > budget.coreWebVitals.lcp * 1.5 ? 'error' : 'warning',
    });
  }

  if (metrics.fid !== undefined && metrics.fid > budget.coreWebVitals.fid) {
    violations.push({
      metric: 'FID',
      value: metrics.fid,
      threshold: budget.coreWebVitals.fid,
      severity: metrics.fid > budget.coreWebVitals.fid * 2 ? 'error' : 'warning',
    });
  }

  if (metrics.cls !== undefined && metrics.cls > budget.coreWebVitals.cls) {
    violations.push({
      metric: 'CLS',
      value: metrics.cls,
      threshold: budget.coreWebVitals.cls,
      severity: metrics.cls > budget.coreWebVitals.cls * 2 ? 'error' : 'warning',
    });
  }

  if (metrics.fcp !== undefined && metrics.fcp > budget.coreWebVitals.fcp) {
    violations.push({
      metric: 'FCP',
      value: metrics.fcp,
      threshold: budget.coreWebVitals.fcp,
      severity: metrics.fcp > budget.coreWebVitals.fcp * 1.5 ? 'error' : 'warning',
    });
  }

  if (metrics.ttfb !== undefined && metrics.ttfb > budget.coreWebVitals.ttfb) {
    violations.push({
      metric: 'TTFB',
      value: metrics.ttfb,
      threshold: budget.coreWebVitals.ttfb,
      severity: metrics.ttfb > budget.coreWebVitals.ttfb * 1.5 ? 'error' : 'warning',
    });
  }

  // Check resource sizes
  if (metrics.jsSize !== undefined && metrics.jsSize > budget.resources.js) {
    violations.push({
      metric: 'JavaScript Size',
      value: metrics.jsSize,
      threshold: budget.resources.js,
      severity: 'warning',
    });
  }

  if (metrics.totalSize !== undefined && metrics.totalSize > budget.resources.total) {
    violations.push({
      metric: 'Total Page Size',
      value: metrics.totalSize,
      threshold: budget.resources.total,
      severity: 'warning',
    });
  }

  // Check load time
  if (metrics.loadTime !== undefined && metrics.loadTime > budget.loadTime.p95) {
    violations.push({
      metric: 'Load Time',
      value: metrics.loadTime,
      threshold: budget.loadTime.p95,
      severity: metrics.loadTime > budget.loadTime.p99 ? 'error' : 'warning',
    });
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Get performance budget based on environment
 */
export function getPerformanceBudget(): PerformanceBudget {
  const isProduction = import.meta.env.PROD;
  return isProduction ? STRICT_PERFORMANCE_BUDGET : DEFAULT_PERFORMANCE_BUDGET;
}

