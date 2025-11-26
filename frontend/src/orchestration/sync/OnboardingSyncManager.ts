/**
 * Onboarding Sync Manager - Synchronizes onboarding progress across pages
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import { onboardingService } from '@/services/onboardingService';
import type { OnboardingProgress } from '../types';

export class OnboardingSyncManager {
  /**
   * Sync onboarding progress
   */
  async syncOnboardingProgress(pageId: string, progress: OnboardingProgress): Promise<void> {
    try {
      // Sync to backend
      await onboardingService.syncToServer('initial');

      // Sync to Frenly AI
      await frenlyAgentService.updateOnboardingProgress({
        pageId,
        completedSteps: progress.completedSteps,
        currentStep: progress.currentStep,
      });

      // Generate contextual message if needed
      const message = await frenlyAgentService.generateOnboardingMessage({
        pageId,
        progress: {
          completedSteps: progress.completedSteps,
          currentStep: progress.currentStep,
          totalSteps: progress.totalSteps || 0,
        },
      });

      // Show message via event
      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: {
            id: message.id,
            type: message.type,
            content: message.content,
            timestamp: message.timestamp,
            page: pageId,
            priority: message.priority,
            dismissible: true,
          },
        })
      );

      logger.debug('Onboarding progress synced', { pageId, progress });
    } catch (error) {
      logger.error('Error syncing onboarding progress', { error, pageId });
      // Don't throw - sync failures shouldn't break the page
    }
  }

  /**
   * Complete onboarding step
   */
  async completeStep(pageId: string, stepId: string, stepName: string): Promise<void> {
    try {
      // Complete step in onboarding service
      onboardingService.completeStep(stepId, stepName, 0, 'initial');

      // Get updated progress
      const progress = onboardingService.getProgress('initial');
      if (progress) {
        await this.syncOnboardingProgress(pageId, {
          pageId,
          completedSteps: progress.completedSteps,
          currentStep: stepId,
          totalSteps: (progress as unknown as { totalSteps?: number }).totalSteps || progress.completedSteps.length || 0,
        } as OnboardingProgress);
      }
    } catch (error) {
      logger.error('Error completing onboarding step', { error, pageId, stepId });
    }
  }

  /**
   * Skip onboarding step
   */
  async skipStep(pageId: string, stepId: string): Promise<void> {
    try {
      // Skip step in onboarding service
      onboardingService.skipStep(stepId, 'initial');

      // Get updated progress
      const progress = onboardingService.getProgress('initial');
      if (progress) {
        await this.syncOnboardingProgress(pageId, {
          pageId,
          completedSteps: progress.completedSteps,
          currentStep: null,
          totalSteps: (progress as unknown as { totalSteps?: number }).totalSteps || progress.completedSteps.length || 0,
        } as OnboardingProgress);
      }
    } catch (error) {
      logger.error('Error skipping onboarding step', { error, pageId, stepId });
    }
  }
}

// Singleton instance
let onboardingSyncInstance: OnboardingSyncManager | null = null;

export function getOnboardingSyncManager(): OnboardingSyncManager {
  if (!onboardingSyncInstance) {
    onboardingSyncInstance = new OnboardingSyncManager();
  }
  return onboardingSyncInstance;
}
