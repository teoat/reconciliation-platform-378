/**
 * Feature Integration Module
 * 
 * Integration points for Frenly AI and Meta Agent frameworks
 */

// Frenly AI Integration
export {
  getFeatureGuidance,
  getRelevantFeatures,
  trackFeatureUsage,
  getNextSuggestedFeature,
} from './frenly';

// Meta Agent Integration
export {
  getCompatibleFeatures,
  getMonitorableFeatures,
  getExecutableFeatures,
  getFeatureActions,
  getFeatureMetrics,
  getFeatureEvents,
  requiresApproval,
  getFeatureDependencies,
  validateActionParameters,
  getFeatureMetadataJSON,
  getAllFeaturesMetadataJSON,
} from './meta-agent';

// Synchronization
export {
  syncFeaturesWithFrenly,
  syncFeaturesWithMetaAgent,
  initializeFeatureSync,
  getFeatureUsageStats,
} from './sync';

// Orchestration Integration
export {
  FeatureAwarePageIntegration,
  registerPageOrchestration,
  getPageFeatures,
} from './orchestration-integration';

// Component Integration (React)
export {
  useFeatureRegistryInit,
  useFeatureGuidanceForContext,
  useFeatureStats,
  FeatureGuidanceDisplay,
} from './component-integration';

// Validation
export {
  validateFeatureRegistry,
  logValidationResults,
  validateOnInit,
  type ValidationResult,
} from './validation';

