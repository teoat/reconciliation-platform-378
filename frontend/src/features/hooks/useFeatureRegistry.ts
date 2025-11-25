/**
 * React Hook for Feature Registry
 * 
 * Provides React hooks for accessing feature registry in components
 */

import { useMemo } from 'react';
import {
  featureRegistry,
  type FeatureMetadata,
  type FeatureCategory,
  type AgentType,
} from '../registry';

/**
 * Hook to get a feature by ID
 */
export function useFeature(featureId: string): FeatureMetadata | undefined {
  return useMemo(() => featureRegistry.get(featureId), [featureId]);
}

/**
 * Hook to get features by category
 */
export function useFeaturesByCategory(category: FeatureCategory): FeatureMetadata[] {
  return useMemo(() => featureRegistry.getByCategory(category), [category]);
}

/**
 * Hook to get features compatible with agent type
 */
export function useCompatibleFeatures(agentType: AgentType): FeatureMetadata[] {
  return useMemo(() => featureRegistry.getCompatibleWithAgent(agentType), [agentType]);
}

/**
 * Hook to get Frenly-enabled features
 */
export function useFrenlyFeatures(): FeatureMetadata[] {
  return useMemo(() => featureRegistry.getFrenlyEnabled(), []);
}

/**
 * Hook to search features
 */
export function useFeatureSearch(query: string): FeatureMetadata[] {
  return useMemo(() => featureRegistry.search(query), [query]);
}

/**
 * Hook to get all features
 */
export function useAllFeatures(): FeatureMetadata[] {
  return useMemo(() => featureRegistry.getAll(), []);
}

