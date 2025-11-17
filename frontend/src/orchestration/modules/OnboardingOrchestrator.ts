/**
 * Onboarding Orchestrator - Central coordinator for onboarding flows
 */

import { logger } from '@/services/logger';
import { getOnboardingSyncManager } from '../sync';
import { onboardingService, type OnboardingType } from '@/services/onboardingService';
import type { OnboardingStep, OnboardingProgress } from '../types';

export class OnboardingOrchestrator {
  private pageAdapters: Map<string, PageOnboardingAdapter> = new Map();

  /**
   * Register page adapter
   */
  registerPageAdapter(pageId: string, adapter: PageOnboardingAdapter): void {
    this.pageAdapters.set(pageId, adapter);
    logger.debug('Page onboarding adapter registered', { pageId });
  }

  /**
   * Get onboarding steps for page
   */
  getPageSteps(pageId: string): OnboardingStep[] {
    const adapter = this.pageAdapters.get(pageId);
    if (!adapter) return [];

    return adapter.getPageSteps();
  }

  /**
   * Get current onboarding step
   */
  getCurrentStep(pageId: string): OnboardingStep | null {
    const adapter = this.pageAdapters.get(pageId);
    if (!adapter) return null;

    return adapter.getCurrentStep();
  }

  /**
   * Complete onboarding step
   */
  async completeStep(pageId: string, stepId: string): Promise<void> {
    const adapter = this.pageAdapters.get(pageId);
    if (!adapter) {
      logger.warn('No adapter found for page', { pageId });
      return;
    }

    await adapter.completeStep(stepId);

    // Sync with Frenly
    await adapter.syncWithFrenly();
  }

  /**
   * Skip onboarding step
   */
  async skipStep(pageId: string, stepId: string): Promise<void> {
    const adapter = this.pageAdapters.get(pageId);
    if (!adapter) {
      logger.warn('No adapter found for page', { pageId });
      return;
    }

    await adapter.skipStep(stepId);

    // Sync with Frenly
    await adapter.syncWithFrenly();
  }

  /**
   * Sync onboarding progress
   */
  async syncProgress(pageId: string, progress: OnboardingProgress): Promise<void> {
    const syncManager = getOnboardingSyncManager();
    await syncManager.syncOnboardingProgress(pageId, progress);
  }

  /**
   * Get onboarding progress
   */
  getProgress(type: OnboardingType = 'initial'): OnboardingProgress | null {
    const progress = onboardingService.getProgress(type);
    if (!progress) return null;

    return {
      pageId: '',
      completedSteps: progress.completedSteps,
      currentStep: progress.currentStep || null,
      totalSteps: progress.completedSteps.length + (progress.currentStep ? 1 : 0),
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
    };
  }
}

/**
 * Page Onboarding Adapter Interface
 */
export interface PageOnboardingAdapter {
  getPageSteps(): OnboardingStep[];
  getCurrentStep(): OnboardingStep | null;
  completeStep(stepId: string): Promise<void>;
  skipStep(stepId: string): Promise<void>;
  syncWithFrenly(): Promise<void>;
}

// Singleton instance
let orchestratorInstance: OnboardingOrchestrator | null = null;

export function getOnboardingOrchestrator(): OnboardingOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new OnboardingOrchestrator();
  }
  return orchestratorInstance;
}

