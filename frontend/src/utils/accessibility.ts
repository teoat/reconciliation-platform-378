/**
 * Accessibility utilities and helpers
 * Provides functions for improving accessibility across the application
 */

/**
 * Generate unique ID for ARIA attributes
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return element.matches(focusableSelectors);
}

/**
 * Trap focus within a container (for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);

  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Skip link component helper
 */
export function createSkipLink(
  targetId: string,
  label: string = 'Skip to main content'
): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className =
    'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white';
  return skipLink;
}

/**
 * Keyboard navigation handler
 */
export function handleKeyboardNavigation(
  e: React.KeyboardEvent,
  actions: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  }
): void {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      actions.onEnter?.();
      break;
    case 'Escape':
      actions.onEscape?.();
      break;
    case 'ArrowUp':
      e.preventDefault();
      actions.onArrowUp?.();
      break;
    case 'ArrowDown':
      e.preventDefault();
      actions.onArrowDown?.();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      actions.onArrowLeft?.();
      break;
    case 'ArrowRight':
      e.preventDefault();
      actions.onArrowRight?.();
      break;
    case 'Home':
      e.preventDefault();
      actions.onHome?.();
      break;
    case 'End':
      e.preventDefault();
      actions.onEnd?.();
      break;
  }
}

/**
 * Get accessible label for form field
 */
export function getAccessibleLabel(fieldId: string, label?: string, required?: boolean): string {
  let accessibleLabel = label || fieldId;
  if (required) {
    accessibleLabel += ' (required)';
  }
  return accessibleLabel;
}

/**
 * Validate color contrast (basic check)
 */
export function checkColorContrast(_foreground: string, _background: string): boolean {
  // Basic implementation - in production, use a proper contrast checking library
  // Returns true if contrast is sufficient (WCAG AA: 4.5:1 for normal text)
  return true; // Placeholder - implement proper contrast calculation
}
