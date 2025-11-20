/**
 * Onboarding Orchestration Module
 *
 * Unified onboarding experience across all pages with Frenly AI guidance
 */

import { logger } from '@/services/logger';
import { onboardingService } from '@/services/onboardingService';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import type { OnboardingStep, PageOrchestrationInterface } from '../types';

export interface PageOnboardingAdapter {
  getPageSteps(): OnboardingStep[];
  getCurrentStep(): OnboardingStep | null;
  completeStep(stepId: string): Promise<void>;
  skipStep(stepId: string): Promise<void>;
  syncWithFrenly(): Promise<void>;
}

export interface OnboardingProgress {
  pageId: string;
  completedSteps: string[];
  currentStep: string | null;
  totalSteps: number;
  progress: number;
  timestamp: number;
}

export class OnboardingOrchestrator {
  private adapters: Map<string, PageOnboardingAdapter> = new Map();
  private progressCache: Map<string, OnboardingProgress> = new Map();

  /**
   * Register a page onboarding adapter
   */
  registerAdapter(pageId: string, adapter: PageOnboardingAdapter): void {
    this.adapters.set(pageId, adapter);
    logger.debug('Onboarding adapter registered', { pageId });
  }

  /**
   * Unregister a page onboarding adapter
   */
  unregisterAdapter(pageId: string): void {
    this.adapters.delete(pageId);
    this.progressCache.delete(pageId);
    logger.debug('Onboarding adapter unregistered', { pageId });
  }

  /**
   * Get onboarding steps for a page
   */
  getPageSteps(pageId: string): OnboardingStep[] {
    const adapter = this.adapters.get(pageId);
    if (!adapter) {
      return [];
    }
    return adapter.getPageSteps();
  }

  /**
   * Get current onboarding step for a page
   */
  getCurrentStep(pageId: string): OnboardingStep | null {
    const adapter = this.adapters.get(pageId);
    if (!adapter) {
      return null;
    }
    return adapter.getCurrentStep();
  }

  /**
   * Complete an onboarding step
   */
  async completeStep(pageId: string, stepId: string): Promise<void> {
    const adapter = this.adapters.get(pageId);
    if (!adapter) {
      logger.warn('No adapter found for page', { pageId });
      return;
    }

    try {
      await adapter.completeStep(stepId);
      await this.syncProgress(pageId);
      await adapter.syncWithFrenly();
    } catch (error) {
      logger.error('Failed to complete onboarding step', { pageId, stepId, error });
      throw error;
    }
  }

  /**
   * Skip an onboarding step
   */
  async skipStep(pageId: string, stepId: string): Promise<void> {
    const adapter = this.adapters.get(pageId);
    if (!adapter) {
      logger.warn('No adapter found for page', { pageId });
      return;
    }

    try {
      await adapter.skipStep(stepId);
      await this.syncProgress(pageId);
      await adapter.syncWithFrenly();
    } catch (error) {
      logger.error('Failed to skip onboarding step', { pageId, stepId, error });
      throw error;
    }
  }

  /**
   * Sync onboarding progress for a page
   */
  async syncProgress(pageId: string): Promise<void> {
    const adapter = this.adapters.get(pageId);
    if (!adapter) {
      return;
    }

    const steps = adapter.getPageSteps();
    const completedSteps = steps.filter((s) => s.completed).map((s) => s.id);
    const currentStep = adapter.getCurrentStep()?.id || null;
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;

    const progressData: OnboardingProgress = {
      pageId,
      completedSteps,
      currentStep,
      totalSteps,
      progress: Math.round(progress),
      timestamp: Date.now(),
    };

    this.progressCache.set(pageId, progressData);

    // Sync to backend
    try {
      await onboardingService.completeStep(
        currentStep || 'unknown',
        'Onboarding step',
        0,
        'feature_tour'
      );
    } catch (error) {
      logger.debug('Failed to sync onboarding progress to backend', { pageId, error });
    }

    // Sync to Frenly AI
    try {
      await frenlyAgentService.updateOnboardingProgress?.({
        pageId,
        completedSteps,
        currentStep,
        progress: Math.round(progress),
      });
    } catch (error) {
      logger.debug('Failed to sync onboarding progress to Frenly AI', { pageId, error });
    }
  }

  /**
   * Get onboarding progress for a page
   */
  getProgress(pageId: string): OnboardingProgress | null {
    return this.progressCache.get(pageId) || null;
  }

