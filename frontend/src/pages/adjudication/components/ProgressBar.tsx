import React from 'react';

interface ProgressBarProps {
  progress: number;
  title: string;
}

/**
 * Progress bar component with proper ARIA attributes
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, title }) => {
  const progressValue = Math.max(0, Math.min(100, progress ?? 0)); // Clamp between 0-100
  const ariaLabel = `${title} progress: ${progressValue}%`;
  return (
    <div className="mt-4">
      <div className="w-full bg-gray-200 rounded-full h-2">
        {/* eslint-disable-next-line jsx-a11y/aria-proptypes */}
        <div
          className="bg-blue-500 h-2 rounded-full"
          // Dynamic width for progress bar - acceptable inline style
          style={{ width: `${progressValue}%` }}
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuenow={progressValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-live="polite"
          tabIndex={0}
        ></div>
      </div>
    </div>
  );
};

