// ============================================================================
import { logger } from '@/services/logger';
// PERFORMANCE HOOKS - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * @deprecated This is just a wrapper around useCallback. Use useCallback directly instead.
 * For stable callbacks that don't change reference, use useStableCallback from usePerformanceOptimizations.ts
 * 
 * Migration:
 * - Old: useMemoizedCallback(callback, deps)
 * - New: useCallback(callback, deps)
 */
export const useMemoizedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

export const useMemoizedValue = <T>(value: T, deps: React.DependencyList): T => {
  return useMemo(() => value, deps);
};

export const useRenderCount = () => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  return renderCount.current;
};

export const useWhyDidYouUpdate = (name: string, props: Record<string, unknown>) => {
  const previous = useRef<Record<string, unknown>>();

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach((key) => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        logger.info('[why-did-you-update]', name, changedProps);
      }
    }

    previous.current = props;
  });
};
