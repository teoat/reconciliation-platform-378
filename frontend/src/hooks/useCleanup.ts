// Custom hook for component cleanup
import { useEffect, RefObject } from 'react';

interface CleanupConfig {
  timers?: boolean;
  subscriptions?: boolean;
  stateCleanup?: boolean;
}

/**
 * Hook to automatically clean up resources on component unmount
 * Prevents memory leaks and stale state
 */
export function useCleanup(
  cleanupFn: () => void | (() => void),
  deps: React.DependencyList = [],
  config: CleanupConfig = { timers: true, subscriptions: true, stateCleanup: true }
) {
  useEffect(() => {
    // Execute cleanup function on unmount
    return cleanupFn as () => void;
  }, deps);
}

/**
 * Hook to clean up timers (setTimeout, setInterval) on unmount
 */
export function useTimerCleanup() {
  useEffect(() => {
    return () => {
      // Clear all timers on unmount
      // Note: This is best effort - maintain timer references explicitly
      const highestId = setTimeout(() => {}, 0) as any;
      for (let i = 0; i < highestId; i++) {
        clearTimeout(i);
      }
    };
  }, []);
}

/**
 * Hook to cleanup event listeners on unmount
 */
export function useEventListener<T extends HTMLElement>(
  target: RefObject<T>,
  eventType: string,
  handler: (event: Event) => void,
  options: AddEventListenerOptions = {}
) {
  useEffect(() => {
    const element = target.current;
    if (!element) return;

    element.addEventListener(eventType, handler, options);

    return () => {
      element.removeEventListener(eventType, handler, options);
    };
  }, [target, eventType, handler, options]);
}

/**
 * Hook to cleanup WebSocket connections on unmount
 */
export function useWebSocketCleanup(ws: WebSocket | null) {
  useEffect(() => {
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [ws]);
}

/**
 * Hook to cleanup API cancellations on unmount
 */
export function useAbortController() {
  useEffect(() => {
    const controller = new AbortController();
    return () => {
      controller.abort();
    };
  }, []);
}