  /**
   * Get all registered page IDs
   */
  getRegisteredPages(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/**
 * Page Onboarding Adapter Implementation
 */
export class PageOnboardingAdapterImpl implements PageOnboardingAdapter {
  constructor(
    private pageOrchestration: PageOrchestrationInterface,
    private getSteps: () => OnboardingStep[]
  ) {}

  getPageSteps(): OnboardingStep[] {
    return this.getSteps();
  }

  getCurrentStep(): OnboardingStep | null {
    return this.pageOrchestration.getCurrentOnboardingStep();
  }

  async completeStep(stepId: string): Promise<void> {
    await this.pageOrchestration.completeOnboardingStep(stepId);
  }

  async skipStep(stepId: string): Promise<void> {
    await this.pageOrchestration.skipOnboardingStep(stepId);
  }

  async syncWithFrenly(): Promise<void> {
    await this.pageOrchestration.syncWithFrenly();
  }
}

/**
 * Onboarding Progress Sync Manager
 */
export class OnboardingProgressSync {
  private syncQueue: Array<{ pageId: string; timestamp: number }> = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(private orchestrator: OnboardingOrchestrator) {
    // Auto-sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, 30000);
  }

  /**
   * Queue a page for sync
   */
  queueSync(pageId: string): void {
    const existing = this.syncQueue.find((item) => item.pageId === pageId);
    if (!existing) {
      this.syncQueue.push({ pageId, timestamp: Date.now() });
    }
    this.processSyncQueue();
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift()!;
      try {
        await this.orchestrator.syncProgress(item.pageId);
      } catch (error) {
        logger.error('Failed to sync onboarding progress', { pageId: item.pageId, error });
      }
    }

    this.isSyncing = false;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

/**
 * Onboarding Analytics
 */
export class OnboardingAnalytics {
  private analytics: Map<
    string,
    {
      pageId: string;
      stepCompletions: Map<string, number>;
      stepSkips: Map<string, number>;
      averageTimePerStep: Map<string, number>;
      totalTime: number;
      startedAt: number;
    }
  > = new Map();

  /**
   * Track step completion
   */
  trackStepCompletion(pageId: string, stepId: string, timeTaken: number): void {
    let pageAnalytics = this.analytics.get(pageId);
    if (!pageAnalytics) {
      pageAnalytics = {
        pageId,
        stepCompletions: new Map(),
        stepSkips: new Map(),
        averageTimePerStep: new Map(),
        totalTime: 0,
        startedAt: Date.now(),
      };
      this.analytics.set(pageId, pageAnalytics);
    }

    const currentCount = pageAnalytics.stepCompletions.get(stepId) || 0;
    pageAnalytics.stepCompletions.set(stepId, currentCount + 1);

    const currentAvg = pageAnalytics.averageTimePerStep.get(stepId) || 0;
    const newAvg = (currentAvg + timeTaken) / 2;
    pageAnalytics.averageTimePerStep.set(stepId, newAvg);

    pageAnalytics.totalTime += timeTaken;
  }

  /**
   * Track step skip
   */
  trackStepSkip(pageId: string, stepId: string): void {
    let pageAnalytics = this.analytics.get(pageId);
    if (!pageAnalytics) {
      pageAnalytics = {
        pageId,
        stepCompletions: new Map(),
        stepSkips: new Map(),
        averageTimePerStep: new Map(),
        totalTime: 0,
        startedAt: Date.now(),
      };
      this.analytics.set(pageId, pageAnalytics);
    }

    const currentCount = pageAnalytics.stepSkips.get(stepId) || 0;
    pageAnalytics.stepSkips.set(stepId, currentCount + 1);
  }

  /**
   * Get analytics for a page
   */
  getAnalytics(pageId: string) {
    return this.analytics.get(pageId);
  }

  /**
   * Get all analytics
   */
  getAllAnalytics() {
    return Array.from(this.analytics.values());
  }
}

// Singleton instances
let orchestratorInstance: OnboardingOrchestrator | null = null;
let progressSyncInstance: OnboardingProgressSync | null = null;
let analyticsInstance: OnboardingAnalytics | null = null;

/**
 * Get the onboarding orchestrator instance
 */
export function getOnboardingOrchestrator(): OnboardingOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new OnboardingOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * Get the onboarding progress sync instance
 */
export function getOnboardingProgressSync(): OnboardingProgressSync {
  if (!progressSyncInstance) {
    progressSyncInstance = new OnboardingProgressSync(getOnboardingOrchestrator());
  }
  return progressSyncInstance;
}

/**
 * Get the onboarding analytics instance
 */
export function getOnboardingAnalytics(): OnboardingAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new OnboardingAnalytics();
  }
  return analyticsInstance;
}
