// Performance Optimization Utilities
// Implements advanced memoization, debouncing, and performance monitoring

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { logger } from '../services/logger';

// ============================================================================
// ADVANCED MEMOIZATION UTILITIES
// ============================================================================

/**
 * Deep comparison memoization hook
 * More efficient than React.memo for complex objects
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const prevDeps = useRef<React.DependencyList>();
  const prevResult = useRef<T>();

  const depsChanged =
    !prevDeps.current ||
    deps.length !== prevDeps.current.length ||
    deps.some((dep, index) => !Object.is(dep, prevDeps.current![index]));

  if (depsChanged) {
    prevDeps.current = deps;
    prevResult.current = factory();
  }

  return prevResult.current!;
}

/**
 * Memoized callback with deep dependency comparison
 */
export function useDeepCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  return useDeepMemo(() => useCallback(callback, deps), deps);
}

/**
 * Selective memoization - only memoizes if condition is met
 */
export function useConditionalMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  condition: boolean
): T {
  const prevResult = useRef<T>();

  if (condition) {
    return useMemo(factory, deps);
  }

  if (prevResult.current === undefined) {
    prevResult.current = factory();
  }

  return prevResult.current;
}

// ============================================================================
// DEBOUNCING AND THROTTLING
// ============================================================================

/**
 * Advanced debouncing with immediate execution option
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: { immediate?: boolean; maxWait?: number } = {}
): T {
  const { immediate = false, maxWait } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef<number>();
  const lastResultRef = useRef<any>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (immediate && !lastCallRef.current) {
        lastResultRef.current = callback(...args);
        lastCallRef.current = now;
      }

      if (maxWait && (!lastCallRef.current || now - lastCallRef.current >= maxWait)) {
        lastResultRef.current = callback(...args);
        lastCallRef.current = now;
        if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      } else {
        timeoutRef.current = setTimeout(() => {
          if (!immediate || now - (lastCallRef.current || 0) >= delay) {
            lastResultRef.current = callback(...args);
          }
          lastCallRef.current = now;
        }, delay);

        if (maxWait && !maxTimeoutRef.current) {
          maxTimeoutRef.current = setTimeout(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            lastResultRef.current = callback(...args);
            lastCallRef.current = now;
          }, maxWait);
        }
      }

      return lastResultRef.current;
    },
    [callback, delay, immediate, maxWait]
  ) as T;
}

/**
 * Throttling hook with leading/trailing edge options
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true }
): T {
  const { leading = true, trailing = true } = options;
  const lastCallRef = useRef<number>();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastResultRef = useRef<any>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (!lastCallRef.current || now - lastCallRef.current >= delay) {
        if (leading) {
          lastResultRef.current = callback(...args);
          lastCallRef.current = now;
        } else if (trailing) {
          lastCallRef.current = now;
          timeoutRef.current = setTimeout(() => {
            lastResultRef.current = callback(...args);
          }, delay);
        }
      } else if (trailing && !timeoutRef.current) {
        timeoutRef.current = setTimeout(
          () => {
            lastResultRef.current = callback(...args);
            lastCallRef.current = now;
          },
          delay - (now - lastCallRef.current)
        );
      }

      return lastResultRef.current;
    },
    [callback, delay, leading, trailing]
  ) as T;
}

// ============================================================================
// VIRTUALIZATION HELPERS
// ============================================================================

/**
 * Efficient list virtualization calculator
 */
