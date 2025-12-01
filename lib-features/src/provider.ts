/**
 * Feature Flag Provider
 * 
 * Provides a unified interface for evaluating feature flags,
 * with support for Optimizely integration and local fallbacks.
 */

import { 
  FeatureFlagConfig, 
  FeatureFlagContext, 
  FeatureFlagEvaluation,
  FeatureFlagOverride 
} from './types';
import { FEATURE_FLAGS, getFeatureFlag } from './flags';

/**
 * Feature Flag Provider class
 * Manages feature flag evaluation with caching and override support
 */
export class FeatureFlagProvider {
  private config: FeatureFlagConfig;
  private overrides: Map<string, FeatureFlagOverride>;
  private cache: Map<string, { value: boolean; timestamp: number }>;
  private context: FeatureFlagContext;

  constructor(config: FeatureFlagConfig = {}) {
    this.config = {
      pollingInterval: 60,
      enableCache: true,
      cacheTTL: 300,
      debug: false,
      ...config
    };
    this.overrides = new Map();
    this.cache = new Map();
    this.context = {};
  }

  /**
   * Initialize the provider with user context
   */
  public initialize(context: FeatureFlagContext): void {
    this.context = context;
    
    if (this.config.debug) {
      console.log('[FeatureFlags] Initialized with context:', context);
    }
  }

  /**
   * Evaluate a feature flag
   */
  public isEnabled(flagKey: string, defaultValue?: boolean): boolean {
    const evaluation = this.evaluate(flagKey, defaultValue);
    return evaluation.value;
  }

  /**
   * Evaluate a feature flag with full details
   */
  public evaluate(flagKey: string, defaultValue?: boolean): FeatureFlagEvaluation {
    // Check for overrides first
    const override = this.overrides.get(flagKey);
    if (override) {
      if (!override.expiresAt || override.expiresAt > new Date()) {
        return {
          flagKey,
          value: override.value,
          reason: 'override'
        };
      } else {
        // Remove expired override
        this.overrides.delete(flagKey);
      }
    }

    // Check cache
    if (this.config.enableCache) {
      const cached = this.cache.get(flagKey);
      if (cached) {
        const isExpired = Date.now() - cached.timestamp > (this.config.cacheTTL ?? 300) * 1000;
        if (!isExpired) {
          return {
            flagKey,
            value: cached.value,
            reason: 'default'
          };
        }
      }
    }

    // Get flag definition
    const flag = getFeatureFlag(flagKey);
    if (!flag) {
      const value = defaultValue ?? this.config.defaultFlags?.[flagKey] ?? false;
      return {
        flagKey,
        value,
        reason: 'default'
      };
    }

    // Evaluate based on rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.context.userId || 'anonymous', flagKey);
      const isInRollout = hash < flag.rolloutPercentage;
      
      const result = {
        flagKey,
        value: isInRollout,
        reason: 'rollout' as const
      };

      this.cacheResult(flagKey, result.value);
      return result;
    }

    // Check segment targeting
    if (flag.allowedSegments && flag.allowedSegments.length > 0) {
      const userRole = this.context.role || '';
      const isTargeted = flag.allowedSegments.includes(userRole);
      
      const result = {
        flagKey,
        value: isTargeted,
        reason: 'targeting-match' as const
      };

      this.cacheResult(flagKey, result.value);
      return result;
    }

    // Return default value
    const value = flag.defaultValue;
    this.cacheResult(flagKey, value);

    return {
      flagKey,
      value,
      reason: 'default'
    };
  }

  /**
   * Set a local override for a feature flag
   */
  public setOverride(override: FeatureFlagOverride): void {
    this.overrides.set(override.flagKey, override);
    
    if (this.config.debug) {
      console.log('[FeatureFlags] Override set:', override);
    }
  }

  /**
   * Remove an override
   */
  public removeOverride(flagKey: string): void {
    this.overrides.delete(flagKey);
  }

  /**
   * Clear all overrides
   */
  public clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Get all current overrides
   */
  public getOverrides(): FeatureFlagOverride[] {
    return Array.from(this.overrides.values());
  }

  /**
   * Clear the evaluation cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all enabled features for current context
   */
  public getEnabledFeatures(): string[] {
    const enabled: string[] = [];
    
    for (const flag of Object.values(FEATURE_FLAGS)) {
      if (this.isEnabled(flag.key)) {
        enabled.push(flag.key);
      }
    }
    
    return enabled;
  }

  /**
   * Hash user ID for consistent rollout bucketing
   */
  private hashUserId(userId: string, flagKey: string): number {
    const combined = `${userId}:${flagKey}`;
    let hash = 0;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash % 100);
  }

  /**
   * Cache evaluation result
   */
  private cacheResult(flagKey: string, value: boolean): void {
    if (this.config.enableCache) {
      this.cache.set(flagKey, { value, timestamp: Date.now() });
    }
  }
}

// Singleton instance for convenience
let defaultProvider: FeatureFlagProvider | null = null;

/**
 * Get or create the default provider instance
 */
export function getDefaultProvider(config?: FeatureFlagConfig): FeatureFlagProvider {
  if (!defaultProvider) {
    defaultProvider = new FeatureFlagProvider(config);
  }
  return defaultProvider;
}

/**
 * Initialize the default provider with context
 */
export function initializeFeatureFlags(
  context: FeatureFlagContext,
  config?: FeatureFlagConfig
): FeatureFlagProvider {
  const provider = getDefaultProvider(config);
  provider.initialize(context);
  return provider;
}

/**
 * Quick check if a feature is enabled
 */
export function isFeatureEnabled(flagKey: string, defaultValue?: boolean): boolean {
  return getDefaultProvider().isEnabled(flagKey, defaultValue);
}
