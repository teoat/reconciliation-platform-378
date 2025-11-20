/**
 * AI Service - OpenAI/Anthropic Integration
 *
 * Provides AI model integration for advanced message generation
 * and natural language understanding.
 */

import { logger } from './logger';

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'fallback';
export type AIModel = string;

export interface AIConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIPrompt {
  system?: string;
  user: string;
  context?: Record<string, unknown>;
  examples?: Array<{ input: string; output: string }>;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface NLUIntent {
  intent: string;
  confidence: number;
  entities?: Record<string, string>;
  parameters?: Record<string, unknown>;
}

class AIService {
  private static instance: AIService;
  private config: AIConfig;
  private apiKey: string | null = null;
  private responseCache: Map<string, { response: AIResponse; timestamp: number }> = new Map();
  private readonly maxCacheSize = 200;
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private pendingRequests: Map<string, Promise<AIResponse>> = new Map(); // Request deduplication

  private constructor() {
    // Default configuration
    this.config = {
      provider: 'fallback',
      model: 'default',
      temperature: 0.7,
      maxTokens: 500,
    };

    // Load API key from environment
    this.loadApiKey();

    // Start periodic cache cleanup
    this.startCacheCleanup();
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(
      () => {
        this.cleanupCache();
      },
      60 * 60 * 1000
    ); // Cleanup every hour
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.responseCache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.responseCache.delete(key));

    // If still too many, remove oldest
    if (this.responseCache.size > this.maxCacheSize) {
      const entries = Array.from(this.responseCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const toRemove = this.responseCache.size - this.maxCacheSize;
      for (let i = 0; i < toRemove; i++) {
        this.responseCache.delete(entries[i][0]);
      }
    }
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Load API key from environment
   */
  private loadApiKey(): void {
    // Try to load from environment variables
    if (typeof process !== 'undefined' && process.env) {
      this.apiKey =
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.VITE_OPENAI_API_KEY ||
        process.env.VITE_ANTHROPIC_API_KEY ||
        null;
    }

    // Try to load from localStorage as fallback
    if (!this.apiKey && typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('ai_api_key') || null;
    }
  }

  /**
   * Configure AI service
   */
  configure(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };

    // Update API key if provided
    if (config.apiKey) {
      this.apiKey = config.apiKey;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_api_key', config.apiKey);
      }
    }
  }

