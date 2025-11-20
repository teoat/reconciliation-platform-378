/**
 * Orchestration Monitoring Utilities
 *
 * Provides utilities for monitoring Frenly AI orchestration integration
 * and tracking system health and performance.
 */

import { logger } from '@/services/logger';
import { getPageLifecycleManager } from '../PageLifecycleManager';
import { getPageStateSyncManager } from '../sync/PageStateSyncManager';
import { getEventSyncManager } from '../sync/EventSyncManager';
import { getBehaviorTracker } from '../modules/BehaviorAnalytics';

export interface OrchestrationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    lifecycleManager: boolean;
    syncManager: boolean;
    eventManager: boolean;
    behaviorTracker: boolean;
  };
  metrics: {
    pagesTracked: number;
    eventsProcessed: number;
    syncQueueSize: number;
    errors: number;
  };
  timestamp: number;
}

export interface PerformanceMetrics {
  messageGenerationTime: number;
  contextUpdateTime: number;
  syncTime: number;
  averageResponseTime: number;
}

/**
 * Monitor orchestration system health
 */
export function checkOrchestrationHealth(): OrchestrationHealth {
  const lifecycleManager = getPageLifecycleManager();
  const syncManager = getPageStateSyncManager();
  const eventManager = getEventSyncManager();
  const behaviorTracker = getBehaviorTracker();

  const health: OrchestrationHealth = {
    status: 'healthy',
    components: {
      lifecycleManager: lifecycleManager !== null,
      syncManager: syncManager !== null,
      eventManager: eventManager !== null,
      behaviorTracker: behaviorTracker !== null,
    },
    metrics: {
      pagesTracked: 0, // Would need to track this
      eventsProcessed: 0, // Would need to track this
      syncQueueSize: 0, // Would need to track this
      errors: 0, // Would need to track this
    },
    timestamp: Date.now(),
  };

  // Check if any component is missing
  const allHealthy = Object.values(health.components).every((v) => v === true);
  if (!allHealthy) {
    health.status = 'degraded';
  }

  return health;
}

/**
 * Log orchestration metrics
 */
export function logOrchestrationMetrics(): void {
  const health = checkOrchestrationHealth();
  logger.info('Orchestration Health Check', {
    status: health.status,
    components: health.components,
    metrics: health.metrics,
  });
}

/**
 * Monitor message generation performance
 */
export class MessagePerformanceMonitor {
  private generationTimes: number[] = [];
  private readonly maxSamples = 100;

  recordGenerationTime(timeMs: number): void {
    this.generationTimes.push(timeMs);
    if (this.generationTimes.length > this.maxSamples) {
      this.generationTimes.shift();
    }
  }

  getAverageGenerationTime(): number {
    if (this.generationTimes.length === 0) return 0;
    const sum = this.generationTimes.reduce((a, b) => a + b, 0);
    return sum / this.generationTimes.length;
  }

  getMetrics(): PerformanceMetrics {
    return {
      messageGenerationTime: this.getAverageGenerationTime(),
      contextUpdateTime: 0, // Would need to track
      syncTime: 0, // Would need to track
      averageResponseTime: this.getAverageGenerationTime(),
    };
  }
}

// Singleton instance
let performanceMonitorInstance: MessagePerformanceMonitor | null = null;

export function getPerformanceMonitor(): MessagePerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new MessagePerformanceMonitor();
  }
  return performanceMonitorInstance;
}

/**
 * Track orchestration errors
 */
export class ErrorTracker {
  private errors: Array<{ error: Error; timestamp: number; context: Record<string, unknown> }> = [];
  private readonly maxErrors = 50;

  recordError(error: Error, context?: Record<string, unknown>): void {
    this.errors.push({
      error,
      timestamp: Date.now(),
      context: context || {},
    });

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    logger.error('Orchestration Error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  getRecentErrors(
    count: number = 10
  ): Array<{ error: Error; timestamp: number; context: Record<string, unknown> }> {
    return this.errors.slice(-count);
  }

  getErrorCount(): number {
    return this.errors.length;
  }
}

// Singleton instance
let errorTrackerInstance: ErrorTracker | null = null;

export function getErrorTracker(): ErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new ErrorTracker();
  }
  return errorTrackerInstance;
}

/**
 * Periodic health check
 */
export function startHealthMonitoring(intervalMs: number = 60000): () => void {
  const interval = setInterval(() => {
    logOrchestrationMetrics();
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}
