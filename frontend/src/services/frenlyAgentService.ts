/**
 * Frenly Agent Service - Frontend Integration
 *
 * Provides a frontend service wrapper for integrating with the FrenlyGuidanceAgent.
 * This service handles communication between React components and the agent backend.
 */

import {
  FrenlyGuidanceAgent,
  MessageContext,
  GeneratedMessage,
} from '../../../agents/guidance/FrenlyGuidanceAgent';
import { logger } from './logger';

// Import NLU service directly
let nluService: {
  processQuery?: (query: string) => Promise<unknown>;
  understand?: (query: string) => Promise<unknown>;
  generateResponse?: (intent: string) => Promise<unknown>;
} | null = null;
const getNLUService = async () => {
  if (!nluService) {
    const module = await import('./nluService');
    nluService = module.nluService;
  }
  return nluService;
};

export interface FrenlyAgentServiceConfig {
  apiEndpoint?: string;
  enableCache?: boolean;
  cacheTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
}

class FrenlyAgentService {
  private static instance: FrenlyAgentService;
  private agent: FrenlyGuidanceAgent;
  private config: FrenlyAgentServiceConfig;
  private requestDebounce: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly debounceDelay = 300; // 300ms debounce
  private readonly defaultMaxRetries = 3;
  private readonly defaultRetryDelay = 1000; // 1 second

