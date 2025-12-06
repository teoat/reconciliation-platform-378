// Atomic Workflow Types

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  data?: Record<string, unknown>;
}

export interface WorkflowState {
  currentStep: number;
  steps: WorkflowStep[];
  canProceed: boolean;
  canGoBack: boolean;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  condition?: () => boolean;
}
