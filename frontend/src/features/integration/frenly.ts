/**
 * Frenly AI Integration with Feature Registry
 * 
 * Provides hooks and utilities for Frenly AI to interact with registered features
 */

import { featureRegistry, type FeatureMetadata } from '../registry';
import { frenlyAgentService } from '../../services/frenlyAgentService';
import { helpContentService } from '../../services/helpContentService';
import { logger } from '../../services/logger';

/**
 * Get contextual guidance for a feature
 */
export async function getFeatureGuidance(
  featureId: string,
  context?: Record<string, unknown>
): Promise<string | null> {
  const feature = featureRegistry.get(featureId);
  if (!feature?.frenlyIntegration?.providesGuidance) {
    return null;
  }

  // Get help content from feature tips or help content service
  if (feature.frenlyIntegration.helpContentIds && feature.frenlyIntegration.helpContentIds.length > 0) {
    try {
      // Try to get help content from service
      const helpContentMap = await helpContentService.getHelpContentBatch(
        feature.frenlyIntegration.helpContentIds
      );
      
      if (helpContentMap.size > 0) {
        // Use help content if available
        const helpContent = Array.from(helpContentMap.values())[0];
        return helpContent.content;
      }
    } catch (error) {
      logger.error('Failed to load help content', { featureId, error });
    }
    
    // Fallback to tips
    const tips = feature.frenlyIntegration.tips || [];
    if (tips.length > 0) {
      return `💡 Tips for ${feature.name}:\n${tips.map(t => `- ${t}`).join('\n')}`;
    }
  }

  // Generate contextual message using Frenly agent
  if (context) {
    try {
      const userId = (context.userId as string) || 'system';
      const page = (context.page as string) || feature.category;
      const progressContext = context.progress as {
        completedSteps?: string[];
        totalSteps?: number;
        currentStep?: string;
      } | undefined;

      const message = await frenlyAgentService.generateMessage({
        userId,
        page,
        progress: progressContext ? {
          completedSteps: progressContext.completedSteps || [],
          totalSteps: progressContext.totalSteps || 0,
          currentStep: progressContext.currentStep,
        } : undefined,
      });

      return message.content;
    } catch {
      // Fallback to tips
    }
  }

  // Fallback to tips
  if (feature.frenlyIntegration.tips && feature.frenlyIntegration.tips.length > 0) {
    return `💡 Tips for ${feature.name}:\n${feature.frenlyIntegration.tips.map(t => `- ${t}`).join('\n')}`;
  }

  return null;
}

/**
 * Get features relevant to current context
 */
export function getRelevantFeatures(
  page?: string,
  userProgress?: string[]
): FeatureMetadata[] {
  const allFeatures = featureRegistry.getAll();

  return allFeatures.filter(feature => {
    // Filter by page/category
    if (page && feature.category !== page && !feature.id.includes(page)) {
      return false;
    }

    // Filter by onboarding progress
    if (userProgress && feature.frenlyIntegration?.onboardingSteps) {
      const hasRelevantStep = feature.frenlyIntegration.onboardingSteps.some(
        step => userProgress.includes(step)
      );
      if (!hasRelevantStep) {
        return false;
      }
    }

    return feature.frenlyIntegration?.providesGuidance === true;
  });
}

/**
 * Track feature usage for Frenly learning
 */
export async function trackFeatureUsage(
  featureId: string,
  actionId: string,
  userId: string
): Promise<void> {
  const feature = featureRegistry.get(featureId);
  if (!feature) return;

  await frenlyAgentService.trackInteraction(userId, `feature:${featureId}:${actionId}`, undefined);
}

/**
 * Get next suggested feature based on user progress
 */
export function getNextSuggestedFeature(
  completedSteps: string[]
): FeatureMetadata | null {
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

