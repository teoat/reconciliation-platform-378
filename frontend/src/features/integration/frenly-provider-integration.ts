/**
 * FrenlyProvider Integration with Feature Registry
 * 
 * Helper functions to integrate feature registry with FrenlyProvider component
 */

import { getRelevantFeatures, getFeatureGuidance } from './frenly';
import { logger } from '../../services/logger';

/**
 * Enhanced message generation using feature registry
 */
export async function generateFeatureAwareMessage(
  currentPage: string,
  userProgress: {
    completedSteps: string[];
    totalSteps: number;
    currentStep?: string;
  },
  fallbackMessage: () => Promise<{
    id: string;
    type: string;
    content: string;
    timestamp: Date;
    priority: string;
  }>
): Promise<{
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  priority: string;
}> {
  try {
    // Get relevant features for current page
    const relevantFeatures = getRelevantFeatures(
      currentPage,
      userProgress.completedSteps
    );

    if (relevantFeatures.length > 0) {
      // Get guidance from most relevant feature
      const primaryFeature = relevantFeatures[0];
      const guidance = await getFeatureGuidance(primaryFeature.id, {
        page: currentPage,
        userProgress: userProgress.completedSteps,
        progress: {
          completedSteps: userProgress.completedSteps,
          totalSteps: userProgress.totalSteps,
          currentStep: userProgress.currentStep,
        },
      });

      if (guidance) {
        return {
          id: `feature-guidance-${Date.now()}`,
          type: 'tip',
          content: guidance,
          timestamp: new Date(),
          priority: 'medium',
        };
      }
    }

    // Fallback to default message generation
    return fallbackMessage();
  } catch (error) {
    logger.error('Failed to generate feature-aware message', { error });
    // Fallback to default
    return fallbackMessage();
  }
}

/**
 * Get next suggested feature for user
 */
export function getNextFeatureSuggestion(
  currentPage: string,
  completedSteps: string[]
): {
  featureId: string;
  featureName: string;
  suggestion: string;
} | null {
  try {
    const relevantFeatures = getRelevantFeatures(currentPage, completedSteps);
    
    if (relevantFeatures.length > 0) {
      const nextFeature = relevantFeatures[0];
      const tips = nextFeature.frenlyIntegration?.tips || [];
      
      return {
        featureId: nextFeature.id,
        featureName: nextFeature.name,
        suggestion: tips[0] || `Try using ${nextFeature.name}`,
      };
    }

    return null;
  } catch (error) {
    logger.error('Failed to get next feature suggestion', { error });
    return null;
  }
}

