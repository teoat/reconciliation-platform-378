/**
 * Type definitions for keyboard navigation service
 */

export interface KeyboardNavigationConfig {
  enableTabNavigation: boolean;
  enableArrowNavigation: boolean;
  enableEnterActivation: boolean;
  enableEscapeCancellation: boolean;
  enableSpaceActivation: boolean;
  enableHomeEndNavigation: boolean;
  enablePageUpDownNavigation: boolean;
  enableCustomShortcuts: boolean;
  focusTrapEnabled: boolean;
  skipLinksEnabled: boolean;
  announceNavigation: boolean;
  visualFocusIndicator: boolean;
  focusTimeout: number;
  navigationDelay: number;
}

export interface FocusableElement {
  id: string;
  element: HTMLElement;
  tabIndex: number;
  role: string;
  label: string;
  group?: string;
  order: number;
  isVisible: boolean;
  isEnabled: boolean;
  isFocusable: boolean;
}

export interface NavigationGroup {
  id: string;
  name: string;
  elements: FocusableElement[];
  orientation: 'horizontal' | 'vertical' | 'grid';
  wrapAround: boolean;
  skipDisabled: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
  category: 'navigation' | 'action' | 'utility' | 'accessibility';
}

export interface FocusHistory {
  elementId: string;
  timestamp: Date;
  context: string;
  previousElementId?: string;
}

export interface NavigationState {
  currentElement: FocusableElement | null;
  currentGroup: NavigationGroup | null;
  focusHistory: FocusHistory[];
  isNavigating: boolean;
  lastNavigationDirection: 'forward' | 'backward' | 'up' | 'down' | 'left' | 'right';
  skipLinksVisible: boolean;
  focusTrapActive: boolean;
}

