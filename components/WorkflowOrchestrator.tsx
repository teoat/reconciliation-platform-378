'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Workflow,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Info,
  Zap,
  Target,
  Activity,
} from 'lucide-react';

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
  value: any;
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
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([
    {
      id: 'ingestion',
      name: 'Data Ingestion',
      page: 'ingestion',
      order: 1,
      isCompleted: false,
      isActive: currentStage === 'ingestion',
      isRequired: true,
      estimatedTime: 30,
      dependencies: [],
      validationRules: [
        {
          field: 'files',
          condition: 'exists',
          message: 'Files must be uploaded',
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
      estimatedTime: 45,
      dependencies: ['ingestion'],
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
      id: 'adjudication',
      name: 'Discrepancy Adjudication',
      page: 'adjudication',
      order: 3,
      isCompleted: false,
      isActive: currentStage === 'adjudication',
      isRequired: true,
      estimatedTime: 60,
      dependencies: ['reconciliation'],
      validationRules: [
        {
          field: 'discrepancies',
          condition: 'exists',
          message: 'Discrepancies must be identified',
          severity: 'error',
        },
        {
          field: 'workflows',
          condition: 'exists',
          message: 'Adjudication workflows must be created',
          severity: 'error',
        },
      ],
    },
    {
      id: 'analytics',
      name: 'Analytics & Reporting',
      page: 'visualization',
      order: 4,
      isCompleted: false,
      isActive: currentStage === 'visualization',
      isRequired: false,
      estimatedTime: 20,
      dependencies: ['adjudication'],
      validationRules: [
        {
          field: 'reports',
          condition: 'exists',
          message: 'Reports should be generated',
          severity: 'warning',
        },
      ],
    },
    {
      id: 'security',
      name: 'Security & Compliance',
      page: 'security',
      order: 5,
      isCompleted: false,
      isActive: currentStage === 'security',
      isRequired: false,
      estimatedTime: 15,
      dependencies: ['analytics'],
      validationRules: [
        {
          field: 'auditLogs',
          condition: 'exists',
          message: 'Audit logs must be maintained',
          severity: 'error',
        },
        {
          field: 'compliance',
          condition: 'equals',
          message: 'Compliance status must be verified',
          severity: 'error',
        },
      ],
    },
    {
      id: 'api',
      name: 'API & Integration',
      page: 'api',
      order: 6,
      isCompleted: false,
      isActive: currentStage === 'api',
      isRequired: false,
      estimatedTime: 25,
      dependencies: ['security'],
      validationRules: [
        {
          field: 'endpoints',
          condition: 'exists',
          message: 'API endpoints must be configured',
          severity: 'warning',
        },
      ],
    },
  ]);

  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransition[]>([
    {
      from: 'ingestion',
      to: 'reconciliation',
      conditions: [
        { field: 'files', operator: 'exists', value: true },
        { field: 'quality', operator: 'greater_than', value: 0.7 },
      ],
      autoAdvance: true,
    },
    {
      from: 'reconciliation',
      to: 'adjudication',
      conditions: [{ field: 'discrepancies', operator: 'exists', value: true }],
      autoAdvance: false,
    },
    {
      from: 'adjudication',
      to: 'analytics',
      conditions: [{ field: 'resolvedDiscrepancies', operator: 'greater_than', value: 0 }],
      autoAdvance: true,
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
        if (condition.operator === 'exists' && !condition.value) {
          conditionErrors.push({
            field: condition.field,
            message: `Required field ${condition.field} is missing`,
            severity: 'error',
          });
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
      console.error('Failed to advance workflow:', error);
    } finally {
      setIsAutoAdvancing(false);
    }
  }, [workflowStages, validateStageTransition, onDataSync, onStageChange]);

  // Go back to previous stage
  const goToPreviousStage = useCallback(async () => {
    const currentStageIndex = workflowStages.findIndex((stage) => stage.isActive);
    if (currentStageIndex <= 0) {
      return;
    }

    const previousStageData = workflowStages[currentStageIndex - 1];

    setIsAutoAdvancing(true);
    try {
      // Update workflow state
      setWorkflowStages((prev) =>
        prev.map((stage) => ({
          ...stage,
          isActive: stage.id === previousStageData.id ? true : false,
          isCompleted: stage.id === previousStageData.id ? false : stage.isCompleted,
        }))
      );

      // Change page
      onStageChange(previousStageData.page);
    } catch (error) {
      console.error('Failed to go back:', error);
    } finally {
      setIsAutoAdvancing(false);
    }
  }, [workflowStages, onStageChange]);

  // Auto-advance if conditions are met
  useEffect(() => {
    const currentStageData = workflowStages.find((stage) => stage.isActive);
    if (!currentStageData) return undefined;

    const transition = workflowTransitions.find((t) => t.from === currentStageData.id);
    if (transition && transition.autoAdvance) {
      // Check if auto-advance conditions are met
      const shouldAutoAdvance = transition.conditions.every((condition) => {
        // This would check actual data values
        return true; // Simplified for now
      });

      if (shouldAutoAdvance) {
        const timeoutId = setTimeout(() => {
          advanceToNextStage();
        }, 2000); // Auto-advance after 2 seconds

        return () => clearTimeout(timeoutId);
      }
    }

    return undefined;
  }, [workflowStages, workflowTransitions, advanceToNextStage]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Workflow className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Workflow Orchestration</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-600">
            {workflowProgress.completed}/{workflowProgress.total} stages completed
          </div>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="progress-bar progress-bar-blue h-2 rounded-full"
              style={{ width: `${workflowProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Workflow Stages */}
      <div className="space-y-4">
        {workflowStages.map((stage, index) => (
          <div
            key={stage.id}
            className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
              stage.isActive
                ? 'border-blue-500 bg-blue-50'
                : stage.isCompleted
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0">
              {stage.isCompleted ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : stage.isActive ? (
                <Activity className="w-6 h-6 text-blue-600" />
              ) : (
                <Clock className="w-6 h-6 text-gray-400" />
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
                >
                  {stage.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{stage.estimatedTime}m</span>
                  {stage.isRequired && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
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
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={advanceToNextStage}
            disabled={
              isAutoAdvancing ||
              workflowStages.findIndex((stage) => stage.isActive) >= workflowStages.length - 1
            }
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAutoAdvancing ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Advancing...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
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
