/**
 * Page Lifecycle Manager - Manages page lifecycle events and Frenly AI integration
 */

import { logger } from '@/services/logger';
import type { PageOrchestrationInterface, PageEvent, PageContext } from './types';
import { PageFrenlyIntegration } from './PageFrenlyIntegration';

export class PageLifecycleManager {
  private frenlyIntegration: PageFrenlyIntegration;
  private currentPage: PageOrchestrationInterface | null = null;
  private eventListeners: Map<string, EventListener[]> = new Map();

  constructor() {
    // Set up global event listeners
    this.setupGlobalEventListeners();
  }

  /**
   * Handle page mount
   */
  async onPageMount(page: PageOrchestrationInterface): Promise<void> {
    try {
      this.currentPage = page;

      // Create Frenly integration for this page
      this.frenlyIntegration = new PageFrenlyIntegration(page);

      // Initialize integration
      await this.frenlyIntegration.initialize();

      // Generate welcome message
      const message = await this.frenlyIntegration.generateContextualMessage();
      await this.frenlyIntegration.showMessage(message);

      // Sync page state
      await this.frenlyIntegration.syncPageState();

      // Emit mount event
      await this.emitPageEvent({
        type: 'mount',
        pageId: page.getPageId(),
        timestamp: Date.now(),
        data: {
          metadata: page.getPageMetadata(),
        },
      });

      logger.info('Page mounted', { pageId: page.getPageId() });
    } catch (error) {
      logger.error('Error on page mount', { error, pageId: page.getPageId() });
      // Don't throw - page should still work without Frenly AI
    }
  }

  /**
   * Handle page update
   */
  async onPageUpdate(
    page: PageOrchestrationInterface,
    changes: Partial<PageContext>
  ): Promise<void> {
    try {
      if (!this.frenlyIntegration) {
        // Re-initialize if needed
        await this.onPageMount(page);
        return;
      }

      // Update context
      await this.frenlyIntegration.updateContext(changes);

      // Generate contextual message if needed
      if (this.shouldGenerateMessage(changes)) {
        const message = await this.frenlyIntegration.generateContextualMessage();
        await this.frenlyIntegration.showMessage(message);
      }

      // Sync state
      await this.frenlyIntegration.syncPageState();

      // Emit update event
      await this.emitPageEvent({
        type: 'update',
        pageId: page.getPageId(),
        timestamp: Date.now(),
        data: { changes },
      });

      logger.debug('Page updated', {
        pageId: page.getPageId(),
        changes: Object.keys(changes),
      });
    } catch (error) {
      logger.error('Error on page update', {
        error,
        pageId: page.getPageId(),
      });
    }
  }

  /**
   * Handle page unmount
   */
  async onPageUnmount(page: PageOrchestrationInterface): Promise<void> {
    try {
      if (this.frenlyIntegration) {
        // Save state
        await this.frenlyIntegration.saveState();

        // Cleanup
        await this.frenlyIntegration.cleanup();
      }

      // Emit unmount event
      await this.emitPageEvent({
        type: 'unmount',
        pageId: page.getPageId(),
        timestamp: Date.now(),
      });

      this.currentPage = null;

      logger.info('Page unmounted', { pageId: page.getPageId() });
    } catch (error) {
      logger.error('Error on page unmount', {
        error,
        pageId: page.getPageId(),
      });
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    featureId: string,
    action: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      if (this.frenlyIntegration) {
        await this.frenlyIntegration.handlePageEvents([
          {
            type: 'feature-used',
            pageId: this.currentPage?.getPageId() || 'unknown',
            timestamp: Date.now(),
            data: {
              featureId,
              action,
              ...data,
            },
          },
        ]);
      }
    } catch (error) {
      logger.error('Error tracking feature usage', { error });
    }
  }

  /**
   * Track feature error
   */
  async trackFeatureError(featureId: string, error: Error): Promise<void> {
    try {
      if (this.frenlyIntegration) {
        await this.frenlyIntegration.handlePageEvents([
          {
            type: 'feature-error',
            pageId: this.currentPage?.getPageId() || 'unknown',
            timestamp: Date.now(),
            data: {
              featureId,
              error: {
                message: error.message,
                stack: error.stack,
              },
            },
          },
        ]);
      }
    } catch (error) {
      logger.error('Error tracking feature error', { error });
    }
  }

  /**
   * Track user action
   */
  async trackUserAction(
    action: string,
    target?: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      if (this.frenlyIntegration) {
        await this.frenlyIntegration.handlePageEvents([
          {
            type: 'user-action',
            pageId: this.currentPage?.getPageId() || 'unknown',
            timestamp: Date.now(),
            data: {
              action,
              target,
              ...data,
            },
          },
        ]);
      }
    } catch (error) {
      logger.error('Error tracking user action', { error });
    }
  }

  /**
   * Get current page
   */
  getCurrentPage(): PageOrchestrationInterface | null {
    return this.currentPage;
  }

  /**
   * Get Frenly integration
   */
  getFrenlyIntegration(): PageFrenlyIntegration | null {
    return this.frenlyIntegration || null;
  }

  /**
   * Emit page event
   */
  private async emitPageEvent(event: PageEvent): Promise<void> {
    // Emit to window for global listeners
    window.dispatchEvent(
      new CustomEvent('page:event', {
        detail: event,
      })
    );

    // Handle with Frenly integration if available
    if (this.frenlyIntegration) {
      await this.frenlyIntegration.handlePageEvents([event]);
    }
  }

  /**
   * Check if message should be generated
   */
  private shouldGenerateMessage(changes: Partial<PageContext>): boolean {
    // Generate message for significant changes
    const significantKeys = ['currentStep', 'completedSteps', 'workflowState', 'error', 'progress'];
    return significantKeys.some((key) => key in changes);
  }

  /**
   * Set up global event listeners
   */
  private setupGlobalEventListeners(): void {
    // Listen for feature errors
    window.addEventListener('feature:error', ((event: CustomEvent) => {
      const { featureId, error } = event.detail;
      this.trackFeatureError(featureId, error);
    }) as EventListener);

    // Listen for feature usage
    window.addEventListener('feature:used', ((event: CustomEvent) => {
      const { featureId, action, data } = event.detail;
      this.trackFeatureUsage(featureId, action, data);
    }) as EventListener);

    // Listen for user actions
    window.addEventListener('user:action', ((event: CustomEvent) => {
      const { action, target, data } = event.detail;
      this.trackUserAction(action, target, data);
    }) as EventListener);
  }
}

// Singleton instance
let lifecycleManagerInstance: PageLifecycleManager | null = null;

export function getPageLifecycleManager(): PageLifecycleManager {
  if (!lifecycleManagerInstance) {
    lifecycleManagerInstance = new PageLifecycleManager();
  }
  return lifecycleManagerInstance;
}
