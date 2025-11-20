/**
 * useAccessibility Hook
 * Provides accessibility utilities and helpers for components
 */

import { useEffect, useRef, useCallback } from 'react';
import { announceToScreenReader, trapFocus } from '../utils/accessibility';

/**
 * Hook for managing focus trap (useful for modals)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      cleanupRef.current = trapFocus(containerRef.current);
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReaderAnnouncement() {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(handlers: {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          handlers.onEnter?.();
          break;
        case 'Escape':
          handlers.onEscape?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlers.onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.onArrowDown?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlers.onArrowLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handlers.onArrowRight?.();
          break;
        case 'Home':
          e.preventDefault();
          handlers.onHome?.();
          break;
        case 'End':
          e.preventDefault();
          handlers.onEnd?.();
          break;
      }
    },
    [handlers]
  );
}

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
  const announce = useScreenReaderAnnouncement();

  return useCallback(
    (message: string) => {
      announce(message, priority);
    },
    [announce, priority]
  );
}
