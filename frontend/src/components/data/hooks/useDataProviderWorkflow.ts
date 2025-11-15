// Data Provider Workflow Hook
import React, { useState, useEffect } from 'react';
import { useWorkflowProgress, useWorkflowValidation, createInitialWorkflowState } from './workflow';
import { WorkflowState, WorkflowStage } from './types';
import type { CrossPageData, ValidationResult, Notification, Alert } from '../types';

export const useDataProviderWorkflow = (
  crossPageData: CrossPageData,
  validateCrossPageData: (fromPage: string, toPage: string) => ValidationResult,
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void,
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);

  const workflowProgress = useWorkflowProgress(workflowState);
  const { validateWorkflowConsistency, validateAdvancement } = useWorkflowValidation(
    workflowState,
    crossPageData,
    validateCrossPageData
  );

  // Initialize workflow state
  useEffect(() => {
    if (!workflowState) {
      setWorkflowState(createInitialWorkflowState());
    }
  }, [workflowState]);

  // Advance workflow
  const advanceWorkflow = React.useCallback(
    async (toStage: WorkflowStage<Record<string, unknown>>) => {
      if (!workflowState) return;

      // Validate transition
      const validation = validateAdvancement(toStage);
      if (!validation.isValid) {
        throw new Error(
          `Cannot advance to ${toStage.name}: ${validation.errors.map((e) => e.message).join(', ')}`
        );
      }

      // Update workflow state
      setWorkflowState((prev) =>
        prev
          ? {
              ...prev,
              currentStage: toStage,
              progress: (toStage.order / 6) * 100,
              lastUpdated: new Date(),
              previousStage: prev.currentStage,
              nextStage: undefined,
            }
          : null
      );

      // Notify users
      addNotification({
        type: 'info',
        title: 'Workflow Advanced',
        message: `Advanced to ${toStage.name}`,
        page: toStage.page,
        isRead: false,
      });
    },
    [workflowState, addAlert, addNotification, validateAdvancement]
  );

  // Reset workflow
  const resetWorkflow = React.useCallback(() => {
    setWorkflowState(null);
  }, []);

  return {
    workflowState,
    setWorkflowState,
    workflowProgress,
    advanceWorkflow,
    resetWorkflow,
    validateWorkflowConsistency,
  };
};
