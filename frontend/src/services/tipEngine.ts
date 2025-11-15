/**
 * Tip Engine Service
 * 
 * Provides intelligent tip delivery system with:
 * - Priority scoring
 * - User behavior analysis
 * - Tip relevance calculation
 * - Tip effectiveness tracking
 * - Behavior-based tip delivery
 */

import { logger } from './logger';

export type TipPriority = 'low' | 'medium' | 'high' | 'critical';
export type TipContext = 'global' | 'feature' | 'error' | 'empty-state' | 'action';

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: TipPriority;
  context: TipContext;
  targetElement?: string; // CSS selector
  conditions?: {
    userRole?: string[];
    featureFlags?: string[];
    permissions?: string[];
    userActions?: string[]; // Actions user must have taken
  };
  metadata?: {
    relatedFeature?: string;
    estimatedTime?: number; // seconds
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
  };
  tracking?: {
    impressions: number;
    dismissals: number;
    clicks: number;
    effectiveness?: number; // 0-1 score
  };
}

export interface UserBehavior {
  actions: string[];
  featuresUsed: string[];
  errorsEncountered: string[];
  lastActiveTime: Date;
  sessionDuration: number;
}

export interface TipEngineConfig {
  maxTipsPerSession?: number;
  tipCooldown?: number; // milliseconds between tips
  priorityWeights?: Record<TipPriority, number>;
  behaviorAnalysisEnabled?: boolean;
}

class TipEngine {
  private tips: Map<string, Tip> = new Map();
  private userBehavior: UserBehavior | null = null;
  private config: Required<TipEngineConfig>;
  private tipHistory: string[] = [];
  private dismissedTips: Set<string> = new Set();

  constructor(config: TipEngineConfig = {}) {
    this.config = {
      maxTipsPerSession: config.maxTipsPerSession || 5,
      tipCooldown: config.tipCooldown || 30000, // 30 seconds
      priorityWeights: config.priorityWeights || {
        low: 1,
        medium: 2,
        high: 4,
        critical: 8,
      },
      behaviorAnalysisEnabled: config.behaviorAnalysisEnabled !== false,
    };
  }

  /**
   * Register a tip
   */
  registerTip(tip: Tip): void {
    if (!tip.tracking) {
      tip.tracking = {
        impressions: 0,
        dismissals: 0,
        clicks: 0,
        effectiveness: 0,
      };
    }
    this.tips.set(tip.id, tip);
    logger.debug('Tip registered', { tipId: tip.id, title: tip.title });
  }

  /**
   * Register multiple tips
   */
  registerTips(tips: Tip[]): void {
    tips.forEach((tip) => this.registerTip(tip));
  }

  /**
   * Update user behavior
   */
  updateBehavior(behavior: Partial<UserBehavior>): void {
    if (!this.userBehavior) {
      this.userBehavior = {
        actions: [],
        featuresUsed: [],
        errorsEncountered: [],
        lastActiveTime: new Date(),
        sessionDuration: 0,
      };
    }

    this.userBehavior = {
      ...this.userBehavior,
      ...behavior,
      lastActiveTime: new Date(),
    };
  }

  /**
   * Calculate tip priority score
   */
  private calculatePriorityScore(tip: Tip, userRole?: string): number {
    const basePriority = this.config.priorityWeights[tip.priority];

    // Check conditions
    if (tip.conditions) {
      if (tip.conditions.userRole && userRole) {
        if (!tip.conditions.userRole.includes(userRole)) {
          return 0; // Tip not applicable
        }
      }
    }

    // Calculate relevance based on behavior
    let relevanceScore = 1;
    if (this.config.behaviorAnalysisEnabled && this.userBehavior) {
      // Increase score if user has taken related actions
      if (tip.conditions?.userActions) {
        const hasRelatedActions = tip.conditions.userActions.some((action) =>
          this.userBehavior!.actions.includes(action)
        );
        if (hasRelatedActions) {
          relevanceScore += 0.5;
        }
      }

      // Increase score for error-related tips if user encountered errors
      if (tip.context === 'error' && this.userBehavior.errorsEncountered.length > 0) {
        relevanceScore += 0.3;
      }

      // Decrease score if tip was recently shown
      if (this.tipHistory.includes(tip.id)) {
        relevanceScore *= 0.5;
      }

      // Decrease score if tip was dismissed
      if (this.dismissedTips.has(tip.id)) {
        relevanceScore *= 0.2;
      }
    }

    // Calculate effectiveness score
    let effectivenessMultiplier = 1;
    if (tip.tracking?.effectiveness !== undefined) {
      effectivenessMultiplier = tip.tracking.effectiveness;
    } else if (tip.tracking) {
      // Calculate effectiveness from tracking data
      const totalInteractions = tip.tracking.impressions || 1;
      const engagement = (tip.tracking.clicks || 0) / totalInteractions;
      const dismissalRate = (tip.tracking.dismissals || 0) / totalInteractions;
      effectivenessMultiplier = engagement * (1 - dismissalRate);
    }

    return basePriority * relevanceScore * effectivenessMultiplier;
  }

