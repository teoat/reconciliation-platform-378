/**
 * Workflow Orchestration Module
 * 
 * Coordinates multi-page workflows with Frenly AI assistance
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import type { WorkflowState, FrenlyMessage } from '../types';

export interface WorkflowStep {
  id: string;
  name: string;
  pageId: string;
  order: number;
  isCompleted: boolean;
  isActive: boolean;
  isRequired: boolean;
  dependencies: string[];
  estimatedTime: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  startPage: string;
  endPage: string;
}

export class WorkflowStateManager {
  private workflows: Map<string, WorkflowState> = new Map();
  private definitions: Map<string, WorkflowDefinition> = new Map();

  /**
   * Register a workflow definition
   */
  registerWorkflow(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
    logger.debug('Workflow registered', { workflowId: definition.id });
  }

  /**
   * Initialize workflow state
   */
  initializeWorkflow(workflowId: string, userId: string): WorkflowState {
    const definition = this.definitions.get(workflowId);
    if (!definition) {
      throw new Error(`Workflow definition not found: ${workflowId}`);
    }

    const state: WorkflowState = {
      workflowId,
      currentStep: definition.steps[0]?.id || '',
      completedSteps: [],
      totalSteps: definition.steps.length,
      progress: 0,
      metadata: {
        userId,
        startedAt: Date.now(),
        definition: definition.name,
      },
    };

    this.workflows.set(workflowId, state);
    return state;
  }

  /**
   * Get workflow state
   */
  getWorkflowState(workflowId: string): WorkflowState | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Update workflow state
   */
  updateWorkflowState(workflowId: string, updates: Partial<WorkflowState>): void {
    const current = this.workflows.get(workflowId);
    if (!current) {
      logger.warn('Workflow state not found', { workflowId });
      return;
    }

    const updated: WorkflowState = {
      ...current,
      ...updates,
      metadata: {
        ...current.metadata,
        ...updates.metadata,
      },
    };

    // Recalculate progress
    if (updated.completedSteps && updated.totalSteps) {
      updated.progress = Math.round((updated.completedSteps.length / updated.totalSteps) * 100);
    }

    this.workflows.set(workflowId, updated);
    logger.debug('Workflow state updated', { workflowId, progress: updated.progress });
  }

  /**
   * Complete a workflow step
   */
  completeStep(workflowId: string, stepId: string): void {
    const state = this.getWorkflowState(workflowId);
    if (!state) {
      logger.warn('Workflow state not found', { workflowId });
      return;
    }

    if (!state.completedSteps.includes(stepId)) {
      state.completedSteps.push(stepId);
    }

    this.updateWorkflowState(workflowId, {
      completedSteps: state.completedSteps,
    });
  }

  /**
   * Advance to next step
   */
  advanceToStep(workflowId: string, stepId: string): void {
    const definition = this.definitions.get(workflowId);
    if (!definition) {
      logger.warn('Workflow definition not found', { workflowId });
      return;
    }

    const step = definition.steps.find((s) => s.id === stepId);
    if (!step) {
      logger.warn('Workflow step not found', { workflowId, stepId });
      return;
    }

    // Check dependencies
    const allDependenciesMet = step.dependencies.every((depId) => {
      const state = this.getWorkflowState(workflowId);
      return state?.completedSteps.includes(depId) || false;
    });

    if (!allDependenciesMet) {
      logger.warn('Workflow step dependencies not met', { workflowId, stepId, dependencies: step.dependencies });
      return;
    }

    this.updateWorkflowState(workflowId, {
      currentStep: stepId,
    });
  }

  /**
   * Get workflow definition
   */
  getWorkflowDefinition(workflowId: string): WorkflowDefinition | null {
    return this.definitions.get(workflowId) || null;
  }
}

/**
 * Workflow Step Tracker
 */
export class WorkflowStepTracker {
  private stepStartTimes: Map<string, number> = new Map();
  private stepDurations: Map<string, number[]> = new Map();

  /**
   * Start tracking a step
   */
  startStep(workflowId: string, stepId: string): void {
    const key = `${workflowId}:${stepId}`;
    this.stepStartTimes.set(key, Date.now());
  }

  /**
   * End tracking a step
   */
  endStep(workflowId: string, stepId: string): number {
    const key = `${workflowId}:${stepId}`;
    const startTime = this.stepStartTimes.get(key);
    if (!startTime) {
      return 0;
    }

    const duration = Date.now() - startTime;
    this.stepStartTimes.delete(key);

    const durations = this.stepDurations.get(key) || [];
    durations.push(duration);
    this.stepDurations.set(key, durations);

    return duration;
  }

  /**
   * Get average duration for a step
   */
  getAverageDuration(workflowId: string, stepId: string): number {
    const key = `${workflowId}:${stepId}`;
    const durations = this.stepDurations.get(key) || [];
    if (durations.length === 0) {
      return 0;
    }
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }
}

/**
 * Workflow Guidance Engine
 */
