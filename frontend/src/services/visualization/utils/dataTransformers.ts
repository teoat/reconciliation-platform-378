/**
 * Data transformation utilities for progress visualization
 */

import type { WorkflowStage } from '../types';

/**
 * Calculate overall progress from workflow stages
 */
export function calculateOverallProgress(stages: WorkflowStage[]): number {
  if (stages.length === 0) return 0;

  const totalStages = stages.length;
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const skippedStages = stages.filter((s) => s.status === 'skipped').length;

  return Math.round(((completedStages + skippedStages) / totalStages) * 100);
}

/**
 * Calculate estimated time remaining
 */
export function calculateEstimatedTimeRemaining(stages: WorkflowStage[]): number {
  const currentStage = stages.find((s) => s.status === 'active');
  if (!currentStage) return 0;

  const remainingStages = stages.filter(
    (s) => s.order >= currentStage.order && s.status === 'pending'
  );
  return remainingStages.reduce((total, stage) => total + stage.estimatedTime, 0);
}

/**
 * Generate suggestions for a workflow stage
 */
export function generateSuggestions(stage: WorkflowStage): string[] {
  const suggestions: string[] = [];

  switch (stage.id) {
    case 'data_setup':
      suggestions.push('Use drag-and-drop for faster file uploads');
      suggestions.push('Use AI suggestions for automatic field mapping');
      suggestions.push('Save your progress - you can continue later');
      break;
    case 'reconciliation':
      suggestions.push('Review matching rules before running');
      suggestions.push('Monitor progress and adjust settings if needed');
      break;
    case 'review_and_export':
      suggestions.push('Use bulk actions for efficiency');
      suggestions.push('Check match confidence scores');
      suggestions.push('Choose appropriate export format');
      break;
  }

  return suggestions;
}

/**
 * Generate keyboard shortcuts for a workflow stage
 */
export function generateShortcuts(
  stage: WorkflowStage
): { label: string; action: () => void; shortcut: string }[] {
  const shortcuts: { label: string; action: () => void; shortcut: string }[] = [];

  switch (stage.id) {
    case 'data_setup':
      shortcuts.push({
        label: 'Upload Files',
        action: () => console.log('Upload files'),
        shortcut: 'Ctrl+U',
      });
      shortcuts.push({
        label: 'Use AI Mapping',
        action: () => console.log('Use AI mapping'),
        shortcut: 'Ctrl+M',
      });
      shortcuts.push({
        label: 'Save Progress',
        action: () => console.log('Save progress'),
        shortcut: 'Ctrl+S',
      });
      break;
    case 'reconciliation':
      shortcuts.push({
        label: 'Start Reconciliation',
        action: () => console.log('Start reconciliation'),
        shortcut: 'Ctrl+R',
      });
      break;
    case 'review_and_export':
      shortcuts.push({
        label: 'Export Results',
        action: () => console.log('Export results'),
        shortcut: 'Ctrl+E',
      });
      break;
  }

  return shortcuts;
}

