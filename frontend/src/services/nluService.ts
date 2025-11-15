/**
 * Natural Language Understanding Service
 * 
 * Provides intent recognition and entity extraction for user queries.
 */

import { aiService, NLUIntent } from './aiService';
import { logger } from './logger';

export interface QueryContext {
  userId?: string;
  page?: string;
  progress?: {
    completedSteps: string[];
    totalSteps: number;
  };
  recentActions?: string[];
}

export interface UnderstandingResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  parameters: Record<string, unknown>;
  suggestedAction?: string;
  response?: string;
}

class NLUService {
  private static instance: NLUService;
  private intentPatterns: Map<string, RegExp[]> = new Map();

  private constructor() {
    this.initializeIntentPatterns();
  }

  static getInstance(): NLUService {
    if (!NLUService.instance) {
      NLUService.instance = new NLUService();
    }
    return NLUService.instance;
  }

  /**
   * Initialize intent recognition patterns
   */
  private initializeIntentPatterns(): void {
    // Help intent patterns
    this.intentPatterns.set('help', [
      /help|how|what|can you|could you|explain|tell me/i,
      /how do i|how to|what is|what are/i,
    ]);

    // Navigation intent patterns
    this.intentPatterns.set('navigation', [
      /go to|navigate to|open|show me|take me/i,
      /project|reconciliation|dashboard|settings/i,
    ]);

    // Action intent patterns
    this.intentPatterns.set('action', [
      /create|new|add|make|build/i,
      /delete|remove|cancel/i,
      /update|edit|change|modify/i,
      /start|begin|run|execute/i,
    ]);

    // Search intent patterns
    this.intentPatterns.set('search', [
      /search|find|look for|locate/i,
      /where is|where are|show all/i,
    ]);

    // Information intent patterns
    this.intentPatterns.set('information', [
      /what is|what are|tell me about|information/i,
      /explain|describe|details/i,
    ]);

    // Error intent patterns
    this.intentPatterns.set('error', [
      /error|problem|issue|bug|failed|broken/i,
      /doesn't work|not working|can't|cannot/i,
    ]);
  }

  /**
   * Understand user query
   */
  async understand(query: string, context?: QueryContext): Promise<UnderstandingResult> {
    try {
      // Try AI-powered understanding first
      if (aiService.isAvailable()) {
        const aiIntent = await aiService.understandIntent(query, context);
        
        if (aiIntent.confidence > 0.6) {
          return {
            intent: aiIntent.intent,
            confidence: aiIntent.confidence,
            entities: aiIntent.entities || {},
            parameters: aiIntent.parameters || {},
            suggestedAction: this.getSuggestedAction(aiIntent.intent, context),
          };
        }
      }

      // Fallback to pattern matching
      return this.patternBasedUnderstanding(query, context);
    } catch (error) {
      logger.error('NLU understanding error:', error);
      return this.patternBasedUnderstanding(query, context);
    }
  }

  /**
   * Pattern-based intent understanding
   */
  private patternBasedUnderstanding(query: string, context?: QueryContext): UnderstandingResult {
    const lowerQuery = query.toLowerCase();
    let bestIntent = 'help';
    let bestConfidence = 0.5;
    const entities: Record<string, string> = {};
    const parameters: Record<string, unknown> = {};

    // Check each intent pattern
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      let matchCount = 0;
      
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        const confidence = Math.min(0.9, 0.5 + (matchCount * 0.1));
        if (confidence > bestConfidence) {
          bestIntent = intent;
          bestConfidence = confidence;
        }
      }
    }

    // Extract entities
    this.extractEntities(query, entities, parameters);

    return {
      intent: bestIntent,
      confidence: bestConfidence,
      entities,
      parameters,
      suggestedAction: this.getSuggestedAction(bestIntent, context),
    };
  }

  /**
   * Extract entities from query
   */
  private extractEntities(
    query: string,
    entities: Record<string, string>,
    parameters: Record<string, unknown>
  ): void {
    const lowerQuery = query.toLowerCase();

    // Extract page/feature names
    const features = ['dashboard', 'project', 'reconciliation', 'settings', 'analytics'];
    for (const feature of features) {
      if (lowerQuery.includes(feature)) {
        entities.feature = feature;
        parameters.target = feature;
      }
    }

    // Extract action verbs
    if (lowerQuery.includes('create') || lowerQuery.includes('new')) {
      entities.action = 'create';
      parameters.action = 'create';
    } else if (lowerQuery.includes('delete') || lowerQuery.includes('remove')) {
      entities.action = 'delete';
      parameters.action = 'delete';
    } else if (lowerQuery.includes('update') || lowerQuery.includes('edit')) {
      entities.action = 'update';
      parameters.action = 'update';
    }

    // Extract project names (quoted strings)
    const projectMatch = query.match(/"([^"]+)"/);
    if (projectMatch) {
      entities.projectName = projectMatch[1];
      parameters.projectName = projectMatch[1];
    }
  }

  /**
   * Get suggested action based on intent
   */
  private getSuggestedAction(intent: string, context?: QueryContext): string {
    switch (intent) {
      case 'help':
        return 'Show help content';
      case 'navigation':
        return 'Navigate to page';
      case 'action':
        return 'Perform action';
      case 'search':
        return 'Search content';
      case 'information':
        return 'Display information';
      case 'error':
        return 'Show error help';
      default:
        return 'Provide guidance';
    }
  }

  /**
   * Generate contextual response based on understanding
   */
  async generateResponse(
    intent: string,
    query: string,
    context?: QueryContext
  ): Promise<string> {
    try {
      if (aiService.isAvailable()) {
        const prompt = {
          system: `You are Frenly, a helpful AI assistant for a reconciliation platform.
Generate a friendly, helpful response based on the user's intent and query.
Be concise, conversational, and action-oriented.`,
          user: `Intent: ${intent}\nQuery: ${query}\nContext: ${JSON.stringify(context || {})}`,
        };

        const response = await aiService.generateText(prompt);
        return response.content;
      }
    } catch (error) {
      logger.error('Response generation error:', error);
    }

    // Fallback responses
    return this.getFallbackResponse(intent, query);
  }

  /**
   * Get fallback response
   */
  private getFallbackResponse(intent: string, query: string): string {
    switch (intent) {
      case 'help':
        return "I'm here to help! What would you like to know about reconciliation?";
      case 'navigation':
        return "I can help you navigate! Which page would you like to go to?";
      case 'action':
        return "I can help you with that action! What would you like to create or modify?";
      case 'search':
        return "I can help you search! What are you looking for?";
      case 'information':
        return "I'd be happy to share information! What would you like to know?";
      case 'error':
        return "I'm sorry you're experiencing an issue! Can you describe the error in more detail?";
      default:
        return "I'm Frenly, your AI assistant! How can I help you today?";
    }
  }
}

// Export singleton instance
export const nluService = NLUService.getInstance();

// Export class for testing
export { NLUService };