export class WorkflowGuidanceEngine {
  constructor(
    private stateManager: WorkflowStateManager,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _stepTracker: WorkflowStepTracker // Reserved for future step duration tracking
  ) {}

  /**
   * Generate guidance for current workflow step
   */
  async generateGuidance(workflowId: string): Promise<FrenlyMessage | null> {
    const state = this.stateManager.getWorkflowState(workflowId);
    if (!state) {
      return null;
    }

    const definition = this.stateManager.getWorkflowDefinition(workflowId);
    if (!definition) {
      return null;
    }

    const currentStep = definition.steps.find((s) => s.id === state.currentStep);
    if (!currentStep) {
      return null;
    }

    // Generate contextual message via Frenly AI
    try {
      const generatedMessage = await frenlyAgentService.generateMessage({
        userId: state.metadata?.userId || 'unknown',
        page: currentStep.pageId,
        progress: {
          completedSteps: state.completedSteps,
          totalSteps: state.totalSteps,
          currentStep: state.currentStep,
        },
      });

      // Convert GeneratedMessage to FrenlyMessage
      const message: FrenlyMessage = {
        id: generatedMessage.id,
        type: generatedMessage.type === 'help' ? 'tip' : (generatedMessage.type as FrenlyMessage['type']),
        content: generatedMessage.content,
        timestamp: generatedMessage.timestamp,
        page: currentStep.pageId,
        priority: generatedMessage.priority,
        dismissible: true,
        autoHide: generatedMessage.type === 'greeting' ? 5000 : undefined,
      };

      return message;
    } catch (error) {
      logger.error('Failed to generate workflow guidance', { workflowId, error });
      return null;
    }
  }

  /**
   * Check if guidance should be shown
   */
  shouldShowGuidance(state: WorkflowState): boolean {
    // Show guidance if:
    // 1. User is on a new step (not completed)
    // 2. Step has been active for more than 30 seconds without progress
    // 3. User hasn't seen guidance for this step yet

    const stepStartTime = state.metadata?.stepStartTime || 0;
    const timeOnStep = Date.now() - stepStartTime;

    return timeOnStep > 30000 && !state.completedSteps.includes(state.currentStep);
  }
}

/**
 * Workflow Sync Service
 */
export class WorkflowSyncService {
  private syncQueue: Array<{ workflowId: string; timestamp: number }> = [];
  private isSyncing = false;

  constructor(private stateManager: WorkflowStateManager) {}

  /**
   * Queue workflow for sync
   */
  queueSync(workflowId: string): void {
    const existing = this.syncQueue.find((item) => item.workflowId === workflowId);
    if (!existing) {
      this.syncQueue.push({ workflowId, timestamp: Date.now() });
    }
    this.processSyncQueue();
  }

  /**
   * Sync workflow state
   */
  async syncWorkflowState(workflowId: string, state: WorkflowState): Promise<void> {
    // Persist to backend (if workflow service exists)
    // await workflowService.saveState(workflowId, state);

    // Sync to Frenly AI
    try {
      await frenlyAgentService.updateWorkflowState?.({
        workflowId,
        currentStep: state.currentStep,
        progress: state.progress,
        completedSteps: state.completedSteps,
      });
    } catch (error) {
      logger.debug('Failed to sync workflow state to Frenly AI', { workflowId, error });
    }

    // Generate workflow guidance if needed
    const guidanceEngine = new WorkflowGuidanceEngine(this.stateManager, new WorkflowStepTracker());
    if (guidanceEngine.shouldShowGuidance(state)) {
      const message = await guidanceEngine.generateGuidance(workflowId);
      if (message) {
        // Show message via Frenly AI
        // await frenlyAgentService.showMessage(message);
      }
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift()!;
      const state = this.stateManager.getWorkflowState(item.workflowId);
      if (state) {
        try {
          await this.syncWorkflowState(item.workflowId, state);
        } catch (error) {
          logger.error('Failed to sync workflow state', { workflowId: item.workflowId, error });
        }
      }
    }

    this.isSyncing = false;
  }
}

// Singleton instances
let stateManagerInstance: WorkflowStateManager | null = null;
let stepTrackerInstance: WorkflowStepTracker | null = null;
let syncServiceInstance: WorkflowSyncService | null = null;

/**
 * Get the workflow state manager instance
 */
export function getWorkflowStateManager(): WorkflowStateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new WorkflowStateManager();
  }
  return stateManagerInstance;
}

/**
 * Get the workflow step tracker instance
 */
export function getWorkflowStepTracker(): WorkflowStepTracker {
  if (!stepTrackerInstance) {
    stepTrackerInstance = new WorkflowStepTracker();
  }
  return stepTrackerInstance;
}

/**
 * Get the workflow sync service instance
 */
export function getWorkflowSyncService(): WorkflowSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new WorkflowSyncService(getWorkflowStateManager());
  }
  return syncServiceInstance;
}

