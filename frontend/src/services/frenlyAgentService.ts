/**
 * Frenly Agent Service - Frontend Integration
 * 
 * Provides a frontend service wrapper for integrating with the FrenlyGuidanceAgent.
 * This service handles communication between React components and the agent backend.
 */

import { FrenlyGuidanceAgent, MessageContext, GeneratedMessage } from '../../../agents/guidance/FrenlyGuidanceAgent';
import { logger } from './logger';

// Import NLU service directly
let nluService: any = null;
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
}

class FrenlyAgentService {
  private static instance: FrenlyAgentService;
  private agent: FrenlyGuidanceAgent;
  private config: FrenlyAgentServiceConfig;
  private requestDebounce: Map<string, NodeJS.Timeout> = new Map();
  private readonly debounceDelay = 300; // 300ms debounce

  private constructor(config: FrenlyAgentServiceConfig = {}) {
    this.config = {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      ...config,
    };

    // Initialize agent (in a real implementation, this would connect to backend)
    this.agent = new FrenlyGuidanceAgent();
    this.initializeAgent();
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
   * Initialize the agent
   */
  private async initializeAgent(): Promise<void> {
    try {
      await this.agent.initialize();
      await this.agent.start();
    } catch (error) {
      logger.error('Failed to initialize FrenlyGuidanceAgent:', { error });
    }
  }

  /**
   * Generate an intelligent message based on context with debouncing
   */
  async generateMessage(context: MessageContext): Promise<GeneratedMessage> {
    // Create debounce key
    const debounceKey = `${context.userId}_${context.page}_${context.progress?.completedSteps.length || 0}`;
    
    // Clear existing debounce
    const existingDebounce = this.requestDebounce.get(debounceKey);
    if (existingDebounce) {
      clearTimeout(existingDebounce);
    }

    // Create debounced request
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await this.agent.execute(context as any);
          
          if (result.success && result.data) {
            resolve((result.data as { message: GeneratedMessage }).message);
          } else {
            reject(new Error('Failed to generate message'));
          }
        } catch (error) {
          logger.error('Error generating message:', { error });
          reject(error);
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
   * Handle user query with NLU
   */
  async handleUserQuery(
    userId: string,
    query: string,
    context?: MessageContext
  ): Promise<GeneratedMessage> {
    try {
      // Use agent's handleUserQuery method
      return await this.agent.handleUserQuery(userId, query, context);
    } catch (error) {
      logger.error('Error handling user query:', { error });
      
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
          context: context || { userId },
        };
      } catch (fallbackError) {
        logger.error('Fallback NLU error:', { error: fallbackError });
        throw error;
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

