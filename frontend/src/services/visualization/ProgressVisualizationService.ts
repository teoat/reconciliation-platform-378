/**
 * Progress Visualization Service - Core service for workflow progress tracking
 */

import type {
  WorkflowStage,
  ProgressAnimation,
  ContextualHelp,
  WorkflowGuidance,
} from './types';
import {
  calculateOverallProgress,
  calculateEstimatedTimeRemaining,
  generateSuggestions,
  generateShortcuts,
} from './utils/dataTransformers';
import { createProgressAnimation } from './utils/animationHelpers';
import {
  initializeDefaultReconciliationWorkflow,
  initializeDefaultContextualHelp,
} from './utils/workflowInitializers';
import { calculateTooltipPosition } from './utils/animationHelpers';

class ProgressVisualizationService {
  private static instance: ProgressVisualizationService;
  private workflows: Map<string, WorkflowStage[]> = new Map();
  private currentWorkflow: string | null = null;
  private progressAnimations: Map<string, ProgressAnimation> = new Map();
  private contextualHelp: Map<string, ContextualHelp> = new Map();
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  public static getInstance(): ProgressVisualizationService {
    if (!ProgressVisualizationService.instance) {
      ProgressVisualizationService.instance = new ProgressVisualizationService();
    }
    return ProgressVisualizationService.instance;
  }

  constructor() {
    this.initializeDefaultWorkflows();
    this.initializeContextualHelp();
  }

  private initializeDefaultWorkflows(): void {
    const reconciliationWorkflow = initializeDefaultReconciliationWorkflow();
    this.workflows.set('reconciliation', reconciliationWorkflow);
  }

  private initializeContextualHelp(): void {
    this.contextualHelp = initializeDefaultContextualHelp();
  }

  // Workflow Management
  public createWorkflow(id: string, stages: WorkflowStage[]): void {
    this.workflows.set(id, stages);
    this.emit('workflowCreated', { id, stages });
  }

  public getWorkflow(id: string): WorkflowStage[] | undefined {
    return this.workflows.get(id);
  }

  public setCurrentWorkflow(id: string): boolean {
    if (!this.workflows.has(id)) return false;

    this.currentWorkflow = id;
    this.emit('workflowChanged', id);
    return true;
  }

  public getCurrentWorkflow(): WorkflowStage[] | null {
    if (!this.currentWorkflow) return null;
    return this.workflows.get(this.currentWorkflow) || null;
  }

  // Stage Management
  public updateStageStatus(stageId: string, status: WorkflowStage['status']): boolean {
    if (!this.currentWorkflow) return false;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return false;

    const stage = workflow.find((s) => s.id === stageId);
    if (!stage) return false;

    stage.status = status;
    this.emit('stageStatusUpdated', { stageId, status });
    return true;
  }

  public updateStageProgress(stageId: string, progress: number): boolean {
    if (!this.currentWorkflow) return false;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return false;

    const stage = workflow.find((s) => s.id === stageId);
    if (!stage) return false;

    stage.progress = Math.max(0, Math.min(100, progress));
    this.emit('stageProgressUpdated', { stageId, progress });
    return true;
  }

  public completeStage(stageId: string, actualTime?: number): boolean {
    if (!this.currentWorkflow) return false;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return false;

    const stage = workflow.find((s) => s.id === stageId);
    if (!stage) return false;

    stage.status = 'completed';
    stage.progress = 100;
    if (actualTime) stage.actualTime = actualTime;

    this.advanceToNextStage();
    this.emit('stageCompleted', { stageId, actualTime });
    return true;
  }

  public skipStage(stageId: string, reason: string): boolean {
    if (!this.currentWorkflow) return false;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return false;

    const stage = workflow.find((s) => s.id === stageId);
    if (!stage) return false;

    if (!stage.validation.allowSkip) return false;

    stage.status = 'skipped';
    stage.validation.skipReason = reason;

    this.advanceToNextStage();
    this.emit('stageSkipped', { stageId, reason });
    return true;
  }

  private advanceToNextStage(): void {
    if (!this.currentWorkflow) return;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return;

    const currentStage = workflow.find((s) => s.status === 'active');
    if (!currentStage) return;

    const nextStage = workflow.find((s) => s.order === currentStage.order + 1);
    if (nextStage) {
      nextStage.status = 'active';
      this.emit('stageActivated', nextStage.id);
    }
  }

  // Progress Visualization
  public getOverallProgress(): number {
    if (!this.currentWorkflow) return 0;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return 0;

    return calculateOverallProgress(workflow);
  }

  public getEstimatedTimeRemaining(): number {
    if (!this.currentWorkflow) return 0;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return 0;

    return calculateEstimatedTimeRemaining(workflow);
  }

