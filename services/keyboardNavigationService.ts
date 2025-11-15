// Enhanced Keyboard Navigation + Focus Management
// Comprehensive keyboard navigation and focus management system

import React from 'react'

export interface KeyboardNavigationConfig {
  enableTabNavigation: boolean
  enableArrowNavigation: boolean
  enableEnterActivation: boolean
  enableEscapeCancellation: boolean
  enableSpaceActivation: boolean
  enableHomeEndNavigation: boolean
  enablePageUpDownNavigation: boolean
  enableCustomShortcuts: boolean
  focusTrapEnabled: boolean
  skipLinksEnabled: boolean
  announceNavigation: boolean
  visualFocusIndicator: boolean
  focusTimeout: number
  navigationDelay: number
}

export interface FocusableElement {
  id: string
  element: HTMLElement
  tabIndex: number
  role: string
  label: string
  group?: string
  order: number
  isVisible: boolean
  isEnabled: boolean
  isFocusable: boolean
}

export interface NavigationGroup {
  id: string
  name: string
  elements: FocusableElement[]
  orientation: 'horizontal' | 'vertical' | 'grid'
  wrapAround: boolean
  skipDisabled: boolean
}

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: string
  description: string
  category: 'navigation' | 'action' | 'utility' | 'accessibility'
}

export interface FocusHistory {
  elementId: string
  timestamp: Date
  context: string
  previousElementId?: string
}

export interface NavigationState {
  currentElement: FocusableElement | null
  currentGroup: NavigationGroup | null
  focusHistory: FocusHistory[]
  isNavigating: boolean
  lastNavigationDirection: 'forward' | 'backward' | 'up' | 'down' | 'left' | 'right'
  skipLinksVisible: boolean
  focusTrapActive: boolean
}

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
  navigationDelay: 100
}

export class KeyboardNavigationService {
  private config: KeyboardNavigationConfig
  private elements: Map<string, FocusableElement> = new Map()
  private groups: Map<string, NavigationGroup> = new Map()
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private state: NavigationState
  private observers: Set<(state: NavigationState) => void> = new Set()
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null
  private focusHandler: ((event: FocusEvent) => void) | null = null
  private blurHandler: ((event: FocusEvent) => void) | null = null
  private isInitialized: boolean = false

  constructor(config: Partial<KeyboardNavigationConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.state = {
      currentElement: null,
      currentGroup: null,
      focusHistory: [],
      isNavigating: false,
      lastNavigationDirection: 'forward',
      skipLinksVisible: false,
      focusTrapActive: false
    }
    this.initializeShortcuts()
  }

  private initializeShortcuts(): void {
    // Navigation shortcuts
    this.addShortcut({
      key: 'Tab',
      action: 'navigate-forward',
      description: 'Navigate to next focusable element',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'Tab',
      shiftKey: true,
      action: 'navigate-backward',
      description: 'Navigate to previous focusable element',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'ArrowUp',
      action: 'navigate-up',
      description: 'Navigate up in current group',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'ArrowDown',
      action: 'navigate-down',
      description: 'Navigate down in current group',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'ArrowLeft',
      action: 'navigate-left',
      description: 'Navigate left in current group',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'ArrowRight',
      action: 'navigate-right',
      description: 'Navigate right in current group',
      category: 'navigation'
    })

    // Activation shortcuts
    this.addShortcut({
      key: 'Enter',
      action: 'activate-element',
      description: 'Activate current element',
      category: 'action'
    })

    this.addShortcut({
      key: ' ',
      action: 'activate-element',
      description: 'Activate current element',
      category: 'action'
    })

    // Cancellation shortcuts
    this.addShortcut({
      key: 'Escape',
      action: 'cancel-action',
      description: 'Cancel current action or close modal',
      category: 'action'
    })

    // Utility shortcuts
    this.addShortcut({
      key: 'Home',
      action: 'navigate-first',
      description: 'Navigate to first element in group',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'End',
      action: 'navigate-last',
      description: 'Navigate to last element in group',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'PageUp',
      action: 'navigate-page-up',
      description: 'Navigate up by page',
      category: 'navigation'
    })

    this.addShortcut({
      key: 'PageDown',
      action: 'navigate-page-down',
      description: 'Navigate down by page',
      category: 'navigation'
    })

    // Accessibility shortcuts
    this.addShortcut({
      key: 's',
      ctrlKey: true,
      action: 'toggle-skip-links',
      description: 'Toggle skip links visibility',
      category: 'accessibility'
    })

    this.addShortcut({
      key: 'h',
      ctrlKey: true,
      action: 'show-help',
      description: 'Show keyboard navigation help',
      category: 'accessibility'
    })
  }

