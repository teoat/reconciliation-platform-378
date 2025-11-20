//! Common Performance Utilities
//!
//! Single source of truth for performance utilities like debounce and throttle.
//! This consolidates duplicate implementations from performance.ts and performanceMonitoring.tsx

/**
 * Debounces a function call, delaying execution until after wait time has passed
 * since the last invocation.
 *
 * @param func - The function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * // Call multiple times, only executes after 300ms of inactivity
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this executes
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    if (typeof timeout !== 'undefined') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call, limiting execution to at most once per limit period.
 *
 * @param func - The function to throttle
 * @param limit - Time limit in milliseconds between executions
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   handleScroll();
 * }, 100);
 *
 * // Even if called 100 times in 100ms, only executes once
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return (...args: Parameters<T>): ReturnType<T> => {
    if (!inThrottle) {
      lastResult = func(...args) as ReturnType<T>;
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
}
