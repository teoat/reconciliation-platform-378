// Stale-While-Revalidate Pattern Hook
// Ensures old data remains visible during refetch, preventing data flicker

import { useState, useEffect, useCallback } from 'react';

interface UseStaleWhileRevalidateOptions<T> {
  queryFn: () => Promise<T>;
  queryKey: string;
  staleTime?: number;
  cacheTime?: number;
  enabled?: boolean;
}

/**
 * Stale-While-Revalidate Hook
 *
 * Provides stale data immediately while fetching fresh data in background
 * Prevents blank states and data flicker during refetch
 *
 * @example
 * const { data, isFetching, isStale } = useStaleWhileRevalidate({
 *   queryFn: () => fetchProjects(),
 *   queryKey: 'projects'
 * })
 */
export function useStaleWhileRevalidate<T>({
  queryFn,
  queryKey,
  staleTime = 5 * 60 * 1000, // 5 minutes
  cacheTime = 10 * 60 * 1000, // 10 minutes
  enabled = true,
}: UseStaleWhileRevalidateOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Check if data is stale
  const checkStaleness = useCallback(() => {
    if (!lastFetched) return false;
    const now = Date.now();
    return now - lastFetched > staleTime;
  }, [lastFetched, staleTime]);

  // Fetch data
  const fetchData = useCallback(
    async (showOldData = true) => {
      try {
        // Keep old data visible while fetching
        if (showOldData) {
          setIsFetching(true);
        } else {
          setIsLoading(true);
        }

        const result = await queryFn();

        setData(result);
        setIsLoading(false);
        setIsFetching(false);
        setError(null);
        setLastFetched(Date.now());
        setIsStale(false);
      } catch (err) {
        setIsLoading(false);
        setIsFetching(false);
        setError(err instanceof Error ? err : new Error('Unknown error'));

        // Don't clear data on error - keep showing stale data
        if (!data) {
          setData(null);
        }
      }
    },
    [queryFn, data]
  );

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    const existingData = sessionStorage.getItem(`swr_cache_${queryKey}`);
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        const { data: cachedData, timestamp } = parsed;

        // Check if cached data is still valid
        if (Date.now() - timestamp < cacheTime) {
          setData(cachedData);
          setLastFetched(timestamp);
          setIsLoading(false);

          // Mark as stale if beyond staleTime
          if (Date.now() - timestamp > staleTime) {
            setIsStale(true);
            // Refetch in background
            fetchData(true);
          }

          return;
        }
      } catch (e) {
        // Invalid cache, fetch fresh data
      }
    }

    fetchData(false);
  }, [enabled]);

  // Cache data changes
  useEffect(() => {
    if (data !== null) {
      sessionStorage.setItem(
        `swr_cache_${queryKey}`,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    }
  }, [data, queryKey]);

  // Automatic refetch on window focus if stale
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      if (checkStaleness()) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enabled, checkStaleness, fetchData]);

  // Manual refetch
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cache
  const clear = useCallback(() => {
    sessionStorage.removeItem(`swr_cache_${queryKey}`);
    setData(null);
    setIsStale(false);
  }, [queryKey]);

  return {
    data,
    isLoading,
    isFetching,
    isStale,
    error,
    refetch,
    clear,
    lastFetched,
  };
}

export default useStaleWhileRevalidate;
