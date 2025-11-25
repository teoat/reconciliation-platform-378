/**
 * Feature Registry Validation
 * 
 * Validates feature registry integrity and provides diagnostics
 */

import { featureRegistry, type FeatureMetadata } from '../registry';
import { logger } from '../../services/logger';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalFeatures: number;
    byCategory: Record<string, number>;
    frenlyEnabled: number;
    metaAgentEnabled: number;
  };
}

/**
 * Validate feature registry
 */
export function validateFeatureRegistry(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allFeatures = featureRegistry.getAll();

  // Check for duplicate IDs
  const ids = new Set<string>();
  allFeatures.forEach(feature => {
    if (ids.has(feature.id)) {
      errors.push(`Duplicate feature ID: ${feature.id}`);
    }
    ids.add(feature.id);
  });

  // Validate feature structure
  allFeatures.forEach(feature => {
    // Required fields
    if (!feature.id) {
      errors.push(`Feature missing ID: ${JSON.stringify(feature)}`);
    }
    if (!feature.name) {
      errors.push(`Feature ${feature.id} missing name`);
    }
    if (!feature.description) {
      warnings.push(`Feature ${feature.id} missing description`);
    }
    if (!feature.category) {
      errors.push(`Feature ${feature.id} missing category`);
    }
    if (!feature.status) {
      warnings.push(`Feature ${feature.id} missing status`);
    }

    // Validate actions
    if (feature.actions) {
      feature.actions.forEach((action, index) => {
        if (!action.id) {
          errors.push(`Feature ${feature.id} action ${index} missing ID`);
        }
        if (!action.name) {
          warnings.push(`Feature ${feature.id} action ${index} missing name`);
        }
      });
    }

    // Validate Frenly integration
    if (feature.frenlyIntegration) {
      if (feature.frenlyIntegration.providesGuidance && !feature.frenlyIntegration.tips && !feature.frenlyIntegration.helpContentIds) {
        warnings.push(`Feature ${feature.id} provides guidance but has no tips or help content`);
      }
    }

    // Validate Meta Agent integration
    if (feature.metaAgentIntegration) {
      if (feature.metaAgentIntegration.executable && (!feature.actions || feature.actions.length === 0)) {
        warnings.push(`Feature ${feature.id} is executable but has no actions`);
      }
    }
  });

  // Calculate stats
  const byCategory: Record<string, number> = {};
  allFeatures.forEach(feature => {
    byCategory[feature.category] = (byCategory[feature.category] || 0) + 1;
  });

  const frenlyEnabled = featureRegistry.getFrenlyEnabled().length;
  const metaAgentEnabled = allFeatures.filter(f => f.metaAgentIntegration).length;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalFeatures: allFeatures.length,
      byCategory,
      frenlyEnabled,
      metaAgentEnabled,
    },
  };
}

/**
 * Log validation results
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.valid) {
    logger.info('Feature registry validation passed', result.stats);
  } else {
    logger.error('Feature registry validation failed', {
      errorCount: result.errors.length,
      errors: result.errors,
    });
  }

  if (result.warnings.length > 0) {
    logger.warn('Feature registry validation warnings', {
      warningCount: result.warnings.length,
      warnings: result.warnings,
    });
  }
}

/**
 * Validate on initialization
 */
export function validateOnInit(): void {
  const result = validateFeatureRegistry();
  logValidationResults(result);

  if (!result.valid) {
    throw new Error(`Feature registry validation failed: ${result.errors.join(', ')}`);
  }
}

