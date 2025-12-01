/**
 * Atomic Workflow Types
 */

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  order: number;
  dependencies?: string[];
}

export interface AtomicWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowAction {
  type: 'START' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'COMPLETE';
  workflowId: string;
  stepId?: string;
  payload?: unknown;
}
