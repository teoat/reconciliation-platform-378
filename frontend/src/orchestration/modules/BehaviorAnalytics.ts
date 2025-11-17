/**
 * Behavior Analytics Module - Tracks and analyzes user behavior
 */

import { logger } from '@/services/logger';

export interface UserBehavior {
  sessionDuration: number;
  actionsPerformed: number;
  errors: number;
  pagesVisited: string[];
  featuresUsed: string[];
  lastAction?: string;
  lastActionTime?: number;
}

export interface BehaviorPattern {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredFeatures: string[];
  commonErrors: string[];
  usageFrequency: 'low' | 'medium' | 'high';
}

export class BehaviorTracker {
  private behaviors: Map<string, UserBehavior> = new Map();

  /**
   * Track user interaction
   */
  trackInteraction(userId: string, action: string, data?: Record<string, unknown>): void {
    const behavior = this.getOrCreateBehavior(userId);
    behavior.actionsPerformed++;
    behavior.lastAction = action;
    behavior.lastActionTime = Date.now();

    if (data?.featureId && typeof data.featureId === 'string') {
      if (!behavior.featuresUsed.includes(data.featureId)) {
        behavior.featuresUsed.push(data.featureId);
      }
    }

    this.behaviors.set(userId, behavior);
    this.persistBehavior(userId, behavior);
  }

  /**
   * Track page visit
   */
  trackPageVisit(userId: string, pageId: string): void {
    const behavior = this.getOrCreateBehavior(userId);
    if (!behavior.pagesVisited.includes(pageId)) {
      behavior.pagesVisited.push(pageId);
    }
    this.behaviors.set(userId, behavior);
    this.persistBehavior(userId, behavior);
  }

  /**
   * Track error
   */
  trackError(userId: string): void {
    const behavior = this.getOrCreateBehavior(userId);
    behavior.errors++;
    this.behaviors.set(userId, behavior);
    this.persistBehavior(userId, behavior);
  }

  /**
   * Get user behavior
   */
  getUserBehavior(userId: string): UserBehavior {
    return this.getOrCreateBehavior(userId);
  }

  /**
   * Get or create behavior
   */
  private getOrCreateBehavior(userId: string): UserBehavior {
    const existing = this.behaviors.get(userId);
    if (existing) return existing;

    // Try to load from localStorage
    const stored = localStorage.getItem(`behavior:${userId}`);
    if (stored) {
      try {
        const behavior = JSON.parse(stored);
        this.behaviors.set(userId, behavior);
        return behavior;
      } catch (error) {
        logger.error('Error parsing stored behavior', { error, userId });
      }
    }

    // Create new behavior
    const behavior: UserBehavior = {
      sessionDuration: 0,
      actionsPerformed: 0,
      errors: 0,
      pagesVisited: [],
      featuresUsed: [],
    };
    this.behaviors.set(userId, behavior);
    return behavior;
  }

  /**
   * Persist behavior
   */
  private persistBehavior(userId: string, behavior: UserBehavior): void {
    try {
      localStorage.setItem(`behavior:${userId}`, JSON.stringify(behavior));
    } catch (error) {
      logger.error('Error persisting behavior', { error, userId });
    }
  }
}

export class BehaviorAnalyzer {
  /**
   * Analyze behavior patterns
   */
  analyzePatterns(behavior: UserBehavior): BehaviorPattern {
    const skillLevel = this.assessSkillLevel(behavior);
    const preferredFeatures = this.identifyPreferredFeatures(behavior);
    const commonErrors = this.identifyCommonErrors(behavior);
    const usageFrequency = this.assessUsageFrequency(behavior);

    return {
      skillLevel,
      preferredFeatures,
      commonErrors,
      usageFrequency,
    };
  }

  /**
   * Assess skill level
   */
  private assessSkillLevel(behavior: UserBehavior): 'beginner' | 'intermediate' | 'advanced' {
    const errorRate = behavior.errors / Math.max(behavior.actionsPerformed, 1);
    const featuresUsed = behavior.featuresUsed.length;
    const pagesVisited = behavior.pagesVisited.length;

    if (errorRate > 0.2 || featuresUsed < 3 || pagesVisited < 2) {
      return 'beginner';
    }

    if (errorRate < 0.05 && featuresUsed > 10 && pagesVisited > 5) {
      return 'advanced';
    }

    return 'intermediate';
  }

  /**
   * Identify preferred features
   */
  private identifyPreferredFeatures(behavior: UserBehavior): string[] {
    // Return most used features (simplified)
    return behavior.featuresUsed.slice(0, 5);
  }

  /**
   * Identify common errors
   */
  private identifyCommonErrors(behavior: UserBehavior): string[] {
    // This would analyze error patterns (simplified)
    return [];
  }

  /**
   * Assess usage frequency
   */
  private assessUsageFrequency(behavior: UserBehavior): 'low' | 'medium' | 'high' {
    const actionsPerMinute = behavior.actionsPerformed / Math.max(behavior.sessionDuration / 60000, 1);

    if (actionsPerMinute < 1) return 'low';
    if (actionsPerMinute > 5) return 'high';
    return 'medium';
  }
}

export class PersonalizationEngine {
  private analyzer = new BehaviorAnalyzer();

  /**
   * Personalize Frenly AI response based on behavior
   */
  async personalizeResponse(
    _userId: string,
    userBehavior: UserBehavior,
    baseContext: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const patterns = this.analyzer.analyzePatterns(userBehavior);

    // Adjust context based on patterns
    const personalizedContext = {
      ...baseContext,
      behavior: {
        skillLevel: patterns.skillLevel,
        preferredFeatures: patterns.preferredFeatures,
        usageFrequency: patterns.usageFrequency,
      },
      preferences: {
        communicationStyle: this.getCommunicationStyle(patterns),
        messageFrequency: this.getMessageFrequency(patterns),
      },
    };

    return personalizedContext;
  }

  /**
   * Get communication style based on patterns
   */
  private getCommunicationStyle(patterns: BehaviorPattern): 'brief' | 'detailed' | 'conversational' {
    if (patterns.skillLevel === 'advanced') return 'brief';
    if (patterns.skillLevel === 'beginner') return 'detailed';
    return 'conversational';
  }

  /**
   * Get message frequency based on patterns
   */
  private getMessageFrequency(patterns: BehaviorPattern): 'low' | 'medium' | 'high' {
    if (patterns.usageFrequency === 'low') return 'low';
    if (patterns.usageFrequency === 'high') return 'high';
    return 'medium';
  }
}

// Singleton instances
let behaviorTrackerInstance: BehaviorTracker | null = null;
let personalizationEngineInstance: PersonalizationEngine | null = null;

export function getBehaviorTracker(): BehaviorTracker {
  if (!behaviorTrackerInstance) {
    behaviorTrackerInstance = new BehaviorTracker();
  }
  return behaviorTrackerInstance;
}

export function getPersonalizationEngine(): PersonalizationEngine {
  if (!personalizationEngineInstance) {
    personalizationEngineInstance = new PersonalizationEngine();
  }
  return personalizationEngineInstance;
}

