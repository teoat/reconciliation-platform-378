/**
 * Page Frenly Integration - Core integration pattern for pages with Frenly AI
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import type {
  PageOrchestrationInterface,
  MessageContext,
  FrenlyMessage,
  PageContext,
  PageEvent,
  WorkflowState,
} from './types';

export class PageFrenlyIntegration {
  private pageOrchestration: PageOrchestrationInterface;
  private currentContext: MessageContext | null = null;
  private messageHistory: FrenlyMessage[] = [];
  private isInitialized = false;

  constructor(pageOrchestration: PageOrchestrationInterface) {
    this.pageOrchestration = pageOrchestration;
  }

  /**
   * Initialize integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Collect initial context
      this.currentContext = await this.collectPageContext();

      // Sync initial state
      await this.syncPageState();

      this.isInitialized = true;
      logger.info('PageFrenlyIntegration initialized', {
        pageId: this.pageOrchestration.getPageId(),
      });
    } catch (error) {
      logger.error('Failed to initialize PageFrenlyIntegration', { error });
      throw error;
    }
  }

  /**
   * Collect page context for Frenly AI
   */
  async collectPageContext(): Promise<MessageContext> {
    const metadata = this.pageOrchestration.getPageMetadata();
    const pageContext = this.pageOrchestration.getPageContext();
    const workflowState = this.pageOrchestration.getWorkflowState();

    // Get user ID
    const userId =
      localStorage.getItem('userId') ||
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }

    // Get session start time
    const sessionStart = localStorage.getItem('sessionStart');
    if (!sessionStart) {
      localStorage.setItem('sessionStart', Date.now().toString());
    }

    const context: MessageContext = {
      userId,
      page: metadata.id,
      progress: workflowState
        ? {
            completedSteps: workflowState.completedSteps,
            totalSteps: workflowState.totalSteps,
            currentStep: workflowState.currentStep,
          }
        : undefined,
      preferences: this.getUserPreferences(),
      behavior: {
        sessionDuration: sessionStart ? Date.now() - parseInt(sessionStart) : 0,
        actionsPerformed: this.getActionCount(),
        errors: this.getErrorCount(),
      },
      pageData: pageContext,
    };

    this.currentContext = context;
    return context;
  }

  /**
   * Generate contextual message from Frenly AI
   */
  async generateContextualMessage(): Promise<FrenlyMessage> {
    try {
      const context = await this.collectPageContext();

      // Generate message using Frenly agent service
      const agentMessage = await frenlyAgentService.generateMessage(context);

      // Convert to FrenlyMessage format
      const frenlyMessage: FrenlyMessage = {
        id: agentMessage.id,
        type: agentMessage.type === 'help' ? 'tip' : (agentMessage.type as FrenlyMessage['type']),
        content: agentMessage.content,
        timestamp: agentMessage.timestamp,
        page: context.page,
        priority: agentMessage.priority,
        dismissible: true,
        autoHide: agentMessage.type === 'greeting' ? 5000 : undefined,
      };

      // Track message shown
      await frenlyAgentService.trackInteraction(context.userId, 'message_shown', agentMessage.id);

      // Add to history
      this.messageHistory.push(frenlyMessage);
      if (this.messageHistory.length > 50) {
        this.messageHistory.shift();
      }

      return frenlyMessage;
    } catch (error) {
      logger.error('Error generating contextual message', { error });
      throw error;
    }
  }

  /**
   * Sync page state with Frenly AI
   */
  async syncPageState(): Promise<void> {
    try {
      const context = await this.collectPageContext();

      // Sync to Frenly agent service
      await frenlyAgentService.syncPageState({
        pageId: context.page || '',
        state: context.pageData || {},
        timestamp: Date.now(),
      });

      logger.debug('Page state synced', {
        pageId: context.page,
      });
    } catch (error) {
      logger.error('Error syncing page state', { error });
      // Don't throw - sync failures shouldn't break the page
    }
  }

  /**
   * Handle page events
   */
  async handlePageEvents(events: PageEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.handlePageEvent(event);
      } catch (error) {
        logger.error('Error handling page event', { error, event });
      }
    }
  }

  /**
   * Handle single page event
   */
  private async handlePageEvent(event: PageEvent): Promise<void> {
    const context = await this.collectPageContext();

    switch (event.type) {
      case 'mount':
        // Track page view
        await frenlyAgentService.trackInteraction(context.userId, 'page_view', event.pageId);
        // Generate welcome message
        const message = await this.generateContextualMessage();
        await this.showMessage(message);
        break;

      case 'update':
        // Update context and sync
        await this.syncPageState();
        // Generate contextual message if significant change
        if (this.shouldGenerateMessage(event.data)) {
          const updateMessage = await this.generateContextualMessage();
          await this.showMessage(updateMessage);
        }
        break;

      case 'feature-error':
        // Generate error recovery message
        const errorMessage = await this.generateErrorMessage(event);
        if (errorMessage) {
          await this.showMessage(errorMessage);
        }
        break;

      case 'user-action':
        // Track user action
        await frenlyAgentService.trackInteraction(context.userId, 'user_action', event.action);
        break;
    }
  }

  /**
   * Show message (delegates to Frenly provider)
   */
  async showMessage(message: FrenlyMessage): Promise<void> {
    // This will be handled by the FrenlyProvider context
    // For now, we'll emit an event that the provider can listen to
    window.dispatchEvent(
      new CustomEvent('frenly:show-message', {
        detail: message,
      })
    );
  }

  /**
   * Hide message
   */
  async hideMessage(messageId: string): Promise<void> {
    window.dispatchEvent(
      new CustomEvent('frenly:hide-message', {
        detail: { messageId },
      })
    );
  }

  /**
   * Update context with changes
   */
  async updateContext(changes: Partial<PageContext>): Promise<void> {
    if (this.currentContext?.pageData) {
      this.currentContext.pageData = {
        ...this.currentContext.pageData,
        ...changes,
      };
    }
    await this.syncPageState();
  }

  /**
   * Save state before unmount
   */
  async saveState(): Promise<void> {
    await this.syncPageState();
    // Save to localStorage if needed
    const state = {
      pageId: this.pageOrchestration.getPageId(),
      context: this.currentContext,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      `frenly:state:${this.pageOrchestration.getPageId()}`,
      JSON.stringify(state)
    );
  }

  /**
   * Cleanup on unmount
   */
  async cleanup(): Promise<void> {
    await this.saveState();
    this.currentContext = null;
    this.isInitialized = false;
  }

  /**
   * Generate error recovery message
   */
  private async generateErrorMessage(event: PageEvent): Promise<FrenlyMessage | null> {
    if (event.type !== 'feature-error') return null;

    const context = await this.collectPageContext();
    const errorData = event.data as { featureId: string; error: Error };

    // Generate helpful error message
    const message = await frenlyAgentService.generateMessage({
      ...context,
      behavior: {
        ...context.behavior,
        errors: (context.behavior?.errors || 0) + 1,
      },
    });

    return {
      id: message.id,
      type: 'warning',
      content: `I noticed an issue with ${errorData.featureId}. Let me help you fix it!`,
      timestamp: new Date(),
      page: context.page,
      priority: 'high',
      dismissible: true,
    };
  }

  /**
   * Check if message should be generated based on changes
   */
  private shouldGenerateMessage(changes?: Record<string, unknown>): boolean {
    if (!changes) return false;

    // Generate message for significant changes
    const significantKeys = ['currentStep', 'completedSteps', 'workflowState', 'error'];
    return significantKeys.some((key) => key in changes);
  }

  /**
   * Get user preferences
   */
  private getUserPreferences(): MessageContext['preferences'] {
    const prefs = localStorage.getItem('frenly:preferences');
    if (prefs) {
      try {
        return JSON.parse(prefs);
      } catch {
        // Fallback to defaults
      }
    }
    return {
      communicationStyle: 'conversational',
      messageFrequency: 'medium',
    };
  }

  /**
   * Get action count from session
   */
  private getActionCount(): number {
    const count = localStorage.getItem('frenly:actionCount');
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Get error count from session
   */
  private getErrorCount(): number {
    const count = localStorage.getItem('frenly:errorCount');
    return count ? parseInt(count, 10) : 0;
  }
}
