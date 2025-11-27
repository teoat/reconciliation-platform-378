/**
 * Keyboard Navigation Service - Core service orchestrating keyboard navigation
 */

import { logger } from '@/services/logger';
import type {
  KeyboardNavigationConfig,
  FocusableElement,
  NavigationGroup,
  KeyboardShortcut,
  NavigationState,
} from './types';
import {
  scanForFocusableElements,
  createSkipLinks,
  updateSkipLinksVisibility,
} from './utils/accessibilityHelpers';
import {
  initializeDefaultShortcuts,
  findShortcut,
  generateShortcutKey,
  activateCurrentElement,
  cancelCurrentAction,
} from './handlers/shortcutHandlers';
import {
  getNextFocusableElement,
  getPreviousFocusableElement,
  getFirstFocusableElement,
  getLastFocusableElement,
  getElementInDirection,
  getPageUpElement,
  getPageDownElement,
  focusElement,
  findElementByHTMLElement,
} from './handlers/focusHandlers';

const defaultConfig: KeyboardNavigationConfig = {
  enableTabNavigation: true,
  enableArrowNavigation: true,
  enableEnterActivation: true,
  enableEscapeCancellation: true,
  enableSpaceActivation: true,
  enableHomeEndNavigation: true,
  enablePageUpDownNavigation: true,
  enableCustomShortcuts: true,
  focusTrapEnabled: true,
  skipLinksEnabled: true,
  announceNavigation: true,
  visualFocusIndicator: true,
  focusTimeout: 5000,
  navigationDelay: 100,
};

export class KeyboardNavigationService {
  private config: KeyboardNavigationConfig;
  private elements: Map<string, FocusableElement> = new Map();
  private groups: Map<string, NavigationGroup> = new Map();
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private state: NavigationState;
  private observers: Set<(state: NavigationState) => void> = new Set();
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private focusHandler: ((event: FocusEvent) => void) | null = null;
  private blurHandler: ((event: FocusEvent) => void) | null = null;
  private isInitialized: boolean = false;

  constructor(config: Partial<KeyboardNavigationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.state = {
      currentElement: null,
      currentGroup: null,
      focusHistory: [],
      isNavigating: false,
      lastNavigationDirection: 'forward',
      skipLinksVisible: false,
      focusTrapActive: false,
    };
    this.initializeShortcuts();
  }

  private initializeShortcuts(): void {
    const defaultShortcuts = initializeDefaultShortcuts();
    defaultShortcuts.forEach((shortcut) => {
      const key = generateShortcutKey(shortcut);
      this.shortcuts.set(key, shortcut);
    });
  }

  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.setupEventListeners();
    const focusableElements = scanForFocusableElements();
    focusableElements.forEach((el) => this.elements.set(el.id, el));

    if (this.config.skipLinksEnabled) {
      createSkipLinks();
    }

