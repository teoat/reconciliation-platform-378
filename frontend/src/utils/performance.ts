// Performance Monitoring Utilities
import { logger } from '@/services/logger';
import { toRecord } from './typeHelpers';
// Provides comprehensive performance monitoring for the Reconciliation Platform

// Import common performance utilities (SSOT)
import { debounce, throttle } from './common/performance';

interface PerformanceMetrics {
  timestamp: number;
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  memoryUsage: number;
  jsHeapSizeUsed: number;
  jsHeapSizeLimit: number;
}

interface NetworkMetrics {
  timestamp: number;
  url: string;
  method: string;
  status: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  cacheStatus: string;
}

interface UserMetrics {
  timestamp: number;
  userId: string;
  sessionId: string;
  pageViews: number;
  timeOnSite: number;
  bounceRate: number;
  conversionRate: number;
  deviceType: string;
  browserType: string;
  osType: string;
  location: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private networkMetrics: NetworkMetrics[] = [];
  private userMetrics: UserMetrics[] = [];
  private sessionStartTime: number;
  private pageViewCount: number = 0;
  private isMonitoring: boolean = false;

  constructor() {
    this.sessionStartTime = Date.now();
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Initialize performance observer
    this.initializePerformanceObserver();

    // Initialize network monitoring
    this.initializeNetworkMonitoring();

    // Initialize user metrics
    this.initializeUserMetrics();

    // Initialize memory monitoring
    this.initializeMemoryMonitoring();

    this.isMonitoring = true;
    logger.info('Performance monitoring initialized');
  }

  private initializePerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    // Observe Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });

    // Observe different types of performance entries
    try {
      observer.observe({
        entryTypes: [
          'navigation',
          'paint',
          'largest-contentful-paint',
          'first-input',
          'layout-shift',
        ],
      });
    } catch (error) {
      logger.warn('PerformanceObserver not fully supported:', error);
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    const metrics: Partial<PerformanceMetrics> = {
      timestamp: Date.now(),
    };

    switch (entry.entryType) {
      case 'navigation': {
        const navEntry = entry as PerformanceNavigationTiming;
        metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.fetchStart;
        metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
        break;
      }

      case 'paint': {
        const paintEntry = entry as PerformancePaintTiming;
        if (paintEntry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = paintEntry.startTime;
        }
        break;
      }

      case 'largest-contentful-paint': {
        metrics.largestContentfulPaint = entry.startTime;
        break;
      }

      case 'first-input': {
        const fiEntry = entry as PerformanceEventTiming;
        metrics.firstInputDelay = fiEntry.processingStart - fiEntry.startTime;
        break;
      }

      case 'layout-shift': {
        interface PerformanceLayoutShift extends PerformanceEntry {
          value: number;
          hadRecentInput: boolean;
        }
        const lsEntry = entry as PerformanceLayoutShift;
        if (!lsEntry.hadRecentInput) {
          metrics.cumulativeLayoutShift = lsEntry.value;
        }
        break;
      }
    }

    // Calculate total blocking time
    if (entry.entryType === 'navigation') {
      metrics.totalBlockingTime = this.calculateTotalBlockingTime();
    }

    // Store metrics
    this.metrics.push(metrics as PerformanceMetrics);
  }

  private calculateTotalBlockingTime(): number {
    interface PerformanceLongTaskTiming extends PerformanceEntry {
      attribution: Array<{
        name: string;
        entryType: string;
        startTime: number;
        duration: number;
      }>;
    }
    const longTasks = performance.getEntriesByType('long-task') as PerformanceLongTaskTiming[];
    return longTasks.reduce((total, task) => total + task.duration, 0);
  }