  /**
   * Get next tip based on priority and relevance
   */
  getNextTip(userRole?: string, context?: TipContext): Tip | null {
    // Filter available tips
    const availableTips = Array.from(this.tips.values()).filter((tip) => {
      // Skip dismissed tips (unless enough time has passed)
      if (this.dismissedTips.has(tip.id)) {
        return false;
      }

      // Filter by context if provided
      if (context && tip.context !== context) {
        return false;
      }

      // Check conditions
      if (tip.conditions) {
        if (tip.conditions.userRole && userRole) {
          if (!tip.conditions.userRole.includes(userRole)) {
            return false;
          }
        }
      }

      return true;
    });

    if (availableTips.length === 0) {
      return null;
    }

    // Calculate scores for all tips
    const scoredTips = availableTips.map((tip) => ({
      tip,
      score: this.calculatePriorityScore(tip, userRole),
    }));

    // Sort by score (highest first)
    scoredTips.sort((a, b) => b.score - a.score);

    // Return top tip
    const topTip = scoredTips[0].tip;

    // Track impression
    if (topTip.tracking) {
      topTip.tracking.impressions = (topTip.tracking.impressions || 0) + 1;
    }

    // Add to history
    this.tipHistory.push(topTip.id);
    if (this.tipHistory.length > this.config.maxTipsPerSession) {
      this.tipHistory.shift();
    }

    return topTip;
  }

  /**
   * Track tip dismissal
   */
  dismissTip(tipId: string): void {
    const tip = this.tips.get(tipId);
    if (tip && tip.tracking) {
      tip.tracking.dismissals = (tip.tracking.dismissals || 0) + 1;
      this.updateTipEffectiveness(tip);
    }
    this.dismissedTips.add(tipId);
  }

  /**
   * Track tip click/engagement
   */
  trackTipClick(tipId: string): void {
    const tip = this.tips.get(tipId);
    if (tip && tip.tracking) {
      tip.tracking.clicks = (tip.tracking.clicks || 0) + 1;
      this.updateTipEffectiveness(tip);
    }
  }

  /**
   * Update tip effectiveness score
   */
  private updateTipEffectiveness(tip: Tip): void {
    if (!tip.tracking) return;

    const impressions = tip.tracking.impressions || 1;
    const clicks = tip.tracking.clicks || 0;
    const dismissals = tip.tracking.dismissals || 0;

    const engagement = clicks / impressions;
    const retention = 1 - dismissals / impressions;

    tip.tracking.effectiveness = (engagement + retention) / 2;
  }

  /**
   * Get tips by category
   */
  getTipsByCategory(category: string): Tip[] {
    return Array.from(this.tips.values()).filter((tip) => tip.category === category);
  }

  /**
   * Reset session data
   */
  resetSession(): void {
    this.tipHistory = [];
    this.dismissedTips.clear();
  }

  /**
   * Get analytics data
   */
  getAnalytics(): {
    totalTips: number;
    totalImpressions: number;
    totalClicks: number;
    totalDismissals: number;
    averageEffectiveness: number;
    tipsByPriority: Record<TipPriority, number>;
  } {
    const tips = Array.from(this.tips.values());
    const totalImpressions = tips.reduce((sum, tip) => sum + (tip.tracking?.impressions || 0), 0);
    const totalClicks = tips.reduce((sum, tip) => sum + (tip.tracking?.clicks || 0), 0);
    const totalDismissals = tips.reduce((sum, tip) => sum + (tip.tracking?.dismissals || 0), 0);
    const effectivenessScores = tips
      .map((tip) => tip.tracking?.effectiveness || 0)
      .filter((score) => score > 0);
    const averageEffectiveness =
      effectivenessScores.length > 0
        ? effectivenessScores.reduce((sum, score) => sum + score, 0) / effectivenessScores.length
        : 0;

    const tipsByPriority: Record<TipPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    tips.forEach((tip) => {
      tipsByPriority[tip.priority]++;
    });

    return {
      totalTips: tips.length,
      totalImpressions,
      totalClicks,
      totalDismissals,
      averageEffectiveness,
      tipsByPriority,
    };
  }
}

// Singleton instance
export const tipEngine = new TipEngine();

// Export default instance
export default tipEngine;

