/**
 * React Component Integration for Feature Registry
 *
 * Provides React components and hooks for integrating feature registry
 * with existing Frenly AI and orchestration components
 */

import { useEffect, useState } from 'react';
import { featureRegistry, type FeatureMetadata } from '../registry';
import { getFeatureGuidance, getRelevantFeatures } from './frenly';
import { initializeFeatureSync, getFeatureUsageStats } from './sync';
import { validateOnInit } from './validation';
import { logger } from '../../services/logger';

/**
 * Hook to initialize feature registry on app startup
 */
export function useFeatureRegistryInit() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Validate registry first
        validateOnInit();

        // Then sync with external systems
        await initializeFeatureSync();

        if (mounted) {
          setInitialized(true);
          logger.info('Feature registry initialized');
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          logger.error('Failed to initialize feature registry', { error });
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { initialized, error };
}

/**
 * Hook to get feature guidance for current context
 */
export function useFeatureGuidanceForContext(pageId?: string, userProgress?: string[]) {
  const [guidance, setGuidance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pageId) return;

    async function loadGuidance() {
      setLoading(true);
      try {
        // Get relevant features for current page
        const relevantFeatures = getRelevantFeatures(pageId, userProgress);

        if (relevantFeatures.length > 0) {
          // Get guidance from first relevant feature
          const featureGuidance = await getFeatureGuidance(relevantFeatures[0].id, {
            page: pageId,
            userProgress,
          });
          setGuidance(featureGuidance);
        }
      } catch (error) {
        logger.error('Failed to load feature guidance', { error, pageId });
      } finally {
        setLoading(false);
      }
    }

    loadGuidance();
  }, [pageId, userProgress]);

  return { guidance, loading };
}

/**
 * Hook to get feature statistics
 */
export function useFeatureStats() {
  const [stats, setStats] = useState(getFeatureUsageStats());

  useEffect(() => {
    // Update stats when features change
    const updateStats = () => {
      setStats(getFeatureUsageStats());
    };

    // Initial stats
    updateStats();

    // Could add event listener for feature registry changes
    // For now, we'll update on mount
  }, []);

  return stats;
}

/**
 * Component to display feature guidance
 */
export function FeatureGuidanceDisplay({
  featureId,
  context,
}: {
  featureId: string;
  context?: Record<string, unknown>;
}) {
  const [guidance, setGuidance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGuidance() {
      setLoading(true);
      try {
        const featureGuidance = await getFeatureGuidance(featureId, context);
        setGuidance(featureGuidance);
      } catch (error) {
        logger.error('Failed to load feature guidance', { error, featureId });
      } finally {
        setLoading(false);
      }
    }

    loadGuidance();
  }, [featureId, context]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading guidance...</div>;
  }

  if (!guidance) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-sm whitespace-pre-line">{guidance}</div>
    </div>
  );
}
