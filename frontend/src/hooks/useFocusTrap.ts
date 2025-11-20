import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook for trapping focus within a container element
 * Useful for modals, dialogs, and other focus-contained components
 *
 * @param isActive - Whether focus trapping is active
 * @returns Ref to attach to the container element
 *
 * @example
 * ```tsx
 * const modalRef = useFocusTrap(isOpen)
 *
 * return (
 *   <div ref={modalRef}>
 *     <button>First</button>
 *     <button>Last</button>
 *   </div>
 * )
 * ```
 */
export const useFocusTrap = (isActive: boolean): RefObject<HTMLElement> => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Save currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'button',
        '[href]',
        'input',
        'select',
        'textarea',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute('disabled') && !el.hasAttribute('aria-hidden')
      );
    };

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    // Handle Tab key
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      const currentFocus = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab: focus previous element
        if (currentFocus === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: focus next element
        if (currentFocus === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Optionally close modal/dialog
        // This is handled by the component using the hook
      }
    };

    container.addEventListener('keydown', handleTab);
    container.addEventListener('keydown', handleEscape);

    return () => {
      container.removeEventListener('keydown', handleTab);
      container.removeEventListener('keydown', handleEscape);

      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};
