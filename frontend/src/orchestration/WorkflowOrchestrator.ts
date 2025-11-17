/**
 * Workflow Orchestrator - Coordinates multi-page workflows with Frenly AI
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import type {
  WorkflowState,
  PageOrchestrationInterface,
  PageContext,
} from './types';

export interface WorkflowOrchestrationConfig {
  workflowId: string;
  userId: string;
  pages: string[];
  initialState?: Partial<WorkflowState>;
}

export interface WorkflowStep {
  id: string;
  pageId: string;
  name: string;
  description: string;
  order: number;
  required: boolean;
}

export class WorkflowOrchestrator {
  private config: WorkflowOrchestrationConfig;
  private currentState: WorkflowState | null = null;
  private steps: WorkflowStep[] = [];
  private pageStates: Map<string, PageContext> = new Map();

  constructor(config: WorkflowOrchestrationConfig) {
    this.config = config;
    this.initializeState();
  }

  /**
   * Initialize workflow state
   */
  private initializeState(): void {
    this.currentState = {
      workflowId: this.config.workflowId,
      currentStep: this.config.pages[0] || '',
      completedSteps: [],
      totalSteps: this.config.pages.length,
      progress: 0,
      metadata: this.config.initialState?.metadata || {},
    };
  }

  /**
   * Register workflow steps
   */
  registerSteps(steps: WorkflowStep[]): void {
    this.steps = steps.sort((a, b) => a.order - b.order);
    if (this.currentState) {
      this.currentState.totalSteps = steps.length;
    }
  }

  /**
   * Get current workflow state
   */
  getWorkflowState(): WorkflowState | null {
    return this.currentState;
  }

  /**
   * Update workflow state
   */
  async updateState(
    page: PageOrchestrationInterface,
    updates: Partial<WorkflowState>
  ): Promise<void> {
    try {
      if (!this.currentState) {
        this.initializeState();
      }
      
      const current = this.currentState!;
      this.currentState = {
        workflowId: current.workflowId,
        currentStep: updates.currentStep ?? current.currentStep,
        completedSteps: updates.completedSteps ?? current.completedSteps,
        totalSteps: updates.totalSteps ?? current.totalSteps,
        progress: current.progress,
        metadata: { ...current.metadata, ...updates.metadata },
      };

      // Update progress
      if (updates.completedSteps && this.currentState) {
        this.currentState.progress = Math.round(
          (updates.completedSteps.length / this.currentState.totalSteps) * 100
        );
      }

      // Save page state
      const pageContext = page.getPageContext();
      this.pageStates.set(page.getPageId(), pageContext);

      // Sync to Frenly AI
      await this.syncWithFrenly(page);

      // Generate guidance if needed
      if (this.shouldShowGuidance()) {
        await this.generateWorkflowGuidance(page);
      }

      logger.debug('Workflow state updated', {
        workflowId: this.config.workflowId,
        state: this.currentState,
      });
    } catch (error) {
      logger.error('Error updating workflow state', { error });
    }
  }

  /**
   * Complete a workflow step
   */
  async completeStep(
    page: PageOrchestrationInterface,
    stepId: string
  ): Promise<void> {
    try {
      if (!this.currentState) {
        this.initializeState();
      }

      const current = this.currentState!;
      
      // Add to completed steps
      if (!current.completedSteps.includes(stepId)) {
        current.completedSteps.push(stepId);
      }

      // Update current step
      const nextStep = this.getNextStep(stepId);
      if (nextStep) {
        current.currentStep = nextStep.id;
      }

      // Update progress
      current.progress = Math.round(
        (current.completedSteps.length / current.totalSteps) * 100
      );

      // Sync state
      if (this.currentState) {
        await this.updateState(page, this.currentState);
      }

      // Generate completion message
      if (this.isWorkflowComplete()) {
        await this.generateCompletionMessage();
      } else {
        await this.generateStepCompletionMessage(stepId);
      }

      logger.info('Workflow step completed', {
        workflowId: this.config.workflowId,
        stepId,
      });
    } catch (error) {
      logger.error('Error completing workflow step', { error, stepId });
      throw error;
    }
  }

  /**
   * Get next step after current step
   */
  getNextStep(currentStepId: string): WorkflowStep | null {
    const currentIndex = this.steps.findIndex(
      (step) => step.id === currentStepId
    );
    if (currentIndex === -1 || currentIndex === this.steps.length - 1) {
      return null;
    }
    return this.steps[currentIndex + 1];
  }

  /**
   * Check if workflow is complete
   */
  isWorkflowComplete(): boolean {
    if (!this.currentState) return false;
    return (
      this.currentState.completedSteps.length >= this.currentState.totalSteps
    );
  }

  /**
   * Get workflow progress percentage
   */
  getProgressPercentage(): number {
    if (!this.currentState) return 0;
    return this.currentState.progress;
  }

  /**
   * Sync workflow state with Frenly AI
   */
  async syncWithFrenly(
    _page: PageOrchestrationInterface
  ): Promise<void> {
    try {
      if (!this.currentState) return;

      await frenlyAgentService.updateWorkflowState({
        workflowId: this.config.workflowId,
        currentStep: this.currentState.currentStep,
        progress: this.currentState.progress,
        completedSteps: this.currentState.completedSteps,
      });

      logger.debug('Workflow state synced with Frenly AI', {
        workflowId: this.config.workflowId,
      });
    } catch (error) {
      logger.error('Error syncing workflow state', { error });
    }
  }

  /**
   * Generate workflow guidance
   */
  private async generateWorkflowGuidance(
    _page: PageOrchestrationInterface
  ): Promise<void> {
    try {
      if (!this.currentState) return;

      const message = await frenlyAgentService.generateMessage({
        userId: this.config.userId,
        page: this.config.pages[0] || '',
        progress: {
          completedSteps: this.currentState.completedSteps,
          totalSteps: this.currentState.totalSteps,
          currentStep: this.currentState.currentStep,
        },
      });

      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: message,
        })
      );
    } catch (error) {
      logger.error('Error generating workflow guidance', { error });
    }
  }

  /**
   * Generate completion message
   */
  private async generateCompletionMessage(): Promise<void> {
    try {
      const message = await frenlyAgentService.generateMessage({
        userId: this.config.userId,
        page: this.config.pages[this.config.pages.length - 1] || '',
        progress: {
          completedSteps: this.currentState?.completedSteps || [],
          totalSteps: this.currentState?.totalSteps || 0,
          currentStep: undefined,
        },
      });

      const celebrationMessage = {
        ...message,
        type: 'celebration' as const,
        content:
          "🎉 Amazing! You've completed the entire workflow. Great job!",
        priority: 'high' as const,
      };

      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: celebrationMessage,
        })
      );
    } catch (error) {
      logger.error('Error generating completion message', { error });
    }
  }

  /**
   * Generate step completion message
   */
  private async generateStepCompletionMessage(stepId: string): Promise<void> {
    try {
      const step = this.steps.find((s) => s.id === stepId);
      const message = await frenlyAgentService.generateMessage({
        userId: this.config.userId,
        page: step?.pageId || '',
        progress: {
          completedSteps: this.currentState?.completedSteps || [],
          totalSteps: this.currentState?.totalSteps || 0,
          currentStep: stepId,
        },
      });

      window.dispatchEvent(
        new CustomEvent('frenly:show-message', {
          detail: message,
        })
      );
    } catch (error) {
      logger.error('Error generating step completion message', { error });
    }
  }

  /**
   * Check if guidance should be shown
   */
  private shouldShowGuidance(): boolean {
    if (!this.currentState) return false;

    // Show guidance at milestones (25%, 50%, 75%)
    const milestones = [25, 50, 75];
    return milestones.includes(this.currentState.progress);
  }

  /**
   * Get page state for a specific page
   */
  getPageState(pageId: string): PageContext | null {
    return this.pageStates.get(pageId) || null;
  }

  /**
   * Save workflow state to localStorage
   */
  saveState(): void {
    try {
      const state = {
        workflowId: this.config.workflowId,
        state: this.currentState,
        pageStates: Object.fromEntries(this.pageStates),
        timestamp: Date.now(),
      };
      localStorage.setItem(
        `workflow:${this.config.workflowId}`,
        JSON.stringify(state)
      );
    } catch (error) {
      logger.error('Error saving workflow state', { error });
    }
  }

  /**
   * Load workflow state from localStorage
   */
  loadState(): void {
    try {
      const saved = localStorage.getItem(`workflow:${this.config.workflowId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentState = parsed.state;
        this.pageStates = new Map(Object.entries(parsed.pageStates || {}));
      }
    } catch (error) {
      logger.warn('Failed to load workflow state', { error });
    }
  }
}

// Singleton instances per workflow
const orchestrators: Map<string, WorkflowOrchestrator> = new Map();

export function getWorkflowOrchestrator(
  config: WorkflowOrchestrationConfig
): WorkflowOrchestrator {
  if (!orchestrators.has(config.workflowId)) {
    const orchestrator = new WorkflowOrchestrator(config);
    orchestrator.loadState();
    orchestrators.set(config.workflowId, orchestrator);
  }
  return orchestrators.get(config.workflowId)!;
}

