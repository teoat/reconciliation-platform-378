// Frontend Performance Optimization Service
import { logger } from '@/services/logger';
// This service handles performance monitoring, optimization, and caching

import { EventEmitter } from 'events';

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  apiResponseTime: number;
  timestamp: string;
}

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    gzippedSize: number;
  }>;
  duplicates: Array<{
    module: string;
    chunks: string[];
    size: number;
  }>;
}

export interface CacheStrategy {
  name: string;
  maxAge: number;
  maxSize: number;
  strategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
}

class PerformanceService extends EventEmitter {
  private metrics: PerformanceMetrics | null = null;
  private observers: PerformanceObserver[] = [];
  private cacheStrategies: Map<string, CacheStrategy> = new Map();
  private memoryCache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private apiCache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private bundleAnalysis: BundleAnalysis | null = null;

  constructor() {
    super();
    this.initializePerformanceMonitoring();
    this.setupCacheStrategies();
    this.analyzeBundle();
  }

  // Performance Monitoring
  private initializePerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Core Web Vitals
      this.observeWebVitals();

      // Monitor memory usage
      this.observeMemoryUsage();

      // Monitor API performance
      this.observeApiPerformance();

      // Monitor bundle performance
      this.observeBundlePerformance();
    }
  }

  private observeWebVitals(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetric('firstContentfulPaint', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.updateMetric('largestContentfulPaint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const timing = entry as PerformanceEventTiming;
          if (timing && 'processingStart' in timing && 'startTime' in timing) {
            this.updateMetric('firstInputDelay', timing.processingStart - timing.startTime);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShift = entry as LayoutShift;
          if (layoutShift && 'hadRecentInput' in layoutShift && 'value' in layoutShift) {
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
        });
        this.updateMetric('cumulativeLayoutShift', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = performance.memory as PerformanceMemory;
      this.updateMetric('memoryUsage', memory.usedJSHeapSize / 1024 / 1024); // MB
    }
  }

  private observeApiPerformance(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.updateMetric('apiResponseTime', responseTime);
        this.emit('api_performance', {
          url: args[0],
          responseTime,
          status: response.status,
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.emit('api_error', {
          url: args[0],
          responseTime,
          error,
        });

        throw error;
      }
    };
  }

  private observeBundlePerformance(): void {
    // Analyze loaded resources
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;

      resources.forEach((resource) => {
        const resourceTiming = resource as PerformanceResourceTiming;
        if (resourceTiming && 'transferSize' in resourceTiming && resourceTiming.transferSize) {
          totalSize += resourceTiming.transferSize;
        }
      });

      this.updateMetric('bundleSize', totalSize / 1024); // KB
    }
  }

  private updateMetric(key: Exclude<keyof PerformanceMetrics, 'timestamp'>, value: number): void {
    if (!this.metrics) {
      this.metrics = this.getDefaultMetrics();
    }

    this.metrics[key] = value;
    this.metrics.timestamp = new Date().toISOString();

    this.emit('metrics_updated', this.metrics);
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      memoryUsage: 0,
      bundleSize: 0,
      cacheHitRate: 0,
      apiResponseTime: 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Cache Management
  private setupCacheStrategies(): void {
    this.cacheStrategies.set('api', {
      name: 'API Cache',
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      strategy: 'memory',
    });

    this.cacheStrategies.set('user', {
      name: 'User Data Cache',
      maxAge: 30 * 60 * 1000, // 30 minutes
      maxSize: 50,
      strategy: 'localStorage',
    });

    this.cacheStrategies.set('project', {
      name: 'Project Data Cache',
      maxAge: 15 * 60 * 1000, // 15 minutes
      maxSize: 100,
      strategy: 'sessionStorage',
    });

    this.cacheStrategies.set('file', {
      name: 'File Cache',
      maxAge: 60 * 60 * 1000, // 1 hour
      maxSize: 200,
      strategy: 'indexedDB',
    });
  }

  // Memory Cache
  setCache<T>(key: string, data: T, ttl: number = 300000): void {
    const strategy = this.cacheStrategies.get('api');
    if (!strategy) return;

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || strategy.maxAge,
    });

    // Cleanup expired entries
    this.cleanupExpiredCache();
  }

  getCache<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(key?: string): void {
    if (key) {
      this.memoryCache.delete(key);
    } else {
      this.memoryCache.clear();
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Local Storage Cache
  setLocalCache<T>(key: string, data: T, ttl: number = 1800000): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error: unknown) {
      logger.warning('Failed to set local cache', { error });
    }
  }

  getLocalCache<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      if (Date.now() - cacheData.timestamp > cacheData.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheData.data;
    } catch (error: unknown) {
      logger.warning('Failed to get local cache', { error });
      return null;
    }
  }

  // Session Storage Cache
  setSessionCache<T>(key: string, data: T, ttl: number = 900000): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error: unknown) {
      logger.warning('Failed to set session cache', { error });
    }
  }

  getSessionCache<T>(key: string): T | null {
    try {
      const cached = sessionStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      if (Date.now() - cacheData.timestamp > cacheData.ttl) {
        sessionStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheData.data;
    } catch (error: unknown) {
      logger.warning('Failed to get session cache', { error });
      return null;
    }
  }

  // Bundle Analysis
  private analyzeBundle(): void {
    if (typeof window !== 'undefined' && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const chunks: Array<{ name: string; size: number; gzippedSize: number }> = [];
      const duplicates: Array<{ module: string; chunks: string[]; size: number }> = [];

      let totalSize = 0;
      let gzippedSize = 0;

      resources.forEach((resource) => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          const size = resource.transferSize || 0;
          const gzipped = resource.decodedBodySize || size;

          totalSize += size;
          gzippedSize += gzipped;

          chunks.push({
            name: resource.name.split('/').pop() || 'unknown',
            size: size / 1024, // KB
            gzippedSize: gzipped / 1024, // KB
          });
        }
      });

      this.bundleAnalysis = {
        totalSize: totalSize / 1024, // KB
        gzippedSize: gzippedSize / 1024, // KB
        chunks,
        duplicates,
      };
    }
  }

  // Performance Optimization Methods
  lazyLoadImages(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  preloadCriticalResources(): void {
    const criticalResources = ['/api/auth/me', '/api/projects', '/api/dashboard'];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  optimizeImages(): void {
    // Convert images to WebP format if supported
    if (this.supportsWebP()) {
      document.querySelectorAll('img').forEach((img) => {
        const src = img.src;
        if (src.includes('.jpg') || src.includes('.png')) {
          const webpSrc = src.replace(/\.(jpg|png)$/, '.webp');
          img.src = webpSrc;
        }
      });
    }
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Performance Reporting
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  getBundleAnalysis(): BundleAnalysis | null {
    return this.bundleAnalysis;
  }

  getCacheStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.memoryCache.size,
      misses: 0, // This would need to be tracked
      size: this.memoryCache.size,
    };
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.memoryCache.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default performanceService;