  /**
   * Generate text using AI model with caching and deduplication
   */
  async generateText(prompt: AIPrompt): Promise<AIResponse> {
    try {
      // Create cache key from prompt
      const cacheKey = this.getCacheKey(prompt);

      // Check cache
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.response;
      }

      // Check for pending request (deduplication)
      const pendingRequest = this.pendingRequests.get(cacheKey);
      if (pendingRequest) {
        return pendingRequest;
      }

      // Check if API key is available
      if (!this.apiKey && this.config.provider !== 'fallback') {
        logger.warn('AI API key not available, using fallback');
        return this.generateFallbackResponse(prompt);
      }

      // Create request promise
      const requestPromise = (async (): Promise<AIResponse> => {
        try {
          let response: AIResponse;

          // Route to appropriate provider
          switch (this.config.provider) {
            case 'openai':
              response = await this.generateWithOpenAI(prompt);
              break;
            case 'anthropic':
              response = await this.generateWithAnthropic(prompt);
              break;
            case 'gemini':
              response = await this.generateWithGemini(prompt);
              break;
            default:
              response = this.generateFallbackResponse(prompt);
          }

          // Cache response
          if (this.responseCache.size >= this.maxCacheSize) {
            this.cleanupCache();
          }
          this.responseCache.set(cacheKey, {
            response,
            timestamp: Date.now(),
          });

          return response;
        } finally {
          // Remove from pending requests
          this.pendingRequests.delete(cacheKey);
        }
      })();

      // Store pending request
      this.pendingRequests.set(cacheKey, requestPromise);

      return requestPromise;
    } catch (error) {
      logger.error('AI generation error:', error);
      return this.generateFallbackResponse(prompt);
    }
  }

  /**
   * Get cache key from prompt
   */
  private getCacheKey(prompt: AIPrompt): string {
    const promptStr = `${prompt.system || ''}_${prompt.user}_${JSON.stringify(prompt.context || {})}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < promptStr.length; i++) {
      const char = promptStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `ai_${hash}_${this.config.provider}_${this.config.model}`;
  }

  /**
   * Natural Language Understanding - Intent recognition
   */
  async understandIntent(query: string, context?: Record<string, unknown>): Promise<NLUIntent> {
    try {
      const prompt: AIPrompt = {
        system: `You are an intent recognition system for a reconciliation platform. 
Analyze user queries and identify the intent and extract entities.

Available intents:
- help: User needs help or guidance
- search: User wants to search for something
- action: User wants to perform an action (create, update, delete)
- navigation: User wants to navigate to a page
- information: User wants information about something
- error: User is reporting or asking about an error

Respond with JSON: {"intent": "intent_name", "confidence": 0.0-1.0, "entities": {}, "parameters": {}}`,
        user: query,
        context,
      };

      const response = await this.generateText(prompt);

      // Parse JSON response
      try {
        const parsed = JSON.parse(response.content);
        return {
          intent: parsed.intent || 'help',
          confidence: parsed.confidence || 0.5,
          entities: parsed.entities || {},
          parameters: parsed.parameters || {},
        };
      } catch {
        // Fallback intent recognition
        return this.fallbackIntentRecognition(query);
      }
    } catch (error) {
      logger.error('NLU error:', error);
      return this.fallbackIntentRecognition(query);
    }
  }

  /**
   * Generate response with OpenAI
   */
  private async generateWithOpenAI(prompt: AIPrompt): Promise<AIResponse> {
    const messages = [];

    if (prompt.system) {
      messages.push({ role: 'system', content: prompt.system });
    }

    messages.push({ role: 'user', content: prompt.user });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
      model: data.model,
      finishReason: data.choices[0]?.finish_reason,
    };
  }

  /**
   * Generate response with Anthropic
   */
  private async generateWithAnthropic(prompt: AIPrompt): Promise<AIResponse> {
    const messages = [
      { role: 'user', content: `${prompt.system ? `${prompt.system}\n\n` : ''}${prompt.user}` },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature || 0.7,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens || 0,
            completionTokens: data.usage.output_tokens || 0,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : undefined,
      model: data.model,
      finishReason: data.stop_reason,
    };
  }

  /**
   * Generate response with Gemini
   */
  private async generateWithGemini(prompt: AIPrompt): Promise<AIResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || 'gemini-pro'}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt.system ? `${prompt.system}\n\n` : ''}${prompt.user}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: this.config.temperature || 0.7,
            maxOutputTokens: this.config.maxTokens || 500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.candidates[0]?.content?.parts[0]?.text || '',
      model: this.config.model,
    };
  }

  /**
   * Fallback response generation (rule-based)
   */
  private generateFallbackResponse(prompt: AIPrompt): AIResponse {
    // Rule-based fallback that analyzes the prompt
    const userQuery = prompt.user.toLowerCase();

    if (userQuery.includes('help') || userQuery.includes('how')) {
      return {
        content: "I'm here to help! What would you like to know about reconciliation?",
      };
    }

    if (userQuery.includes('error') || userQuery.includes('problem')) {
      return {
        content:
          "Let me help you troubleshoot. Can you describe what error or problem you're experiencing?",
      };
    }

    if (userQuery.includes('create') || userQuery.includes('new')) {
      return {
        content:
          'I can help you create a new reconciliation project. Would you like step-by-step guidance?',
      };
    }

    // Default response
    return {
      content:
        "I'm Frenly, your AI assistant! I'm here to help you with reconciliation tasks. What would you like to do?",
    };
  }

  /**
   * Fallback intent recognition
   */
  private fallbackIntentRecognition(query: string): NLUIntent {
    const lowerQuery = query.toLowerCase();

    // Simple keyword-based intent recognition
    if (lowerQuery.includes('help') || lowerQuery.includes('how') || lowerQuery.includes('what')) {
      return { intent: 'help', confidence: 0.7 };
    }

    if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
      return { intent: 'search', confidence: 0.7 };
    }

    if (lowerQuery.includes('create') || lowerQuery.includes('new') || lowerQuery.includes('add')) {
      return { intent: 'action', confidence: 0.8, parameters: { action: 'create' } };
    }

    if (
      lowerQuery.includes('go to') ||
      lowerQuery.includes('navigate') ||
      lowerQuery.includes('open')
    ) {
      return { intent: 'navigation', confidence: 0.7 };
    }

    if (
      lowerQuery.includes('error') ||
      lowerQuery.includes('problem') ||
      lowerQuery.includes('issue')
    ) {
      return { intent: 'error', confidence: 0.8 };
    }

    return { intent: 'information', confidence: 0.5 };
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.apiKey !== null || this.config.provider === 'fallback';
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

// Export class for testing
export { AIService };
