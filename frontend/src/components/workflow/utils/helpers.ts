/**
 * Helper utilities for workflow automation
 */

import type { WorkflowData, BusinessRuleData, WorkflowInstanceData, ApprovalRequestData } from '../types';

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'running':
    case 'pending':
      return 'bg-green-100 text-green-800';
    case 'inactive':
    case 'completed':
    case 'approved':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'paused':
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'skipped':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Initialize sample workflows
 */
export function initializeSampleWorkflows(): WorkflowData[] {
  return [
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
}

/**
 * Initialize sample business rules
 */
export function initializeSampleRules(): BusinessRuleData[] {
  return [
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
      executionCount: 890,
      successRate: 95.2,
    },
  ];
}

/**
 * Initialize sample workflow instances
 */
export function initializeSampleInstances(): WorkflowInstanceData[] {
  return [
    {
      id: 'instance-001',
      workflowId: 'workflow-001',
      recordId: 'REC-2023-001',
      status: 'running',
      currentStep: 'step-001',
      steps: [
        {
          id: 'step-instance-001',
          stepId: 'step-001',
          status: 'in_progress',
          startedAt: '2024-01-20T10:00:00Z',
          assignedTo: 'finance-manager',
        },
      ],
      startedAt: '2024-01-20T10:00:00Z',
      assignedTo: 'finance-manager',
      priority: 'high',
      metadata: { amount: 15000000, description: 'High value transaction' },
    },
  ];
}

/**
 * Initialize sample approval requests
 */
export function initializeSampleApprovals(): ApprovalRequestData[] {
  return [
    {
      id: 'approval-001',
      workflowInstanceId: 'instance-001',
      stepId: 'step-001',
      recordId: 'REC-2023-001',
      requestedBy: 'system',
      requestedAt: '2024-01-20T10:00:00Z',
      assignedTo: 'finance-manager',
      status: 'pending',
      priority: 'high',
      dueDate: new Date('2024-01-21T10:00:00Z'),
      metadata: { amount: 15000000, description: 'High value transaction' },
    },
  ];
}