  public initialize(): void {
    if (this.isInitialized) {
      return
    }

    this.setupEventListeners()
    this.scanForFocusableElements()
    this.createSkipLinks()
    this.isInitialized = true

    console.log('Keyboard Navigation Service initialized')
  }

  private setupEventListeners(): void {
    this.keydownHandler = (event: KeyboardEvent) => {
      this.handleKeyDown(event)
    }

    this.focusHandler = (event: FocusEvent) => {
      this.handleFocus(event)
    }

    this.blurHandler = (event: FocusEvent) => {
      this.handleBlur(event)
    }

    document.addEventListener('keydown', this.keydownHandler)
    document.addEventListener('focusin', this.focusHandler)
    document.addEventListener('focusout', this.blurHandler)
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const shortcut = this.findShortcut(event)
    if (shortcut) {
      event.preventDefault()
      this.executeShortcut(shortcut, event)
    }
  }

  private handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement
    const element = this.findElementByHTMLElement(target)
    
    if (element) {
      this.state.currentElement = element
      this.addToFocusHistory(element)
      this.announceFocus(element)
      this.notifyObservers()
    }
  }

  private handleBlur(event: FocusEvent): void {
    // Handle blur if needed
  }

  private findShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    const key = event.key
    const ctrlKey = event.ctrlKey
    const shiftKey = event.shiftKey
    const altKey = event.altKey
    const metaKey = event.metaKey

    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.key === key &&
          shortcut.ctrlKey === ctrlKey &&
          shortcut.shiftKey === shiftKey &&
          shortcut.altKey === altKey &&
          shortcut.metaKey === metaKey) {
        return shortcut
      }
    }

    return null
  }

  private executeShortcut(shortcut: KeyboardShortcut, event: KeyboardEvent): void {
    switch (shortcut.action) {
      case 'navigate-forward':
        this.navigateForward()
        break
      case 'navigate-backward':
        this.navigateBackward()
        break
      case 'navigate-up':
        this.navigateUp()
        break
      case 'navigate-down':
        this.navigateDown()
        break
      case 'navigate-left':
        this.navigateLeft()
        break
      case 'navigate-right':
        this.navigateRight()
        break
      case 'activate-element':
        this.activateCurrentElement()
        break
      case 'cancel-action':
        this.cancelCurrentAction()
        break
      case 'navigate-first':
        this.navigateToFirst()
        break
      case 'navigate-last':
        this.navigateToLast()
        break
      case 'navigate-page-up':
        this.navigatePageUp()
        break
      case 'navigate-page-down':
        this.navigatePageDown()
        break
      case 'toggle-skip-links':
        this.toggleSkipLinks()
        break
      case 'show-help':
        this.showHelp()
        break
    }
  }

  private navigateForward(): void {
    if (!this.config.enableTabNavigation) return

    const nextElement = this.getNextFocusableElement()
    if (nextElement) {
      this.focusElement(nextElement)
      this.state.lastNavigationDirection = 'forward'
    }
  }

  private navigateBackward(): void {
    if (!this.config.enableTabNavigation) return

    const previousElement = this.getPreviousFocusableElement()
    if (previousElement) {
      this.focusElement(previousElement)
      this.state.lastNavigationDirection = 'backward'
    }
  }

  private navigateUp(): void {
    if (!this.config.enableArrowNavigation) return

    const upElement = this.getUpElement()
    if (upElement) {
      this.focusElement(upElement)
      this.state.lastNavigationDirection = 'up'
    }
  }

  private navigateDown(): void {
    if (!this.config.enableArrowNavigation) return

    const downElement = this.getDownElement()
    if (downElement) {
      this.focusElement(downElement)
      this.state.lastNavigationDirection = 'down'
    }
  }

  private navigateLeft(): void {
    if (!this.config.enableArrowNavigation) return

    const leftElement = this.getLeftElement()
    if (leftElement) {
      this.focusElement(leftElement)
      this.state.lastNavigationDirection = 'left'
    }
  }

  private navigateRight(): void {
    if (!this.config.enableArrowNavigation) return

    const rightElement = this.getRightElement()
    if (rightElement) {
      this.focusElement(rightElement)
      this.state.lastNavigationDirection = 'right'
    }
  }

  private activateCurrentElement(): void {
    if (!this.config.enableEnterActivation && !this.config.enableSpaceActivation) return

    if (this.state.currentElement) {
      const element = this.state.currentElement.element
      
      if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
        element.click()
      } else if (element.tagName === 'A') {
        element.click()
      } else if (element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox') {
        element.click()
      } else if (element.tagName === 'INPUT' && element.getAttribute('type') === 'radio') {
        element.click()
      }
    }
  }

  private cancelCurrentAction(): void {
    if (!this.config.enableEscapeCancellation) return

    // Close modals, cancel forms, etc.
    const modals = document.querySelectorAll('[role="dialog"], [role="modal"]')
    for (const modal of modals) {
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]')
      if (closeButton) {
        (closeButton as HTMLElement).click()
        break
      }
    }
  }

  private navigateToFirst(): void {
    if (!this.config.enableHomeEndNavigation) return

    const firstElement = this.getFirstFocusableElement()
    if (firstElement) {
      this.focusElement(firstElement)
    }
  }

  private navigateToLast(): void {
    if (!this.config.enableHomeEndNavigation) return

    const lastElement = this.getLastFocusableElement()
    if (lastElement) {
      this.focusElement(lastElement)
    }
  }

  private navigatePageUp(): void {
    if (!this.config.enablePageUpDownNavigation) return

    // Implement page up navigation
    const pageUpElement = this.getPageUpElement()
    if (pageUpElement) {
      this.focusElement(pageUpElement)
    }
  }

  private navigatePageDown(): void {
    if (!this.config.enablePageUpDownNavigation) return

    // Implement page down navigation
    const pageDownElement = this.getPageDownElement()
    if (pageDownElement) {
      this.focusElement(pageDownElement)
    }
  }

  private toggleSkipLinks(): void {
    if (!this.config.skipLinksEnabled) return

    this.state.skipLinksVisible = !this.state.skipLinksVisible
    this.updateSkipLinksVisibility()
    this.notifyObservers()
  }

  private showHelp(): void {
    // Show keyboard navigation help dialog
    console.log('Keyboard Navigation Help:')
    for (const shortcut of this.shortcuts.values()) {
      console.log(`${shortcut.key}${shortcut.ctrlKey ? ' + Ctrl' : ''}${shortcut.shiftKey ? ' + Shift' : ''}${shortcut.altKey ? ' + Alt' : ''}${shortcut.metaKey ? ' + Meta' : ''}: ${shortcut.description}`)
    }
  }

  // Navigation helper methods
  private getNextFocusableElement(): FocusableElement | null {
    const elements = Array.from(this.elements.values())
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.tabIndex - b.tabIndex)

    if (elements.length === 0) return null

    if (!this.state.currentElement) {
      return elements[0]
    }

    const currentIndex = elements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return elements[0]

    const nextIndex = (currentIndex + 1) % elements.length
    return elements[nextIndex]
  }

  private getPreviousFocusableElement(): FocusableElement | null {
    const elements = Array.from(this.elements.values())
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.tabIndex - b.tabIndex)

    if (elements.length === 0) return null

    if (!this.state.currentElement) {
      return elements[elements.length - 1]
    }

    const currentIndex = elements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return elements[elements.length - 1]

    const previousIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1
    return elements[previousIndex]
  }

  private getUpElement(): FocusableElement | null {
    if (!this.state.currentElement || !this.state.currentGroup) return null

    const groupElements = this.state.currentGroup.elements
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.order - b.order)

    const currentIndex = groupElements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return null

    // Simple up navigation - find element above current position
    const upIndex = Math.max(0, currentIndex - 1)
    return groupElements[upIndex]
  }

  private getDownElement(): FocusableElement | null {
    if (!this.state.currentElement || !this.state.currentGroup) return null

    const groupElements = this.state.currentGroup.elements
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.order - b.order)

    const currentIndex = groupElements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return null

    // Simple down navigation - find element below current position
    const downIndex = Math.min(groupElements.length - 1, currentIndex + 1)
    return groupElements[downIndex]
  }

  private getLeftElement(): FocusableElement | null {
    if (!this.state.currentElement || !this.state.currentGroup) return null

    const groupElements = this.state.currentGroup.elements
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.order - b.order)

    const currentIndex = groupElements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return null

    // Simple left navigation - find element to the left
    const leftIndex = Math.max(0, currentIndex - 1)
    return groupElements[leftIndex]
  }

  private getRightElement(): FocusableElement | null {
    if (!this.state.currentElement || !this.state.currentGroup) return null

    const groupElements = this.state.currentGroup.elements
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.order - b.order)

    const currentIndex = groupElements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return null

    // Simple right navigation - find element to the right
    const rightIndex = Math.min(groupElements.length - 1, currentIndex + 1)
    return groupElements[rightIndex]
  }

  private getFirstFocusableElement(): FocusableElement | null {
    const elements = Array.from(this.elements.values())
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.tabIndex - b.tabIndex)

    return elements.length > 0 ? elements[0] : null
  }

  private getLastFocusableElement(): FocusableElement | null {
    const elements = Array.from(this.elements.values())
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.tabIndex - b.tabIndex)

    return elements.length > 0 ? elements[elements.length - 1] : null
  }

  private getPageUpElement(): FocusableElement | null {
    // Simple implementation - navigate up by 5 elements
    if (!this.state.currentElement) return this.getFirstFocusableElement()

    const elements = Array.from(this.elements.values())
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.tabIndex - b.tabIndex)

    const currentIndex = elements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return elements[0]

    const pageUpIndex = Math.max(0, currentIndex - 5)
    return elements[pageUpIndex]
  }

  private getPageDownElement(): FocusableElement | null {
    // Simple implementation - navigate down by 5 elements
    if (!this.state.currentElement) return this.getLastFocusableElement()

    const elements = Array.from(this.elements.values())
      .filter(el => el.isFocusable && el.isVisible && el.isEnabled)
      .sort((a, b) => a.tabIndex - b.tabIndex)

    const currentIndex = elements.findIndex(el => el.id === this.state.currentElement!.id)
    if (currentIndex === -1) return elements[elements.length - 1]

    const pageDownIndex = Math.min(elements.length - 1, currentIndex + 5)
    return elements[pageDownIndex]
  }

  private focusElement(element: FocusableElement): void {
    element.element.focus()
    this.state.currentElement = element
    this.addToFocusHistory(element)
    this.announceFocus(element)
    this.notifyObservers()
  }

  private addToFocusHistory(element: FocusableElement): void {
    const historyEntry: FocusHistory = {
      elementId: element.id,
      timestamp: new Date(),
      context: 'keyboard-navigation',
      previousElementId: this.state.currentElement?.id
    }

    this.state.focusHistory.push(historyEntry)

    // Keep only last 50 entries
    if (this.state.focusHistory.length > 50) {
      this.state.focusHistory = this.state.focusHistory.slice(-50)
    }
  }

  private announceFocus(element: FocusableElement): void {
    if (!this.config.announceNavigation) return

    const announcement = `Focused on ${element.label}`
    
    // Use ARIA live region for announcement
    const liveRegion = document.getElementById('keyboard-navigation-announcer')
    if (liveRegion) {
      liveRegion.textContent = announcement
    } else {
      console.log(announcement)
    }
  }

  private scanForFocusableElements(): void {
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
      '[role="option"]'
    ]

    const elements = document.querySelectorAll(focusableSelectors.join(', '))
    
    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement
      const focusableElement: FocusableElement = {
        id: htmlElement.id || `focusable-${index}`,
        element: htmlElement,
        tabIndex: htmlElement.tabIndex || 0,
        role: htmlElement.getAttribute('role') || htmlElement.tagName.toLowerCase(),
        label: this.getElementLabel(htmlElement),
        order: index,
        isVisible: this.isElementVisible(htmlElement),
        isEnabled: !htmlElement.hasAttribute('disabled'),
        isFocusable: this.isElementFocusable(htmlElement)
      }

      this.elements.set(focusableElement.id, focusableElement)
    })
  }

  private getElementLabel(element: HTMLElement): string {
    const label = element.getAttribute('aria-label') ||
                 element.getAttribute('aria-labelledby') ||
                 element.getAttribute('title') ||
                 element.textContent?.trim() ||
                 element.getAttribute('placeholder') ||
                 element.tagName.toLowerCase()

    return label || 'Unlabeled element'
  }

  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0'
  }

  private isElementFocusable(element: HTMLElement): boolean {
    return element.tabIndex >= 0 && 
           !element.hasAttribute('disabled') &&
           this.isElementVisible(element)
  }

  private createSkipLinks(): void {
    if (!this.config.skipLinksEnabled) return

    const skipLinksContainer = document.createElement('div')
    skipLinksContainer.id = 'skip-links-container'
    skipLinksContainer.className = 'skip-links'
    skipLinksContainer.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      z-index: 9999;
    `

    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#footer', text: 'Skip to footer' }
    ]

    skipLinks.forEach(link => {
      const skipLink = document.createElement('a')
      skipLink.href = link.href
      skipLink.textContent = link.text
      skipLink.className = 'skip-link'
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
      `
      
      skipLink.addEventListener('focus', () => {
        skipLink.style.transform = 'translateY(0)'
      })
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.transform = 'translateY(-100%)'
      })

      skipLinksContainer.appendChild(skipLink)
    })

    document.body.appendChild(skipLinksContainer)
  }

  private updateSkipLinksVisibility(): void {
    const skipLinksContainer = document.getElementById('skip-links-container')
    if (skipLinksContainer) {
      skipLinksContainer.style.display = this.state.skipLinksVisible ? 'block' : 'none'
    }
  }

  private findElementByHTMLElement(element: HTMLElement): FocusableElement | null {
    for (const focusableElement of this.elements.values()) {
      if (focusableElement.element === element) {
        return focusableElement
      }
    }
    return null
  }

  // Public methods
  public addShortcut(shortcut: KeyboardShortcut): void {
    const key = this.generateShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  private generateShortcutKey(shortcut: KeyboardShortcut): string {
    return `${shortcut.key}-${shortcut.ctrlKey ? 'ctrl' : ''}-${shortcut.shiftKey ? 'shift' : ''}-${shortcut.altKey ? 'alt' : ''}-${shortcut.metaKey ? 'meta' : ''}`
  }

  public removeShortcut(key: string): void {
    this.shortcuts.delete(key)
  }

  public addElement(element: FocusableElement): void {
    this.elements.set(element.id, element)
  }

  public removeElement(elementId: string): void {
    this.elements.delete(elementId)
  }

  public createGroup(group: NavigationGroup): void {
    this.groups.set(group.id, group)
  }

  public removeGroup(groupId: string): void {
    this.groups.delete(groupId)
  }

  public focusElementById(elementId: string): boolean {
    const element = this.elements.get(elementId)
    if (element && element.isFocusable && element.isVisible && element.isEnabled) {
      this.focusElement(element)
      return true
    }
    return false
  }

  public getCurrentElement(): FocusableElement | null {
    return this.state.currentElement
  }

  public getNavigationState(): NavigationState {
    return { ...this.state }
  }

  public subscribe(callback: (state: NavigationState) => void): () => void {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.state))
  }

  public destroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
    }
    if (this.focusHandler) {
      document.removeEventListener('focusin', this.focusHandler)
    }
    if (this.blurHandler) {
      document.removeEventListener('focusout', this.blurHandler)
    }

    const skipLinksContainer = document.getElementById('skip-links-container')
    if (skipLinksContainer) {
      skipLinksContainer.remove()
    }

    this.elements.clear()
    this.groups.clear()
    this.shortcuts.clear()
    this.observers.clear()
    this.isInitialized = false

    console.log('Keyboard Navigation Service destroyed')
  }
}

// Export the service
export default KeyboardNavigationService