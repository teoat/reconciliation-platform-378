/**
 * Meta Agent Integration with Feature Registry
 * 
 * Provides hooks and utilities for meta agents to discover and interact with features
 */

import { featureRegistry, type FeatureMetadata, type AgentType } from '../registry';

/**
 * Get features compatible with an agent type
 */
export function getCompatibleFeatures(agentType: AgentType): FeatureMetadata[] {
  return featureRegistry.getCompatibleWithAgent(agentType);
}

/**
 * Get features that can be monitored
 */
export function getMonitorableFeatures(): FeatureMetadata[] {
  return featureRegistry.getAll().filter(
    f => f.metaAgentIntegration?.monitorable === true
  );
}

/**
 * Get features that can be executed
 */
export function getExecutableFeatures(): FeatureMetadata[] {
  return featureRegistry.getAll().filter(
    f => f.metaAgentIntegration?.executable === true
  );
}

/**
 * Get feature actions for execution
 */
export function getFeatureActions(featureId: string) {
  const feature = featureRegistry.get(featureId);
  return feature?.actions || [];
}

/**
 * Get feature metrics for monitoring
 */
export function getFeatureMetrics(featureId: string) {
  const feature = featureRegistry.get(featureId);
  return feature?.metaAgentIntegration?.metrics || [];
}

/**
 * Get feature events for event-driven architecture
 */
export function getFeatureEvents(featureId: string) {
  const feature = featureRegistry.get(featureId);
  return feature?.metaAgentIntegration?.events || [];
}

/**
 * Check if feature requires approval for action
 */
export function requiresApproval(featureId: string, actionId: string): boolean {
  const feature = featureRegistry.get(featureId);
  const action = feature?.actions.find(a => a.id === actionId);
  return action?.requiresApproval === true;
}

/**
 * Get feature dependencies
 */
export function getFeatureDependencies(featureId: string): FeatureMetadata[] {
  return featureRegistry.getDependencies(featureId);
}

/**
 * Validate feature action parameters
 */
export function validateActionParameters(
  featureId: string,
  actionId: string,
  parameters: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const feature = featureRegistry.get(featureId);
  const action = feature?.actions.find(a => a.id === actionId);

  if (!action) {
    return { valid: false, errors: [`Action ${actionId} not found in feature ${featureId}`] };
  }

  const errors: string[] = [];

  // Check required parameters
  action.parameters?.forEach(param => {
    if (param.required && !(param.name in parameters)) {
      errors.push(`Missing required parameter: ${param.name}`);
    }
  });

  // Type validation could be added here

  return { valid: errors.length === 0, errors };
}

/**
 * Get feature metadata as JSON for agent processing
 */
export function getFeatureMetadataJSON(featureId: string): string | null {
  const feature = featureRegistry.get(featureId);
  return feature ? JSON.stringify(feature, null, 2) : null;
}

/**
 * Get all features metadata as JSON
 */
export function getAllFeaturesMetadataJSON(): string {
  return JSON.stringify(featureRegistry.getAll(), null, 2);
}

