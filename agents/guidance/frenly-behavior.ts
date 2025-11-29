/**
 * Frenly Guidance Agent - User Behavior and Learning
 */

import { UserBehavior, MessageContext } from './frenly-interfaces';
import { logger } from '../../frontend/src/services/logger';

export class BehaviorTracker {
  private behaviors: Map<string, UserBehavior> = new Map();
  private readonly behaviorMaxSize = 1000; // Max behaviors to store
  private readonly interactionMaxHistory = 100; // Max interactions per user

  /**
   * Get or create user behavior
   */
  getUserBehavior(userId: string): UserBehavior {
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
   * Cleanup old user behaviors
   */
  cleanupOldBehaviors(): void {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    let removedCount = 0;

    for (const [userId, behavior] of this.behaviors.entries()) {
      const age = now - behavior.lastInteraction.getTime();

      // Remove behaviors older than 30 days
      if (age > maxAge) {
        this.behaviors.delete(userId);
        removedCount++;
      } else {
        // Trim interaction history
        if (behavior.messageInteractions.length > this.interactionMaxHistory) {
          behavior.messageInteractions = behavior.messageInteractions.slice(
            -this.interactionMaxHistory
          );
        }
      }
    }

    // If still too many, remove least recently used
    if (this.behaviors.size > this.behaviorMaxSize) {
      const entries = Array.from(this.behaviors.entries()).sort(
        (a, b) => a[1].lastInteraction.getTime() - b[1].lastInteraction.getTime()
      );

      const toRemove = this.behaviors.size - this.behaviorMaxSize;
      for (let i = 0; i < toRemove; i++) {
        const [userId] = entries[i];
        this.behaviors.delete(userId);
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} old user behaviors`);
    }
  }

  /**
   * Get all behaviors (for metrics)
   */
  getAllBehaviors(): Map<string, UserBehavior> {
    return this.behaviors;
  }
}
