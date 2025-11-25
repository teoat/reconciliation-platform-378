/**
 * Frenly Guidance Agent - Intelligent User Guidance System
 *
 * Provides context-aware, intelligent guidance messages to users based on their
 * current page, progress, behavior, and preferences. Learns from user feedback
 * to improve future messaging.
 *
 * Priority: HIGH - Core User Experience Agent
 */

import {
  MetaAgent,
  AgentType,
  AutonomyLevel,
  ExecutionContext,
  AgentResult,
  AgentMetrics,
  AgentStatus,
  AgentStatusInfo,
  HILContext,
  HILResponse,
} from '../core/types';
import { agentBus } from '../core/bus';
import { logger } from '../../frontend/src/services/logger';

// Import services for integration
let helpContentService: any = null;
let onboardingService: any = null;
let aiService: any = null;
let nluService: any = null;
let mcpIntegrationService: any = null;

// Lazy load services to avoid circular dependencies
const getHelpContentService = async () => {
  if (!helpContentService) {
    const module = await import('../../frontend/src/services/helpContentService');
    helpContentService = module.helpContentService;
  }
  return helpContentService;
};

const getOnboardingService = async () => {
  if (!onboardingService) {
    const module = await import('../../frontend/src/services/onboardingService');
    onboardingService = module.onboardingService;
  }
  return onboardingService;
};

const getAIService = async () => {
  if (!aiService) {
    const module = await import('../../frontend/src/services/aiService');
    aiService = module.aiService;
  }
  return aiService;
};

const getNLUService = async () => {
  if (!nluService) {
    const module = await import('../../frontend/src/services/nluService');
    nluService = module.nluService;
  }
  return nluService;
};

const getMCPIntegrationService = async () => {
  if (!mcpIntegrationService) {
    const module = await import('../../frontend/src/services/mcpIntegrationService');
    mcpIntegrationService = module.mcpIntegrationService;
  }
  return mcpIntegrationService;
};

export interface MessageContext {
  userId: string;
  page?: string;
  progress?: {
    completedSteps: string[];
    totalSteps: number;
    currentStep?: string;
  };
  preferences?: {
    communicationStyle?: 'brief' | 'detailed' | 'conversational';
    messageFrequency?: 'low' | 'medium' | 'high';
  };
  behavior?: {
    sessionDuration?: number;
    actionsPerformed?: number;
    errors?: number;
  };
}

export interface GeneratedMessage {
  id: string;
  type: 'greeting' | 'tip' | 'warning' | 'celebration' | 'help';
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  context: MessageContext;
}

export interface UserBehavior {
  userId: string;
  messageInteractions: Array<{
    messageId: string;
    feedback?: 'helpful' | 'not-helpful' | 'dismissed';
    timestamp: Date;
  }>;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferences: MessageContext['preferences'];
  lastInteraction: Date;
}

export class FrenlyGuidanceAgent implements MetaAgent {
  readonly name = 'frenly-guidance';
  readonly type: AgentType = 'guidance';
  readonly autonomyLevel: AutonomyLevel = 'partial';

  private behaviors: Map<string, UserBehavior> = new Map();
  private messageHistory: Map<string, GeneratedMessage[]> = new Map();
  private status: AgentStatus = 'idle';
  private agentMetrics: AgentMetrics = {
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastExecutionTime: new Date(),
    errors: 0,
    warnings: 0,
    hilRequests: 0,
    autoDecisions: 0,
  };

  private executionHistory: Array<{ timestamp: Date; duration: number; success: boolean }> = [];
  private readonly maxHistorySize = 1000;
  private readonly messageCache: Map<string, { message: GeneratedMessage; accessTime: number }> = new Map();
  private readonly maxCacheSize = 500;
  private readonly behaviorMaxSize = 1000; // Max behaviors to store
  private readonly interactionMaxHistory = 100; // Max interactions per user
  private cleanupTimer: NodeJS.Timeout | null = null;
  private pendingRequests: Map<string, Promise<GeneratedMessage>> = new Map(); // Request deduplication
  private mcpMonitoringTimer: NodeJS.Timeout | null = null;
  private lastMCPCheck: Date | null = null;
  private readonly mcpCheckInterval: number = parseInt(
    process.env.FRENLY_MCP_CHECK_INTERVAL || '300000',
    10
  ); // Default: 5 minutes, configurable via env

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    logger.info('Initializing FrenlyGuidanceAgent...');
    this.status = 'idle';