  private initializeNetworkMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    const networkObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.handleNetworkEntry(entry as PerformanceResourceTiming);
        }
      }
    });

    try {
      networkObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      logger.warn('Network monitoring not supported:', error);
    }
  }

  private handleNetworkEntry(entry: PerformanceResourceTiming): void {
    const networkMetrics: NetworkMetrics = {
      timestamp: Date.now(),
      url: entry.name,
      method: 'GET', // Default, would need to be tracked separately
      status: 200, // Default, would need to be tracked separately
      responseTime: entry.responseEnd - entry.requestStart,
      requestSize: entry.transferSize || 0,
      responseSize: entry.encodedBodySize || 0,
      cacheStatus: entry.transferSize === 0 ? 'HIT' : 'MISS',
    };

    this.networkMetrics.push(networkMetrics);
  }

  private initializeUserMetrics(): void {
    this.pageViewCount++;

    const userMetrics: UserMetrics = {
      timestamp: Date.now(),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      pageViews: this.pageViewCount,
      timeOnSite: Date.now() - this.sessionStartTime,
      bounceRate: this.calculateBounceRate(),
      conversionRate: this.calculateConversionRate(),
      deviceType: this.getDeviceType(),
      browserType: this.getBrowserType(),
      osType: this.getOSType(),
      location: this.getLocation(),
    };

    this.userMetrics.push(userMetrics);
  }

  private initializeMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    // TypeScript doesn't have memory in Performance type, but it exists in Chrome
    const memoryInfo = (performance as unknown as { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;

    const metrics: Partial<PerformanceMetrics> = {
      timestamp: Date.now(),
      memoryUsage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100,
      jsHeapSizeUsed: memoryInfo.usedJSHeapSize,
      jsHeapSizeLimit: memoryInfo.totalJSHeapSize,
    };

    this.metrics.push(metrics as PerformanceMetrics);
  }

  // Utility methods
  private getUserId(): string {
    return localStorage.getItem('userId') || 'anonymous';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private calculateBounceRate(): number {
    // Simple bounce rate calculation
    return this.pageViewCount === 1 ? 100 : 0;
  }

  private calculateConversionRate(): number {
    // Simple conversion rate calculation
    return 0; // Would be calculated based on business logic
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  private getBrowserType(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSType(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getLocation(): string {
    // Would typically use geolocation API or IP-based location
    return 'Unknown';
  }

  // Public methods
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getNetworkMetrics(): NetworkMetrics[] {
    return [...this.networkMetrics];
  }

  public getUserMetrics(): UserMetrics[] {
    return [...this.userMetrics];
  }

  public getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sum = this.metrics.reduce(
      (acc, metric) => ({
        pageLoadTime: (acc.pageLoadTime || 0) + metric.pageLoadTime,
        domContentLoaded: (acc.domContentLoaded || 0) + metric.domContentLoaded,
        firstContentfulPaint: (acc.firstContentfulPaint || 0) + metric.firstContentfulPaint,
        largestContentfulPaint: (acc.largestContentfulPaint || 0) + metric.largestContentfulPaint,
        firstInputDelay: (acc.firstInputDelay || 0) + metric.firstInputDelay,
        cumulativeLayoutShift: (acc.cumulativeLayoutShift || 0) + metric.cumulativeLayoutShift,
        totalBlockingTime: (acc.totalBlockingTime || 0) + metric.totalBlockingTime,
        memoryUsage: (acc.memoryUsage || 0) + metric.memoryUsage,
      }),
      {} as Partial<PerformanceMetrics>
    );

    const count = this.metrics.length;
    return {
      pageLoadTime: sum.pageLoadTime! / count,
      domContentLoaded: sum.domContentLoaded! / count,
      firstContentfulPaint: sum.firstContentfulPaint! / count,
      largestContentfulPaint: sum.largestContentfulPaint! / count,
      firstInputDelay: sum.firstInputDelay! / count,
      cumulativeLayoutShift: sum.cumulativeLayoutShift! / count,
      totalBlockingTime: sum.totalBlockingTime! / count,
      memoryUsage: sum.memoryUsage! / count,
    };
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.networkMetrics = [];
    this.userMetrics = [];
  }

  public sendMetricsToServer(): void {
    if (!this.isMonitoring) return;

    const data = {
      performance: this.getAverageMetrics(),
      network: this.networkMetrics,
      user: this.userMetrics[this.userMetrics.length - 1], // Latest user metrics
      timestamp: Date.now(),
    };

    // Send to analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch((error) => {
      logger.error('Failed to send performance metrics:', error);
    });
  }

  public startMonitoring(): void {
    if (!this.isMonitoring) {
      this.initializeMonitoring();
    }
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
  }
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const monitor = new PerformanceMonitor();

  return {
    metrics: monitor.getMetrics(),
    networkMetrics: monitor.getNetworkMetrics(),
    userMetrics: monitor.getUserMetrics(),
    averageMetrics: monitor.getAverageMetrics(),
    clearMetrics: () => monitor.clearMetrics(),
    sendMetrics: () => monitor.sendMetricsToServer(),
    startMonitoring: () => monitor.startMonitoring(),
    stopMonitoring: () => monitor.stopMonitoring(),
  };
}

// Utility functions for performance optimization
// Re-export from common module (SSOT)
export { debounce, throttle };

// Performance configuration (basic)
// NOTE: This conflicts with performanceConfig.tsx - use performanceConfig.tsx for full config
export const basicPerformanceConfig = {
  lazyLoading: {
    enabled: true,
    preloadOnHover: true,
    preloadOnFocus: true,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  codeSplitting: {
    enabled: true,
    chunkSize: 200000, // 200KB
    maxChunks: 15,
    minChunkSize: 30000, // 30KB
  },
  virtualScrolling: {
    enabled: true,
    itemHeight: 50,
    overscan: 10,
    threshold: 0.05,
  },
  caching: {
    enabled: true,
    maxAge: 300000, // 5 minutes
    staleWhileRevalidate: 600000, // 10 minutes
  },
  monitoring: {
    enabled: true,
    sampleRate: 0.1, // 10% of users
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
  },
};

// Export the main class
export default PerformanceMonitor;
