// Performance Optimization Hooks and Components
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { performanceService, PerformanceMetrics, BundleAnalysis } from '../services/performanceService';

// Performance Monitoring Hook
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    performanceService.on('metrics_updated', setMetrics);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    performanceService.off('metrics_updated', setMetrics);
  }, []);

  const getCurrentMetrics = useCallback(() => {
    return performanceService.getMetrics();
  }, []);

  useEffect(() => {
    return () => {
      performanceService.off('metrics_updated', setMetrics);
    };
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getCurrentMetrics,
  };
};

// Cache Management Hook
export const useCache = (strategy: 'memory' | 'localStorage' | 'sessionStorage' = 'memory') => {
  const setCache = useCallback((key: string, data: any, ttl?: number) => {
    switch (strategy) {
      case 'memory':
        performanceService.setCache(key, data, ttl);
        break;
      case 'localStorage':
        performanceService.setLocalCache(key, data, ttl);
        break;
      case 'sessionStorage':
        performanceService.setSessionCache(key, data, ttl);
        break;
    }
  }, [strategy]);

  const getCache = useCallback((key: string) => {
    switch (strategy) {
      case 'memory':
        return performanceService.getCache(key);
      case 'localStorage':
        return performanceService.getLocalCache(key);
      case 'sessionStorage':
        return performanceService.getSessionCache(key);
      default:
        return null;
    }
  }, [strategy]);

  const clearCache = useCallback((key?: string) => {
    if (strategy === 'memory') {
      performanceService.clearCache(key);
    } else {
      // For localStorage and sessionStorage, we'd need to implement key-specific clearing
      if (key) {
        const storage = strategy === 'localStorage' ? localStorage : sessionStorage;
        storage.removeItem(`cache_${key}`);
      }
    }
  }, [strategy]);

  return {
    setCache,
    getCache,
    clearCache,
  };
};

// Lazy Loading Hook
export const useLazyLoad = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, hasLoaded]);

  return { ref, isVisible, hasLoaded };
};

// Debounced Hook
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled Hook
export const useThrottle = <T,>(value: T, delay: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
};

// Memoized Component Hook
export const useMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  props: P,
  deps: React.DependencyList
) => {
  return useMemo(() => <Component {...props} />, deps);
};

// Virtual Scrolling Hook
export const useVirtualScroll = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    return { start: Math.max(0, start - overscan), end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

// Performance Dashboard Component
export const PerformanceDashboard: React.FC = () => {
  const { metrics, isMonitoring, startMonitoring, stopMonitoring } = usePerformanceMonitoring();
  const [bundleAnalysis, setBundleAnalysis] = useState<BundleAnalysis | null>(null);

  useEffect(() => {
    setBundleAnalysis(performanceService.getBundleAnalysis());
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Dashboard</h3>
        <div className="text-center text-gray-500">
          <p>No performance data available</p>
          <button
            onClick={startMonitoring}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Start Monitoring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Dashboard</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isMonitoring ? 'Monitoring' : 'Stopped'}
          </span>
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {isMonitoring ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Web Vitals */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Core Web Vitals</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">First Contentful Paint</span>
                <span className={`text-sm font-medium ${getScoreColor(metrics.firstContentfulPaint < 1800 ? 90 : 50)}`}>
                  {Math.round(metrics.firstContentfulPaint)}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${metrics.firstContentfulPaint < 1800 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min(100, (metrics.firstContentfulPaint / 3000) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Largest Contentful Paint</span>
                <span className={`text-sm font-medium ${getScoreColor(metrics.largestContentfulPaint < 2500 ? 90 : 50)}`}>
                  {Math.round(metrics.largestContentfulPaint)}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${metrics.largestContentfulPaint < 2500 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min(100, (metrics.largestContentfulPaint / 4000) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">First Input Delay</span>
                <span className={`text-sm font-medium ${getScoreColor(metrics.firstInputDelay < 100 ? 90 : 50)}`}>
                  {Math.round(metrics.firstInputDelay)}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${metrics.firstInputDelay < 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min(100, (metrics.firstInputDelay / 300) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Cumulative Layout Shift</span>
                <span className={`text-sm font-medium ${getScoreColor(metrics.cumulativeLayoutShift < 0.1 ? 90 : 50)}`}>
                  {metrics.cumulativeLayoutShift.toFixed(3)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${metrics.cumulativeLayoutShift < 0.1 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min(100, (metrics.cumulativeLayoutShift / 0.25) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Performance Metrics</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.memoryUsage.toFixed(1)} MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bundle Size</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.bundleSize.toFixed(1)} KB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.apiResponseTime.toFixed(0)} ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cache Hit Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {(metrics.cacheHitRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Bundle Analysis */}
        {bundleAnalysis && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Bundle Analysis</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Size</span>
                <span className="text-sm font-medium text-gray-900">
                  {bundleAnalysis.totalSize.toFixed(1)} KB
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gzipped Size</span>
                <span className="text-sm font-medium text-gray-900">
                  {bundleAnalysis.gzippedSize.toFixed(1)} KB
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Compression Ratio</span>
                <span className="text-sm font-medium text-gray-900">
                  {((1 - bundleAnalysis.gzippedSize / bundleAnalysis.totalSize) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Chunks</span>
                <span className="text-sm font-medium text-gray-900">
                  {bundleAnalysis.chunks.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Lazy Loaded Image Component
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className, placeholder }) => {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <img src={src} alt={alt} className={className} />
      ) : (
        <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
          {placeholder || 'Loading...'}
        </div>
      )}
    </div>
  );
};

// Virtual List Component
export const VirtualList: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}> = ({ items, itemHeight, containerHeight, renderItem }) => {
  const { visibleItems, totalHeight, offsetY, setScrollTop } = useVirtualScroll(
    items,
    itemHeight,
    containerHeight
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Debounced Input Component
export const DebouncedInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, delay = 300, placeholder, className }) => {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, delay);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};