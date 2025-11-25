/**
 * Feature Registry Synchronization
 * 
 * Synchronizes feature registry with external systems and components
 */

import { featureRegistry } from '../registry';
import { logger } from '../../services/logger';
import { frenlyAgentService } from '../../services/frenlyAgentService';

/**
 * Sync features with Frenly AI service
 */
export async function syncFeaturesWithFrenly(): Promise<void> {
  try {
    const frenlyFeatures = featureRegistry.getFrenlyEnabled();
    
    logger.info('Syncing features with Frenly AI', {
      featureCount: frenlyFeatures.length,
    });

    // Prepare feature metadata for sync
    const featuresToSync = frenlyFeatures.map(feature => ({
      id: feature.id,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      frenlyIntegration: feature.frenlyIntegration,
      actions: feature.actions?.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
      })) || [],
    }));

    // Try to sync with backend via frenlyAgentService
    try {
      // Use the agent service to register features
      // This will be handled by the backend agent when it receives feature metadata
      const userId = localStorage.getItem('userId') || 'system';
      
      // Track feature registration as interaction
      for (const feature of featuresToSync) {
        await frenlyAgentService.trackInteraction(
          userId,
          `feature:registered:${feature.id}`,
          JSON.stringify(feature)
        );
      }

      logger.info('Features synced with Frenly AI backend', {
        featureCount: featuresToSync.length,
      });
    } catch (syncError) {
      logger.warn('Failed to sync features with backend, using local registry only', {
        error: syncError,
        featureCount: featuresToSync.length,
      });
      // Don't throw - local registry still works
    }

    // Track feature discovery locally
    for (const feature of frenlyFeatures) {
      try {
        logger.debug('Feature available for Frenly guidance', {
          featureId: feature.id,
          name: feature.name,
          providesGuidance: feature.frenlyIntegration?.providesGuidance,
          tipsCount: feature.frenlyIntegration?.tips?.length || 0,
        });
      } catch (error) {
        logger.error('Failed to log feature sync', {
          featureId: feature.id,
          error,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to sync features with Frenly', { error });
    throw error;
  }
}

/**
 * Sync features with Meta Agent framework
 */
export async function syncFeaturesWithMetaAgent(): Promise<void> {
  try {
    const allFeatures = featureRegistry.getAll();
    
    logger.info('Syncing features with Meta Agent', {
      featureCount: allFeatures.length,
    });

    // Track feature discovery for meta agents
    for (const feature of allFeatures) {
      if (feature.metaAgentIntegration) {
        try {
          logger.debug('Feature synced with Meta Agent', {
            featureId: feature.id,
            monitorable: feature.metaAgentIntegration.monitorable,
            executable: feature.metaAgentIntegration.executable,
          });
        } catch (error) {
          logger.error('Failed to sync feature with Meta Agent', {
            featureId: feature.id,
            error,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Failed to sync features with Meta Agent', { error });
    throw error;
  }
}

/**
 * Initialize feature registry synchronization
 */
export async function initializeFeatureSync(): Promise<void> {
  try {
    await Promise.all([
      syncFeaturesWithFrenly(),
      syncFeaturesWithMetaAgent(),
    ]);
    
    logger.info('Feature registry synchronization initialized');
  } catch (error) {
    logger.error('Failed to initialize feature sync', { error });
    throw error;
  }
}

/**
 * Get feature usage statistics
 */
export function getFeatureUsageStats(): {
  totalFeatures: number;
  frenlyEnabled: number;
  metaAgentEnabled: number;
  byCategory: Record<string, number>;
} {
  const allFeatures = featureRegistry.getAll();
  const frenlyFeatures = featureRegistry.getFrenlyEnabled();
  const metaAgentFeatures = allFeatures.filter(f => f.metaAgentIntegration);

  const byCategory: Record<string, number> = {};
  allFeatures.forEach(feature => {
    byCategory[feature.category] = (byCategory[feature.category] || 0) + 1;
  });

  return {
    totalFeatures: allFeatures.length,
    frenlyEnabled: frenlyFeatures.length,
    metaAgentEnabled: metaAgentFeatures.length,
    byCategory,
  };
}

