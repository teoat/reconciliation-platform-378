// ============================================================================
// PERFORMANCE OPTIMIZATION CONFIGURATION
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export const performanceConfig = {
  // Lazy loading configuration
  lazyLoading: {
    enabled: true,
    preloadOnHover: true,
    preloadOnFocus: true,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Code splitting configuration
  codeSplitting: {
    enabled: true,
    chunkSize: 250000, // 250KB
    maxChunks: 10,
    minChunkSize: 50000, // 50KB
  },

  // Virtual scrolling configuration
  virtualScrolling: {
    enabled: true,
    itemHeight: 50,
    overscan: 5,
    threshold: 0.1,
  },

  // Performance monitoring configuration
  monitoring: {
    enabled: true,
    sampleRate: 0.1,
    enableMemoryMonitoring: true,
    enableNetworkMonitoring: true,
    enableRenderMonitoring: true,
    enableBundleAnalysis: true,
  },

  // Caching configuration
  caching: {
    enabled: true,
    maxAge: 300000, // 5 minutes
    maxSize: 100, // 100 items
    enableMemoryCache: true,
    enableLocalStorageCache: true,
  },

  // Debouncing configuration
  debouncing: {
    search: 300,
    resize: 100,
    scroll: 16,
    input: 200,
  },

  // Throttling configuration
  throttling: {
    scroll: 16,
    resize: 100,
    mousemove: 16,
    touchmove: 16,
  },

  // Bundle optimization
  bundleOptimization: {
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    enableSourceMaps: false,
    enableAnalyzer: true,
  },

  // Image optimization
  imageOptimization: {
    enabled: true,
    quality: 80,
    format: 'webp',
    lazyLoading: true,
    placeholder: true,
  },

  // Font optimization
  fontOptimization: {
    enabled: true,
    preload: true,
    display: 'swap',
    fallback: true,
  },

  // Service worker configuration
  serviceWorker: {
    enabled: true,
    cacheStrategy: 'staleWhileRevalidate',
    offlineFallback: true,
    updateCheckInterval: 60000, // 1 minute
  },
};

// ============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Checks if performance optimizations are enabled
 */
export function isPerformanceOptimizationEnabled(): boolean {
  return (
    performanceConfig.lazyLoading.enabled &&
    performanceConfig.codeSplitting.enabled &&
    performanceConfig.virtualScrolling.enabled
  );
}

/**
 * Gets the optimal chunk size based on network conditions
 */
export function getOptimalChunkSize(): number {
  if ('connection' in navigator) {
    // TypeScript doesn't have connection in Navigator type, but it exists in Chrome
    const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    const effectiveType = connection?.effectiveType;

    switch (effectiveType || '4g') {
      case 'slow-2g':
        return 100000; // 100KB
      case '2g':
        return 150000; // 150KB
      case '3g':
        return 200000; // 200KB
      case '4g':
        return 300000; // 300KB
      default:
        return performanceConfig.codeSplitting.chunkSize;
    }
  }

  return performanceConfig.codeSplitting.chunkSize;
}

/**
 * Gets the optimal debounce delay based on input type
 */
export function getOptimalDebounceDelay(inputType: string): number {
  const delays = performanceConfig.debouncing;
  return delays[inputType as keyof typeof delays] || delays.input;
}

/**
 * Gets the optimal throttle delay based on event type
 */
export function getOptimalThrottleDelay(eventType: string): number {
  const delays = performanceConfig.throttling;
  return delays[eventType as keyof typeof delays] || delays.scroll;
}

/**
 * Checks if the device has limited resources
 */
export function isResourceLimitedDevice(): boolean {
  if ('memory' in performance) {
    // TypeScript doesn't have memory in Performance type, but it exists in Chrome
    const memory = (performance as unknown as { memory?: { jsHeapSizeLimit?: number; usedJSHeapSize?: number } }).memory;
    if (memory?.jsHeapSizeLimit && memory?.usedJSHeapSize) {
      const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize;
      return availableMemory < 50 * 1024 * 1024; // 50MB
    }
  }

  if ('connection' in navigator) {
    const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    return connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
  }

  return false;
}

/**
 * Gets performance optimization recommendations
 */
export function getPerformanceRecommendations(): string[] {
  const recommendations: string[] = [];

  if (isResourceLimitedDevice()) {
    recommendations.push('Enable aggressive lazy loading');
    recommendations.push('Reduce chunk sizes');
    recommendations.push('Enable virtual scrolling');
    recommendations.push('Disable non-essential features');
  }

  if ('connection' in navigator) {
    const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
      recommendations.push('Enable offline caching');
      recommendations.push('Reduce image quality');
      recommendations.push('Use compressed assets');
    }
  }

  return recommendations;
}

// ============================================================================
// PERFORMANCE OPTIMIZATION HOOKS
// ============================================================================

/**
 * Hook for performance optimization
 */
export function usePerformanceOptimization() {
  const [isEnabled, setIsEnabled] = useState(isPerformanceOptimizationEnabled());
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    setRecommendations(getPerformanceRecommendations());
  }, []);

  const enableOptimizations = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableOptimizations = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const toggleOptimizations = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  return {
    isEnabled,
    recommendations,
    enableOptimizations,
    disableOptimizations,
    toggleOptimizations,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  performanceConfig,
  isPerformanceOptimizationEnabled,
  getOptimalChunkSize,
  getOptimalDebounceDelay,
  getOptimalThrottleDelay,
  isResourceLimitedDevice,
  getPerformanceRecommendations,
  usePerformanceOptimization,
};
