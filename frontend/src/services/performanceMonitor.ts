// Performance Monitoring Service
import { logger } from '@/services/logger';
// Implements Web Vitals tracking and performance optimization

import React from 'react';
// import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals'
import { APP_CONFIG } from '../config/AppConfig';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  CLS: number; // Cumulative Layout Shift
  FID: number; // First Input Delay
  LCP: number; // Largest Contentful Paint

  // Additional metrics
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte

  // Custom metrics
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;

  // User experience metrics
  bounceRate: number;
  sessionDuration: number;
  pageViews: number;

  // Performance scores
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;

  // Timestamp
  timestamp: Date;
}

// Performance configuration
interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number;
  reportInterval: number;
  maxRetries: number;
  endpoint: string;
  debug: boolean;
}

// Default configuration
const defaultConfig: PerformanceConfig = {
  enabled: true,
  sampleRate: 1.0,
  reportInterval: 30000, // 30 seconds
  maxRetries: 3,
  endpoint: '/api/analytics/performance',
  debug: false,
};

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private reportTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.init();
  }

  private init(): void {
    if (!this.config.enabled || this.isInitialized) return;

    try {
      this.setupWebVitals();
      this.setupCustomMetrics();
      this.setupPerformanceObserver();
      this.startReporting();
      this.isInitialized = true;

      if (this.config.debug) {
        logger.log('Performance monitoring initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize performance monitoring:', error);
    }
  }

  private setupWebVitals(): void {
    // Core Web Vitals
    onCLS((metric) => {
      this.metrics.CLS = metric.value;
      this.reportMetric('CLS', metric.value);
    });

    onLCP((metric) => {
      this.metrics.LCP = metric.value;
      this.reportMetric('LCP', metric.value);
    });

    // Additional metrics
    onFCP((metric) => {
      this.metrics.FCP = metric.value;
      this.reportMetric('FCP', metric.value);
    });

    onTTFB((metric) => {
      this.metrics.TTFB = metric.value;
      this.reportMetric('TTFB', metric.value);
    });
  }

  private setupCustomMetrics(): void {
    // Page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.metrics.loadTime = loadTime;
      this.reportMetric('loadTime', loadTime);
    });

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // User interaction tracking
    this.trackUserInteractions();
  }

  private setupPerformanceObserver(): void {
    // Long task observer
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            this.reportMetric('longTask', entry.duration);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Navigation observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.renderTime =
              navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
            this.reportMetric('renderTime', this.metrics.renderTime);
          }
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
  }

  private trackUserInteractions(): void {
    let interactionStart = 0;
    let interactionCount = 0;

    const trackInteraction = () => {
      if (interactionStart === 0) {
        interactionStart = performance.now();
      }
      interactionCount++;
    };

    // Track various user interactions
    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });

    // Calculate interaction time
    window.addEventListener('beforeunload', () => {
      if (interactionStart > 0) {
        this.metrics.interactionTime = performance.now() - interactionStart;
        this.reportMetric('interactionTime', this.metrics.interactionTime);
      }
    });
  }

  private startReporting(): void {
    this.reportTimer = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  private reportMetric(name: string, value: number): void {
    if (this.config.debug) {
      logger.log(`Performance metric ${name}:`, value);
    }

    // Store metric
    this.metrics[name as keyof PerformanceMetrics] = value as any;
    this.metrics.timestamp = new Date();

    // Send to analytics endpoint
    this.sendMetric(name, value);
  }

  private async sendMetric(name: string, value: number): Promise<void> {
    try {
      const payload = {
        metric: name,
        value,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (this.config.debug) {
        logger.error('Failed to send performance metric:', error);
      }
    }
  }

  private async reportMetrics(): Promise<void> {
    if (Object.keys(this.metrics).length === 0) return;

    try {
      const payload = {
        ...this.metrics,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        connection: this.getConnectionInfo(),
        device: this.getDeviceInfo(),
      };

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Clear metrics after reporting
      this.metrics = {};
    } catch (error) {
      if (this.config.debug) {
        logger.error('Failed to report performance metrics:', error);
      }
    }
  }

  private getConnectionInfo(): any {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      };
    }
    return null;
  }

  private getDeviceInfo(): any {
    return {
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };
  }

  // Public methods
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public getPerformanceScore(): number {
    const metrics = this.metrics;
    let score = 100;

    // CLS scoring (0-0.1 is good, 0.1-0.25 needs improvement, >0.25 is poor)
    if (metrics.CLS !== undefined) {
      if (metrics.CLS > 0.25) score -= 30;
      else if (metrics.CLS > 0.1) score -= 15;
    }

    // FID scoring (0-100ms is good, 100-300ms needs improvement, >300ms is poor)
    if (metrics.FID !== undefined) {
      if (metrics.FID > 300) score -= 30;
      else if (metrics.FID > 100) score -= 15;
    }

    // LCP scoring (<2.5s is good, 2.5-4s needs improvement, >4s is poor)
    if (metrics.LCP !== undefined) {
      if (metrics.LCP > 4000) score -= 30;
      else if (metrics.LCP > 2500) score -= 15;
    }

    return Math.max(0, score);
  }

  public markCustomMetric(name: string, value: number): void {
    this.reportMetric(name, value);
  }

  public measureCustomFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.markCustomMetric(name, duration);
    return result;
  }

  public async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.markCustomMetric(name, duration);
    return result;
  }

  public destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private optimizations: Map<string, () => void> = new Map();

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Image optimization
  public optimizeImages(): void {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      // Lazy loading
      if (!img.loading) {
        img.loading = 'lazy';
      }

      // WebP support
      if (img.src && !img.src.includes('.webp')) {
        const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const webpImg = new Image();
        webpImg.onload = () => {
          img.src = webpSrc;
        };
        webpImg.src = webpSrc;
      }
    });
  }

  // Resource hints
  public addResourceHints(urls: string[]): void {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Critical CSS inlining
  public inlineCriticalCSS(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Bundle splitting
  public loadChunk(chunkName: string): Promise<any> {
    return import(/* webpackChunkName: "[request]" */ `../chunks/${chunkName}`);
  }

  // Memory optimization
  public optimizeMemory(): void {
    // Clear unused event listeners
    if (window.gc) {
      window.gc();
    }

    // Clear unused timers
    const highestTimeoutId = setTimeout(() => {}, 0);
    clearTimeout(highestTimeoutId);
    // Note: In browser environment, we can't iterate through timeout IDs
    // This is a simplified cleanup approach
  }

  // Debounced scroll handler
  public addOptimizedScrollHandler(handler: () => void, delay = 16): void {
    let ticking = false;

    const optimizedHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handler();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedHandler, { passive: true });
  }

  // Virtual scrolling for large lists
  public createVirtualScroller(
    container: HTMLElement,
    itemHeight: number,
    totalItems: number,
    renderItem: (index: number) => HTMLElement
  ): void {
    const visibleItems = Math.ceil(container.clientHeight / itemHeight);
    let scrollTop = 0;

    const updateVisibleItems = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems, totalItems);

      // Clear container safely
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      // Render visible items
      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(i);
        item.style.position = 'absolute';
        item.style.top = `${i * itemHeight}px`;
        container.appendChild(item);
      }

      // Set container height
      container.style.height = `${totalItems * itemHeight}px`;
    };

    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop;
      updateVisibleItems();
    });

    updateVisibleItems();
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor({
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
});

export const performanceOptimizer = PerformanceOptimizer.getInstance();

// React performance hooks
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    getPerformanceScore: () => performanceMonitor.getPerformanceScore(),
    markMetric: (name: string, value: number) => performanceMonitor.markCustomMetric(name, value),
    measureFunction: <T>(name: string, fn: () => T) =>
      performanceMonitor.measureCustomFunction(name, fn),
    measureAsyncFunction: <T>(name: string, fn: () => Promise<T>) =>
      performanceMonitor.measureAsyncFunction(name, fn),
  };
};

// Performance middleware for API calls
export const performanceMiddleware = (store: any) => (next: any) => (action: any) => {
  const start = performance.now();
  const result = next(action);
  const duration = performance.now() - start;

  if (duration > 100) {
    // Log slow actions
    logger.warn(`Slow action: ${action.type} took ${duration.toFixed(2)}ms`);
  }

  performanceMonitor.markCustomMetric(`action_${action.type}`, duration);
  return result;
};

export default performanceMonitor;
