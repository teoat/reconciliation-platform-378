/**
 * Features Index - Central Export Point
 * 
 * This file provides a clean, organized export structure for all features,
 * making it easy for AI agents to discover and interact with application capabilities.
 */

// Feature Registry
export {
  featureRegistry,
  registerFeature,
  getFeatureMetadata,
  getAllFeaturesJSON,
  type FeatureMetadata,
  type FeatureCategory,
  type FeatureAction,
  type FrenlyIntegration,
  type MetaAgentIntegration,
  type AgentType,
} from './registry';

// Feature Modules (organized by category)
// Each feature module exports its metadata and implementation

// Data Ingestion Features
export * from './data-ingestion';

// Reconciliation Features
export * from './reconciliation';

// Adjudication Features
export * from './adjudication';

// Analytics Features
export * from './analytics';

// Collaboration Features
export * from './collaboration';

// Security Features
export * from './security';

// Performance Features
export * from './performance';

// UI Component Features
export * from './ui-components';

// Utility Features
export * from './utilities';

// Orchestration Features
export * from './orchestration';

