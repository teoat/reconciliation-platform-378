/**
 * React Hook for Meta Agent Feature Integration
 * 
 * Provides hooks for meta agents to interact with features
 */

import { useCallback, useMemo } from 'react';
import {
  getCompatibleFeatures,
  getMonitorableFeatures,
  getExecutableFeatures,
  getFeatureActions,
  getFeatureMetrics,
  getFeatureEvents,
  requiresApproval,
  validateActionParameters,
} from '../integration/meta-agent';
import type { AgentType, FeatureMetadata } from '../registry';

/**
 * Hook to get features compatible with agent type
 */
export function useCompatibleFeatures(agentType: AgentType): FeatureMetadata[] {
  return useMemo(() => getCompatibleFeatures(agentType), [agentType]);
}

/**
 * Hook to get monitorable features
 */
export function useMonitorableFeatures(): FeatureMetadata[] {
  return useMemo(() => getMonitorableFeatures(), []);
}

/**
 * Hook to get executable features
 */
export function useExecutableFeatures(): FeatureMetadata[] {
  return useMemo(() => getExecutableFeatures(), []);
}

/**
 * Hook to get feature actions
 */
export function useFeatureActions(featureId: string) {
  return useMemo(() => getFeatureActions(featureId), [featureId]);
}

/**
 * Hook to get feature metrics
 */
export function useFeatureMetrics(featureId: string) {
  return useMemo(() => getFeatureMetrics(featureId), [featureId]);
}

/**
 * Hook to get feature events
 */
export function useFeatureEvents(featureId: string) {
  return useMemo(() => getFeatureEvents(featureId), [featureId]);
}

/**
 * Hook to check if action requires approval
 */
export function useRequiresApproval() {
  return useCallback(
    (featureId: string, actionId: string): boolean => {
      return requiresApproval(featureId, actionId);
    },
    []
  );
}

/**
 * Hook to validate action parameters
 */
export function useValidateActionParameters() {
  return useCallback(
    (
      featureId: string,
      actionId: string,
      parameters: Record<string, unknown>
    ) => {
      return validateActionParameters(featureId, actionId, parameters);
    },
    []
  );
}

