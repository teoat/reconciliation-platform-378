'use client';
import React from 'react';

interface WorkflowProgressProps {
  completed: number;
  total: number;
  percentage: number;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  completed,
  total,
  percentage,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
        <span className="sr-only">Progress:</span>
        {completed}/{total} stages completed
      </div>
      <div
        className="w-24 bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Workflow progress: ${percentage}%`}
      >
        <div
          className="progress-bar progress-bar-blue h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

