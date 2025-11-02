// Enhanced ARIA Live Regions + Announcement System
import { logger } from '@/services/logger'
// Comprehensive ARIA live regions and announcement system for screen readers

import React from 'react'

export interface AriaLiveRegion {
  id: string
  element: HTMLElement
  politeness: 'polite' | 'assertive' | 'off'
  atomic: boolean
  relevant: 'additions' | 'removals' | 'text' | 'all'
  label?: string
  description?: string
  isActive: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface Announcement {
  id: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  politeness: 'polite' | 'assertive'
  category: 'navigation' | 'status' | 'error' | 'success' | 'warning' | 'info' | 'progress'
  timestamp: Date
  duration?: number
  context?: any
  regionId?: string
}

export interface AnnouncementQueue {
  id: string
  announcements: Announcement[]
  maxSize: number
  currentIndex: number
  isProcessing: boolean
}

export interface AriaLiveConfig {
  enableAutoAnnouncements: boolean
  enablePriorityQueuing: boolean
  enableContextualAnnouncements: boolean
  enableProgressAnnouncements: boolean
  enableErrorAnnouncements: boolean
  enableSuccessAnnouncements: boolean
  enableNavigationAnnouncements: boolean
  defaultPoliteness: 'polite' | 'assertive'
  announcementDelay: number
  maxQueueSize: number
  autoClearDelay: number
  enableLogging: boolean
  enableDebugMode: boolean
}

export interface AnnouncementContext {
  userId?: string
  sessionId?: string
  pageId?: string
  componentId?: string
  action?: string
  previousState?: any
  currentState?: any
  metadata?: any
}

const defaultConfig: AriaLiveConfig = {
  enableAutoAnnouncements: true,
  enablePriorityQueuing: true,
  enableContextualAnnouncements: true,
  enableProgressAnnouncements: true,
  enableErrorAnnouncements: true,
  enableSuccessAnnouncements: true,
  enableNavigationAnnouncements: true,
  defaultPoliteness: 'polite',
  announcementDelay: 100,
  maxQueueSize: 50,
  autoClearDelay: 5000,
  enableLogging: true,
  enableDebugMode: false
}

export class AriaLiveRegionsService {
  private config: AriaLiveConfig
  private regions: Map<string, AriaLiveRegion> = new Map()
  private queues: Map<string, AnnouncementQueue> = new Map()
  private announcements: Map<string, Announcement> = new Map()
  private isInitialized: boolean = false
  private processingTimer: NodeJS.Timeout | null = null
  private observers: Set<(announcement: Announcement) => void> = new Set()

  constructor(config: Partial<AriaLiveConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.initializeDefaultRegions()
  }

  private initializeDefaultRegions(): void {
    // Create default regions
    this.createRegion({
      id: 'status-announcer',
      politeness: 'polite',
      atomic: false,
      relevant: 'additions',
      label: 'Status announcements',
      description: 'Announces status updates and general information',
      priority: 'medium'
    })

    this.createRegion({
      id: 'error-announcer',
      politeness: 'assertive',
      atomic: true,
      relevant: 'all',
      label: 'Error announcements',
      description: 'Announces errors and critical issues',
      priority: 'critical'
    })

    this.createRegion({
      id: 'success-announcer',
      politeness: 'polite',
      atomic: false,
      relevant: 'additions',
      label: 'Success announcements',
      description: 'Announces successful actions and completions',
      priority: 'medium'
    })

    this.createRegion({
      id: 'navigation-announcer',
      politeness: 'polite',
      atomic: false,
      relevant: 'additions',
      label: 'Navigation announcements',
      description: 'Announces navigation changes and focus updates',
      priority: 'high'
    })

    this.createRegion({
      id: 'progress-announcer',
      politeness: 'polite',
      atomic: false,
      relevant: 'additions',
      label: 'Progress announcements',
      description: 'Announces progress updates and loading states',
      priority: 'low'
    })
  }

