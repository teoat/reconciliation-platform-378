/**
 * Orchestration Analytics Utilities
 *
 * Provides analytics tracking and reporting for Frenly AI orchestration.
 */

import { logger } from '@/services/logger';

export interface FeatureUsageStats {
  featureId: string;
  usageCount: number;
  successCount: number;
  errorCount: number;
  averageTime?: number;
  lastUsed?: number;
}

export interface PageAnalytics {
  pageId: string;
  visitCount: number;
  averageSessionDuration: number;
  featuresUsed: string[];
  errors: number;
  lastVisit: number;
}

export interface UserAnalytics {
  userId: string;
  pagesVisited: string[];
  featuresUsed: string[];
  totalActions: number;
  totalErrors: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  sessionDuration: number;
}

/**
 * Analytics Collector
 */
export class AnalyticsCollector {
  private featureUsage: Map<string, FeatureUsageStats> = new Map();
  private pageAnalytics: Map<string, PageAnalytics> = new Map();
  private userAnalytics: Map<string, UserAnalytics> = new Map();

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureId: string, action: string, success: boolean, duration?: number): void {
    const stats = this.featureUsage.get(featureId) || {
      featureId,
      usageCount: 0,
      successCount: 0,
      errorCount: 0,
      lastUsed: Date.now(),
    };

    stats.usageCount++;
    if (success) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }

    if (duration !== undefined) {
      stats.averageTime =
        stats.averageTime !== undefined ? (stats.averageTime + duration) / 2 : duration;
    }

    stats.lastUsed = Date.now();
    this.featureUsage.set(featureId, stats);

    logger.debug('Feature usage tracked', { featureId, action, success });
  }

  /**
   * Track page visit
   */
  trackPageVisit(pageId: string, duration: number): void {
    const analytics = this.pageAnalytics.get(pageId) || {
      pageId,
      visitCount: 0,
      averageSessionDuration: 0,
      featuresUsed: [],
      errors: 0,
      lastVisit: Date.now(),
    };

    analytics.visitCount++;
    analytics.averageSessionDuration = (analytics.averageSessionDuration + duration) / 2;
    analytics.lastVisit = Date.now();

    this.pageAnalytics.set(pageId, analytics);
  }

  /**
   * Get feature usage statistics
   */
  getFeatureStats(featureId: string): FeatureUsageStats | null {
    return this.featureUsage.get(featureId) || null;
  }

  /**
   * Get page analytics
   */
  getPageAnalytics(pageId: string): PageAnalytics | null {
    return this.pageAnalytics.get(pageId) || null;
  }

  /**
   * Get all feature stats
   */
  getAllFeatureStats(): FeatureUsageStats[] {
    return Array.from(this.featureUsage.values());
  }

  /**
   * Get all page analytics
   */
  getAllPageAnalytics(): PageAnalytics[] {
    return Array.from(this.pageAnalytics.values());
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): {
    features: FeatureUsageStats[];
    pages: PageAnalytics[];
    timestamp: number;
  } {
    return {
      features: this.getAllFeatureStats(),
      pages: this.getAllPageAnalytics(),
      timestamp: Date.now(),
    };
  }

  /**
   * Clear analytics data
   */
  clear(): void {
    this.featureUsage.clear();
    this.pageAnalytics.clear();
    this.userAnalytics.clear();
  }
}

// Singleton instance
let analyticsCollectorInstance: AnalyticsCollector | null = null;

export function getAnalyticsCollector(): AnalyticsCollector {
  if (!analyticsCollectorInstance) {
    analyticsCollectorInstance = new AnalyticsCollector();
  }
  return analyticsCollectorInstance;
}

/**
 * Generate analytics report
 */
export function generateAnalyticsReport(): {
  summary: {
    totalFeatures: number;
    totalPages: number;
    totalUsage: number;
    errorRate: number;
  };
  topFeatures: FeatureUsageStats[];
  topPages: PageAnalytics[];
} {
  const collector = getAnalyticsCollector();
  const features = collector.getAllFeatureStats();
  const pages = collector.getAllPageAnalytics();

  const totalUsage = features.reduce((sum, f) => sum + f.usageCount, 0);
  const totalErrors = features.reduce((sum, f) => sum + f.errorCount, 0);
  const errorRate = totalUsage > 0 ? totalErrors / totalUsage : 0;

  const topFeatures = features.sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);

  const topPages = pages.sort((a, b) => b.visitCount - a.visitCount).slice(0, 10);

  return {
    summary: {
      totalFeatures: features.length,
      totalPages: pages.length,
      totalUsage,
      errorRate: Math.round(errorRate * 100) / 100,
    },
    topFeatures,
    topPages,
  };
}
