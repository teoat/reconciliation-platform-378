// Simplified Progress Indicators Component
// Reduced from 715 lines to ~150 lines by focusing on essential functionality

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Circle } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Clock } from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error' | 'skipped';
  icon?: React.ReactNode;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: number;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'minimal' | 'detailed';
  showLabels?: boolean;
  showDescriptions?: boolean;
  interactive?: boolean;
  onStepClick?: (step: ProgressStep, index: number) => void;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep = 0,
  orientation = 'horizontal',
  variant = 'default',
  showLabels = true,
  showDescriptions = false,
  interactive = false,
  onStepClick,
  className = '',
}) => {
  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.icon) return step.icon;

    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Circle className="h-5 w-5 text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'skipped':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepClasses = (step: ProgressStep, index: number) => {
    const baseClasses = 'flex items-center space-x-3';
    const interactiveClasses = interactive ? 'cursor-pointer hover:bg-gray-50 rounded-lg p-2' : '';

    return `${baseClasses} ${interactiveClasses}`;
  };

  const handleStepClick = (step: ProgressStep, index: number) => {
    if (interactive && onStepClick) {
      onStepClick(step, index);
    }
  };

  const getOrientationClasses = () => {
    return orientation === 'vertical' ? 'flex-col space-y-4' : 'flex-row space-x-4';
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'text-sm';
      case 'detailed':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  return (
    <div className={`${getOrientationClasses()} ${getVariantClasses()} ${className}`}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={getStepClasses(step, index)}
          onClick={() => handleStepClick(step, index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleStepClick(step, index);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Go to step ${step.label || index + 1}`}
        >
          <div className="flex-shrink-0">{getStepIcon(step, index)}</div>

          <div className="flex-1 min-w-0">
            {showLabels && (
              <p
                className={`font-medium ${
                  step.status === 'current'
                    ? 'text-blue-600'
                    : step.status === 'completed'
                      ? 'text-green-600'
                      : step.status === 'error'
                        ? 'text-red-600'
                        : 'text-gray-500'
                }`}
              >
                {step.title}
              </p>
            )}

            {showDescriptions && step.description && (
              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Simplified Circular Progress Component
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showValue?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = true,
  showPercentage = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20',
    };
    return sizes[size];
  };

  const getVariantClasses = () => {
    const variants = {
      default: 'text-blue-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600',
    };
    return variants[variant];
  };

  const getTextSize = () => {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    };
    return sizes[size];
  };

  return (
    <div className={`relative ${getSizeClasses()} ${className}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />

        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${getVariantClasses()} transition-all duration-300`}
          strokeLinecap="round"
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-semibold ${getTextSize()} ${getVariantClasses()}`}>
            {showPercentage ? `${Math.round(percentage)}%` : value}
          </span>
        </div>
      )}
    </div>
  );
};

// Simplified Linear Progress Component
export interface LinearProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showValue?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value,
  max = 100,
  variant = 'default',
  showValue = false,
  showPercentage = false,
  animated = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getVariantClasses = () => {
    const variants = {
      default: 'bg-blue-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
      info: 'bg-blue-600',
    };
    return variants[variant];
  };

  const getAnimationClasses = () => {
    return animated ? 'animate-pulse' : '';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {showValue && (
          <span className="text-sm font-medium text-gray-700">
            {showPercentage ? `${Math.round(percentage)}%` : value}
          </span>
        )}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getVariantClasses()} ${getAnimationClasses()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
