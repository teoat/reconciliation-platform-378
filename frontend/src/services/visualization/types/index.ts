/**
 * Type definitions for progress visualization service
 */

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

