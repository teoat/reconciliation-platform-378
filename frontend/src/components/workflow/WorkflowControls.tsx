'use client';
import React from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface WorkflowControlsProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  isAutoAdvancing: boolean;
  estimatedTimeRemaining: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const WorkflowControls: React.FC<WorkflowControlsProps> = ({
  canGoPrevious,
  canGoNext,
  isAutoAdvancing,
  estimatedTimeRemaining,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center space-x-4">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go to previous workflow stage"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && canGoPrevious) {
              e.preventDefault();
              onPrevious();
            }
          }}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Previous</span>
        </button>

        <button
          onClick={onNext}
          disabled={isAutoAdvancing || !canGoNext}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Advance to next workflow stage"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isAutoAdvancing && canGoNext) {
              e.preventDefault();
              onNext();
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
        Estimated time remaining: {estimatedTimeRemaining} minutes
      </div>
    </div>
  );
};

