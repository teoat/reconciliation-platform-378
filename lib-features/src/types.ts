/**
 * Type definitions for feature flags
 */

export interface FeatureFlag {
  /** Unique identifier for the feature flag */
  key: string;
  /** Human-readable name */
  name: string;
  /** Description of what the feature does */
  description: string;
  /** Whether the feature is enabled by default */
  defaultValue: boolean;
  /** Category for grouping related features */
  category: FeatureCategory;
  /** Rollout percentage (0-100) */
  rolloutPercentage?: number;
  /** User segments that should have access */
  allowedSegments?: string[];
  /** Whether this is an experimental feature */
  experimental?: boolean;
  /** Date when the feature was added */
  createdAt?: string;
  /** Target removal date for experimental features */
  targetRemovalDate?: string;
}

export type FeatureCategory = 
  | 'ui'
  | 'backend'
  | 'performance'
  | 'security'
  | 'experimental'
  | 'beta';

export interface FeatureFlagContext {
  /** User identifier */
  userId?: string;
  /** User email */
  email?: string;
  /** User role */
  role?: string;
  /** Organization identifier */
  organizationId?: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Additional custom attributes */
  customAttributes?: Record<string, string | number | boolean>;
}

export interface FeatureFlagEvaluation {
  /** The evaluated flag key */
  flagKey: string;
  /** The evaluated value */
  value: boolean;
  /** Reason for the evaluation result */
  reason: EvaluationReason;
  /** Variant key if using multi-variate flags */
  variationKey?: string;
}

export type EvaluationReason = 
  | 'default'
  | 'targeting-match'
  | 'rollout'
  | 'override'
  | 'error';

export interface FeatureFlagOverride {
  /** Flag key to override */
  flagKey: string;
  /** Override value */
  value: boolean;
  /** Expiration timestamp */
  expiresAt?: Date;
  /** Reason for override */
  reason?: string;
}

export interface FeatureFlagConfig {
  /** Optimizely SDK key */
  sdkKey?: string;
  /** Polling interval in seconds */
  pollingInterval?: number;
  /** Enable local storage caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Default flags to use when SDK is not available */
  defaultFlags?: Record<string, boolean>;
}
