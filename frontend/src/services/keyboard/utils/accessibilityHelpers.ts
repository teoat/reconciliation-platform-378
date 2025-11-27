/**
 * Accessibility helper utilities for keyboard navigation
 */

import type { FocusableElement } from '../types';

/**
 * Get accessible label for an element
 */
export function getElementLabel(element: HTMLElement): string {
  const label =
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title') ||
    element.textContent?.trim() ||
    element.getAttribute('placeholder') ||
    element.tagName.toLowerCase();

  return label || 'Unlabeled element';
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * Check if element is focusable
 */
export function isElementFocusable(element: HTMLElement): boolean {
  return (
    element.tabIndex >= 0 && !element.hasAttribute('disabled') && isElementVisible(element)
  );
}

/**
 * Scan document for focusable elements
 */
export function scanForFocusableElements(): FocusableElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="option"]',
  ];

  const elements = document.querySelectorAll(focusableSelectors.join(', '));
  const focusableElements: FocusableElement[] = [];

  elements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    focusableElements.push({
      id: htmlElement.id || `focusable-${index}`,
      element: htmlElement,
      tabIndex: htmlElement.tabIndex || 0,
      role: htmlElement.getAttribute('role') || htmlElement.tagName.toLowerCase(),
      label: getElementLabel(htmlElement),
      order: index,
      isVisible: isElementVisible(htmlElement),
      isEnabled: !htmlElement.hasAttribute('disabled'),
      isFocusable: isElementFocusable(htmlElement),
    });
  });

  return focusableElements;
}

/**
 * Create skip links for accessibility
 */
export function createSkipLinks(): void {
  const skipLinksContainer = document.createElement('div');
  skipLinksContainer.id = 'skip-links-container';
  skipLinksContainer.className = 'skip-links';
  skipLinksContainer.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    z-index: 9999;
  `;

  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#footer', text: 'Skip to footer' },
  ];

  skipLinks.forEach((link) => {
    const skipLink = document.createElement('a');
    skipLink.href = link.href;
    skipLink.textContent = link.text;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px 16px;
      text-decoration: none;
      z-index: 10000;
      transform: translateY(-100%);
      transition: transform 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.transform = 'translateY(0)';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.transform = 'translateY(-100%)';
    });

    skipLinksContainer.appendChild(skipLink);
  });

  document.body.appendChild(skipLinksContainer);
}

/**
 * Update skip links visibility
 */
export function updateSkipLinksVisibility(visible: boolean): void {
  const skipLinksContainer = document.getElementById('skip-links-container');
  if (skipLinksContainer) {
    skipLinksContainer.style.display = visible ? 'block' : 'none';
  }
}

/**
 * Announce focus change for screen readers
 */
export function announceFocus(element: FocusableElement, enabled: boolean): void {
  if (!enabled) return;

  const announcement = `Focused on ${element.label}`;

  // Use ARIA live region for announcement
  const liveRegion = document.getElementById('keyboard-navigation-announcer');
  if (liveRegion) {
    liveRegion.textContent = announcement;
  }
}

