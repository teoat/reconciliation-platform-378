/**
 * Data transformation utilities for progress visualization
 */

import { FilesApiService } from '@/services/api/files';
import { ReconciliationApiService } from '@/services/api/reconciliation';
import { dataService } from '@/services/utils/dataService';
import { logger } from '@/services/logger';
import type { WorkflowStage } from '../types';

/**
 * Calculate overall progress from workflow stages
 * 
 * Computes the percentage of completed or skipped stages out of total stages.
 * 
 * @param stages - Array of workflow stages with status information
 * @returns Progress percentage (0-100)
 * 
 * @example
 * ```typescript
 * const stages = [
 *   { id: '1', status: 'completed', ... },
 *   { id: '2', status: 'pending', ... },
 * ];
 * const progress = calculateOverallProgress(stages); // Returns 50
 * ```
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
 * 
 * Estimates the total time remaining based on pending stages after the current active stage.
 * 
 * @param stages - Array of workflow stages with order and estimated time
 * @returns Estimated time remaining in minutes (0 if no active stage)
 * 
 * @example
 * ```typescript
 * const stages = [
 *   { id: '1', order: 1, status: 'completed', estimatedTime: 10, ... },
 *   { id: '2', order: 2, status: 'active', estimatedTime: 15, ... },
 *   { id: '3', order: 3, status: 'pending', estimatedTime: 20, ... },
 * ];
 * const remaining = calculateEstimatedTimeRemaining(stages); // Returns 20
 * ```
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
 * 
 * Provides contextual suggestions based on the current workflow stage.
 * 
 * @param stage - The workflow stage to generate suggestions for
 * @returns Array of suggestion strings
 * 
 * @example
 * ```typescript
 * const stage = { id: 'data_setup', ... };
 * const suggestions = generateSuggestions(stage);
 * // Returns: ['Use drag-and-drop for faster file uploads', ...]
 * ```
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
 * 
 * Creates keyboard shortcut definitions with actions for the current workflow stage.
 * Actions include file upload, AI mapping, save progress, start reconciliation, and export results.
 * 
 * @param stage - The workflow stage to generate shortcuts for
 * @returns Array of shortcut objects with label, action function, and keyboard shortcut
 * 
 * @example
 * ```typescript
 * const stage = { id: 'data_setup', ... };
 * const shortcuts = generateShortcuts(stage);
 * // Returns: [
 * //   { label: 'Upload Files', action: () => {...}, shortcut: 'Ctrl+U' },
 * //   ...
 * // ]
 * ```
 */
export function generateShortcuts(
  stage: WorkflowStage
): { label: string; action: () => void; shortcut: string }[] {
  const shortcuts: { label: string; action: () => void; shortcut: string }[] = [];

  switch (stage.id) {
    case 'data_setup':
      shortcuts.push({
        label: 'Upload Files',
        action: async () => {
          try {
            // Trigger file input click or open file upload dialog
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.csv,.xlsx,.xls,.json';
            input.onchange = async (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files && files.length > 0) {
                const projectId = localStorage.getItem('currentProjectId') || '';
                if (!projectId) {
                  logger.error('No project ID found for file upload');
                  return;
                }
                
                for (const file of Array.from(files)) {
                  try {
                    await FilesApiService.uploadFile(projectId, file);
                    logger.info('File uploaded successfully', { fileName: file.name });
                  } catch (error) {
                    logger.error('File upload failed', { error, fileName: file.name });
                  }
                }
              }
            };
            input.click();
          } catch (error) {
            logger.error('Failed to initiate file upload', { error });
          }
        },
        shortcut: 'Ctrl+U',
      });
      shortcuts.push({
        label: 'Use AI Mapping',
        action: async () => {
          try {
            // Trigger AI mapping workflow
            logger.info('AI mapping action triggered');
            // This would typically open an AI mapping modal or trigger a service
            window.dispatchEvent(new CustomEvent('workflow:ai-mapping', {
              detail: { stageId: stage.id }
            }));
          } catch (error) {
            logger.error('Failed to trigger AI mapping', { error });
          }
        },
        shortcut: 'Ctrl+M',
      });
      shortcuts.push({
        label: 'Save Progress',
        action: async () => {
          try {
            // Save current workflow progress
            const workflowId = `workflow_${stage.id}_${Date.now()}`;
            const progressData = {
              stageId: stage.id,
              stageStatus: stage.status,
              timestamp: new Date().toISOString(),
              data: (stage as { data?: Record<string, unknown> }).data || {},
            };
            
            dataService.saveData(workflowId, progressData);
            logger.info('Workflow progress saved', { workflowId, stageId: stage.id });
            
            // Show success notification
            window.dispatchEvent(new CustomEvent('notification:show', {
              detail: {
                type: 'success',
                message: 'Progress saved successfully',
              }
            }));
          } catch (error) {
            logger.error('Failed to save progress', { error });
          }
        },
        shortcut: 'Ctrl+S',
      });
      break;
    case 'reconciliation':
      shortcuts.push({
        label: 'Start Reconciliation',
        action: async () => {
          try {
            const projectId = localStorage.getItem('currentProjectId') || '';
            if (!projectId) {
              logger.error('No project ID found for reconciliation');
              return;
            }
            
            // Get selected files from workflow state or prompt user
            const fileIdA = localStorage.getItem('reconciliation_file_a') || '';
            const fileIdB = localStorage.getItem('reconciliation_file_b') || '';
            
            if (!fileIdA || !fileIdB) {
              logger.warn('Reconciliation files not selected');
              window.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                  type: 'warning',
                  message: 'Please select two files to reconcile',
                }
              }));
              return;
            }
            
            const result = await ReconciliationApiService.startReconciliationJob(projectId, {
              name: `Reconciliation ${Date.now()}`,
              source_data_source_id: fileIdA,
              target_data_source_id: fileIdB,
            });
            
            logger.info('Reconciliation started', { jobId: (result as { job?: { id?: string } })?.job?.id });
            
            window.dispatchEvent(new CustomEvent('notification:show', {
              detail: {
                type: 'success',
                message: 'Reconciliation job started successfully',
              }
            }));
          } catch (error) {
            logger.error('Failed to start reconciliation', { error });
          }
        },
        shortcut: 'Ctrl+R',
      });
      break;
    case 'review_and_export':
      shortcuts.push({
        label: 'Export Results',
        action: async () => {
          try {
            const projectId = localStorage.getItem('currentProjectId') || '';
            if (!projectId) {
              logger.error('No project ID found for export');
              return;
            }
            
            // Get latest reconciliation job for the project
            const jobsResponse = await ReconciliationApiService.getReconciliationJobs(projectId, {
              page: 1,
              per_page: 1,
              status: 'completed',
            });
            
            if (!jobsResponse.jobs || jobsResponse.jobs.length === 0) {
              logger.warn('No completed reconciliation jobs found for export');
              window.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                  type: 'warning',
                  message: 'No completed reconciliation jobs found',
                }
              }));
              return;
            }
            
            const latestJob = jobsResponse.jobs[0] as { id: string };
            const results = await ReconciliationApiService.getReconciliationResults(latestJob.id);
            
            // Export to JSON
            const exportData = {
              projectId,
              jobId: latestJob.id,
              exportedAt: new Date().toISOString(),
              results: results.results || [],
            };
            
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reconciliation_results_${projectId}_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            logger.info('Results exported successfully', { projectId });
          } catch (error) {
            logger.error('Failed to export results', { error });
          }
        },
        shortcut: 'Ctrl+E',
      });
      break;
  }

  return shortcuts;
}

