'use client';
import React from 'react';

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
  validationRules: unknown[];
}

interface WorkflowBreadcrumbsProps {
  stages: WorkflowStage[];
}

export const WorkflowBreadcrumbs: React.FC<WorkflowBreadcrumbsProps> = ({ stages }) => {
  return (
    <nav aria-label="Workflow steps" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        {stages.map((stage, index) => (
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
              Step {stage.order} of {stages.length}: {stage.name}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

