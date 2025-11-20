'use client';
import { logger } from '@/services/logger';

import { useState, useCallback, useMemo } from 'react';
import { Workflow, Zap } from 'lucide-react';
import { WorkflowStageComponent } from './workflow/WorkflowStage';
import { WorkflowProgress } from './workflow/WorkflowProgress';
import { WorkflowBreadcrumbs } from './workflow/WorkflowBreadcrumbs';
import { WorkflowControls } from './workflow/WorkflowControls';

interface WorkflowStage {
  id: string;
  name: string;
  page: string;
  order: number;
  isCompleted: boolean;
  isActive: boolean;
  isRequired: boolean;
  estimatedTime: number;
  dependencies: string[];
  validationRules: ValidationRule[];
}

interface ValidationRule {
  field: string;
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface WorkflowTransition {
  from: string;
  to: string;
  conditions: TransitionCondition[];
  autoAdvance: boolean;
}

interface TransitionCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: string | number | boolean | null | undefined;
}

interface WorkflowOrchestratorProps {
  currentStage: string;
  onStageChange: (stage: string) => void;
  onValidation: (stage: string) => ValidationResult;
  onDataSync: (fromStage: string, toStage: string) => Promise<void>;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationWarning {
  field: string;
  message: string;
}

const WorkflowOrchestrator = ({
  currentStage,
  onStageChange,
  onValidation,
  onDataSync,
}: WorkflowOrchestratorProps) => {
  // Simplified 3-step reconciliation workflow (down from 6 steps)
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([
    {
      id: 'data_setup',
      name: 'Data Setup',
      page: 'ingestion',
      order: 1,
      isCompleted: false,
      isActive: currentStage === 'ingestion' || currentStage === 'data_setup',
      isRequired: true,
      estimatedTime: 25,
      dependencies: [],
      validationRules: [
        {
          field: 'files',
          condition: 'exists',
          message: 'Files must be uploaded',
          severity: 'error',
        },
        {
          field: 'mappedFields',
          condition: 'exists',
          message: 'All required fields must be mapped',
          severity: 'error',
        },
        {
          field: 'quality',
          condition: 'greater_than',
          message: 'Data quality must be above 80%',
          severity: 'warning',
        },
      ],
    },
    {
      id: 'reconciliation',
      name: 'AI Reconciliation',
      page: 'reconciliation',
      order: 2,
      isCompleted: false,
      isActive: currentStage === 'reconciliation',
      isRequired: true,
      estimatedTime: 30,
      dependencies: ['data_setup'],
      validationRules: [
        {
          field: 'records',
          condition: 'exists',
          message: 'Reconciliation records must exist',
          severity: 'error',
        },
        {
          field: 'matchRate',
          condition: 'greater_than',
          message: 'Match rate should be above 70%',
          severity: 'warning',
        },
      ],
    },
    {
      id: 'review_and_export',
      name: 'Review & Export',
      page: 'results',
      order: 3,
      isCompleted: false,
      isActive: currentStage === 'results' || currentStage === 'review_and_export',
      isRequired: true,
      estimatedTime: 25,
      dependencies: ['reconciliation'],
      validationRules: [
        {
          field: 'matches',
          condition: 'exists',
          message: 'Matches must be reviewed',
          severity: 'error',
        },
        {
          field: 'report',
          condition: 'exists',
          message: 'Final report must be exported',
          severity: 'warning',
        },
      ],
    },
  ]);

  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransition[]>([
    {
      from: 'data_setup',
      to: 'reconciliation',
      conditions: [
        { field: 'files', operator: 'exists', value: true },
        { field: 'mappedFields', operator: 'exists', value: true },
        { field: 'quality', operator: 'greater_than', value: 0.7 },
      ],
      autoAdvance: false, // Manual advance for better control
    },
    {
      from: 'reconciliation',
      to: 'review_and_export',
      conditions: [{ field: 'matches', operator: 'exists', value: true }],
      autoAdvance: false,
    },
  ]);

  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  // Calculate workflow progress
  const workflowProgress = useMemo(() => {
    const completedStages = workflowStages.filter((stage) => stage.isCompleted).length;
    const totalStages = workflowStages.length;
    const currentStageIndex = workflowStages.findIndex((stage) => stage.isActive);

    return {
      completed: completedStages,
      total: totalStages,
      percentage: Math.round((completedStages / totalStages) * 100),
      currentStage: currentStageIndex + 1,
      estimatedTimeRemaining: workflowStages
        .slice(currentStageIndex)
        .reduce((total, stage) => total + stage.estimatedTime, 0),
    };
  }, [workflowStages]);

  // Validate stage transition
  const validateStageTransition = useCallback(
    async (fromStage: string, toStage: string): Promise<ValidationResult> => {
      const transition = workflowTransitions.find((t) => t.from === fromStage && t.to === toStage);
      if (!transition) {
        return { isValid: false, errors: [], warnings: [] };
      }

      const validation = await onValidation(toStage);

      // Check transition conditions
      const conditionErrors: ValidationError[] = [];
      for (const condition of transition.conditions) {
        // This would check actual data values
        // For now, we'll simulate the validation
        if (condition.operator === 'exists') {
          // For 'exists' operator, value should be boolean or truthy
          const value = condition.value;
          if (typeof value === 'boolean' && !value) {
            conditionErrors.push({
              field: condition.field,
              message: `Required field ${condition.field} is missing`,
              severity: 'error',
            });
          } else if (value == null) {
            conditionErrors.push({
              field: condition.field,
              message: `Required field ${condition.field} is missing`,
              severity: 'error',
            });
          }
        } else if (condition.operator === 'greater_than' && typeof condition.value === 'number') {
          // For numeric comparisons, ensure we have a number
          // Additional validation logic would go here
        }
      }

      return {
        isValid: validation.isValid && conditionErrors.length === 0,
        errors: [...validation.errors, ...conditionErrors],
        warnings: validation.warnings,
      };
    },
    [workflowTransitions, onValidation]
  );

  // Go to previous stage
  const goToPreviousStage = useCallback(() => {
    const currentStageIndex = workflowStages.findIndex((stage) => stage.isActive);
    if (currentStageIndex <= 0) {
      return;
    }

    const previousStageData = workflowStages[currentStageIndex - 1];

    // Update workflow state
    setWorkflowStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        isActive: stage.id === previousStageData.id ? true : false,
      }))
    );

    // Change page
    onStageChange(previousStageData.page);
  }, [workflowStages, onStageChange]);

  // Advance to next stage
  const advanceToNextStage = useCallback(async () => {
    const currentStageIndex = workflowStages.findIndex((stage) => stage.isActive);
    if (currentStageIndex === -1 || currentStageIndex >= workflowStages.length - 1) {
      return;
    }

    const currentStageData = workflowStages[currentStageIndex];
    const nextStageData = workflowStages[currentStageIndex + 1];

    setIsAutoAdvancing(true);
    try {
      // Validate transition
      const validation = await validateStageTransition(currentStageData.id, nextStageData.id);
      if (!validation.isValid) {
        throw new Error(`Cannot advance: ${validation.errors.map((e) => e.message).join(', ')}`);
      }

      // Sync data between stages
      await onDataSync(currentStageData.id, nextStageData.id);

      // Update workflow state
      setWorkflowStages((prev) =>
        prev.map((stage) => ({
          ...stage,
          isCompleted: stage.id === currentStageData.id ? true : stage.isCompleted,
          isActive: stage.id === nextStageData.id ? true : false,
        }))
      );

      // Change page
      onStageChange(nextStageData.page);
    } catch (error) {
      logger.error('Failed to advance workflow:', error);
    } finally {
      setIsAutoAdvancing(false);
    }
  }, [workflowStages, validateStageTransition, onDataSync, onStageChange]);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      role="region"
      aria-label="Workflow orchestration"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Workflow className="w-6 h-6 text-blue-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900" id="workflow-title">
            Workflow Orchestration
          </h3>
        </div>
        <WorkflowProgress
          completed={workflowProgress.completed}
          total={workflowProgress.total}
          percentage={workflowProgress.percentage}
        />
      </div>

      <WorkflowBreadcrumbs stages={workflowStages} />

      {/* Workflow Stages */}
      <div className="space-y-4" role="list">
        {workflowStages.map((stage, index) => (
          <WorkflowStageComponent
            key={stage.id}
            stage={stage}
            validationResult={validationResults[stage.id]}
            isLast={index === workflowStages.length - 1}
          />
        ))}
      </div>

      <WorkflowControls
        canGoPrevious={workflowStages.findIndex((stage) => stage.isActive) > 0}
        canGoNext={workflowStages.findIndex((stage) => stage.isActive) < workflowStages.length - 1}
        isAutoAdvancing={isAutoAdvancing}
        estimatedTimeRemaining={workflowProgress.estimatedTimeRemaining}
        onPrevious={goToPreviousStage}
        onNext={advanceToNextStage}
      />

      {/* Auto-advance indicator */}
      {isAutoAdvancing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Auto-advancing workflow...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowOrchestrator;
