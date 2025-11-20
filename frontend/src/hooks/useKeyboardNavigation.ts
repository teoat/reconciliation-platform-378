/**
 * Keyboard Navigation Hook
 * Provides keyboard navigation support for accessibility
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for keyboard navigation
 * Handles arrow keys, enter, escape, and other navigation keys
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    enabled = true,
    preventDefault = true,
  } = options;

  const handlersRef = useRef({
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
  });

  // Update handlers ref when options change
  useEffect(() => {
    handlersRef.current = {
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onEnter,
      onEscape,
      onTab,
      onHome,
      onEnd,
      onPageUp,
      onPageDown,
    };
  }, [
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
  ]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { current: handlers } = handlersRef;

      switch (event.key) {
        case 'ArrowUp':
          if (preventDefault) event.preventDefault();
          handlers.onArrowUp?.();
          break;
        case 'ArrowDown':
          if (preventDefault) event.preventDefault();
          handlers.onArrowDown?.();
          break;
        case 'ArrowLeft':
          if (preventDefault) event.preventDefault();
          handlers.onArrowLeft?.();
          break;
        case 'ArrowRight':
          if (preventDefault) event.preventDefault();
          handlers.onArrowRight?.();
          break;
        case 'Enter':
          if (preventDefault) event.preventDefault();
          handlers.onEnter?.();
          break;
        case 'Escape':
          if (preventDefault) event.preventDefault();
          handlers.onEscape?.();
          break;
        case 'Tab':
          handlers.onTab?.();
          break;
        case 'Home':
          if (preventDefault) event.preventDefault();
          handlers.onHome?.();
          break;
        case 'End':
          if (preventDefault) event.preventDefault();
          handlers.onEnd?.();
          break;
        case 'PageUp':
          if (preventDefault) event.preventDefault();
          handlers.onPageUp?.();
          break;
        case 'PageDown':
          if (preventDefault) event.preventDefault();
          handlers.onPageDown?.();
          break;
      }
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
}
