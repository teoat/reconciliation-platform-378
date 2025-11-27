/**
 * Keyboard shortcut handlers
 */

import type { KeyboardShortcut, KeyboardNavigationConfig } from '../types';

/**
 * Initialize default keyboard shortcuts
 */
export function initializeDefaultShortcuts(): KeyboardShortcut[] {
  return [
    // Navigation shortcuts
    {
      key: 'Tab',
      action: 'navigate-forward',
      description: 'Navigate to next focusable element',
      category: 'navigation',
    },
    {
      key: 'Tab',
      shiftKey: true,
      action: 'navigate-backward',
      description: 'Navigate to previous focusable element',
      category: 'navigation',
    },
    {
      key: 'ArrowUp',
      action: 'navigate-up',
      description: 'Navigate up in current group',
      category: 'navigation',
    },
    {
      key: 'ArrowDown',
      action: 'navigate-down',
      description: 'Navigate down in current group',
      category: 'navigation',
    },
    {
      key: 'ArrowLeft',
      action: 'navigate-left',
      description: 'Navigate left in current group',
      category: 'navigation',
    },
    {
      key: 'ArrowRight',
      action: 'navigate-right',
      description: 'Navigate right in current group',
      category: 'navigation',
    },
    // Activation shortcuts
    {
      key: 'Enter',
      action: 'activate-element',
      description: 'Activate current element',
      category: 'action',
    },
    {
      key: ' ',
      action: 'activate-element',
      description: 'Activate current element',
      category: 'action',
    },
    // Cancellation shortcuts
    {
      key: 'Escape',
      action: 'cancel-action',
      description: 'Cancel current action or close modal',
      category: 'action',
    },
    // Utility shortcuts
    {
      key: 'Home',
      action: 'navigate-first',
      description: 'Navigate to first element in group',
      category: 'navigation',
    },
    {
      key: 'End',
      action: 'navigate-last',
      description: 'Navigate to last element in group',
      category: 'navigation',
    },
    {
      key: 'PageUp',
      action: 'navigate-page-up',
      description: 'Navigate up by page',
      category: 'navigation',
    },
    {
      key: 'PageDown',
      action: 'navigate-page-down',
      description: 'Navigate down by page',
      category: 'navigation',
    },
    // Accessibility shortcuts
    {
      key: 's',
      ctrlKey: true,
      action: 'toggle-skip-links',
      description: 'Toggle skip links visibility',
      category: 'accessibility',
    },
    {
      key: 'h',
      ctrlKey: true,
      action: 'show-help',
      description: 'Show keyboard navigation help',
      category: 'accessibility',
    },
  ];
}

/**
 * Find matching shortcut for keyboard event
 */
export function findShortcut(
  event: KeyboardEvent,
  shortcuts: Map<string, KeyboardShortcut>
): KeyboardShortcut | null {
  const key = event.key;
  const ctrlKey = event.ctrlKey;
  const shiftKey = event.shiftKey;
  const altKey = event.altKey;
  const metaKey = event.metaKey;

  for (const shortcut of shortcuts.values()) {
    if (
      shortcut.key === key &&
      shortcut.ctrlKey === ctrlKey &&
      shortcut.shiftKey === shiftKey &&
      shortcut.altKey === altKey &&
      shortcut.metaKey === metaKey
    ) {
      return shortcut;
    }
  }

  return null;
}

/**
 * Generate unique key for shortcut
 */
export function generateShortcutKey(shortcut: KeyboardShortcut): string {
  return `${shortcut.key}-${shortcut.ctrlKey ? 'ctrl' : ''}-${shortcut.shiftKey ? 'shift' : ''}-${shortcut.altKey ? 'alt' : ''}-${shortcut.metaKey ? 'meta' : ''}`;
}

/**
 * Activate current element
 */
export function activateCurrentElement(
  element: HTMLElement | null,
  config: KeyboardNavigationConfig
): void {
  if (!element) return;
  if (!config.enableEnterActivation && !config.enableSpaceActivation) return;

  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    element.click();
  } else if (element.tagName === 'A') {
    element.click();
  } else if (element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox') {
    element.click();
  } else if (element.tagName === 'INPUT' && element.getAttribute('type') === 'radio') {
    element.click();
  }
}

/**
 * Cancel current action (close modals, etc.)
 */
export function cancelCurrentAction(config: KeyboardNavigationConfig): void {
  if (!config.enableEscapeCancellation) return;

  // Close modals, cancel forms, etc.
  const modals = document.querySelectorAll('[role="dialog"], [role="modal"]');
  for (const modal of modals) {
    const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
    if (closeButton) {
      (closeButton as HTMLElement).click();
      break;
    }
  }
}

