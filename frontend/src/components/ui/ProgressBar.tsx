// Standardized ProgressBar component with ARIA support
import React, { memo } from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

/**
 * Standardized progress bar component with:
 * - Full ARIA accessibility support
 * - Hardware-accelerated animations (transform instead of width)
 * - Consistent design across the application
 * - Multiple variants for different contexts
 */
export const ProgressBar: React.FC<ProgressBarProps> = memo(
  ({
    value,
    showLabel = true,
    label = 'Progress',
    variant = 'default',
    size = 'md',
    className = '',
    ariaLabel,
  }) => {
    // Ensure value is between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value));
    const roundedValue = Math.round(clampedValue);

    // Size configurations
    const sizes = {
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-3',
    };

    // Variant colors
    const variantColors = {
      default: 'bg-blue-600',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };

    return (
      <div className={`space-y-1 ${className}`}>
        {showLabel && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>{label}</span>
            <span>{roundedValue}%</span>
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={roundedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ariaLabel || `${label} is ${roundedValue} percent complete`}
          aria-live="polite"
          className={`relative overflow-hidden bg-gray-200 rounded-full ${sizes[size]}`}
        >
          <div
            className={`absolute inset-y-0 left-0 h-full rounded-full transition-transform duration-300 ease-out will-change-transform ${variantColors[variant]}`}
            style={{ transform: `translateX(${clampedValue - 100}%)` }}
          />
        </div>
      </div>
    );
  }
);

export default ProgressBar;