  public initialize(): void {
    if (this.isInitialized) {
      return
    }

    this.createRegionElements()
    this.startProcessing()
    this.isInitialized = true

    if (this.config.enableLogging) {
      logger.info('ARIA Live Regions Service initialized')
    }
  }

  private createRegionElements(): void {
    for (const region of this.regions.values()) {
      if (!document.getElementById(region.id)) {
        const element = document.createElement('div')
        element.id = region.id
        element.setAttribute('aria-live', region.politeness)
        element.setAttribute('aria-atomic', region.atomic.toString())
        element.setAttribute('aria-relevant', region.relevant)
        
        if (region.label) {
          element.setAttribute('aria-label', region.label)
        }
        
        if (region.description) {
          element.setAttribute('aria-describedby', region.description)
        }

        // Hide visually but keep accessible to screen readers
        element.style.cssText = `
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        `

        document.body.appendChild(element)
        region.element = element
        region.isActive = true
      }
    }
  }

  private startProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer)
    }

    this.processingTimer = setInterval(() => {
      this.processQueues()
    }, this.config.announcementDelay)
  }

  private processQueues(): void {
    for (const queue of this.queues.values()) {
      if (queue.isProcessing || queue.announcements.length === 0) {
        continue
      }

      queue.isProcessing = true
      const announcement = queue.announcements[queue.currentIndex]
      
      if (announcement) {
        this.executeAnnouncement(announcement)
        queue.currentIndex++
        
        // Auto-clear after delay
        if (announcement.duration) {
          setTimeout(() => {
            this.clearAnnouncement(announcement.id)
          }, announcement.duration)
        }
      }

      // Reset queue if all announcements processed
      if (queue.currentIndex >= queue.announcements.length) {
        queue.currentIndex = 0
        queue.announcements = []
      }

      queue.isProcessing = false
    }
  }

  private executeAnnouncement(announcement: Announcement): void {
    const region = announcement.regionId ? 
      this.regions.get(announcement.regionId) : 
      this.getBestRegionForAnnouncement(announcement)

    if (!region || !region.isActive) {
      if (this.config.enableDebugMode) {
        logger.warn(`No active region found for announcement: ${announcement.message}`)
      }
      return
    }

    // Clear previous content
    region.element.textContent = ''
    
    // Add new content
    setTimeout(() => {
      region.element.textContent = announcement.message
      
      if (this.config.enableLogging) {
        logger.info(`ARIA Announcement [${announcement.category}]: ${announcement.message}`, { category: announcement.category, message: announcement.message })
      }

      // Notify observers
      this.notifyObservers(announcement)
    }, 10)
  }

  private getBestRegionForAnnouncement(announcement: Announcement): AriaLiveRegion | null {
    const categoryMap: Record<string, string> = {
      'error': 'error-announcer',
      'success': 'success-announcer',
      'navigation': 'navigation-announcer',
      'progress': 'progress-announcer',
      'status': 'status-announcer',
      'warning': 'error-announcer',
      'info': 'status-announcer'
    }

    const preferredRegionId = categoryMap[announcement.category] || 'status-announcer'
    const preferredRegion = this.regions.get(preferredRegionId)
    
    if (preferredRegion && preferredRegion.isActive) {
      return preferredRegion
    }

    // Fallback to any active region
    for (const region of this.regions.values()) {
      if (region.isActive) {
        return region
      }
    }

    return null
  }

  private clearAnnouncement(announcementId: string): void {
    const announcement = this.announcements.get(announcementId)
    if (!announcement) return

    const region = announcement.regionId ? 
      this.regions.get(announcement.regionId) : 
      this.getBestRegionForAnnouncement(announcement)

    if (region) {
      region.element.textContent = ''
    }

    this.announcements.delete(announcementId)
  }

  // Public methods
  public createRegion(regionConfig: Omit<AriaLiveRegion, 'element' | 'isActive'>): AriaLiveRegion {
    const region: AriaLiveRegion = {
      ...regionConfig,
      element: null as any,
      isActive: false
    }

    this.regions.set(region.id, region)
    return region
  }

  public removeRegion(regionId: string): void {
    const region = this.regions.get(regionId)
    if (region && region.element) {
      region.element.remove()
    }
    this.regions.delete(regionId)
  }

  public announce(message: string, options: {
    priority?: Announcement['priority']
    politeness?: Announcement['politeness']
    category?: Announcement['category']
    duration?: number
    context?: AnnouncementContext
    regionId?: string
  } = {}): string {
    const announcement: Announcement = {
      id: this.generateAnnouncementId(),
      message,
      priority: options.priority || 'medium',
      politeness: options.politeness || this.config.defaultPoliteness,
      category: options.category || 'info',
      timestamp: new Date(),
      duration: options.duration || this.config.autoClearDelay,
      context: options.context,
      regionId: options.regionId
    }

    this.announcements.set(announcement.id, announcement)
    this.addToQueue(announcement)

    return announcement.id
  }

  private generateAnnouncementId(): string {
    return `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private addToQueue(announcement: Announcement): void {
    const queueId = announcement.regionId || 'default'
    
    if (!this.queues.has(queueId)) {
      this.queues.set(queueId, {
        id: queueId,
        announcements: [],
        maxSize: this.config.maxQueueSize,
        currentIndex: 0,
        isProcessing: false
      })
    }

    const queue = this.queues.get(queueId)!
    
    if (this.config.enablePriorityQueuing) {
      // Insert based on priority
      const insertIndex = this.findInsertIndex(queue.announcements, announcement)
      queue.announcements.splice(insertIndex, 0, announcement)
    } else {
      queue.announcements.push(announcement)
    }

    // Remove excess announcements
    if (queue.announcements.length > queue.maxSize) {
      queue.announcements = queue.announcements.slice(-queue.maxSize)
    }
  }

  private findInsertIndex(announcements: Announcement[], newAnnouncement: Announcement): number {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
    const newPriority = priorityOrder[newAnnouncement.priority]

    for (let i = 0; i < announcements.length; i++) {
      const currentPriority = priorityOrder[announcements[i].priority]
      if (newPriority > currentPriority) {
        return i
      }
    }

    return announcements.length
  }

  // Convenience methods for common announcements
  public announceError(message: string, context?: AnnouncementContext): string {
    if (!this.config.enableErrorAnnouncements) return ''
    
    return this.announce(message, {
      priority: 'critical',
      politeness: 'assertive',
      category: 'error',
      context
    })
  }

  public announceSuccess(message: string, context?: AnnouncementContext): string {
    if (!this.config.enableSuccessAnnouncements) return ''
    
    return this.announce(message, {
      priority: 'medium',
      politeness: 'polite',
      category: 'success',
      context
    })
  }

  public announceNavigation(message: string, context?: AnnouncementContext): string {
    if (!this.config.enableNavigationAnnouncements) return ''
    
    return this.announce(message, {
      priority: 'high',
      politeness: 'polite',
      category: 'navigation',
      context
    })
  }

  public announceProgress(message: string, context?: AnnouncementContext): string {
    if (!this.config.enableProgressAnnouncements) return ''
    
    return this.announce(message, {
      priority: 'low',
      politeness: 'polite',
      category: 'progress',
      context
    })
  }

  public announceStatus(message: string, context?: AnnouncementContext): string {
    return this.announce(message, {
      priority: 'medium',
      politeness: 'polite',
      category: 'status',
      context
    })
  }

  public announceWarning(message: string, context?: AnnouncementContext): string {
    return this.announce(message, {
      priority: 'high',
      politeness: 'assertive',
      category: 'warning',
      context
    })
  }

  // Context-aware announcements
  public announceFormValidation(fieldName: string, isValid: boolean, message?: string): string {
    const context: AnnouncementContext = {
      componentId: 'form-validation',
      action: isValid ? 'validation-success' : 'validation-error',
      metadata: { fieldName, isValid }
    }

    const announcementMessage = message || 
      (isValid ? `${fieldName} is valid` : `${fieldName} has an error`)

    return this.announce(announcementMessage, {
      priority: isValid ? 'low' : 'high',
      politeness: isValid ? 'polite' : 'assertive',
      category: isValid ? 'success' : 'error',
      context
    })
  }

  public announceDataLoad(dataType: string, count: number, isComplete: boolean): string {
    const context: AnnouncementContext = {
      componentId: 'data-loader',
      action: isComplete ? 'data-loaded' : 'data-loading',
      metadata: { dataType, count, isComplete }
    }

    const message = isComplete ? 
      `${dataType} loaded successfully. ${count} items available.` :
      `Loading ${dataType}...`

    return this.announce(message, {
      priority: 'low',
      politeness: 'polite',
      category: isComplete ? 'success' : 'progress',
      context
    })
  }

  public announceWorkflowStep(stepName: string, stepNumber: number, totalSteps: number): string {
    const context: AnnouncementContext = {
      componentId: 'workflow-stepper',
      action: 'step-changed',
      metadata: { stepName, stepNumber, totalSteps }
    }

    const message = `Step ${stepNumber} of ${totalSteps}: ${stepName}`

    return this.announce(message, {
      priority: 'medium',
      politeness: 'polite',
      category: 'progress',
      context
    })
  }

  public announceSearchResults(query: string, resultCount: number): string {
    const context: AnnouncementContext = {
      componentId: 'search-results',
      action: 'search-completed',
      metadata: { query, resultCount }
    }

    const message = resultCount === 0 ? 
      `No results found for "${query}"` :
      `${resultCount} results found for "${query}"`

    return this.announce(message, {
      priority: 'medium',
      politeness: 'polite',
      category: 'status',
      context
    })
  }

  // Queue management
  public clearQueue(regionId?: string): void {
    if (regionId) {
      const queue = this.queues.get(regionId)
      if (queue) {
        queue.announcements = []
        queue.currentIndex = 0
      }
    } else {
      for (const queue of this.queues.values()) {
        queue.announcements = []
        queue.currentIndex = 0
      }
    }
  }

  public pauseAnnouncements(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer)
      this.processingTimer = null
    }
  }

  public resumeAnnouncements(): void {
    this.startProcessing()
  }

  // Observer pattern
  public subscribe(callback: (announcement: Announcement) => void): () => void {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  private notifyObservers(announcement: Announcement): void {
    this.observers.forEach(callback => callback(announcement))
  }

  // Utility methods
  public getActiveRegions(): AriaLiveRegion[] {
    return Array.from(this.regions.values()).filter(region => region.isActive)
  }

  public getAnnouncementHistory(limit: number = 20): Announcement[] {
    return Array.from(this.announcements.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  public getQueueStatus(): Record<string, { count: number; isProcessing: boolean }> {
    const status: Record<string, { count: number; isProcessing: boolean }> = {}
    
    for (const [queueId, queue] of this.queues.entries()) {
      status[queueId] = {
        count: queue.announcements.length,
        isProcessing: queue.isProcessing
      }
    }

    return status
  }

  public updateConfig(newConfig: Partial<AriaLiveConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer)
      this.processingTimer = null
    }

    // Remove all region elements
    for (const region of this.regions.values()) {
      if (region.element) {
        region.element.remove()
      }
    }

    this.regions.clear()
    this.queues.clear()
    this.announcements.clear()
    this.observers.clear()
    this.isInitialized = false

    if (this.config.enableLogging) {
      logger.info('ARIA Live Regions Service destroyed')
    }
  }
}

// Singleton instance
let serviceInstance: AriaLiveRegionsService | null = null;

export const getAriaLiveRegionsService = (): AriaLiveRegionsService => {
  if (!serviceInstance) {
    serviceInstance = new AriaLiveRegionsService();
  }
  return serviceInstance;
};

// Export the service
export default AriaLiveRegionsService

// Export singleton instance for convenience
export const ariaLiveRegionsService = getAriaLiveRegionsService();

// Re-export types for convenience
export type { AnnouncementContext, AriaLiveRegion, Announcement };