  private constructor(config: FrenlyAgentServiceConfig = {}) {
    this.config = {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    // Initialize agent (in a real implementation, this would connect to backend)
    this.agent = new FrenlyGuidanceAgent();
    this.initializeAgent();
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const maxRetries = options.maxRetries ?? this.config.maxRetries ?? this.defaultMaxRetries;
    const retryDelay = options.retryDelay ?? this.config.retryDelay ?? this.defaultRetryDelay;
    const useExponentialBackoff = options.exponentialBackoff ?? true;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const delay = useExponentialBackoff ? retryDelay * Math.pow(2, attempt) : retryDelay;

          logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
            error: lastError,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Get fallback message when agent fails
   */
  private getFallbackMessage(context: MessageContext): GeneratedMessage {
    const pageMessages: Record<string, string> = {
      '/projects': "Ready to create a project? Click 'New Project' to get started!",
      '/ingestion': 'Upload your data files to begin the reconciliation process.',
      '/reconciliation': 'Configure matching rules to find matching records.',
      '/adjudication': 'Review and resolve discrepancies in your data.',
      '/visualization': 'Create visualizations to understand your data better.',
      '/summary': 'Generate comprehensive reports from your reconciliation results.',
    };

    const defaultMessage =
      "I'm here to help! Feel free to ask me anything about the reconciliation process.";

    return {
      id: `fallback_${Date.now()}`,
      type: 'tip',
      content: pageMessages[context.page || ''] || defaultMessage,
      priority: 'low',
      timestamp: new Date(),
      context,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: FrenlyAgentServiceConfig): FrenlyAgentService {
    if (!FrenlyAgentService.instance) {
      FrenlyAgentService.instance = new FrenlyAgentService(config);
    }
    return FrenlyAgentService.instance;
  }

  /**
   * Initialize the agent with retry mechanism
   */
  private async initializeAgent(): Promise<void> {
    try {
      await this.retryWithBackoff(
        async () => {
          await this.agent.initialize();
          await this.agent.start();
        },
        {
          maxRetries: 5,
          retryDelay: 2000,
          exponentialBackoff: true,
        }
      );
      logger.info('FrenlyGuidanceAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize FrenlyGuidanceAgent after retries:', { error });
      // Agent will work in degraded mode with fallback messages
    }
  }

  /**
   * Generate an intelligent message based on context with debouncing and retry
   */
  async generateMessage(context: MessageContext): Promise<GeneratedMessage> {
    // Create debounce key
    const debounceKey = `${context.userId}_${context.page}_${context.progress?.completedSteps.length || 0}`;

    // Clear existing debounce
    const existingDebounce = this.requestDebounce.get(debounceKey);
    if (existingDebounce) {
      clearTimeout(existingDebounce);
    }

    // Create debounced request with retry
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          // Try with retry mechanism
          const result = await this.retryWithBackoff(async () => {
            const execResult = await this.agent.execute(context);
            if (!execResult.success) {
              throw new Error('Agent execution failed');
            }
            return execResult;
          });

          if (result.data) {
            resolve((result.data as { message: GeneratedMessage }).message);
          } else {
            throw new Error('No message data returned');
          }
        } catch (error) {
          logger.error('Error generating message after retries:', { error });

          // Graceful degradation - return fallback message
          try {
            const fallbackMessage = this.getFallbackMessage(context);
            logger.info('Using fallback message', { context: context.page });
            resolve(fallbackMessage);
          } catch (fallbackError) {
            logger.error('Fallback message generation failed:', { error: fallbackError });
            reject(error);
          }
        } finally {
          this.requestDebounce.delete(debounceKey);
        }
      }, this.debounceDelay);

      this.requestDebounce.set(debounceKey, timeout);
    });
  }

  /**
   * Record user feedback on a message
   */
  async recordFeedback(
    userId: string,
    messageId: string,
    feedback: 'helpful' | 'not-helpful' | 'dismissed'
  ): Promise<void> {
    try {
      await this.agent.recordFeedback(userId, messageId, feedback);
    } catch (error) {
      logger.error('Error recording feedback:', { error });
      throw error;
    }
  }

  /**
   * Handle user query with NLU and retry mechanism
   */
  async handleUserQuery(
    userId: string,
    query: string,
    context?: MessageContext
  ): Promise<GeneratedMessage> {
    const fullContext: MessageContext = context || { userId };

    try {
      // Use agent's handleUserQuery method with retry
      return await this.retryWithBackoff(async () => {
        return await this.agent.handleUserQuery(userId, query, context);
      });
    } catch (error) {
      logger.error('Error handling user query after retries:', { error });

      // Fallback to NLU service directly
      try {
        const nlu = await getNLUService();
        const understanding = await nlu.understand(query, context);
        const response = await nlu.generateResponse(understanding.intent, query, context);

        return {
          id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: understanding.intent === 'error' ? 'warning' : 'help',
          content: response,
          priority: understanding.confidence > 0.8 ? 'high' : 'medium',
          timestamp: new Date(),
          context: fullContext,
        };
      } catch (fallbackError) {
        logger.error('Fallback NLU error:', { error: fallbackError });

        // Final fallback - generic helpful message
        return {
          id: `fallback_query_${Date.now()}`,
          type: 'help',
          content:
            "I'm having trouble understanding that right now. Could you try rephrasing your question? I'm here to help with reconciliation tasks, project management, and data processing.",
          priority: 'medium',
          timestamp: new Date(),
          context: fullContext,
        };
      }
    }
  }

  /**
   * Track user interaction
   */
  async trackInteraction(userId: string, action: string, messageId?: string): Promise<void> {
    try {
      await this.agent.trackInteraction(userId, action, messageId);
    } catch (error) {
      logger.error('Error tracking interaction:', { error });
      throw error;
    }
  }

  /**
   * Get agent status
   */
  getStatus() {
    return this.agent.getStatus();
  }

  /**
   * Get agent metrics
   */
  getMetrics() {
    return this.agent.getMetrics();
  }

  /**
   * Sync page state with Frenly AI
   */
  async syncPageState(data: {
    pageId: string;
    state: Record<string, unknown>;
    timestamp: number;
  }): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        // Track page state sync
        await this.agent.trackInteraction(
          data.state.userId || 'unknown',
          'page_state_sync',
          data.pageId
        );
      });
    } catch (error) {
      logger.error('Error syncing page state:', { error });
      // Don't throw - sync failures shouldn't break the page
    }
  }

  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(data: {
    pageId: string;
    completedSteps: string[];
    currentStep: string | null;
  }): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        // Track onboarding progress
        const userId = localStorage.getItem('userId') || 'unknown';
        await this.agent.trackInteraction(userId, 'onboarding_progress', JSON.stringify(data));
      });
    } catch (error) {
      logger.error('Error updating onboarding progress:', { error });
    }
  }

  /**
   * Update workflow state
   */
  async updateWorkflowState(data: {
    workflowId: string;
    currentStep: string;
    progress: number;
    completedSteps: string[];
  }): Promise<void> {
    try {
      await this.retryWithBackoff(async () => {
        // Track workflow state
        const userId = localStorage.getItem('userId') || 'unknown';
        await this.agent.trackInteraction(userId, 'workflow_state', JSON.stringify(data));
      });
    } catch (error) {
      logger.error('Error updating workflow state:', { error });
    }
  }

  /**
   * Generate onboarding message
   */
  async generateOnboardingMessage(data: {
    pageId: string;
    progress: {
      completedSteps: string[];
      currentStep: string | null;
      totalSteps: number;
    };
  }): Promise<GeneratedMessage> {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const context: MessageContext = {
        userId,
        page: data.pageId,
        progress: {
          completedSteps: data.progress.completedSteps,
          totalSteps: data.progress.totalSteps,
          currentStep: data.progress.currentStep || undefined,
        },
      };
      return await this.generateMessage(context);
    } catch (error) {
      logger.error('Error generating onboarding message:', { error });
      return this.getFallbackMessage({ userId: 'unknown', page: data.pageId });
    }
  }

  /**
   * Generate workflow message
   */
  async generateWorkflowMessage(data: {
    workflowId: string;
    state: {
      currentStep: string;
      progress: number;
      completedSteps: string[];
      totalSteps: number;
    };
  }): Promise<GeneratedMessage> {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      const context: MessageContext = {
        userId,
        page: data.workflowId,
        progress: {
          completedSteps: data.state.completedSteps,
          totalSteps: data.state.totalSteps,
          currentStep: data.state.currentStep,
        },
      };
      return await this.generateMessage(context);
    } catch (error) {
      logger.error('Error generating workflow message:', { error });
      return this.getFallbackMessage({ userId: 'unknown', page: data.workflowId });
    }
  }

  /**
   * Track page view
   */
  async trackPageView(pageId: string): Promise<void> {
    try {
      const userId = localStorage.getItem('userId') || 'unknown';
      await this.trackInteraction(userId, 'page_view', pageId);
    } catch (error) {
      logger.error('Error tracking page view:', { error });
    }
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    try {
      await this.agent.stop();
      await this.agent.cleanup();
    } catch (error) {
      logger.error('Error shutting down FrenlyAgentService:', { error });
    }
  }
}

// Export singleton instance
export const frenlyAgentService = FrenlyAgentService.getInstance();

// Export class for testing
export { FrenlyAgentService };
