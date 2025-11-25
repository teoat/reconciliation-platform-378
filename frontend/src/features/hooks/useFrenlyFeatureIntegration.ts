/**
 * React Hook for Frenly AI Feature Integration
 * 
 * Provides hooks for Frenly AI to interact with features
 */

import { useCallback } from 'react';
import {
  getFeatureGuidance,
  getRelevantFeatures,
  trackFeatureUsage,
  getNextSuggestedFeature,
} from '../integration/frenly';
import type { FeatureMetadata } from '../registry';

/**
 * Hook to get guidance for a feature
 */
export function useFeatureGuidance() {
  return useCallback(
    async (featureId: string, context?: Record<string, unknown>) => {
      return getFeatureGuidance(featureId, context);
    },
    []
  );
}

/**
 * Hook to get relevant features for current context
 */
export function useRelevantFeatures(page?: string, userProgress?: string[]) {
  return useCallback(() => {
    return getRelevantFeatures(page, userProgress);
  }, [page, userProgress]);
}

/**
 * Hook to track feature usage
 */
export function useTrackFeatureUsage() {
  return useCallback(
    async (featureId: string, actionId: string, userId: string) => {
      await trackFeatureUsage(featureId, actionId, userId);
    },
    []
  );
}

/**
 * Hook to get next suggested feature
 */
export function useNextSuggestedFeature(completedSteps: string[]) {
  return useCallback((): FeatureMetadata | null => {
    return getNextSuggestedFeature(completedSteps);
  }, [completedSteps]);
}

