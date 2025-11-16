'use client';
import React from 'react';
import { CheckCircle, Clock, Activity, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationRule {
  field: string;
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
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

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

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

interface WorkflowStageProps {
  stage: WorkflowStage;
  validationResult?: ValidationResult;
  isLast: boolean;
}

export const WorkflowStageComponent: React.FC<WorkflowStageProps> = ({
  stage,
  validationResult,
  isLast,
}) => {
  return (
    <div
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

        {validationResult && (
          <div className="mt-2">
            {validationResult.errors.map((error, errorIndex) => (
              <div
                key={errorIndex}
                className="flex items-center space-x-2 text-sm text-red-600"
              >
                <XCircle className="w-4 h-4" />
                <span>{error.message}</span>
              </div>
            ))}
            {validationResult.warnings.map((warning, warningIndex) => (
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

      {!isLast && (
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

