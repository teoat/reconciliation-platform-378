/**
 * Focus management handlers
 */

import type {
  FocusableElement,
  NavigationGroup,
  NavigationState,
  FocusHistory,
} from '../types';
import { announceFocus } from '../utils/accessibilityHelpers';

/**
 * Get next focusable element
 */
export function getNextFocusableElement(
  elements: Map<string, FocusableElement>,
  currentElement: FocusableElement | null
): FocusableElement | null {
  const elementArray = Array.from(elements.values())
    .filter((el) => el.isFocusable && el.isVisible && el.isEnabled)
    .sort((a, b) => a.tabIndex - b.tabIndex);

  if (elementArray.length === 0) return null;

  if (!currentElement) {
    return elementArray[0];
  }

  const currentIndex = elementArray.findIndex((el) => el.id === currentElement.id);
  if (currentIndex === -1) return elementArray[0];

  const nextIndex = (currentIndex + 1) % elementArray.length;
  return elementArray[nextIndex];
}

/**
 * Get previous focusable element
 */
export function getPreviousFocusableElement(
  elements: Map<string, FocusableElement>,
  currentElement: FocusableElement | null
): FocusableElement | null {
  const elementArray = Array.from(elements.values())
    .filter((el) => el.isFocusable && el.isVisible && el.isEnabled)
    .sort((a, b) => a.tabIndex - b.tabIndex);

  if (elementArray.length === 0) return null;

  if (!currentElement) {
    return elementArray[elementArray.length - 1];
  }

  const currentIndex = elementArray.findIndex((el) => el.id === currentElement.id);
  if (currentIndex === -1) return elementArray[elementArray.length - 1];

  const previousIndex = currentIndex === 0 ? elementArray.length - 1 : currentIndex - 1;
  return elementArray[previousIndex];
}

/**
 * Get first focusable element
 */
export function getFirstFocusableElement(
  elements: Map<string, FocusableElement>
): FocusableElement | null {
  const elementArray = Array.from(elements.values())
    .filter((el) => el.isFocusable && el.isVisible && el.isEnabled)
    .sort((a, b) => a.tabIndex - b.tabIndex);

  return elementArray.length > 0 ? elementArray[0] : null;
}

/**
 * Get last focusable element
 */
export function getLastFocusableElement(
  elements: Map<string, FocusableElement>
): FocusableElement | null {
  const elementArray = Array.from(elements.values())
    .filter((el) => el.isFocusable && el.isVisible && el.isEnabled)
    .sort((a, b) => a.tabIndex - b.tabIndex);

  return elementArray.length > 0 ? elementArray[elementArray.length - 1] : null;
}

/**
 * Get element in direction within group
 */
export function getElementInDirection(
  direction: 'up' | 'down' | 'left' | 'right',
  currentElement: FocusableElement | null,
  currentGroup: NavigationGroup | null
): FocusableElement | null {
  if (!currentElement || !currentGroup) return null;

  const groupElements = currentGroup.elements
    .filter((el) => el.isFocusable && el.isVisible && el.isEnabled)
    .sort((a, b) => a.order - b.order);

  const currentIndex = groupElements.findIndex((el) => el.id === currentElement.id);
  if (currentIndex === -1) return null;

  switch (direction) {
    case 'up':
      return groupElements[Math.max(0, currentIndex - 1)];
    case 'down':
      return groupElements[Math.min(groupElements.length - 1, currentIndex + 1)];
    case 'left':
      return groupElements[Math.max(0, currentIndex - 1)];
    case 'right':
      return groupElements[Math.min(groupElements.length - 1, currentIndex + 1)];
    default:
      return null;
  }
}

/**
 * Get page up element (navigate up by 5 elements)
 */
export function getPageUpElement(
  elements: Map<string, FocusableElement>,
  currentElement: FocusableElement | null
): FocusableElement | null {
  if (!currentElement) {
    return getFirstFocusableElement(elements);
  }

  const elementArray = Array.from(elements.values())
    .filter((el) => el.isFocusable && el.isVisible && el.isEnabled)
    .sort((a, b) => a.tabIndex - b.tabIndex);

  const currentIndex = elementArray.findIndex((el) => el.id === currentElement.id);
  if (currentIndex === -1) return elementArray[0];

  const pageUpIndex = Math.max(0, currentIndex - 5);
  return elementArray[pageUpIndex];
}

/**
 * Get page down element (navigate down by 5 elements)
 */
export function getPageDownElement(
  elements: Map<string, FocusableElement>,
  currentElement: FocusableElement | null
): FocusableElement | null {
  if (!currentElement) {
    return getLastFocusableElement(elements);
  }

  const elementArray = Array.from(elements.values())
    .filter((el) => el.isFocusable && el.isVisible && el.isEnabled)
    .sort((a, b) => a.tabIndex - b.tabIndex);

  const currentIndex = elementArray.findIndex((el) => el.id === currentElement.id);
  if (currentIndex === -1) return elementArray[elementArray.length - 1];

  const pageDownIndex = Math.min(elementArray.length - 1, currentIndex + 5);
  return elementArray[pageDownIndex];
}

/**
 * Focus an element and update state
 */
export function focusElement(
  element: FocusableElement,
  state: NavigationState,
  config: { announceNavigation: boolean }
): void {
  element.element.focus();
  state.currentElement = element;
  addToFocusHistory(element, state);
  announceFocus(element, config.announceNavigation);
}

/**
 * Add element to focus history
 */
export function addToFocusHistory(element: FocusableElement, state: NavigationState): void {
  const historyEntry: FocusHistory = {
    elementId: element.id,
    timestamp: new Date(),
    context: 'keyboard-navigation',
    previousElementId: state.currentElement?.id,
  };

  state.focusHistory.push(historyEntry);

  // Keep only last 50 entries
  if (state.focusHistory.length > 50) {
    state.focusHistory = state.focusHistory.slice(-50);
  }
}

/**
 * Find element by HTML element
 */
export function findElementByHTMLElement(
  element: HTMLElement,
  elements: Map<string, FocusableElement>
): FocusableElement | null {
  for (const focusableElement of elements.values()) {
    if (focusableElement.element === element) {
      return focusableElement;
    }
  }
  return null;
}