    // Subscribe to agent events
    agentBus.subscribe('agent.execution.complete', (event) => {
      if (event.agent !== this.name) {
        // Could react to other agent events
      }
    });

    // Start periodic cleanup
    this.startCleanupTimer();

    // Start periodic MCP monitoring
    this.startMCPMonitoring();

    logger.info('FrenlyGuidanceAgent initialized');
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.status === 'running') {
      logger.warning('FrenlyGuidanceAgent is already running');
      return;
    }

    logger.info('Starting FrenlyGuidanceAgent...');
    this.status = 'running';

    await agentBus.emit({
      type: 'agent.started',
      agent: this.name,
      timestamp: new Date(),
      data: { autonomyLevel: this.autonomyLevel },
    });

    logger.info('FrenlyGuidanceAgent started');
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    this.status = 'stopped';
    
    // Stop timers
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.mcpMonitoringTimer) {
      clearInterval(this.mcpMonitoringTimer);
      this.mcpMonitoringTimer = null;
    }
    
    logger.info('FrenlyGuidanceAgent stopped');

    await agentBus.emit({
      type: 'agent.stopped',
      agent: this.name,
      timestamp: new Date(),
    });
  }

  /**
   * Pause the agent
   */
  async pause(): Promise<void> {
    this.status = 'paused';
    logger.info('FrenlyGuidanceAgent paused');
  }

  /**
   * Resume the agent
   */
  async resume(): Promise<void> {
    if (this.status === 'paused') {
      this.status = 'running';
      logger.info('FrenlyGuidanceAgent resumed');
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stop();
    
    // Stop cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Perform final cleanup
    this.cleanupOldBehaviors();
    this.behaviors.clear();
    this.messageHistory.clear();
    this.messageCache.clear();
    this.pendingRequests.clear();
    
    logger.info('FrenlyGuidanceAgent cleaned up');
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Run cleanup every 6 hours
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldBehaviors();
      this.cleanupOldMessageHistory();
      this.cleanupOldCache();
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  /**
   * Start MCP monitoring
   */
  private startMCPMonitoring(): void {
    // MCP monitoring will be implemented when MCP integration is available
    // This is a placeholder to prevent compilation errors
    logger.debug('MCP monitoring not yet implemented');
  }

  /**
   * Cleanup old user behaviors
   */
  private cleanupOldBehaviors(): void {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    let removedCount = 0;

    for (const [userId, behavior] of this.behaviors.entries()) {
      const age = now - behavior.lastInteraction.getTime();
      
      // Remove behaviors older than 30 days
      if (age > maxAge) {
        this.behaviors.delete(userId);
        this.messageHistory.delete(userId);
        removedCount++;
      } else {
        // Trim interaction history
        if (behavior.messageInteractions.length > this.interactionMaxHistory) {
          behavior.messageInteractions = behavior.messageInteractions
            .slice(-this.interactionMaxHistory);
        }
      }
    }

    // If still too many, remove least recently used
    if (this.behaviors.size > this.behaviorMaxSize) {
      const entries = Array.from(this.behaviors.entries())
        .sort((a, b) => a[1].lastInteraction.getTime() - b[1].lastInteraction.getTime());
      
      const toRemove = this.behaviors.size - this.behaviorMaxSize;
      for (let i = 0; i < toRemove; i++) {
        const [userId] = entries[i];
        this.behaviors.delete(userId);
        this.messageHistory.delete(userId);
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} old user behaviors`);
    }
  }

  /**
   * Cleanup old message history
   */
  private cleanupOldMessageHistory(): void {
    for (const [userId, history] of this.messageHistory.entries()) {
      if (history.length > 100) {
        // Keep only last 100 messages per user
        this.messageHistory.set(userId, history.slice(-100));
      }
    }
  }

  /**
   * Cleanup old cache entries using LRU
   */
  private cleanupOldCache(): void {
    const now = Date.now();
    const maxCacheAge = 60 * 60 * 1000; // 1 hour

    // Remove expired entries
    for (const [key, entry] of this.messageCache.entries()) {
      const age = now - entry.accessTime;
      if (age > maxCacheAge) {
        this.messageCache.delete(key);
      }
    }

    // If still too many, remove least recently used
    if (this.messageCache.size > this.maxCacheSize) {
      const entries = Array.from(this.messageCache.entries())
        .sort((a, b) => a[1].accessTime - b[1].accessTime);
      
      const toRemove = this.messageCache.size - this.maxCacheSize;
      for (let i = 0; i < toRemove; i++) {
        this.messageCache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Execute message generation
   */
  async execute(context?: ExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.status = 'running';

    try {
      logger.debug('FrenlyGuidanceAgent executing message generation...');

      const messageContext = context as unknown as MessageContext | undefined;
      if (!messageContext || !messageContext.userId) {
        throw new Error('Message context with userId is required');
      }

      const message = await this.generateMessage(messageContext);

      const executionTime = Date.now() - startTime;
      this.recordExecution(executionTime, true);

      await agentBus.emit({
        type: 'agent.execution.complete',
        agent: this.name,
        timestamp: new Date(),
        data: { messageId: message.id, type: message.type },
      });

      return {
        success: true,
        executionTime,
        data: { message },
        metrics: this.agentMetrics,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordExecution(executionTime, false);
      this.status = 'error';

      logger.error('FrenlyGuidanceAgent execution failed', { error: String(error) });

      return {
        success: false,
        executionTime,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: this.agentMetrics,
      };
    } finally {
      this.status = 'idle';
    }
  }

  /**
   * Generate intelligent message based on context with request deduplication
   */
  async generateMessage(context: MessageContext): Promise<GeneratedMessage> {
    // Check cache first
    const cacheKey = this.getCacheKey(context);
    const cached = this.messageCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.message)) {
      // Update access time for LRU
      cached.accessTime = Date.now();
      return cached.message;
    }

    // Check for pending request (deduplication)
    const requestKey = `${cacheKey}_${context.progress?.completedSteps.length || 0}`;
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create request promise for deduplication
    const requestPromise = (async (): Promise<GeneratedMessage> => {
      try {
        // Get or create user behavior
        const behavior = this.getUserBehavior(context.userId);

        // Analyze context to determine message type and content
        const messageType = await this.determineMessageType(context, behavior);
        const content = await this.generateContent(messageType, context, behavior);

        const message: GeneratedMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: messageType,
          content,
          priority: this.determinePriority(context, behavior),
          timestamp: new Date(),
          context,
        };

        // Cache message with LRU tracking
        this.cacheMessage(cacheKey, message);

        return message;
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(requestKey);
      }
    })();

    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);
    
    // Track message in history after promise resolves
    requestPromise.then(message => {
      const userHistory = this.messageHistory.get(context.userId) || [];
      userHistory.push(message);
      if (userHistory.length > 100) {
        userHistory.shift();
      }
      this.messageHistory.set(context.userId, userHistory);
    });
    
    return requestPromise;
  }

  /**
   * Determine message type based on context with onboarding integration
   */
  private async determineMessageType(
    context: MessageContext,
    _behavior: UserBehavior
  ): Promise<GeneratedMessage['type']> {
    const progress = context.progress;

    // Check onboarding progress for better context awareness
    try {
      const onboardingSvc = await getOnboardingService();
      const onboardingProgress = onboardingSvc?.getProgress('initial');
      
      // If user hasn't completed onboarding, prioritize guidance
      if (onboardingProgress && !onboardingProgress.completedOnboarding) {
        if (onboardingProgress.currentStep) {
          return 'help';
        }
        return 'greeting';
      }
    } catch (error) {
      logger.debug('Error checking onboarding progress:', { error: error instanceof Error ? error.message : String(error) });
    }

    // Check for completion milestones
    if (progress && progress.completedSteps.length === progress.totalSteps) {
      return 'celebration';
    }

    // Check for errors
    if (context.behavior?.errors && context.behavior.errors > 0) {
      return 'warning';
    }

    // Check for slow progress
    if (progress && progress.completedSteps.length > 0) {
      const completionRate = progress.completedSteps.length / progress.totalSteps;
      if (
        completionRate < 0.3 &&
        context.behavior?.sessionDuration &&
        context.behavior.sessionDuration > 300000
      ) {
        return 'help';
      }
    }

    // Check if user is new
    if (!progress || progress.completedSteps.length === 0) {
      return 'greeting';
    }

    // Default to tip
    return 'tip';
  }

  /**
   * Generate message content with integrated help, onboarding, AI, and MCP insights
   */
  private async generateContent(
    type: GeneratedMessage['type'],
    context: MessageContext,
    _behavior: UserBehavior
  ): Promise<string> {
    const style = context.preferences?.communicationStyle || 'conversational';

    // Try to get MCP insights for system-aware messages
    let mcpInsight: string | null = null;
    try {
      const mcpService = await getMCPIntegrationService();
      if (mcpService?.isMCPAvailable()) {
        // Get performance summary for proactive insights
        const summary = await mcpService.getPerformanceSummary();
        
        // Generate insight message if there are recommendations
        if (summary.recommendations.length > 0 && (type === 'warning' || type === 'tip')) {
          mcpInsight = await mcpService.generateInsightMessage();
        }
      }
    } catch (error) {
      logger.debug('MCP integration failed, continuing without insights:', { error: error instanceof Error ? error.message : String(error) });
    }

    // Try AI generation first (if available)
    try {
      const aiContent = await this.generateWithAI(context, type, style, mcpInsight);
      if (aiContent) {
        return aiContent;
      }
    } catch (error) {
      logger.debug('AI generation failed, using fallback:', { error: error instanceof Error ? error.message : String(error) });
    }

    // Include MCP insight in warning/tip messages if available
    if (mcpInsight && (type === 'warning' || type === 'tip')) {
      return mcpInsight;
    }

    // Fallback to rule-based generation
    switch (type) {
      case 'greeting':
        return this.generateGreeting(context, style);

      case 'tip':
        return await this.generateTipWithHelp(context, style);

      case 'warning':
        return this.generateWarning(context, style);

      case 'celebration':
        return this.generateCelebration(context, style);

      case 'help':
        return await this.generateHelpWithContent(context, style);

      default:
        return this.generateGreeting(context, style);
    }
  }

  /**
   * Generate message using AI model with optional MCP insights
   */
  private async generateWithAI(
    context: MessageContext,
    messageType: GeneratedMessage['type'],
    style: string,
    mcpInsight?: string | null
  ): Promise<string> {
    try {
      const ai = await getAIService();
      
      if (!ai?.isAvailable()) {
        return null as any; // Fallback to non-AI generation
      }

      const systemPrompt = `You are Frenly, a friendly AI assistant for a reconciliation platform.
Generate a ${messageType} message for a user on the ${context.page || 'dashboard'} page.
User has completed ${context.progress?.completedSteps.length || 0} out of ${context.progress?.totalSteps || 0} steps.
Communication style: ${style}.
Be helpful, friendly, and concise.${mcpInsight ? `\nSystem insight available: ${mcpInsight}` : ''}`;

      const userPrompt = `Generate a ${messageType} message that:
- Matches the ${style} communication style
- Relates to the current page: ${context.page}
- Acknowledges progress if applicable
- Provides actionable guidance${mcpInsight ? `\n- Incorporates system insight: ${mcpInsight}` : ''}`;

      const response = await ai.generateText({
        system: systemPrompt,
        user: userPrompt,
        context: {
          page: context.page,
          progress: context.progress,
          preferences: context.preferences,
        },
      });

      return response.content;
    } catch (error) {
      logger.debug('AI generation error:', { error: error instanceof Error ? error.message : String(error) });
      return null as any; // Fallback
    }
  }

  /**
   * Generate tip with help content integration
   */
  private async generateTipWithHelp(context: MessageContext, style: string): Promise<string> {
    const page = context.page || 'dashboard';
    
    try {
      const helpService = await getHelpContentService();
      
      // Try to find relevant help content for the page
      const pageToFeature: Record<string, string> = {
        dashboard: 'dashboard',
        reconciliation: 'reconciliation',
        ingestion: 'data_ingestion',
        visualization: 'visualization',
        adjudication: 'adjudication',
      };
      
      const feature = pageToFeature[page] || page;
      const helpContents = helpService?.getContentByFeature(feature) || [];
      
      if (helpContents.length > 0) {
        // Get tips from help content
        const content = helpContents[0];
        if (content.tips && content.tips.length > 0) {
          const tip = content.tips[Math.floor(Math.random() * content.tips.length)];
          if (style === 'brief') {
            return `💡 ${tip.content}`;
          } else if (style === 'detailed') {
            return `Here's a helpful tip from our knowledge base: ${tip.content} This can help improve your workflow efficiency.`;
          } else {
            return `💡 Quick tip: ${tip.content} Need more help? Check out our help center!`;
          }
        }
      }
    } catch (error) {
      logger.debug('Error fetching help content:', { error: error instanceof Error ? error.message : String(error) });
    }
    
    // Fallback to default tip generation
    return this.generateTip(context, style);
  }

  /**
   * Generate help message with help content integration
   */
  private async generateHelpWithContent(context: MessageContext, style: string): Promise<string> {
    const progress = context.progress;
    const nextStep = progress?.completedSteps.length === 0 ? 'getting started' : 'the next step';

    try {
      const helpService = await getHelpContentService();
      const onboardingSvc = await getOnboardingService();
      
      // Get onboarding progress to provide contextual help
      if (context.userId) {
        const onboardingProgress = onboardingSvc?.getProgress('initial');
        
        if (onboardingProgress && onboardingProgress.currentStep) {
          // Search for help content related to current step
          const searchResults = helpService?.search(onboardingProgress.currentStep as string, 1) || [];
          if (searchResults.length > 0) {
            const helpContent = searchResults[0];
            if (style === 'brief') {
              return `Need help with ${nextStep}? Check: ${helpContent.title}`;
            } else if (style === 'detailed') {
              return `I noticed you might need assistance with ${nextStep}. Here's a detailed guide: ${helpContent.content} Related articles: ${helpContent.related?.join(', ') || 'none'}.`;
            } else {
              return `Hey! 👋 I'm here to help with ${nextStep}. Check out "${helpContent.title}" - it has step-by-step guidance! Want me to show you?`;
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Error fetching help content for guidance:', { error: error instanceof Error ? error.message : String(error) });
    }
    
    // Fallback to default help generation
    return this.generateHelp(context, style);
  }

  private generateGreeting(context: MessageContext, style: string): string {
    const page = context.page || 'dashboard';

    if (style === 'brief') {
      return `Welcome! Ready to get started on ${page}?`;
    } else if (style === 'detailed') {
      return `Welcome to the ${page} page! I'm here to help guide you through the reconciliation process. Let's start by familiarizing yourself with the key features on this page.`;
    } else {
      return `Hey there! 👋 Welcome to ${page}! I'm Frenly, your friendly AI guide. I'm here to help you navigate through the reconciliation process smoothly. Ready to dive in?`;
    }
  }

  private generateTip(context: MessageContext, style: string): string {
    const page = context.page || 'dashboard';
    const tips: Record<string, string[]> = {
      dashboard: [
        'Start by uploading your data files to begin the reconciliation process.',
        'Use the filters to quickly find specific records in your dashboard.',
        'Save your work frequently to avoid losing progress.',
      ],
      reconciliation: [
        'Adjust the tolerance levels to find the best matches for your data.',
        'Review matched records carefully before confirming.',
        'Use the bulk actions to process multiple records at once.',
      ],
      visualization: [
        'Try different chart types to understand your data better.',
        'Use date filters to analyze trends over time.',
        'Export your charts for reporting purposes.',
      ],
    };

    const pageTips = tips[page] || tips.dashboard;
    const tip = pageTips[Math.floor(Math.random() * pageTips.length)];

    if (style === 'brief') {
      return `💡 ${tip}`;
    } else if (style === 'detailed') {
      return `Here's a helpful tip: ${tip} This can help improve your workflow efficiency.`;
    } else {
      return `💡 Quick tip: ${tip} Need more help? Just ask!`;
    }
  }

  private generateWarning(_context: MessageContext, style: string): string {
    if (style === 'brief') {
      return '⚠️ Something went wrong. Need help?';
    } else if (style === 'detailed') {
      return 'I noticed an error occurred. Let me help you troubleshoot this issue. Common causes include data format issues or network connectivity problems.';
    } else {
      return "⚠️ Oops! Looks like something didn't work as expected. Don't worry though - I'm here to help you figure it out! Want me to guide you through fixing it?";
    }
  }

  private generateCelebration(_context: MessageContext, style: string): string {
    if (style === 'brief') {
      return '🎉 Congratulations! You did it!';
    } else if (style === 'detailed') {
      return 'Excellent work! You have successfully completed all the steps. Your reconciliation process is complete and ready for export.';
    } else {
      return "🎉 Wow! You've completed everything! Congratulations on finishing your reconciliation process. You're doing amazing! 🚀";
    }
  }

  private generateHelp(context: MessageContext, style: string): string {
    const progress = context.progress;
    const nextStep = progress?.completedSteps.length === 0 ? 'getting started' : 'the next step';

    if (style === 'brief') {
      return `Need help with ${nextStep}?`;
    } else if (style === 'detailed') {
      return `I noticed you might need assistance with ${nextStep}. Let me provide you with detailed guidance to help you proceed.`;
    } else {
      return `Hey! 👋 I'm here if you need help with ${nextStep}. Want me to walk you through it? I've got your back!`;
    }
  }

  /**
   * Determine message priority
   */
  private determinePriority(
    context: MessageContext,
    _behavior: UserBehavior
  ): GeneratedMessage['priority'] {
    if (context.behavior?.errors && context.behavior.errors > 0) {
      return 'high';
    }

    if (
      context.progress &&
      context.progress.completedSteps.length === context.progress.totalSteps
    ) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Get or create user behavior
   */
  private getUserBehavior(userId: string): UserBehavior {
    if (!this.behaviors.has(userId)) {
      this.behaviors.set(userId, {
        userId,
        messageInteractions: [],
        skillLevel: 'beginner',
        preferences: {},
        lastInteraction: new Date(),
      });
    }

    return this.behaviors.get(userId)!;
  }

  /**
   * Record user feedback
   */
  async recordFeedback(
    userId: string,
    messageId: string,
    feedback: 'helpful' | 'not-helpful' | 'dismissed'
  ): Promise<void> {
    const behavior = this.getUserBehavior(userId);

    behavior.messageInteractions.push({
      messageId,
      feedback,
      timestamp: new Date(),
    });

    behavior.lastInteraction = new Date();

    // Learn from feedback
    this.learnFromFeedback(userId, messageId, feedback);
  }

  /**
   * Learn from feedback to improve future messages
   */
  private learnFromFeedback(userId: string, messageId: string, feedback: string): void {
    const behavior = this.getUserBehavior(userId);

    // Update skill level based on interactions
    const helpfulCount = behavior.messageInteractions.filter(
      (i) => i.feedback === 'helpful'
    ).length;
    const totalCount = behavior.messageInteractions.length;

    if (totalCount > 10) {
      const helpfulRate = helpfulCount / totalCount;
      if (helpfulRate > 0.7) {
        behavior.skillLevel = 'advanced';
      } else if (helpfulRate > 0.4) {
        behavior.skillLevel = 'intermediate';
      }
    }

    // Track feedback for message improvement
    logger.debug(
      `FrenlyGuidanceAgent learned from feedback: ${userId} -> ${messageId} -> ${feedback}`
    );
  }

  /**
   * Handle user query with NLU
   */
  async handleUserQuery(userId: string, query: string, context?: MessageContext): Promise<GeneratedMessage> {
    try {
      const nlu = await getNLUService();
      const behavior = this.getUserBehavior(userId);
      
      // Understand user intent
      const understanding = await nlu.understand(query, {
        userId,
        page: context?.page,
        progress: context?.progress,
        recentActions: behavior.messageInteractions
          .slice(-5)
          .map(i => i.messageId),
      });

      // Generate response based on understanding
      const response = await nlu.generateResponse(understanding.intent, query, {
        userId,
        page: context?.page,
        progress: context?.progress,
      });

      // Create message from query response
      const message: GeneratedMessage = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.mapIntentToMessageType(understanding.intent),
        content: response,
        priority: understanding.confidence > 0.8 ? 'high' : 'medium',
        timestamp: new Date(),
        context: context || { userId },
      };

      // Track interaction
      behavior.messageInteractions.push({
        messageId: message.id,
        timestamp: new Date(),
      });

      return message;
    } catch (error) {
      logger.error('Error handling user query:', { error: error instanceof Error ? error.message : String(error) });
      
      // Fallback response
      return {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'help',
        content: "I'm sorry, I didn't understand that. Could you rephrase your question?",
        priority: 'medium',
        timestamp: new Date(),
        context: context || { userId },
      };
    }
  }

  /**
   * Map NLU intent to message type
   */
  private mapIntentToMessageType(intent: string): GeneratedMessage['type'] {
    const intentMap: Record<string, GeneratedMessage['type']> = {
      help: 'help',
      navigation: 'tip',
      action: 'tip',
      search: 'tip',
      information: 'tip',
      error: 'warning',
    };
    
    return intentMap[intent] || 'help';
  }

  /**
   * Track user interaction
   */
  async trackInteraction(userId: string, action: string, messageId?: string): Promise<void> {
    const behavior = this.getUserBehavior(userId);
    behavior.lastInteraction = new Date();

    // Update behavior based on action
    if (action === 'message_shown' && messageId) {
      // Track message view
      if (!behavior.messageInteractions.some((i) => i.messageId === messageId)) {
        behavior.messageInteractions.push({
          messageId,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatusInfo {
    return {
      name: this.name,
      status: this.status,
      lastExecution: this.agentMetrics.lastExecutionTime,
      metrics: this.agentMetrics,
      health:
        this.status === 'error' ? 'unhealthy' : this.status === 'running' ? 'healthy' : 'degraded',
    };
  }

  /**
   * Check if agent can handle context
   */
  canHandle(context: ExecutionContext): boolean {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    return context && typeof (context as any).userId === 'string';
  }

  /**
   * Get agent metrics
   */
  getMetrics(): AgentMetrics {
    return { ...this.agentMetrics };
  }

  /**
   * Check if HIL required
   */
  requiresHIL(_context: ExecutionContext): boolean {
    // Guidance agent typically doesn't require HIL
    // Only for critical user assistance scenarios
    return false;
  }

  /**
   * Request HIL (not typically used for guidance)
   */
  async requestHIL(_context: ExecutionContext, _hilContext: HILContext): Promise<HILResponse> {
    throw new Error('FrenlyGuidanceAgent does not use HIL requests');
  }

  /**
   * Learn from execution result
   */
  learnFromResult(result: AgentResult): void {
    // Update metrics based on result
    if (result.success) {
      this.agentMetrics.autoDecisions++;
    } else {
      this.agentMetrics.errors++;
    }
  }

  /**
   * Adapt strategy based on historical performance
   */
  async adaptStrategy(): Promise<void> {
    // Analyze message feedback patterns
    // Adjust message generation based on user preferences
    // Optimize content based on successful messages

    logger.debug('FrenlyGuidanceAgent adapting strategy based on historical performance');
  }

  /**
   * Get cache key for context
   */
  private getCacheKey(context: MessageContext): string {
    return `${context.userId}_${context.page}_${context.progress?.completedSteps.length || 0}`;
  }

  /**
   * Check if cached message is still valid (5 minutes)
   */
  private isCacheValid(message: GeneratedMessage): boolean {
    const age = Date.now() - message.timestamp.getTime();
    return age < 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Cache message with LRU tracking
   */
  private cacheMessage(key: string, message: GeneratedMessage): void {
    // Cleanup if needed
    if (this.messageCache.size >= this.maxCacheSize) {
      this.cleanupOldCache();
    }

    // Store with access time for LRU
    this.messageCache.set(key, {
      message,
      accessTime: Date.now(),
    });
  }

  /**
   * Record execution metrics
   */
  private recordExecution(duration: number, success: boolean): void {
    this.agentMetrics.totalExecutions++;
    this.executionHistory.push({
      timestamp: new Date(),
      duration,
      success,
    });

    // Trim history
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }

    // Update success rate
    const recentExecutions = this.executionHistory.slice(-100);
    const successCount = recentExecutions.filter((e) => e.success).length;
    this.agentMetrics.successRate = successCount / recentExecutions.length;

    // Update average execution time
    const totalTime = recentExecutions.reduce((sum, e) => sum + e.duration, 0);
    this.agentMetrics.averageExecutionTime = totalTime / recentExecutions.length;

    this.agentMetrics.lastExecutionTime = new Date();
  }
}

// Export singleton instance
export const frenlyGuidanceAgent = new FrenlyGuidanceAgent();
