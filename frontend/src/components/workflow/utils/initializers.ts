/**
 * Workflow Initialization Utilities
 */

import type {
  WorkflowData,
  BusinessRuleData,
  WorkflowInstanceData,
  ApprovalRequestData,
} from '../types';

export const initializeSampleWorkflows = (): WorkflowData[] => [
  {
    id: 'workflow-001',
    name: 'High Value Transaction Approval',
    type: 'approve',
    description: 'Multi-level approval workflow for transactions above 10M IDR',
    assigneeGroup: 'finance-team',
    conditions: [
      {
        id: 'cond-001',
        field: 'amount',
        operator: 'greater_than',
        value: 10000000,
      },
    ],
    actions: [
      {
        id: 'action-001',
        type: 'notify',
        parameters: {
          recipients: ['finance-manager'],
          message: 'High value transaction requires approval',
        },
        order: 1,
      },
      {
        id: 'action-002',
        type: 'assign',
        parameters: { assignee: 'finance-manager' },
        order: 2,
      },
    ],
    timeout: 24,
    priority: 'high',
    status: 'pending',
    order: 1,
  },
  {
    id: 'workflow-002',
    name: 'Discrepancy Escalation',
    type: 'escalation',
    description: 'Automatic escalation for discrepancies above threshold',
    assigneeGroup: 'reconciliation-team',
    conditions: [
      {
        id: 'cond-002',
        field: 'discrepancy_amount',
        operator: 'greater_than',
        value: 1000000,
      },
    ],
    actions: [
      {
        id: 'action-003',
        type: 'escalate',
        parameters: { level: 'senior-analyst', reason: 'High discrepancy amount' },
        order: 1,
      },
      {
        id: 'action-004',
        type: 'notify',
        parameters: {
          recipients: ['senior-analyst'],
          message: 'Discrepancy requires immediate attention',
        },
        order: 2,
      },
    ],
    timeout: 4,
    priority: 'critical',
    status: 'pending',
    order: 2,
  },
  {
    id: 'workflow-003',
    name: 'Data Quality Validation',
    type: 'validation',
    description: 'Automated validation for data quality issues',
    assigneeGroup: 'data-quality-team',
    conditions: [
      {
        id: 'cond-003',
        field: 'quality_score',
        operator: 'less_than',
        value: 90,
      },
    ],
    actions: [
      {
        id: 'action-005',
        type: 'create_task',
        parameters: { taskType: 'data-cleanup', priority: 'medium' },
        order: 1,
      },
      {
        id: 'action-006',
        type: 'notify',
        parameters: {
          recipients: ['data-quality-team'],
          message: 'Data quality issue detected',
        },
        order: 2,
      },
    ],
    timeout: 8,
    priority: 'medium',
    status: 'pending',
    order: 3,
  },
];

export const initializeSampleRules = (): BusinessRuleData[] => [
  {
    id: 'rule-001',
    name: 'Amount Range Validation',
    description: 'Validate transaction amounts are within acceptable range',
    category: 'validation',
    conditions: [
      {
        id: 'rule-cond-001',
        field: 'amount',
        operator: 'greater_than',
        value: 0,
      },
      {
        id: 'rule-cond-002',
        field: 'amount',
        operator: 'less_than',
        value: 100000000,
        logicalOperator: 'AND',
      },
    ],
    actions: [
      {
        id: 'rule-action-001',
        type: 'update_field',
        parameters: { field: 'validation_status', value: 'valid' },
        order: 1,
      },
    ],
    priority: 1,
    status: 'pending',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    executionCount: 1250,
    successRate: 98.5,
  },
  {
    id: 'rule-002',
    name: 'Category Auto-Assignment',
    description: 'Automatically assign categories based on description keywords',
    category: 'routing',
    conditions: [
      {
        id: 'rule-cond-003',
        field: 'description',
        operator: 'contains',
        value: 'operasional',
      },
    ],
    actions: [
      {
        id: 'rule-action-002',
        type: 'update_field',
        parameters: { field: 'category', value: 'operational' },
        order: 1,
      },
    ],
    priority: 2,
    status: 'pending',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    executionCount: 850,
    successRate: 95.2,
  },
];

export const initializeSampleInstances = (): WorkflowInstanceData[] => [
  {
    id: 'instance-001',
    workflowId: 'workflow-001',
    recordId: 'record-001',
    status: 'running',
    currentStep: 'step-002',
    steps: [
      {
        id: 'step-001',
        stepId: 'step-001',
        status: 'completed',
        startedAt: new Date('2024-01-15T10:00:00Z'),
        assignedTo: 'analyst-001',
      },
      {
        id: 'step-002',
        stepId: 'step-002',
        status: 'in_progress',
        startedAt: new Date('2024-01-15T11:00:00Z'),
        assignedTo: 'manager-001',
      },
    ],
    startedAt: new Date('2024-01-15T10:00:00Z'),
    assignedTo: 'analyst-001',
    priority: 'high',
    metadata: { amount: 15000000 },
  },
];

export const initializeSampleApprovals = (): ApprovalRequestData[] => [
  {
    id: 'approval-001',
    workflowInstanceId: 'instance-001',
    stepId: 'step-002',
    recordId: 'record-001',
    requestedBy: 'analyst-001',
    requestedAt: new Date('2024-01-15T11:00:00Z'),
    assignedTo: 'manager-001',
    status: 'pending',
    priority: 'high',
    dueDate: new Date('2024-01-16T11:00:00Z'),
    metadata: { amount: 15000000 },
  },
];

