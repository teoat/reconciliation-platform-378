// Workflow Management Module
import { useMemo, useCallback } from 'react';
import {
  WorkflowState,
  WorkflowStage,
  WorkflowProgress,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';
import { CrossPageData } from './types';

export const useWorkflowProgress = (workflowState: WorkflowState | null): WorkflowProgress => {
  return useMemo((): WorkflowProgress => {
    if (!workflowState) {
      return {
        currentStage: 0,
        totalStages: 6,
        percentage: 0,
        estimatedTimeRemaining: 0,
        completedStages: [],
        upcomingStages: [
          'ingestion',
          'reconciliation',
          'adjudication',
          'analytics',
          'security',
          'api',
        ],
      };
    }

    const stages = ['ingestion', 'reconciliation', 'adjudication', 'analytics', 'security', 'api'];
    const currentIndex = stages.indexOf(workflowState.currentStage.name);

    return {
      currentStage: currentIndex + 1,
      totalStages: stages.length,
      percentage: Math.round(((currentIndex + 1) / stages.length) * 100),
      estimatedTimeRemaining: (stages.length - currentIndex - 1) * 30, // 30 minutes per stage
      completedStages: stages.slice(0, currentIndex),
      upcomingStages: stages.slice(currentIndex + 1),
    };
  }, [workflowState]);
};

export const useWorkflowValidation = (
  workflowState: WorkflowState | null,
  crossPageData: CrossPageData,
  validateCrossPageData: (fromPage: string, toPage: string) => ValidationResult
) => {
  const validateWorkflowConsistency = useCallback((): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: Array<{
      field: string;
      currentValue: unknown;
      suggestedValue: unknown;
      reason: string;
      confidence: number;
    }> = [];

    // Check data consistency across pages
    const ingestionData = crossPageData.ingestion;
    const reconciliationData = crossPageData.reconciliation;

    if (ingestionData.processedData.length !== reconciliationData.records.length) {
      errors.push({
        field: 'recordCount',
        message: 'Record count mismatch between ingestion and reconciliation',
        severity: 'error',
        page: 'system',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }, [crossPageData]);

  const validateAdvancement = useCallback(
    (toStage: WorkflowStage<Record<string, unknown>>): ValidationResult => {
      if (!workflowState) {
        return {
          isValid: false,
          errors: [
            {
              field: 'workflowState',
              message: 'No workflow state available',
              severity: 'error',
              page: 'system',
            },
          ],
          warnings: [],
          suggestions: [],
        };
      }

      return validateCrossPageData(workflowState.currentStage.page, toStage.page);
    },
    [workflowState, validateCrossPageData]
  );

  return {
    validateWorkflowConsistency,
    validateAdvancement,
  };
};

export const createInitialWorkflowState = (): WorkflowState => ({
  id: `workflow-${Date.now()}`,
  currentStage: {
    id: 'ingestion',
    name: 'ingestion',
    page: 'ingestion',
    order: 1,
    isCompleted: false,
    isActive: true,
    data: {},
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    },
  },
  progress: 0,
  status: 'active',
  lastUpdated: new Date(),
});
