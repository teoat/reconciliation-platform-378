/**
 * Feature Hooks
 * 
 * React hooks for feature registry and AI integration
 */

// Feature Registry Hooks
export {
  useFeature,
  useFeaturesByCategory,
  useCompatibleFeatures as useCompatibleFeaturesRegistry,
  useFrenlyFeatures,
  useFeatureSearch,
  useAllFeatures,
} from './useFeatureRegistry';

// Frenly AI Integration Hooks
export {
  useFeatureGuidance,
  useRelevantFeatures,
  useTrackFeatureUsage,
  useNextSuggestedFeature,
} from './useFrenlyFeatureIntegration';

// Meta Agent Integration Hooks
export {
  useCompatibleFeatures,
  useMonitorableFeatures,
  useExecutableFeatures,
  useFeatureActions,
  useFeatureMetrics,
  useFeatureEvents,
  useRequiresApproval,
  useValidateActionParameters,
} from './useMetaAgentFeatureIntegration';

