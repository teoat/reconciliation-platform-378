/**
 * Workflow Automation Types
 */

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains';
  value: string | number | boolean | Date;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  id: string;
  type: 'notify' | 'assign' | 'escalate' | 'create_task' | 'update_field';
  parameters: Record<string, unknown>;
  order: number;
}

export interface WorkflowData {
  id: string;
  name: string;
  type: 'approve' | 'escalation' | 'validation' | 'automation';
  description: string;
  assigneeGroup?: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  timeout?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'inactive';
  order: number;
}

export interface BusinessRuleData {
  id: string;
  name: string;
  description: string;
  category: 'validation' | 'routing' | 'calculation';
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: number;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  executionCount: number;
  successRate: number;
  lastExecuted?: string | Date;
}

export interface WorkflowInstanceData {
  id: string;
  workflowId: string;
  recordId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep?: string;
  steps: Array<{
    id: string;
    stepId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startedAt?: string | Date;
    assignedTo?: string;
  }>;
  startedAt?: string | Date;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>;
}

export interface ApprovalRequestData {
  id: string;
  workflowInstanceId: string;
  stepId: string;
  recordId: string;
  requestedBy: string;
  requestedAt: string | Date;
  assignedTo: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  metadata: Record<string, unknown>;
}

export type TabId = 'workflows' | 'instances' | 'rules' | 'approvals';

export interface WorkflowAutomationProps {
  project: import('../../../types/index').Project | null;
  onProgressUpdate?: (step: string) => void;
}
