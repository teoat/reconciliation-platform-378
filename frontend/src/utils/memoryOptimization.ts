//! Memory Optimization Utilities
//! Provides utilities for memory leak prevention, efficient data structures, and memory monitoring

import { useEffect, useRef, useCallback, RefObject } from 'react';
import { logger } from '@/services/logger';

// ============================================================================
// MEMORY MONITORING
// ============================================================================

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Chrome-specific Performance Memory API
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface PerformanceMark {
  mark(name: string, detail?: Record<string, unknown>): void;
}

/**
 * Get current memory usage (if available)
 */
export function getMemoryUsage(): MemoryInfo | null {
  const perfWithMemory = performance as PerformanceWithMemory;
  if (perfWithMemory.memory) {
    const memory = perfWithMemory.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize || 0,
      totalJSHeapSize: memory.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
    };
  }
  return null;
}

/**
 * Monitor memory usage and log warnings if memory is high
 */
export function monitorMemoryUsage(thresholdMB: number = 150): void {
  const memoryInfo = getMemoryUsage();
  if (memoryInfo) {
    const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
    const limitMB = memoryInfo.jsHeapSizeLimit / (1024 * 1024);
    const usagePercent = (usedMB / limitMB) * 100;

    if (usedMB > thresholdMB) {
      logger.warning(
        `High memory usage: ${usedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}% of limit)`,
        {
          usedMB,
          limitMB,
          usagePercent,
        }
      );
    }

    // Log memory metrics
    const perfWithMark = window.performance as Performance & Partial<PerformanceMark>;
    if (perfWithMark.mark) {
      perfWithMark.mark('memory-check', {
        usedMB,
        limitMB,
        usagePercent,
      });
    }
  }
}

// ============================================================================
// MEMORY LEAK PREVENTION
// ============================================================================

/**
 * Hook to cleanup resources on unmount to prevent memory leaks
 */
export function useMemoryCleanup(cleanupFn: () => void, deps: React.DependencyList = []): void {
  useEffect(() => {
    return cleanupFn;
  }, deps);
}

/**
 * Hook to cleanup subscriptions, timers, and event listeners
 */
export function useComprehensiveCleanup() {
  const timersRef = useRef<Set<NodeJS.Timeout | number>>(new Set());
  const subscriptionsRef = useRef<Set<() => void>>(new Set());
  const listenersRef = useRef<
    Array<{
      element: HTMLElement | Window | Document;
      event: string;
      handler: EventListener;
      options?: boolean | AddEventListenerOptions;
    }>
  >([]);

  const addTimer = useCallback((timer: NodeJS.Timeout | number) => {
    timersRef.current.add(timer);
    return timer;
  }, []);

  const addSubscription = useCallback((unsubscribe: () => void) => {
    subscriptionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  const addEventListener = useCallback(
    (
      element: HTMLElement | Window | Document,
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      element.addEventListener(event, handler, options);
      listenersRef.current.push({ element, event, handler, options });
    },
    []
  );

  useEffect(() => {
    return () => {
      // Clear all timers
      timersRef.current.forEach((timer) => {
        clearTimeout(timer as number);
        clearInterval(timer as number);
      });
      timersRef.current.clear();

      // Unsubscribe from all subscriptions
      subscriptionsRef.current.forEach((unsubscribe) => unsubscribe());
      subscriptionsRef.current.clear();

      // Remove all event listeners
      listenersRef.current.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      listenersRef.current = [];
    };
  }, []);

  return { addTimer, addSubscription, addEventListener };
}

/**
 * Hook to cleanup large data structures on unmount
 */
export function useDataCleanup<T, K = unknown, V = unknown>(
  dataRef: RefObject<T[] | Map<K, V> | Set<K>>
): void {
  useEffect(() => {
    return () => {
      if (dataRef.current) {
        if (Array.isArray(dataRef.current)) {
          dataRef.current.length = 0;
        } else if (dataRef.current instanceof Map || dataRef.current instanceof Set) {
          dataRef.current.clear();
        }
      }
    };
  }, [dataRef]);
}

// ============================================================================
// EFFICIENT DATA STRUCTURES
// ============================================================================

/**
 * Circular buffer to limit memory usage for history tracking
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private maxSize: number;
  private head: number = 0;
  private size: number = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.maxSize;
    if (this.size < this.maxSize) {
      this.size++;
    }
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) {
      return undefined;
    }
    const actualIndex = (this.head - this.size + index + this.maxSize) % this.maxSize;
    return this.buffer[actualIndex];
  }

  getAll(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  clear(): void {
    this.buffer = new Array(this.maxSize);
    this.head = 0;
    this.size = 0;
  }

  get length(): number {
    return this.size;
  }
}

/**
 * Memory-efficient map that automatically removes oldest entries
 */
export class LRUMap<K, V> {
  private map: Map<K, V>;
  private maxSize: number;
  private accessOrder: K[];

  constructor(maxSize: number = 1000) {
    this.map = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    // Update access order
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);

    this.map.set(key, value);
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      // Update access order
      const index = this.accessOrder.indexOf(key);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
        this.accessOrder.push(key);
      }
    }
    return value;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
    this.accessOrder = [];
  }

  get size(): number {
    return this.map.size;
  }
}

// ============================================================================
// COMPONENT MEMORY OPTIMIZATION
// ============================================================================

/**
 * Hook to limit component memory usage by throttling updates
 */
export function useMemoryEfficientState<T>(
  initialState: T,
  maxUpdatesPerSecond: number = 60
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = React.useState<T>(initialState);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<T | ((prev: T) => T) | null>(null);

  const setStateThrottled = useCallback(
    (value: T | ((prev: T) => T)) => {
      const now = Date.now();
      const minInterval = 1000 / maxUpdatesPerSecond;

      if (now - lastUpdateRef.current >= minInterval) {
        lastUpdateRef.current = now;
        setState(value);
        pendingUpdateRef.current = null;
      } else {
        pendingUpdateRef.current = value;
      }
    },
    [maxUpdatesPerSecond]
  );

  // Process pending updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingUpdateRef.current !== null) {
        const now = Date.now();
        if (now - lastUpdateRef.current >= 1000 / maxUpdatesPerSecond) {
          lastUpdateRef.current = now;
          setState(pendingUpdateRef.current);
          pendingUpdateRef.current = null;
        }
      }
    }, 1000 / maxUpdatesPerSecond);

    return () => clearInterval(interval);
  }, [maxUpdatesPerSecond]);

  return [state, setStateThrottled];
}

/**
 * Debounce function to reduce memory churn from rapid updates
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// AUTOMATIC MEMORY MONITORING
// ============================================================================

/**
 * Initialize automatic memory monitoring
 */
export function initializeMemoryMonitoring(intervalMs: number = 30000): () => void {
  const interval = setInterval(() => {
    monitorMemoryUsage(150); // Warn if >150MB
  }, intervalMs);

  return () => clearInterval(interval);
}

/**
 * Cleanup utility for components
 */
export function createCleanupManager() {
  const cleanupFunctions: Array<() => void> = [];

  return {
    add(fn: () => void) {
      cleanupFunctions.push(fn);
    },
    cleanup() {
      cleanupFunctions.forEach((fn) => fn());
      cleanupFunctions.length = 0;
    },
  };
}

import React from 'react';

export default {
  getMemoryUsage,
  monitorMemoryUsage,
  useMemoryCleanup,
  useComprehensiveCleanup,
  useDataCleanup,
  CircularBuffer,
  LRUMap,
  useMemoryEfficientState,
  useDebounce,
};
