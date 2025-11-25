/**
 * Feature Registry for Meta Agent and Frenly AI Integration
 * 
 * This registry provides a centralized way for AI agents to discover, understand,
 * and interact with application features. Each feature is self-describing with
 * metadata that enables intelligent agent behavior.
 */

export interface FeatureMetadata {
  /** Unique identifier for the feature */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Feature description for AI understanding */
  description: string;
  
  /** Feature category for organization */
  category: FeatureCategory;
  
  /** Available actions this feature can perform */
  actions: FeatureAction[];
  
  /** Required permissions/roles */
  permissions?: string[];
  
  /** Dependencies on other features */
  dependencies?: string[];
  
  /** Integration points for Frenly AI */
  frenlyIntegration?: FrenlyIntegration;
  
  /** Integration points for Meta Agent */
  metaAgentIntegration?: MetaAgentIntegration;
  
  /** Feature status */
  status: 'active' | 'deprecated' | 'experimental';
  
  /** Version information */
  version: string;
}

export type FeatureCategory =
  | 'data-ingestion'
  | 'reconciliation'
  | 'adjudication'
  | 'analytics'
  | 'collaboration'
  | 'security'
  | 'performance'
  | 'ui-component'
  | 'utility'
  | 'orchestration';

export interface FeatureAction {
  /** Action identifier */
  id: string;
  
  /** Action name */
  name: string;
  
  /** Action description */
  description: string;
  
  /** Input parameters */
  parameters?: ParameterDefinition[];
  
  /** Expected output type */
  outputType?: string;
  
  /** Whether action requires human approval */
  requiresApproval?: boolean;
  
  /** Estimated execution time */
  estimatedDuration?: number;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
}

export interface FrenlyIntegration {
  /** Whether Frenly can provide guidance for this feature */
  providesGuidance: boolean;
  
  /** Contextual help content IDs */
  helpContentIds?: string[];
  
  /** Onboarding steps related to this feature */
  onboardingSteps?: string[];
  
  /** Tips and suggestions Frenly can provide */
  tips?: string[];
  
  /** User progress tracking points */
  progressMilestones?: string[];
}

export interface MetaAgentIntegration {
  /** Whether meta agents can monitor this feature */
  monitorable: boolean;
  
  /** Whether meta agents can execute actions */
  executable: boolean;
  
  /** Agent types that can interact with this feature */
  compatibleAgents?: AgentType[];
  
  /** Metrics this feature exposes */
  metrics?: MetricDefinition[];
  
  /** Events this feature emits */
  events?: EventDefinition[];
}

export type AgentType =
  | 'monitoring'
  | 'decision'
  | 'remediation'
  | 'processing'
  | 'optimization'
  | 'guidance';

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  unit?: string;
}

export interface EventDefinition {
  name: string;
  description: string;
  payload?: Record<string, unknown>;
}

/**
 * Feature Registry
 * 
 * Central registry of all application features with metadata for AI integration
 */
class FeatureRegistry {
  private features = new Map<string, FeatureMetadata>();

  /**
   * Register a feature with the registry
   */
  register(feature: FeatureMetadata): void {
    if (this.features.has(feature.id)) {
      console.warn(`Feature ${feature.id} is already registered. Overwriting.`);
    }
    this.features.set(feature.id, feature);
  }

  /**
   * Get a feature by ID
   */
  get(id: string): FeatureMetadata | undefined {
    return this.features.get(id);
  }

  /**
   * Get all features
   */
  getAll(): FeatureMetadata[] {
    return Array.from(this.features.values());
  }

  /**
   * Get features by category
   */
  getByCategory(category: FeatureCategory): FeatureMetadata[] {
    return this.getAll().filter(f => f.category === category);
  }

  /**
   * Get features compatible with an agent type
   */
  getCompatibleWithAgent(agentType: AgentType): FeatureMetadata[] {
    return this.getAll().filter(f => 
      f.metaAgentIntegration?.compatibleAgents?.includes(agentType)
    );
  }

  /**
   * Get features that provide Frenly guidance
   */
  getFrenlyEnabled(): FeatureMetadata[] {
    return this.getAll().filter(f => 
      f.frenlyIntegration?.providesGuidance === true
    );
  }

  /**
   * Search features by query
   */
  search(query: string): FeatureMetadata[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(f =>
      f.name.toLowerCase().includes(lowerQuery) ||
      f.description.toLowerCase().includes(lowerQuery) ||
      f.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get feature dependencies
   */
  getDependencies(featureId: string): FeatureMetadata[] {
    const feature = this.get(featureId);
    if (!feature?.dependencies) return [];
    
    return feature.dependencies
      .map(id => this.get(id))
      .filter((f): f is FeatureMetadata => f !== undefined);
  }

  /**
   * Get features that depend on a given feature
   */
  getDependents(featureId: string): FeatureMetadata[] {
    return this.getAll().filter(f => 
      f.dependencies?.includes(featureId)
    );
  }

  /**
   * Check if feature has all dependencies satisfied
   */
  hasDependenciesSatisfied(featureId: string, availableFeatures: string[] = []): boolean {
    const feature = this.get(featureId);
    if (!feature?.dependencies || feature.dependencies.length === 0) {
      return true;
    }

    // If availableFeatures is provided, check against that list
    if (availableFeatures.length > 0) {
      return feature.dependencies.every(dep => availableFeatures.includes(dep));
    }

    // Otherwise check if dependencies are registered
    return feature.dependencies.every(dep => this.get(dep) !== undefined);
  }

  /**
   * Get dependency chain for a feature (all dependencies recursively)
   */
  getDependencyChain(featureId: string, visited: Set<string> = new Set()): FeatureMetadata[] {
    if (visited.has(featureId)) {
      return []; // Circular dependency detected
    }

    visited.add(featureId);
    const feature = this.get(featureId);
    if (!feature?.dependencies) {
      return [];
    }

    const chain: FeatureMetadata[] = [];
    for (const depId of feature.dependencies) {
      const dep = this.get(depId);
      if (dep) {
        chain.push(dep);
        // Recursively get dependencies of dependencies
        const subChain = this.getDependencyChain(depId, visited);
        chain.push(...subChain);
      }
    }

    return chain;
  }
}

// Singleton instance
export const featureRegistry = new FeatureRegistry();

/**
 * Auto-register features from module exports
 * This allows features to self-register when imported
 */
export function registerFeature(feature: FeatureMetadata): void {
  featureRegistry.register(feature);
}

/**
 * Get feature metadata for AI agent consumption
 */
export function getFeatureMetadata(featureId: string): FeatureMetadata | null {
  return featureRegistry.get(featureId) || null;
}

/**
 * Get all features as JSON for AI agent processing
 */
export function getAllFeaturesJSON(): string {
  return JSON.stringify(featureRegistry.getAll(), null, 2);
}

