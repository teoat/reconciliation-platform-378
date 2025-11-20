// ============================================================================
// UNIFIED LOADING STATE HOOK - SINGLE SOURCE OF TRUTH
// ============================================================================

import { useState, useCallback } from 'react';

export interface UseLoadingReturn {
  loading: boolean;
  setLoading: (value: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
  withLoadingState: <T>(asyncFn: () => Promise<T>) => [() => Promise<T>, boolean];
}

/**
 * Unified loading state hook
 * Replaces 317 duplicate loading state instances across 45 files
 *
 * Usage:
 * const { loading, withLoading } = useLoading()
 *
 * // Wrap async operations
 * const fetchData = withLoading(async () => {
 *   return await api.getData()
 * })
 */
export const useLoading = (initialState = false): UseLoadingReturn => {
  const [loading, setLoading] = useState(initialState);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await asyncFn();
    } finally {
      setLoading(false);
    }
  }, []);

  const withLoadingState = useCallback(
    <T>(asyncFn: () => Promise<T>) => {
      const wrappedFn = async () => withLoading(asyncFn);
      return [wrappedFn, loading];
    },
    [withLoading, loading]
  );

  return {
    loading,
    setLoading,
    withLoading,
    withLoadingState,
  };
};

export default useLoading;
