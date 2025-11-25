/**
 * Orchestration Integration
 * 
 * Integration between feature registry and page orchestration system
 * 
 * @deprecated Use orchestration-integration.ts instead
 */

import { featureRegistry, type FeatureMetadata } from '../registry';
import type { PageOrchestrationInterface } from '../../orchestration/types';

/**
 * Get features for a page
 */
export function getPageFeatures(pageId: string): FeatureMetadata[] {
  return featureRegistry.getAll().filter(f => 
    f.id.includes(pageId) || 
    f.frenlyIntegration?.onboardingSteps?.some(step => step.includes(pageId))
  );
}

// Re-export from orchestration-integration
export {
  FeatureAwarePageIntegration,
  registerPageOrchestration,
} from './orchestration-integration';