export function useVirtualization<T>({
  items,
  itemHeight,
  containerHeight,
  scrollTop = 0,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  scrollTop?: number;
  overscan?: number;
}) {
  return useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

    return {
      totalHeight,
      visibleItems: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance measurement hook
 */
export function usePerformanceMeasure(name: string, enabled = true) {
  const startTimeRef = useRef<number>();

  const start = useCallback(() => {
    if (enabled && typeof performance !== 'undefined') {
      startTimeRef.current = performance.now();
    }
  }, [enabled]);

  const end = useCallback(() => {
    if (enabled && startTimeRef.current && typeof performance !== 'undefined') {
      const duration = performance.now() - startTimeRef.current;
      logger.logPerformance(name, duration, { component: 'performance-hook' });
      return duration;
    }
    return 0;
  }, [enabled, name]);

  const measure = useCallback(
    async <T>(operation: () => T | Promise<T>): Promise<T> => {
      start();
      try {
        const result = await operation();
        end();
        return result;
      } catch (error) {
        end();
        throw error;
      }
    },
    [start, end]
  );

  return { start, end, measure };
}

/**
 * Component render performance tracker
 */
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>();

  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();

    if (lastRenderTimeRef.current) {
      const timeSinceLastRender = now - lastRenderTimeRef.current;
      logger.logPerformance(`${componentName}-render`, timeSinceLastRender, {
        renderCount: renderCountRef.current,
        component: componentName,
      });
    }

    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
    componentName,
  };
}

// ============================================================================
// MEMORY OPTIMIZATION
// ============================================================================

/**
 * Efficient state updates with batched operations
 */
export function useBatchedState<T extends Record<string, unknown>>(initialState: T) {
  const [state, setState] = useState(initialState);
  const batchedUpdatesRef = useRef<Partial<T>[]>([]);

  const batchUpdate = useCallback((update: Partial<T>) => {
    batchedUpdatesRef.current.push(update);

    // Debounce the actual state update
    setTimeout(() => {
      if (batchedUpdatesRef.current.length > 0) {
        setState((prevState) => {
          const updates = batchedUpdatesRef.current;
          batchedUpdatesRef.current = [];
          return { ...prevState, ...updates.reduce((acc, update) => ({ ...acc, ...update }), {}) };
        });
      }
    }, 0);
  }, []);

  const flush = useCallback(() => {
    if (batchedUpdatesRef.current.length > 0) {
      setState((prevState) => ({
        ...prevState,
        ...batchedUpdatesRef.current.reduce((acc, update) => ({ ...acc, ...update }), {}),
      }));
      batchedUpdatesRef.current = [];
    }
  }, []);

  return [state, batchUpdate, flush] as const;
}

/**
 * Memory-efficient event handlers
 */
export function useEventHandlers<T extends Record<string, (...args: unknown[]) => unknown>>(
  handlers: T
): T {
  return useMemo(() => handlers, Object.values(handlers));
}

// ============================================================================
// LAZY LOADING OPTIMIZATIONS
// ============================================================================

/**
 * Intelligent lazy loading with intersection observer
 */
export function useLazyLoad(options: IntersectionObserverInit = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<Element | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px', ...options }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasBeenVisible, options]);

  return { ref: elementRef, isVisible, hasBeenVisible };
}

/**
 * Preload resources based on user interaction patterns
 */
export function useResourcePreloader() {
  const preloadedRef = useRef<Set<string>>(new Set());

  const preload = useCallback(
    (url: string, as: 'script' | 'style' | 'image' | 'font' = 'script') => {
      if (preloadedRef.current.has(url)) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = as;
      link.href = url;
      link.crossOrigin = 'anonymous';

      document.head.appendChild(link);
      preloadedRef.current.add(url);

      link.onload = () => logger.logPerformance('resource-preload', 0, { url, as });
    },
    []
  );

  const preloadComponent = useCallback(async (importFn: () => Promise<any>) => {
    try {
      await importFn();
      logger.logPerformance('component-preload', 0, { success: true });
    } catch (error) {
      logger.error('Component preload failed', { error });
    }
  }, []);

  return { preload, preloadComponent };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const performanceUtils = {
  useDeepMemo,
  useDeepCallback,
  useConditionalMemo,
  useDebounce,
  useThrottle,
  useVirtualization,
  usePerformanceMeasure,
  useRenderPerformance,
  useBatchedState,
  useEventHandlers,
  useLazyLoad,
  useResourcePreloader,
};

export default performanceUtils;
