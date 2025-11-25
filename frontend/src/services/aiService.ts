/**
 * AI Service - Secure Backend Proxy Integration
 *
 * Provides AI model integration through secure backend endpoints.
 * Prevents API key exposure in frontend.
 */

// Logger stub
const logger = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};
import { apiClient } from './apiClient';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';
export type AIModel = string;

export interface AIConfig {
  provider?: AIProvider;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
}

export interface AIPrompt {
  user: string;
  provider?: AIProvider;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  response: string;
  provider: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface AIChatResponse {
  success: boolean;
  data?: AIResponse;
  error?: string;
}

export interface NLUIntent {
  intent: string;
  confidence: number;
  entities?: Record<string, string>;
  parameters?: Record<string, unknown>;
}

class AIService {
  private static instance: AIService;
  private responseCache: Map<string, { response: AIResponse; timestamp: number }> = new Map();
  private readonly maxCacheSize = 200;
  private readonly cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate AI response through secure backend endpoint
   */
  async generateResponse(prompt: AIPrompt): Promise<AIResponse> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(prompt);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        logger.info('AI Service: Using cached response');
        return cached;
      }

      // Make request to secure backend endpoint
      const response = (await apiClient.post('/ai/chat', {
        message: prompt.user,
        provider: prompt.provider,
        model: prompt.model,
        temperature: prompt.temperature,
        max_tokens: prompt.maxTokens,
      })) as any;

      if (!response.success || !response.data) {
        throw new Error(
          typeof response.error === 'string' ? response.error : 'AI service request failed'
        );
      }

      // Cache the response
      this.setCachedResponse(cacheKey, response.data);

      if (response.data) {
        return response.data!;
      } else {
        throw new Error('No response data received from AI service');
      }
    } catch (error) {
      logger.error('AI Service: Failed to generate response', error);
      throw error;
    }
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<{ status: string; providers: Record<string, boolean> }> {
    try {
      const response = await apiClient.get('/ai/health');
      return response as any;
    } catch (error) {
      logger.error('AI Service: Health check failed', error);
      return {
        status: 'unhealthy',
        providers: { openai: false, anthropic: false, gemini: false },
      };
    }
  }

  /**
   * Simple NLU intent detection (placeholder for future implementation)
   */
  async detectIntent(text: string): Promise<NLUIntent> {
    // This is a simplified implementation
    // In a real application, this would use more sophisticated NLU
    const lowerText = text.toLowerCase();

    if (lowerText.includes('help') || lowerText.includes('support')) {
      return {
        intent: 'help_request',
        confidence: 0.8,
        entities: {},
      };
    }

    if (lowerText.includes('create') || lowerText.includes('new')) {
      return {
        intent: 'create_request',
        confidence: 0.7,
        entities: {},
      };
    }

    return {
      intent: 'general_query',
      confidence: 0.5,
      entities: {},
    };
  }

  /**
   * Generate cache key for prompt
   */
  private generateCacheKey(prompt: AIPrompt): string {
    const keyData = {
      user: prompt.user,
      provider: prompt.provider || 'openai',
      model: prompt.model,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
    };
    return btoa(JSON.stringify(keyData));
  }

  /**
   * Get cached response if valid
   */
  private getCachedResponse(key: string): AIResponse | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
      return cached.response;
    }
    if (cached) {
      this.responseCache.delete(key);
    }
    return null;
  }

  /**
   * Cache response
   */
  private setCachedResponse(key: string, response: AIResponse): void {
    // Clean up old entries if cache is full
    if (this.responseCache.size >= this.maxCacheSize) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) {
        this.responseCache.delete(oldestKey);
      }
    }

    this.responseCache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear response cache
   */
  clearCache(): void {
    this.responseCache.clear();
    logger.info('AI Service: Cache cleared');
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Legacy exports for backward compatibility
export default aiService;