    this.isInitialized = true;
    logger.info('Keyboard Navigation Service initialized');
  }

  private setupEventListeners(): void {
    this.keydownHandler = (event: KeyboardEvent) => {
      this.handleKeyDown(event);
    };

    this.focusHandler = (event: FocusEvent) => {
      this.handleFocus(event);
    };

    this.blurHandler = (_event: FocusEvent) => {
      // Handle blur if needed
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('focusin', this.focusHandler);
    document.addEventListener('focusout', this.blurHandler);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const shortcut = findShortcut(event, this.shortcuts);
    if (shortcut) {
      event.preventDefault();
      this.executeShortcut(shortcut, event);
    }
  }

  private handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    const element = findElementByHTMLElement(target, this.elements);

    if (element) {
      this.state.currentElement = element;
      this.notifyObservers();
    }
  }

  private executeShortcut(shortcut: KeyboardShortcut, _event: KeyboardEvent): void {
    switch (shortcut.action) {
      case 'navigate-forward':
        this.navigateForward();
        break;
      case 'navigate-backward':
        this.navigateBackward();
        break;
      case 'navigate-up':
        this.navigateUp();
        break;
      case 'navigate-down':
        this.navigateDown();
        break;
      case 'navigate-left':
        this.navigateLeft();
        break;
      case 'navigate-right':
        this.navigateRight();
        break;
      case 'activate-element':
        activateCurrentElement(this.state.currentElement?.element || null, this.config);
        break;
      case 'cancel-action':
        cancelCurrentAction(this.config);
        break;
      case 'navigate-first':
        this.navigateToFirst();
        break;
      case 'navigate-last':
        this.navigateToLast();
        break;
      case 'navigate-page-up':
        this.navigatePageUp();
        break;
      case 'navigate-page-down':
        this.navigatePageDown();
        break;
      case 'toggle-skip-links':
        this.toggleSkipLinks();
        break;
      case 'show-help':
        this.showHelp();
        break;
    }
  }

  private navigateForward(): void {
    if (!this.config.enableTabNavigation) return;
    const nextElement = getNextFocusableElement(this.elements, this.state.currentElement);
    if (nextElement) {
      focusElement(nextElement, this.state, this.config);
      this.state.lastNavigationDirection = 'forward';
      this.notifyObservers();
    }
  }

  private navigateBackward(): void {
    if (!this.config.enableTabNavigation) return;
    const previousElement = getPreviousFocusableElement(this.elements, this.state.currentElement);
    if (previousElement) {
      focusElement(previousElement, this.state, this.config);
      this.state.lastNavigationDirection = 'backward';
      this.notifyObservers();
    }
  }

  private navigateUp(): void {
    if (!this.config.enableArrowNavigation) return;
    const upElement = getElementInDirection('up', this.state.currentElement, this.state.currentGroup);
    if (upElement) {
      focusElement(upElement, this.state, this.config);
      this.state.lastNavigationDirection = 'up';
      this.notifyObservers();
    }
  }

  private navigateDown(): void {
    if (!this.config.enableArrowNavigation) return;
    const downElement = getElementInDirection('down', this.state.currentElement, this.state.currentGroup);
    if (downElement) {
      focusElement(downElement, this.state, this.config);
      this.state.lastNavigationDirection = 'down';
      this.notifyObservers();
    }
  }

  private navigateLeft(): void {
    if (!this.config.enableArrowNavigation) return;
    const leftElement = getElementInDirection('left', this.state.currentElement, this.state.currentGroup);
    if (leftElement) {
      focusElement(leftElement, this.state, this.config);
      this.state.lastNavigationDirection = 'left';
      this.notifyObservers();
    }
  }

  private navigateRight(): void {
    if (!this.config.enableArrowNavigation) return;
    const rightElement = getElementInDirection('right', this.state.currentElement, this.state.currentGroup);
    if (rightElement) {
      focusElement(rightElement, this.state, this.config);
      this.state.lastNavigationDirection = 'right';
      this.notifyObservers();
    }
  }

  private navigateToFirst(): void {
    if (!this.config.enableHomeEndNavigation) return;
    const firstElement = getFirstFocusableElement(this.elements);
    if (firstElement) {
      focusElement(firstElement, this.state, this.config);
      this.notifyObservers();
    }
  }

  private navigateToLast(): void {
    if (!this.config.enableHomeEndNavigation) return;
    const lastElement = getLastFocusableElement(this.elements);
    if (lastElement) {
      focusElement(lastElement, this.state, this.config);
      this.notifyObservers();
    }
  }

  private navigatePageUp(): void {
    if (!this.config.enablePageUpDownNavigation) return;
    const pageUpElement = getPageUpElement(this.elements, this.state.currentElement);
    if (pageUpElement) {
      focusElement(pageUpElement, this.state, this.config);
      this.notifyObservers();
    }
  }

  private navigatePageDown(): void {
    if (!this.config.enablePageUpDownNavigation) return;
    const pageDownElement = getPageDownElement(this.elements, this.state.currentElement);
    if (pageDownElement) {
      focusElement(pageDownElement, this.state, this.config);
      this.notifyObservers();
    }
  }

  private toggleSkipLinks(): void {
    if (!this.config.skipLinksEnabled) return;
    this.state.skipLinksVisible = !this.state.skipLinksVisible;
    updateSkipLinksVisibility(this.state.skipLinksVisible);
    this.notifyObservers();
  }

  private showHelp(): void {
    logger.info('Keyboard Navigation Help');
    for (const shortcut of this.shortcuts.values()) {
      logger.debug(
        `Shortcut: ${shortcut.key}${shortcut.ctrlKey ? ' + Ctrl' : ''}${shortcut.shiftKey ? ' + Shift' : ''}${shortcut.altKey ? ' + Alt' : ''}${shortcut.metaKey ? ' + Meta' : ''}: ${shortcut.description}`
      );
    }
  }

  // Public methods
  public addShortcut(shortcut: KeyboardShortcut): void {
    const key = generateShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  public removeShortcut(key: string): void {
    this.shortcuts.delete(key);
  }

  public addElement(element: FocusableElement): void {
    this.elements.set(element.id, element);
  }

  public removeElement(elementId: string): void {
    this.elements.delete(elementId);
  }

  public createGroup(group: NavigationGroup): void {
    this.groups.set(group.id, group);
  }

  public removeGroup(groupId: string): void {
    this.groups.delete(groupId);
  }

  public focusElementById(elementId: string): boolean {
    const element = this.elements.get(elementId);
    if (element && element.isFocusable && element.isVisible && element.isEnabled) {
      focusElement(element, this.state, this.config);
      this.notifyObservers();
      return true;
    }
    return false;
  }

  public getCurrentElement(): FocusableElement | null {
    return this.state.currentElement;
  }

  public getNavigationState(): NavigationState {
    return { ...this.state };
  }

  public subscribe(callback: (state: NavigationState) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach((callback) => callback(this.state));
  }

  public destroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.focusHandler) {
      document.removeEventListener('focusin', this.focusHandler);
    }
    if (this.blurHandler) {
      document.removeEventListener('focusout', this.blurHandler);
    }

    const skipLinksContainer = document.getElementById('skip-links-container');
    if (skipLinksContainer) {
      skipLinksContainer.remove();
    }

    this.elements.clear();
    this.groups.clear();
    this.shortcuts.clear();
    this.observers.clear();
    this.isInitialized = false;

    logger.info('Keyboard Navigation Service destroyed');
  }
}

// Export the service
export default KeyboardNavigationService;

