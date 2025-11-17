/**
 * Workflow Sync Manager - Synchronizes workflow state across pages
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import type { WorkflowState } from '../types';

export class WorkflowSyncManager {
  private workflowStates: Map<string, WorkflowState> = new Map();

  /**
   * Sync workflow state
   */
  async syncWorkflowState(
    workflowId: string,
    state: WorkflowState
  ): Promise<void> {
    try {
      // Store state locally
      this.workflowStates.set(workflowId, state);

      // Persist to localStorage
      localStorage.setItem(
        `workflow:${workflowId}`,
        JSON.stringify({
          ...state,
          lastSynced: Date.now(),
        })
      );

      // Sync to Frenly AI
      await frenlyAgentService.updateWorkflowState({
        workflowId,
        currentStep: state.currentStep,
        progress: state.progress,
        completedSteps: state.completedSteps,
      });

      // Generate workflow guidance if needed
      if (this.shouldShowGuidance(state)) {
        const message = await frenlyAgentService.generateWorkflowMessage({
          workflowId,
          state: {
            currentStep: state.currentStep,
            progress: state.progress,
            completedSteps: state.completedSteps,
            totalSteps: state.totalSteps,
          },
        });

        // Show message via event
        window.dispatchEvent(
          new CustomEvent('frenly:show-message', {
            detail: {
              id: message.id,
              type: message.type,
              content: message.content,
              timestamp: message.timestamp,
              page: workflowId,
              priority: message.priority,
              dismissible: true,
            },
          })
        );
      }

      logger.debug('Workflow state synced', { workflowId, state });
    } catch (error) {
      logger.error('Error syncing workflow state', { error, workflowId });
      // Don't throw - sync failures shouldn't break the page
    }
  }

  /**
   * Get workflow state
   */
  getWorkflowState(workflowId: string): WorkflowState | null {
    // Try memory first
    const memoryState = this.workflowStates.get(workflowId);
    if (memoryState) return memoryState;

    // Try localStorage
    const stored = localStorage.getItem(`workflow:${workflowId}`);
    if (stored) {
      try {
        const state = JSON.parse(stored);
        this.workflowStates.set(workflowId, state);
        return state;
      } catch (error) {
        logger.error('Error parsing stored workflow state', { error, workflowId });
      }
    }

    return null;
  }

  /**
   * Check if guidance should be shown
   */
  private shouldShowGuidance(state: WorkflowState): boolean {
    // Show guidance on step changes or milestones
    const progressMilestones = [25, 50, 75, 100];
    const isMilestone = progressMilestones.includes(state.progress);

    // Show guidance if progress increased significantly
    const lastState = this.workflowStates.get(state.workflowId || '');
    const progressIncreased =
      lastState && state.progress > lastState.progress + 10;

    return isMilestone || progressIncreased || false;
  }

  /**
   * Clear workflow state
   */
  clearWorkflowState(workflowId: string): void {
    this.workflowStates.delete(workflowId);
    localStorage.removeItem(`workflow:${workflowId}`);
  }
}

// Singleton instance
let workflowSyncInstance: WorkflowSyncManager | null = null;

export function getWorkflowSyncManager(): WorkflowSyncManager {
  if (!workflowSyncInstance) {
    workflowSyncInstance = new WorkflowSyncManager();
  }
  return workflowSyncInstance;
}

