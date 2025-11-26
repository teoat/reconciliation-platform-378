'use client';

import React from 'react';

// Stub component for WorkflowOrchestrator
// This is a placeholder until the full component is migrated

interface WorkflowOrchestratorProps {
  currentStep?: string;
  onStepChange?: (step: string) => void;
  steps?: string[];
  className?: string;
}

const WorkflowOrchestrator: React.FC<WorkflowOrchestratorProps> = ({
  currentStep = 'start',
  onStepChange,
  steps = ['start', 'upload', 'preview', 'validate', 'transform', 'complete'],
  className = '',
}) => {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className={`workflow-orchestrator ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentIndex
                  ? 'bg-green-500 text-white'
                  : index === currentIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
              onClick={() => onStepChange?.(step)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onStepChange?.(step);
                }
              }}
              aria-label={`Step ${index + 1}: ${step}`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-center text-sm text-gray-600">
        Current Step: <span className="font-medium capitalize">{currentStep}</span>
      </div>
    </div>
  );
};

export default WorkflowOrchestrator;
