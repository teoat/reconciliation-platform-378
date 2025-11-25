/**
 * Orchestration Integration with Feature Registry
 * 
 * Integrates feature registry with PageFrenlyIntegration and orchestration system
 */

import { featureRegistry, type FeatureMetadata } from '../registry';
import type { PageOrchestrationInterface } from '../../orchestration/types';
import { getFeatureGuidance, getRelevantFeatures } from './frenly';
import { logger } from '../../services/logger';

/**
 * Get features for a page
 */
export function getPageFeatures(pageId: string): FeatureMetadata[] {
  return featureRegistry.getAll().filter(f => 
    f.id.includes(pageId) || 
    f.frenlyIntegration?.onboardingSteps?.some(step => step.includes(pageId))
  );
}

/**
 * Enhanced PageFrenlyIntegration with feature registry
 */
export class FeatureAwarePageIntegration {
  private pageOrchestration: PageOrchestrationInterface;
  private pageId: string;

  constructor(pageOrchestration: PageOrchestrationInterface) {
    this.pageOrchestration = pageOrchestration;
    this.pageId = pageOrchestration.getPageId();
  }

  /**
   * Get features relevant to current page
   */
  getPageFeatures(): FeatureMetadata[] {
    return getRelevantFeatures(this.pageId);
  }

  /**
   * Get contextual guidance from features
   */
  async getContextualGuidance(
    userProgress?: string[]
  ): Promise<string | null> {
    const relevantFeatures = getRelevantFeatures(this.pageId, userProgress);
    
    if (relevantFeatures.length === 0) {
      return null;
    }

    // Get guidance from most relevant feature
    const primaryFeature = relevantFeatures[0];
    const workflowState = this.pageOrchestration.getWorkflowState();
    
    return getFeatureGuidance(primaryFeature.id, {
      page: this.pageId,
      userProgress,
      workflowState: workflowState ? {
        completedSteps: workflowState.completedSteps,
        totalSteps: workflowState.totalSteps,
        currentStep: workflowState.currentStep,
      } : undefined,
    });
  }

  /**
   * Get next suggested feature based on progress
   */
  getNextSuggestedFeature(completedSteps: string[]): FeatureMetadata | null {
    const frenlyFeatures = featureRegistry.getFrenlyEnabled();
    
    for (const feature of frenlyFeatures) {
      if (feature.frenlyIntegration?.onboardingSteps) {
        const nextStep = feature.frenlyIntegration.onboardingSteps.find(
          step => !completedSteps.includes(step)
        );
        if (nextStep) {
          return feature;
        }
      }
    }

    return null;
  }

  /**
   * Track feature usage
   */
  async trackFeatureAction(
    featureId: string,
    actionId: string,
    userId: string
  ): Promise<void> {
    try {
      const feature = featureRegistry.get(featureId);
      if (!feature) {
        logger.warn('Feature not found for tracking', { featureId });
        return;
      }

      // Track via Frenly service if available
      // This would integrate with frenlyAgentService.trackInteraction
      logger.debug('Feature action tracked', {
        featureId,
        actionId,
        userId,
      });
    } catch (error) {
      logger.error('Failed to track feature action', {
        error,
        featureId,
        actionId,
      });
    }
  }
}

/**
 * Register page orchestration with feature registry
 */
export function registerPageOrchestration(
  pageId: string,
  orchestration: PageOrchestrationInterface
): FeatureAwarePageIntegration {
  // Create feature metadata for the page
  const feature: FeatureMetadata = {
    id: `orchestration:page:${pageId}`,
    name: `${pageId} Page Orchestration`,
    description: `Page orchestration for ${pageId} with lifecycle management`,
    category: 'orchestration',
    status: 'active',
    version: '1.0.0',
    actions: [
      {
        id: 'initialize',
        name: 'Initialize Page',
        description: 'Initialize page orchestration',
      },
      {
        id: 'mount',
        name: 'Mount Page',
        description: 'Handle page mount',
      },
      {
        id: 'unmount',
        name: 'Unmount Page',
        description: 'Handle page unmount',
      },
    ],
    frenlyIntegration: {
      providesGuidance: true,
      onboardingSteps: orchestration.getOnboardingSteps?.()?.map(step => step.title) || [],
    },
    metaAgentIntegration: {
      monitorable: true,
      executable: true,
      compatibleAgents: ['monitoring', 'guidance'],
    },
  };

  featureRegistry.register(feature);

  // Return enhanced integration
  return new FeatureAwarePageIntegration(orchestration);
}

