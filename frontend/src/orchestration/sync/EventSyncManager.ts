/**
 * Event Sync Manager - Handles real-time event synchronization
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import type { PageEvent } from '../types';

export class EventSyncManager {

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Page events
    window.addEventListener('page:event', ((event: CustomEvent<PageEvent>) => {
      this.handlePageEvent(event.detail);
    }) as (event: Event) => void);

    // Feature events
    window.addEventListener('feature:error', ((event: CustomEvent) => {
      const { featureId, error } = event.detail;
      this.handleFeatureError(featureId, error);
    }) as (event: Event) => void);

    window.addEventListener('feature:used', ((event: CustomEvent) => {
      const { featureId, action } = event.detail;
      this.handleFeatureUsed(featureId, action);
    }) as (event: Event) => void);

    // User actions
    window.addEventListener('user:action', ((event: CustomEvent) => {
      const { action } = event.detail;
      this.handleUserAction(action);
    }) as (event: Event) => void);
  }

  /**
   * Handle page event
   */
  private async handlePageEvent(event: PageEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'mount':
          await this.handlePageMount(event);
          break;
        case 'update':
          await this.handlePageUpdate(event);
          break;
        case 'unmount':
          await this.handlePageUnmount(event);
          break;
        default:
          logger.debug('Unhandled page event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling page event', { error, event });
    }
  }

  /**
   * Handle page mount
   */
  private async handlePageMount(event: PageEvent): Promise<void> {
    await frenlyAgentService.trackPageView(event.pageId);

    // Generate contextual message
    const userId = localStorage.getItem('userId') || 'unknown';
    const message = await frenlyAgentService.generateMessage({
      userId,
      page: event.pageId,
    });

    // Show message via event
    window.dispatchEvent(
      new CustomEvent('frenly:show-message', {
        detail: {
          id: message.id,
          type: message.type,
          content: message.content,
          timestamp: message.timestamp,
          page: event.pageId,
          priority: message.priority,
          dismissible: true,
        },
      })
    );
  }

  /**
   * Handle page update
   */
  private async handlePageUpdate(event: PageEvent): Promise<void> {
    // Track significant updates
    if (event.data && Object.keys(event.data).length > 0) {
      const userId = localStorage.getItem('userId') || 'unknown';
      await frenlyAgentService.trackInteraction(
        userId,
        'page_update',
        event.pageId
      );
    }
  }

  /**
   * Handle page unmount
   */
  private async handlePageUnmount(event: PageEvent): Promise<void> {
    // Cleanup handled by PageLifecycleManager
    logger.debug('Page unmounted', { pageId: event.pageId });
  }

  /**
   * Handle feature error
   */
  private async handleFeatureError(featureId: string, _error: Error): Promise<void> {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const message = await frenlyAgentService.generateMessage({
        userId,
        behavior: {
          errors: 1,
        },
      });

      // Show error message
      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: {
            id: message.id,
            type: 'warning',
            content: `I noticed an issue with ${featureId}. Let me help you fix it!`,
            timestamp: new Date(),
            priority: 'high',
            dismissible: true,
          },
        })
      );
    } catch (err) {
      logger.error('Error handling feature error', { error: err, featureId });
    }
  }

  /**
   * Handle feature used
   */
  private async handleFeatureUsed(
    featureId: string,
    _action: string
  ): Promise<void> {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      await frenlyAgentService.trackInteraction(userId, 'feature_used', featureId);
    } catch (err) {
      logger.error('Error tracking feature usage', { error: err, featureId });
    }
  }

  /**
   * Handle user action
   */
  private async handleUserAction(action: string): Promise<void> {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      await frenlyAgentService.trackInteraction(userId, 'user_action', action);
    } catch (err) {
      logger.error('Error tracking user action', { error: err, action });
    }
  }
}

// Singleton instance
let eventSyncInstance: EventSyncManager | null = null;

export function getEventSyncManager(): EventSyncManager {
  if (!eventSyncInstance) {
    eventSyncInstance = new EventSyncManager();
  }
  return eventSyncInstance;
}

