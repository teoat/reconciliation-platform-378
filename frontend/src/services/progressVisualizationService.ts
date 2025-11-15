// Enhanced Progress Visualization & Workflow Guidance Service
import { logger } from '@/services/logger';
// Implements animated progress, contextual help, and stage guidance

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'error';
  progress: number; // 0-100
  estimatedTime: number; // minutes
  actualTime?: number; // minutes
  dependencies: string[];
  requirements: StageRequirement[];
  help: StageHelp;
  validation: StageValidation;
}

export interface StageRequirement {
  id: string;
  type: 'data' | 'permission' | 'validation' | 'approval' | 'file';
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  validationRule?: string;
  errorMessage?: string;
}

export interface StageHelp {
  title: string;
  description: string;
  tips: string[];
  examples: string[];
  links: {
    title: string;
    url: string;
    type: 'documentation' | 'video' | 'example';
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export interface StageValidation {
  rules: ValidationRule[];
  autoValidate: boolean;
  showProgress: boolean;
  allowSkip: boolean;
  skipReason?: string;
}

export interface ValidationRule {
  id: string;
  field: string;
  condition: 'required' | 'min_length' | 'max_length' | 'format' | 'range' | 'custom';
  value?: string | number | boolean | [number, number] | RegExp | Record<string, unknown>;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ProgressAnimation {
  type: 'linear' | 'ease' | 'bounce' | 'elastic' | 'pulse' | 'wave';
  duration: number;
  delay?: number;
  easing?: string;
  showPercentage: boolean;
  showTimeEstimate: boolean;
  showMilestones: boolean;
}

export interface ContextualHelp {
  id: string;
  trigger: 'hover' | 'click' | 'focus' | 'error' | 'timeout';
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  content: {
    title: string;
    description: string;
    actions?: {
      label: string;
      action: () => void;
      type: 'primary' | 'secondary' | 'link';
    }[];
  };
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: string | number | boolean | string[] | null | undefined;
  }>;
}

export interface WorkflowGuidance {
  currentStage: WorkflowStage;
  nextStage?: WorkflowStage;
  previousStage?: WorkflowStage;
  overallProgress: number;
  estimatedTimeRemaining: number;
  blockers: string[];
  suggestions: string[];
  shortcuts: {
    label: string;
    action: () => void;
    shortcut: string;
  }[];
}

class ProgressVisualizationService {
  private static instance: ProgressVisualizationService;
  private workflows: Map<string, WorkflowStage[]> = new Map();
  private currentWorkflow: string | null = null;
  private progressAnimations: Map<string, ProgressAnimation> = new Map();
  private contextualHelp: Map<string, ContextualHelp> = new Map();
  private listeners: Map<string, Function[]> = new Map();

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
    // Simplified Reconciliation workflow - 3 steps instead of 5
    const reconciliationWorkflow: WorkflowStage[] = [
      {
        id: 'data_setup',
        name: 'Data Setup',
        description: 'Upload, validate, and map your data fields',
        order: 1,
        status: 'pending',
        progress: 0,
        estimatedTime: 25, // Combined time from ingestion (15) + mapping (10)
        dependencies: [],
        requirements: [
          {
            id: 'upload_files',
            type: 'file',
            description: 'Upload CSV or Excel files',
            isRequired: true,
            isCompleted: false,
          },
          {
            id: 'validate_format',
            type: 'validation',
            description: 'Validate file format and structure',
            isRequired: true,
            isCompleted: false,
          },
          {
            id: 'map_required_fields',
            type: 'validation',
            description: 'Map all required fields',
            isRequired: true,
            isCompleted: false,
          },
        ],
        help: {
          title: 'Data Setup Help',
          description: 'Upload your files, validate format, and map fields in one streamlined step',
          tips: [
            'Ensure your files are in CSV or Excel format',
            'Use AI suggestions for automatic field mapping',
            'Verify mapped fields before proceeding',
            'Save your progress - you can continue later',
          ],
          examples: ['Sample CSV file with proper headers', 'Excel template with validation rules'],
          links: [
            {
              title: 'Data Format Guide',
              url: '/docs/data-format',
              type: 'documentation',
            },
            {
              title: 'Field Mapping Guide',
              url: '/docs/field-mapping',
              type: 'documentation',
            },
          ],
          faq: [
            {
              question: 'What file formats are supported?',
              answer: 'We support CSV and Excel files (.xlsx, .xls)',
            },
            {
              question: 'Can I save my progress and continue later?',
              answer: 'Yes! Your data setup is automatically saved as you work',
            },
          ],
        },
        validation: {
          rules: [
            {
              id: 'file_required',
              field: 'files',
              condition: 'required',
              message: 'At least one file must be uploaded',
              severity: 'error',
            },
            {
              id: 'required_fields_mapped',
              field: 'mappedFields',
              condition: 'required',
              message: 'All required fields must be mapped',
              severity: 'error',
            },
          ],
          autoValidate: true,
          showProgress: true,
          allowSkip: false,
        },
      },
      {
        id: 'reconciliation',
        name: 'AI Reconciliation',
        description: 'Run AI-powered reconciliation algorithms',
        order: 2,
        status: 'pending',
        progress: 0,
        estimatedTime: 30,
        dependencies: ['data_setup'],
        requirements: [
          {
            id: 'run_algorithms',
            type: 'data',
            description: 'Execute reconciliation algorithms',
            isRequired: true,
            isCompleted: false,
          },
        ],
        help: {
          title: 'Reconciliation Help',
          description: 'Understand the AI reconciliation process',
          tips: [
            'Review matching rules before running',
            'Monitor progress and adjust settings if needed',
            'Check results for accuracy',
          ],
          examples: [],
          links: [
            {
              title: 'Reconciliation Guide',
              url: '/docs/reconciliation',
              type: 'documentation',
            },
          ],
          faq: [
            {
              question: 'How long does reconciliation take?',
              answer: 'Typically 5-30 minutes depending on data size',
            },
          ],
        },
        validation: {
          rules: [],
          autoValidate: false,
          showProgress: true,
          allowSkip: false,
        },
      },
      {
        id: 'review_and_export',
        name: 'Review & Export',
        description: 'Review results and export final reconciliation report',
        order: 3,
        status: 'pending',
        progress: 0,
        estimatedTime: 25, // Combined time from review (20) + export (5)
        dependencies: ['reconciliation'],
        requirements: [
          {
            id: 'review_matches',
            type: 'approval',
            description: 'Review matched items',
            isRequired: true,
            isCompleted: false,
          },
          {
            id: 'handle_discrepancies',
            type: 'data',
            description: 'Handle unmatched items',
            isRequired: false,
            isCompleted: false,
          },
          {
            id: 'generate_report',
            type: 'data',
            description: 'Generate and export final report',
            isRequired: true,
            isCompleted: false,
          },
        ],
        help: {
          title: 'Review & Export Help',
          description: 'Review reconciliation results and export your final report',
          tips: [
            'Check match confidence scores',
            'Review unmatched items carefully',
            'Use bulk actions for efficiency',
            'Choose appropriate export format (CSV, Excel, PDF, JSON)',
            'Save reports for future reference',
          ],
          examples: [],
          links: [
            {
              title: 'Results Review Guide',
              url: '/docs/results-review',
              type: 'documentation',
            },
            {
              title: 'Export Guide',
              url: '/docs/export',
              type: 'documentation',
            },
          ],
          faq: [
            {
              question: 'What if I disagree with a match?',
              answer: 'You can manually adjust or reject any match',
            },
            {
              question: 'What export formats are available?',
              answer: 'CSV, Excel, PDF, and JSON formats are supported',
            },
          ],
        },
        validation: {
          rules: [],
          autoValidate: false,
          showProgress: true,
          allowSkip: false,
        },
      },
    ];

    this.workflows.set('reconciliation', reconciliationWorkflow);
  }

  private initializeContextualHelp(): void {
    // File upload help
    this.contextualHelp.set('file_upload', {
      id: 'file_upload',
      trigger: 'hover',
      position: 'right',
      content: {
        title: 'File Upload Tips',
        description:
          'Drag and drop your files here or click to browse. Supported formats: CSV, Excel',
        actions: [
          {
            label: 'View Format Guide',
            action: () => window.open('/docs/data-format', '_blank'),
            type: 'link',
          },
        ],
      },
    });

    // Field mapping help
    this.contextualHelp.set('field_mapping', {
      id: 'field_mapping',
      trigger: 'focus',
      position: 'bottom',
      content: {
        title: 'Field Mapping',
        description:
          'Map your data fields to the system fields. Use AI suggestions for automatic mapping.',
        actions: [
          {
            label: 'Use AI Suggestions',
            action: () => logger.info('Use AI suggestions'),
            type: 'primary',
          },
        ],
      },
    });

    // Progress help
    this.contextualHelp.set('progress_indicator', {
      id: 'progress_indicator',
      trigger: 'hover',
      position: 'top',
      content: {
        title: 'Progress Tracking',
        description:
          'Track your workflow progress. Click on any stage to see details and requirements.',
        actions: [],
      },
    });
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

    // Auto-advance to next stage
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

    const totalStages = workflow.length;
    const completedStages = workflow.filter((s) => s.status === 'completed').length;
    const skippedStages = workflow.filter((s) => s.status === 'skipped').length;

    return Math.round(((completedStages + skippedStages) / totalStages) * 100);
  }

  public getEstimatedTimeRemaining(): number {
    if (!this.currentWorkflow) return 0;

    const workflow = this.workflows.get(this.currentWorkflow);
    if (!workflow) return 0;

    const currentStage = workflow.find((s) => s.status === 'active');
    if (!currentStage) return 0;

    const remainingStages = workflow.filter(
      (s) => s.order >= currentStage.order && s.status === 'pending'
    );
    return remainingStages.reduce((total, stage) => total + stage.estimatedTime, 0);
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

    const suggestions = this.generateSuggestions(currentStage);
    const shortcuts = this.generateShortcuts(currentStage);

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

  private generateSuggestions(stage: WorkflowStage): string[] {
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

  private generateShortcuts(
    stage: WorkflowStage
  ): { label: string; action: () => void; shortcut: string }[] {
    const shortcuts: { label: string; action: () => void; shortcut: string }[] = [];

    switch (stage.id) {
      case 'data_setup':
        shortcuts.push({
          label: 'Upload Files',
          action: () => logger.info('Upload files'),
          shortcut: 'Ctrl+U',
        });
        shortcuts.push({
          label: 'Use AI Mapping',
          action: () => logger.info('Use AI mapping'),
          shortcut: 'Ctrl+M',
        });
        shortcuts.push({
          label: 'Save Progress',
          action: () => logger.info('Save progress'),
          shortcut: 'Ctrl+S',
        });
        break;
      case 'reconciliation':
        shortcuts.push({
          label: 'Start Reconciliation',
          action: () => logger.info('Start reconciliation'),
          shortcut: 'Ctrl+R',
        });
        break;
      case 'review_and_export':
        shortcuts.push({
          label: 'Export Results',
          action: () => logger.info('Export results'),
          shortcut: 'Ctrl+E',
        });
        break;
    }

    return shortcuts;
  }

  // Contextual Help
  public getContextualHelp(id: string): ContextualHelp | undefined {
    return this.contextualHelp.get(id);
  }

  public showContextualHelp(id: string, element: HTMLElement): void {
    const help = this.contextualHelp.get(id);
    if (!help) return;

    // Create and show help tooltip
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

    // Sanitize content to prevent XSS - use textContent instead of innerHTML
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
        if (action.onClick) {
          button.addEventListener('click', action.onClick);
        }
        actionsDiv.appendChild(button);
      });

      helpContent.appendChild(actionsDiv);
    }

    tooltip.appendChild(helpContent);

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const position = this.calculateTooltipPosition(help.position, rect);

    tooltip.style.position = 'fixed';
    tooltip.style.left = `${position.x}px`;
    tooltip.style.top = `${position.y}px`;
    tooltip.style.zIndex = '9999';

    // Add to DOM
    document.body.appendChild(tooltip);

    // Add event listeners
    help.content.actions?.forEach((action, index) => {
      const button = tooltip.querySelector(`.help-action:nth-child(${index + 1})`);
      if (button) {
        button.addEventListener('click', action.action);
      }
    });

    // Auto-remove after delay
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 5000);
  }

  private calculateTooltipPosition(position: string, rect: DOMRect): { x: number; y: number } {
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

  // Progress Animations
  public createProgressAnimation(
    element: HTMLElement,
    progress: number,
    animation: ProgressAnimation
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
        const remainingTime = this.getEstimatedTimeRemaining();
        timeElement.textContent = `${remainingTime} min remaining`;
      }
    }
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
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

  const createWorkflow = (id: string, stages: WorkflowStage[]) => {
    service.createWorkflow(id, stages);
  };

  const setCurrentWorkflow = (id: string) => {
    return service.setCurrentWorkflow(id);
  };

  const getCurrentWorkflow = () => {
    return service.getCurrentWorkflow();
  };

  const updateStageStatus = (stageId: string, status: WorkflowStage['status']) => {
    return service.updateStageStatus(stageId, status);
  };

  const updateStageProgress = (stageId: string, progress: number) => {
    return service.updateStageProgress(stageId, progress);
  };

  const completeStage = (stageId: string, actualTime?: number) => {
    return service.completeStage(stageId, actualTime);
  };

  const skipStage = (stageId: string, reason: string) => {
    return service.skipStage(stageId, reason);
  };

  const getOverallProgress = () => {
    return service.getOverallProgress();
  };

  const getEstimatedTimeRemaining = () => {
    return service.getEstimatedTimeRemaining();
  };

  const getWorkflowGuidance = () => {
    return service.getWorkflowGuidance();
  };

  const getContextualHelp = (id: string) => {
    return service.getContextualHelp(id);
  };

  const showContextualHelp = (id: string, element: HTMLElement) => {
    service.showContextualHelp(id, element);
  };

  const createProgressAnimation = (
    element: HTMLElement,
    progress: number,
    animation: ProgressAnimation
  ) => {
    service.createProgressAnimation(element, progress, animation);
  };

  return {
    createWorkflow,
    setCurrentWorkflow,
    getCurrentWorkflow,
    updateStageStatus,
    updateStageProgress,
    completeStage,
    skipStage,
    getOverallProgress,
    getEstimatedTimeRemaining,
    getWorkflowGuidance,
    getContextualHelp,
    showContextualHelp,
    createProgressAnimation,
  };
};

// Export singleton instance
export const progressVisualizationService = ProgressVisualizationService.getInstance();
