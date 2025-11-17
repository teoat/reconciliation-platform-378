/**
 * Workflow Orchestrator - Coordinates multi-page workflows
 */

import { logger } from '@/services/logger';
import { getWorkflowSyncManager } from '../sync';
import type { WorkflowState } from '../types';

export class WorkflowOrchestrator {
  private workflowStates: Map<string, WorkflowState> = new Map();
  private stepTrackers: Map<string, WorkflowStepTracker> = new Map();

  /**
   * Register workflow
   */
  registerWorkflow(workflowId: string, initialState: WorkflowState): void {
    this.workflowStates.set(workflowId, initialState);
    this.stepTrackers.set(workflowId, new WorkflowStepTracker(workflowId));
    logger.debug('Workflow registered', { workflowId });
  }

  /**
   * Get workflow state
   */
  getWorkflowState(workflowId: string): WorkflowState | null {
    const syncManager = getWorkflowSyncManager();
    return syncManager.getWorkflowState(workflowId) || this.workflowStates.get(workflowId) || null;
  }

  /**
   * Update workflow state
   */
  async updateWorkflowState(
    workflowId: string,
    updates: Partial<WorkflowState>
  ): Promise<void> {
    const currentState = this.getWorkflowState(workflowId);
    if (!currentState) {
      logger.warn('Workflow not found', { workflowId });
      return;
    }

    const updatedState: WorkflowState = {
      ...currentState,
      ...updates,
      progress: this.calculateProgress(updates.completedSteps || currentState.completedSteps, currentState.totalSteps),
    };

    this.workflowStates.set(workflowId, updatedState);

    // Sync with backend
    const syncManager = getWorkflowSyncManager();
    await syncManager.syncWorkflowState(workflowId, updatedState);

    // Track step change
    const tracker = this.stepTrackers.get(workflowId);
    if (tracker && updates.currentStep) {
      await tracker.trackStepChange(updates.currentStep);
    }
  }

  /**
   * Complete workflow step
   */
  async completeStep(workflowId: string, stepId: string): Promise<void> {
    const currentState = this.getWorkflowState(workflowId);
    if (!currentState) {
      logger.warn('Workflow not found', { workflowId });
      return;
    }

    const completedSteps = [...currentState.completedSteps];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }

    await this.updateWorkflowState(workflowId, {
      completedSteps,
      currentStep: stepId,
    });
  }

  /**
   * Get workflow progress
   */
  getWorkflowProgress(workflowId: string): number {
    const state = this.getWorkflowState(workflowId);
    return state?.progress || 0;
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(completedSteps: string[], totalSteps: number): number {
    if (totalSteps === 0) return 0;
    return Math.round((completedSteps.length / totalSteps) * 100);
  }
}

/**
 * Workflow Step Tracker
 */
class WorkflowStepTracker {
  constructor(private workflowId: string) {}

  /**
   * Track step change
   */
  async trackStepChange(stepId: string): Promise<void> {
    logger.debug('Workflow step changed', { workflowId: this.workflowId, stepId });
    // Could add analytics tracking here
  }
}

// Singleton instance
let workflowOrchestratorInstance: WorkflowOrchestrator | null = null;

export function getWorkflowOrchestrator(): WorkflowOrchestrator {
  if (!workflowOrchestratorInstance) {
    workflowOrchestratorInstance = new WorkflowOrchestrator();
  }
  return workflowOrchestratorInstance;
}

