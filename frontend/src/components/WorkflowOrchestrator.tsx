'use client';
import { logger } from '@/services/logger';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Workflow } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { Clock } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { Play } from 'lucide-react';
import { Pause } from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { Info } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Target } from 'lucide-react';
import { Activity } from 'lucide-react';

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

  // Go to previous stage
  const goToPreviousStage = useCallback(async () => {
    const currentStageIndex = workflowStages.findIndex((stage) => stage.isActive);
    if (currentStageIndex <= 0) return;

    const prevStageIndex = currentStageIndex - 1;
    const prevStage = workflowStages[prevStageIndex];
    
    if (prevStage && onStageChange) {
      await onStageChange(prevStage.id);
    }
  }, [workflowStages, onStageChange]);

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
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
            <span className="sr-only">Progress:</span>
            {workflowProgress.completed}/{workflowProgress.total} stages completed
          </div>
          <div
            className="w-24 bg-gray-200 rounded-full h-2"
            role="progressbar"
            aria-valuenow={workflowProgress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Workflow progress: ${workflowProgress.percentage}%`}
          >
            <div
              className="progress-bar progress-bar-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${workflowProgress.percentage}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="Workflow steps" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          {workflowStages.map((stage, index) => (
            <li key={stage.id} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400" aria-hidden="true">
                  /
                </span>
              )}
              <span
                className={`${
                  stage.isActive
                    ? 'font-semibold text-blue-600'
                    : stage.isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                }`}
                aria-current={stage.isActive ? 'step' : undefined}
              >
                Step {stage.order} of {workflowStages.length}: {stage.name}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Workflow Stages */}
      <div className="space-y-4" role="list">
        {workflowStages.map((stage, index) => (
          <div
            key={stage.id}
            role="listitem"
            className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
              stage.isActive
                ? 'border-blue-500 bg-blue-50'
                : stage.isCompleted
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
            aria-current={stage.isActive ? 'step' : undefined}
          >
            <div className="flex-shrink-0" aria-hidden="true">
              {stage.isCompleted ? (
                <CheckCircle className="w-6 h-6 text-green-600" aria-label="Completed" />
              ) : stage.isActive ? (
                <Activity className="w-6 h-6 text-blue-600" aria-label="Active" />
              ) : (
                <Clock className="w-6 h-6 text-gray-400" aria-label="Pending" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4
                  className={`font-medium ${
                    stage.isActive
                      ? 'text-blue-900'
                      : stage.isCompleted
                        ? 'text-green-900'
                        : 'text-gray-700'
                  }`}
                  id={`stage-${stage.id}-title`}
                >
                  {stage.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <span
                    className="text-sm text-gray-500"
                    aria-label={`Estimated time: ${stage.estimatedTime} minutes`}
                  >
                    {stage.estimatedTime}m
                  </span>
                  {stage.isRequired && (
                    <span
                      className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full"
                      aria-label="Required step"
                    >
                      Required
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-1 text-sm text-gray-600">
                {stage.page} • Dependencies:{' '}
                {stage.dependencies.length > 0 ? stage.dependencies.join(', ') : 'None'}
              </div>

              {validationResults[stage.id] && (
                <div className="mt-2">
                  {validationResults[stage.id].errors.map((error, errorIndex) => (
                    <div
                      key={errorIndex}
                      className="flex items-center space-x-2 text-sm text-red-600"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{error.message}</span>
                    </div>
                  ))}
                  {validationResults[stage.id].warnings.map((warning, warningIndex) => (
                    <div
                      key={warningIndex}
                      className="flex items-center space-x-2 text-sm text-yellow-600"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{warning.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {index < workflowStages.length - 1 && (
              <div className="flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Workflow Controls */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousStage}
            disabled={workflowStages.findIndex((stage) => stage.isActive) <= 0}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go to previous workflow stage"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToPreviousStage();
              }
            }}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          <button
            onClick={advanceToNextStage}
            disabled={
              isAutoAdvancing ||
              workflowStages.findIndex((stage) => stage.isActive) >= workflowStages.length - 1
            }
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Advance to next workflow stage"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                advanceToNextStage();
              }
            }}
          >
            {isAutoAdvancing ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>
                  <span className="sr-only">Status:</span>
                  Advancing...
                </span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                <span>Next</span>
              </>
            )}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Estimated time remaining: {workflowProgress.estimatedTimeRemaining} minutes
        </div>
      </div>

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
