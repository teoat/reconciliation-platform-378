/**
// Simple logger stub until proper import is fixed
const logger = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

/**
 * Performance Optimization Hooks
 * 
 * Reusable hooks for optimizing React component performance
 * Use these to prevent unnecessary re-renders and improve app responsiveness
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Stable callback hook - creates a callback that never changes reference
 * but always uses the latest values
 *
 * Use when passing callbacks to memoized child components
 *
 * @example
 * const handleClick = useStableCallback((id: number) => {
 *   doSomething(id, latestState);
 * });
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}

/**
 * Debounced value hook - delays updating a value until after a delay
 *
 * Use for search inputs, filtering, or any rapid-change value
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * NOTE: Re-exported from useDebounce.ts (SSOT)
 */
export { useDebounce } from './useDebounce';

/**
 * Throttled callback hook - limits how often a function can be called
 *
 * Use for scroll handlers, resize handlers, or frequently-fired events
 *
 * @example
 * const handleScroll = useThrottle(() => {
 *   // Handle scroll
 * }, 100);
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memoized list item hook - optimizes rendering of list items
 *
 * Use when rendering large lists to prevent re-renders
 *
 * @example
 * const items = useMemoizedList(rawItems, item => item.id);
 */
export function useMemoizedList<T>(items: T[], keyExtractor: (item: T) => string | number): T[] {
  return useMemo(() => items, [items.length, items.map(keyExtractor).join(',')]);
}

/**
 * Stable handlers hook - creates an object of stable callback references
 *
 * Use when passing multiple handlers to child components
 *
 * @example
 * const handlers = useStableHandlers({
 *   onEdit: (id) => editItem(id),
 *   onDelete: (id) => deleteItem(id),
 * });
 */
export function useStableHandlers<T extends Record<string, (...args: unknown[]) => unknown>>(
  handlers: T
): T {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  return useMemo(() => {
    const stableHandlers = {} as T;

    Object.keys(handlers).forEach((key) => {
      stableHandlers[key as keyof T] = ((...args: unknown[]) =>
        handlersRef.current[key as keyof T](...args)) as T[keyof T];
    });

    return stableHandlers;
  }, [Object.keys(handlers).join(',')]);
}

/**
 * Previous value hook - gets the previous value of a prop or state
 *
 * Use for comparing with current value or animations
 *
 * @example
 * const prevCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Lazy state hook - defers state updates until component is idle
 *
 * Use for non-critical state updates
 *
 * @example
 * const [status, setStatus] = useLazyState('idle');
 */
export function useLazyState<T>(initialValue: T): [T, (value: T) => void] {
  const [state, setState] = useState(initialValue);
  const pendingRef = useRef<T | null>(null);

  useEffect(() => {
    if (pendingRef.current !== null) {
      const value = pendingRef.current;
      pendingRef.current = null;

      // Use requestIdleCallback if available, fallback to setTimeout
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setState(value));
      } else {
        setTimeout(() => setState(value), 0);
      }
    }
  });

  const setLazyState = useCallback((value: T) => {
    pendingRef.current = value;
  }, []);

  return [state, setLazyState];
}

// Import useState for hooks that need it
import { useState } from 'react';

/**
 * Performance measurement hook - measures component render time
 *
 * Use in development to identify slow components
 *
 * @example
 * usePerformanceMeasure('MyComponent');
 */
export function usePerformanceMeasure(componentName: string): void {
  if (!import.meta.env.DEV) return;

  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (renderTime > 16) {
      // Slower than 60fps
      console.warn(
        `[Performance] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });
}

/**
 * Batch state updates hook - batches multiple state updates
 *
 * Use when updating multiple related state values
 *
 * @example
 * const [state, batchUpdate] = useBatchState({
 *   name: '',
 *   email: '',
 *   phone: ''
 * });
 *
 * batchUpdate({ name: 'John', email: 'john@example.com' });
 */
export function useBatchState<T extends Record<string, unknown>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState(initialState);

  const batchUpdate = useCallback((updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, batchUpdate];
}