  public getWorkflowGuidance(): WorkflowGuidance | null {
    if (!this.currentWorkflow) return null;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return null;

    const currentStage = workflow.find((s) => s.status === 'active');
    if (!currentStage) return null;

    const nextStage = workflow.find((s) => s.order === currentStage.order + 1);
    const previousStage = workflow.find((s) => s.order === currentStage.order - 1);

    const blockers = currentStage.requirements
      .filter((req) => req.isRequired && !req.isCompleted)
      .map((req) => req.description);

    const suggestions = generateSuggestions(currentStage);
    const shortcuts = generateShortcuts(currentStage);

    return {
      currentStage,
      nextStage,
      previousStage,
      overallProgress: this.getOverallProgress(),
      estimatedTimeRemaining: this.getEstimatedTimeRemaining(),
      blockers,
      suggestions,
      shortcuts,
    };
  }

  // Contextual Help
  public getContextualHelp(id: string): ContextualHelp | undefined {
    return this.contextualHelp.get(id);
  }

  public showContextualHelp(id: string, element: HTMLElement): void {
    const help = this.contextualHelp.get(id);
    if (!help) return;

    this.createHelpTooltip(help, element);
  }

  private createHelpTooltip(help: ContextualHelp, element: HTMLElement): void {
    // Remove existing tooltip
    const existingTooltip = document.getElementById(`help-tooltip-${help.id}`);
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = `help-tooltip-${help.id}`;
    tooltip.className = 'contextual-help-tooltip';

    const helpContent = document.createElement('div');
    helpContent.className = 'help-content';

    const title = document.createElement('h3');
    title.textContent = help.content.title || '';
    helpContent.appendChild(title);

    const description = document.createElement('p');
    description.textContent = help.content.description || '';
    helpContent.appendChild(description);

    if (help.content.actions && help.content.actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'help-actions';

      help.content.actions.forEach((action) => {
        const button = document.createElement('button');
        button.className = `help-action ${action.type}`;
        button.textContent = action.label || '';
        button.type = 'button';
        button.addEventListener('click', action.action);
        actionsDiv.appendChild(button);
      });

      helpContent.appendChild(actionsDiv);
    }

    tooltip.appendChild(helpContent);

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const position = calculateTooltipPosition(help.position, rect);

    tooltip.style.position = 'fixed';
    tooltip.style.left = `${position.x}px`;
    tooltip.style.top = `${position.y}px`;
    tooltip.style.zIndex = '9999';

    document.body.appendChild(tooltip);

    // Auto-remove after delay
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 5000);
  }

  // Progress Animations
  public createProgressAnimation(
    element: HTMLElement,
    progress: number,
    animation: ProgressAnimation
  ): void {
    const estimatedTime = this.getEstimatedTimeRemaining();
    createProgressAnimation(element, progress, animation, estimatedTime);
  }

  // Event system
  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: string | Record<string, unknown>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  public destroy(): void {
    this.workflows.clear();
    this.progressAnimations.clear();
    this.contextualHelp.clear();
    this.listeners.clear();
  }
}

// React hook for progress visualization
export const useProgressVisualization = () => {
  const service = ProgressVisualizationService.getInstance();

  return {
    createWorkflow: (id: string, stages: WorkflowStage[]) => service.createWorkflow(id, stages),
    setCurrentWorkflow: (id: string) => service.setCurrentWorkflow(id),
    getCurrentWorkflow: () => service.getCurrentWorkflow(),
    updateStageStatus: (stageId: string, status: WorkflowStage['status']) =>
      service.updateStageStatus(stageId, status),
    updateStageProgress: (stageId: string, progress: number) =>
      service.updateStageProgress(stageId, progress),
    completeStage: (stageId: string, actualTime?: number) =>
      service.completeStage(stageId, actualTime),
    skipStage: (stageId: string, reason: string) => service.skipStage(stageId, reason),
    getOverallProgress: () => service.getOverallProgress(),
    getEstimatedTimeRemaining: () => service.getEstimatedTimeRemaining(),
    getWorkflowGuidance: () => service.getWorkflowGuidance(),
    getContextualHelp: (id: string) => service.getContextualHelp(id),
    showContextualHelp: (id: string, element: HTMLElement) =>
      service.showContextualHelp(id, element),
    createProgressAnimation: (element: HTMLElement, progress: number, animation: ProgressAnimation) =>
      service.createProgressAnimation(element, progress, animation),
  };
};

// Export singleton instance
export const progressVisualizationService = ProgressVisualizationService.getInstance();

export default ProgressVisualizationService;

