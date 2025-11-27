/**
 * Animation helper utilities for progress visualization
 */

import type { ProgressAnimation } from '../types';

/**
 * Create progress animation on element
 */
export function createProgressAnimation(
  element: HTMLElement,
  progress: number,
  animation: ProgressAnimation,
  estimatedTimeRemaining: number
): void {
  const progressBar = element.querySelector('.progress-bar') as HTMLElement;
  if (!progressBar) return;

  // Animate progress bar
  progressBar.style.transition = `width ${animation.duration}ms ${animation.easing || 'ease'}`;
  progressBar.style.width = `${progress}%`;

  // Show percentage if enabled
  if (animation.showPercentage) {
    const percentageElement = element.querySelector('.progress-percentage') as HTMLElement;
    if (percentageElement) {
      percentageElement.textContent = `${Math.round(progress)}%`;
    }
  }

  // Show time estimate if enabled
  if (animation.showTimeEstimate) {
    const timeElement = element.querySelector('.progress-time') as HTMLElement;
    if (timeElement) {
      timeElement.textContent = `${estimatedTimeRemaining} min remaining`;
    }
  }
}

/**
 * Calculate tooltip position
 */
export function calculateTooltipPosition(
  position: string,
  rect: DOMRect
): { x: number; y: number } {
  const tooltipWidth = 300;
  const tooltipHeight = 200;
  const margin = 10;

  switch (position) {
    case 'top':
      return {
        x: rect.left + (rect.width - tooltipWidth) / 2,
        y: rect.top - tooltipHeight - margin,
      };
    case 'bottom':
      return {
        x: rect.left + (rect.width - tooltipWidth) / 2,
        y: rect.bottom + margin,
      };
    case 'left':
      return {
        x: rect.left - tooltipWidth - margin,
        y: rect.top + (rect.height - tooltipHeight) / 2,
      };
    case 'right':
      return {
        x: rect.right + margin,
        y: rect.top + (rect.height - tooltipHeight) / 2,
      };
    default:
      return {
        x: rect.left + (rect.width - tooltipWidth) / 2,
        y: rect.top - tooltipHeight - margin,
      };
  }
}

