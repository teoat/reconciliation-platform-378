/**
 * usePageOrchestration Hook - React hook for page orchestration with Frenly AI
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/services/logger';
import {
  getPageLifecycleManager,
  type PageOrchestrationInterface,
  type PageContext,
  type OnboardingStep,
  type GuidanceHandler,
  type GuidanceContent,
  type WorkflowState,
  type PageMetadata,
} from '@/orchestration';

export interface UsePageOrchestrationOptions {
  pageMetadata: PageMetadata;
  getPageContext: () => PageContext;
  getOnboardingSteps?: () => OnboardingStep[];
  getCurrentOnboardingStep?: () => OnboardingStep | null;
  completeOnboardingStep?: (stepId: string) => Promise<void>;
  skipOnboardingStep?: (stepId: string) => Promise<void>;
  registerGuidanceHandlers?: () => GuidanceHandler[];
  getGuidanceContent?: (topic: string) => GuidanceContent[];
  getWorkflowState?: () => WorkflowState | null;
  updateWorkflowState?: (state: Partial<WorkflowState>) => Promise<void>;
  onContextChange?: (changes: Partial<PageContext>) => void;
}

/**
 * React hook for page orchestration
 */
export function usePageOrchestration(options: UsePageOrchestrationOptions) {
  const location = useLocation();
  const lifecycleManager = getPageLifecycleManager();
  const pageOrchestrationRef = useRef<PageOrchestrationInterface | null>(null);

  // Create page orchestration implementation
  const createPageOrchestration = useCallback((): PageOrchestrationInterface => {
    return {
      getPageId: () => options.pageMetadata.id,
      getPageMetadata: () => options.pageMetadata,
      getPageContext: options.getPageContext,
      getOnboardingSteps: options.getOnboardingSteps || (() => []),
      getCurrentOnboardingStep: options.getCurrentOnboardingStep || (() => null),
      completeOnboardingStep:
        options.completeOnboardingStep ||
        (async () => {
          /* no-op */
        }),
      skipOnboardingStep:
        options.skipOnboardingStep ||
        (async () => {
          /* no-op */
        }),
      registerGuidanceHandlers: options.registerGuidanceHandlers || (() => []),
      getGuidanceContent: options.getGuidanceContent || (() => []),
      getWorkflowState: options.getWorkflowState || (() => null),
      updateWorkflowState:
        options.updateWorkflowState ||
        (async () => {
          /* no-op */
        }),
      syncWithFrenly: async () => {
        const integration = lifecycleManager.getFrenlyIntegration();
        if (integration) {
          await integration.syncPageState();
        }
      },
      onPageMount: async () => {
        await lifecycleManager.onPageMount(pageOrchestrationRef.current!);
      },
      onPageUpdate: async (changes: Partial<PageContext>) => {
        await lifecycleManager.onPageUpdate(pageOrchestrationRef.current!, changes);
        if (options.onContextChange) {
          options.onContextChange(changes);
        }
      },
      onPageUnmount: async () => {
        await lifecycleManager.onPageUnmount(pageOrchestrationRef.current!);
      },
    };
  }, [options, lifecycleManager]);

  // Initialize page orchestration
  useEffect(() => {
    pageOrchestrationRef.current = createPageOrchestration();
  }, [createPageOrchestration]);

  // Handle page mount
  useEffect(() => {
    if (!pageOrchestrationRef.current) return;

    const mount = async () => {
      try {
        await lifecycleManager.onPageMount(pageOrchestrationRef.current!);
      } catch (error) {
        logger.error('Error mounting page', { error });
      }
    };

    mount();

    // Cleanup on unmount
    return () => {
      if (pageOrchestrationRef.current) {
        lifecycleManager.onPageUnmount(pageOrchestrationRef.current).catch((error) => {
          logger.error('Error unmounting page', { error });
        });
      }
    };
  }, [location.pathname, lifecycleManager]);

  // Track page updates
  const updatePageContext = useCallback(
    (changes: Partial<PageContext>) => {
      if (!pageOrchestrationRef.current) return;

      lifecycleManager.onPageUpdate(pageOrchestrationRef.current, changes).catch((error) => {
        logger.error('Error updating page', { error });
      });
    },
    [lifecycleManager]
  );

  // Track feature usage
  const trackFeatureUsage = useCallback(
    (featureId: string, action: string, data?: Record<string, unknown>) => {
      lifecycleManager.trackFeatureUsage(featureId, action, data);
    },
    [lifecycleManager]
  );

  // Track feature error
  const trackFeatureError = useCallback(
    (featureId: string, error: Error) => {
      lifecycleManager.trackFeatureError(featureId, error);
    },
    [lifecycleManager]
  );

  // Track user action
  const trackUserAction = useCallback(
    (action: string, target?: string, data?: Record<string, unknown>) => {
      lifecycleManager.trackUserAction(action, target, data);
    },
    [lifecycleManager]
  );

  // Get Frenly integration
  const getFrenlyIntegration = useCallback(() => {
    return lifecycleManager.getFrenlyIntegration();
  }, [lifecycleManager]);

  return {
    updatePageContext,
    trackFeatureUsage,
    trackFeatureError,
    trackUserAction,
    getFrenlyIntegration,
    pageOrchestration: pageOrchestrationRef.current,
  };
}
