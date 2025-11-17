/**
 * Onboarding Orchestrator - Coordinates onboarding across pages with Frenly AI
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import { onboardingService } from '@/services/onboardingService';
import type {
  OnboardingStep,
  OnboardingProgress,
  PageOrchestrationInterface,
} from './types';

export interface OnboardingOrchestrationConfig {
  pageId: string;
  userId: string;
  role?: string;
  deviceId?: string;
}

export class OnboardingOrchestrator {
  private config: OnboardingOrchestrationConfig;
  private currentProgress: OnboardingProgress | null = null;

  constructor(config: OnboardingOrchestrationConfig) {
    this.config = config;
  }

  /**
   * Initialize onboarding orchestrator
   */
  async initialize(): Promise<void> {
    try {
      // Load existing progress
      await this.loadProgress();
      logger.info('OnboardingOrchestrator initialized', {
        pageId: this.config.pageId,
      });
    } catch (error) {
      logger.error('Failed to initialize OnboardingOrchestrator', { error });
    }
  }

  /**
   * Get onboarding steps for a page
   */
  getOnboardingSteps(
    page: PageOrchestrationInterface
  ): OnboardingStep[] {
    return page.getOnboardingSteps();
  }

  /**
   * Get current onboarding step
   */
  getCurrentStep(
    page: PageOrchestrationInterface
  ): OnboardingStep | null {
    return page.getCurrentOnboardingStep();
  }

  /**
   * Complete an onboarding step
   */
  async completeStep(
    page: PageOrchestrationInterface,
    stepId: string
  ): Promise<void> {
    try {
      // Complete step in page
      await page.completeOnboardingStep(stepId);

      // Update progress
      if (this.currentProgress) {
        if (!this.currentProgress.completedSteps.includes(stepId)) {
          this.currentProgress.completedSteps.push(stepId);
        }
        this.currentProgress.currentStep = this.getNextStepId(page, stepId);
      }

      // Sync progress
      await this.syncProgress(page);

      // Generate celebration message if all steps completed
      if (this.isOnboardingComplete(page)) {
        await this.generateCompletionMessage();
      } else {
        await this.generateStepCompletionMessage(stepId);
      }

      logger.info('Onboarding step completed', {
        pageId: this.config.pageId,
        stepId,
      });
    } catch (error) {
      logger.error('Error completing onboarding step', { error, stepId });
      throw error;
    }
  }

  /**
   * Skip an onboarding step
   */
  async skipStep(
    page: PageOrchestrationInterface,
    stepId: string,
    remindLater?: boolean
  ): Promise<void> {
    try {
      // Skip step in page
      await page.skipOnboardingStep(stepId);

      // Update progress
      if (this.currentProgress) {
        this.currentProgress.currentStep = this.getNextStepId(page, stepId);
      }

      // Sync progress
      await this.syncProgress(page);

      // Generate skip message
      await this.generateSkipMessage(stepId, remindLater);

      logger.info('Onboarding step skipped', {
        pageId: this.config.pageId,
        stepId,
        remindLater,
      });
    } catch (error) {
      logger.error('Error skipping onboarding step', { error, stepId });
      throw error;
    }
  }

  /**
   * Sync onboarding progress with backend and Frenly AI
   */
  async syncProgress(
    page: PageOrchestrationInterface
  ): Promise<void> {
    try {
      const steps = this.getOnboardingSteps(page);
      const completedSteps = steps
        .filter((step) => step.completed)
        .map((step) => step.id);

      const progress: OnboardingProgress = {
        pageId: this.config.pageId,
        completedSteps,
        currentStep: this.getCurrentStep(page)?.id || null,
        totalSteps: steps.length,
      };

      // Sync steps to backend
      for (const stepId of completedSteps) {
        const step = steps.find((s) => s.id === stepId);
        if (step) {
          onboardingService.completeStep(
            stepId,
            step.title,
            0, // Duration will be tracked separately
            'initial' // Use initial type for page onboarding
          );
        }
      }

      // Mark onboarding as complete if all steps done
      if (this.isOnboardingComplete(page)) {
        onboardingService.completeOnboarding('initial');
      }

      // Sync all progress to server
      await onboardingService.syncAllProgress();

      // Sync to Frenly AI
      await frenlyAgentService.updateOnboardingProgress({
        pageId: this.config.pageId,
        completedSteps,
        currentStep: progress.currentStep,
      });

      this.currentProgress = progress;

      logger.debug('Onboarding progress synced', {
        pageId: this.config.pageId,
        progress,
      });
    } catch (error) {
      logger.error('Error syncing onboarding progress', { error });
      // Don't throw - sync failures shouldn't break the page
    }
  }

  /**
   * Check if onboarding is complete
   */
  isOnboardingComplete(page: PageOrchestrationInterface): boolean {
    const steps = this.getOnboardingSteps(page);
    return steps.every((step) => step.completed || step.skipped);
  }

  /**
   * Get onboarding progress percentage
   */
  getProgressPercentage(page: PageOrchestrationInterface): number {
    const steps = this.getOnboardingSteps(page);
    if (steps.length === 0) return 100;

    const completedCount = steps.filter(
      (step) => step.completed || step.skipped
    ).length;
    return Math.round((completedCount / steps.length) * 100);
  }

  /**
   * Load progress from backend
   */
  private async loadProgress(): Promise<void> {
    try {
      const response = onboardingService.getProgress('initial');

      if (response) {
        this.currentProgress = {
          pageId: this.config.pageId,
          completedSteps: response.completedSteps || [],
          currentStep: response.currentStep || null,
          totalSteps: 0, // Will be set from page steps
          startedAt: response.startedAt,
          completedAt: response.completedAt,
        };
      } else {
        // Initialize empty progress
        this.currentProgress = {
          pageId: this.config.pageId,
          completedSteps: [],
          currentStep: null,
          totalSteps: 0,
        };
      }
    } catch (error) {
      logger.warn('Failed to load onboarding progress', { error });
      // Initialize empty progress
      this.currentProgress = {
        pageId: this.config.pageId,
        completedSteps: [],
        currentStep: null,
        totalSteps: 0,
      };
    }
  }

  /**
   * Get next step ID after current step
   */
  private getNextStepId(
    page: PageOrchestrationInterface,
    currentStepId: string
  ): string | null {
    const steps = this.getOnboardingSteps(page);
    const currentIndex = steps.findIndex((step) => step.id === currentStepId);
    if (currentIndex === -1 || currentIndex === steps.length - 1) {
      return null;
    }
    return steps[currentIndex + 1].id;
  }

  /**
   * Generate completion message
   */
  private async generateCompletionMessage(): Promise<void> {
    try {
      const message = await frenlyAgentService.generateMessage({
        userId: this.config.userId,
        page: this.config.pageId,
        progress: {
          completedSteps: this.currentProgress?.completedSteps || [],
          totalSteps: this.currentProgress?.totalSteps || 0,
          currentStep: undefined,
        },
      });

      // Override with celebration message
      const celebrationMessage = {
        ...message,
        type: 'celebration' as const,
        content:
          "🎉 Congratulations! You've completed the onboarding for this page. You're all set!",
        priority: 'high' as const,
      };

      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: celebrationMessage,
        })
      );
    } catch (error) {
      logger.error('Error generating completion message', { error });
    }
  }

  /**
   * Generate step completion message
   */
  private async generateStepCompletionMessage(stepId: string): Promise<void> {
    try {
      const message = await frenlyAgentService.generateMessage({
        userId: this.config.userId,
        page: this.config.pageId,
        progress: {
          completedSteps: this.currentProgress?.completedSteps || [],
          totalSteps: this.currentProgress?.totalSteps || 0,
          currentStep: stepId,
        },
      });

      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: message,
        })
      );
    } catch (error) {
      logger.error('Error generating step completion message', { error });
    }
  }

  /**
   * Generate skip message
   */
  private async generateSkipMessage(
    _stepId: string,
    remindLater?: boolean
  ): Promise<void> {
    try {
      const content = remindLater
        ? "No problem! I'll remind you about this step later."
        : "Got it! You can always come back to this step if you need help.";

      const message = await frenlyAgentService.generateMessage({
        userId: this.config.userId,
        page: this.config.pageId,
      });

      const skipMessage = {
        ...message,
        type: 'tip' as const,
        content,
        priority: 'low' as const,
      };

      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: skipMessage,
        })
      );
    } catch (error) {
      logger.error('Error generating skip message', { error });
    }
  }
}

// Singleton instance per page
const orchestrators: Map<string, OnboardingOrchestrator> = new Map();

export function getOnboardingOrchestrator(
  config: OnboardingOrchestrationConfig
): OnboardingOrchestrator {
  const key = `${config.pageId}_${config.userId}`;
  if (!orchestrators.has(key)) {
    orchestrators.set(key, new OnboardingOrchestrator(config));
  }
  return orchestrators.get(key)!;
}

