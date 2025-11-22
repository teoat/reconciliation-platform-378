import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/services/logger';

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  bundleSize: number;
  loadTime: number;
}

interface PerformanceConfig {
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableRenderMonitoring: boolean;
  enableBundleAnalysis: boolean;
  sampleRate: number;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      enableRenderMonitoring: true,
      enableBundleAnalysis: true,
      sampleRate: 0.1,
      ...config,
    };

    this.initializeObservers();
  }

  private initializeObservers() {
    if (this.config.enableRenderMonitoring) {
      this.observeRenderPerformance();
    }

    if (this.config.enableNetworkMonitoring) {
      this.observeNetworkPerformance();
    }

    if (this.config.enableBundleAnalysis) {
      this.observeBundlePerformance();
    }
  }

  private observeRenderPerformance() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            renderTime: entry.duration,
            memoryUsage: 0,
            networkLatency: 0,
            bundleSize: 0,
            loadTime: 0,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
    this.observers.set('render', observer);
  }

  private observeNetworkPerformance() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric({
            renderTime: 0,
            memoryUsage: 0,
            networkLatency: navEntry.responseEnd - navEntry.requestStart,
            bundleSize: 0,
            loadTime: navEntry.loadEventEnd - navEntry.navigationStart,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('network', observer);
  }

  private observeBundlePerformance() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric({
            renderTime: 0,
            memoryUsage: 0,
            networkLatency: 0,
            bundleSize: resourceEntry.transferSize,
            loadTime: resourceEntry.duration,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('bundle', observer);
  }

  private recordMetric(metric: PerformanceMetrics) {
    if (Math.random() < this.config.sampleRate) {
      this.metrics.push(metric);
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        renderTime: acc.renderTime + metric.renderTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        networkLatency: acc.networkLatency + metric.networkLatency,
        bundleSize: acc.bundleSize + metric.bundleSize,
        loadTime: acc.loadTime + metric.loadTime,
      }),
      { renderTime: 0, memoryUsage: 0, networkLatency: 0, bundleSize: 0, loadTime: 0 }
    );

    const count = this.metrics.length;
    return {
      renderTime: totals.renderTime / count,
      memoryUsage: totals.memoryUsage / count,
      networkLatency: totals.networkLatency / count,
      bundleSize: totals.bundleSize / count,
      loadTime: totals.loadTime / count,
    };
  }

  public clearMetrics() {
    this.metrics = [];
  }

  public destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// ============================================================================
// REACT HOOKS FOR PERFORMANCE MONITORING
// ============================================================================

/**
 * Hook for monitoring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    performance.mark(`${componentName}-render-start`);
    performance.mark(`${componentName}-render-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-render-start`,
      `${componentName}-render-end`
    );

    if (renderTime > 100) {
      logger.warn(`${componentName} took ${renderTime}ms to render`);
    }
  });
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitoring() {
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  useEffect(() => {
    if (!('memory' in performance)) return;

    const updateMemoryUsage = () => {
      // TypeScript doesn't have memory in Performance type, but it exists in Chrome
      const memory = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
      if (memory?.usedJSHeapSize) {
        setMemoryUsage(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}

/**
 * Hook for monitoring network performance
 */
export function useNetworkMonitoring() {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null>(null);

  useEffect(() => {
    if (!('connection' in navigator)) return;

    // TypeScript doesn't have connection in Navigator type, but it exists in Chrome
    const connection = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number } }).connection;
    setNetworkInfo({
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: (connection as { rtt?: number })?.rtt || 0,
    });

    const handleConnectionChange = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    };

    connection.addEventListener('change', handleConnectionChange);
    return () => connection.removeEventListener('change', handleConnectionChange);
  }, []);

  return networkInfo;
}

/**
 * Hook for monitoring bundle size and load time
 */
export function useBundleMonitoring() {
  const [bundleInfo, setBundleInfo] = useState<{
    size: number;
    loadTime: number;
  } | null>(null);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          setBundleInfo({
            size: resourceEntry.transferSize,
            loadTime: resourceEntry.duration,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    return () => observer.disconnect();
  }, []);

  return bundleInfo;
}

/**
 * Hook for comprehensive performance monitoring
 */
export function usePerformanceMonitoring(config: Partial<PerformanceConfig> = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const monitorRef = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    monitorRef.current = new PerformanceMonitor(config);

    const updateMetrics = () => {
      if (monitorRef.current) {
        setMetrics(monitorRef.current.getMetrics());
      }
    };

    const interval = setInterval(updateMetrics, 10000);
    return () => {
      clearInterval(interval);
      if (monitorRef.current) {
        monitorRef.current.destroy();
      }
    };
  }, [config]);

  const clearMetrics = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.clearMetrics();
      setMetrics([]);
    }
  }, []);

  const getAverageMetrics = useCallback(() => {
    return monitorRef.current?.getAverageMetrics() || {};
  }, []);

  return {
    metrics,
    clearMetrics,
    getAverageMetrics,
  };
}

// ============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Debounces a function to improve performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function to improve performance
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoizes a function result
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Creates a performance-optimized component wrapper
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    useRenderPerformance(componentName);

    return <Component {...props} />;
  };
}

// ============================================================================
// BUNDLE ANALYSIS UTILITIES
// ============================================================================

/**
 * Analyzes bundle composition
 */
export async function analyzeBundleComposition() {
  if (!('PerformanceObserver' in window)) return null;

  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const resources: Array<{
        name: string;
        size: number;
        loadTime: number;
        type: string;
      }> = [];

      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          resources.push({
            name: resourceEntry.name,
            size: resourceEntry.transferSize,
            loadTime: resourceEntry.duration,
            type: resourceEntry.initiatorType,
          });
        }
      }

      observer.disconnect();
      resolve(resources);
    });

    observer.observe({ entryTypes: ['resource'] });
  });
}

/**
 * Measures component bundle size
 */
export async function measureComponentBundleSize(componentName: string) {
  const startTime = performance.now();

  try {
    // This would be implemented based on your bundler
    const bundleSize = await import(`../components/${componentName}`);
    const endTime = performance.now();

    return {
      componentName,
      loadTime: endTime - startTime,
      bundleSize: 0, // Would be calculated by bundler
    };
  } catch (error) {
    logger.error(`Failed to measure bundle size for ${componentName}:`, error);
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PerformanceMonitor,
  debounce,
  throttle,
  memoize,
  withPerformanceMonitoring,
  analyzeBundleComposition,
  measureComponentBundleSize,
};

export default {
  PerformanceMonitor,
  useRenderPerformance,
  useMemoryMonitoring,
  useNetworkMonitoring,
  useBundleMonitoring,
  usePerformanceMonitoring,
  debounce,
  throttle,
  memoize,
  withPerformanceMonitoring,
  analyzeBundleComposition,
  measureComponentBundleSize,
};
