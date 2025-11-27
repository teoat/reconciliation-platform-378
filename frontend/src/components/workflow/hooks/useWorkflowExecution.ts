/**
 * Hook for workflow execution logic
 */

import { useState, useCallback } from 'react';
import type {
  WorkflowInstanceData,
  BusinessRuleData,
  ApprovalRequestData,
} from '../types';
import {
  initializeSampleInstances,
  initializeSampleRules,
  initializeSampleApprovals,
} from '../utils/helpers';

export function useWorkflowExecution() {
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstanceData[]>(
    initializeSampleInstances()
  );
  const [businessRules, setBusinessRules] = useState<BusinessRuleData[]>(
    initializeSampleRules()
  );
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestData[]>(
    initializeSampleApprovals()
  );
  const [isCreating, setIsCreating] = useState(false);

  const createRule = useCallback(() => {
    setIsCreating(true);
    setTimeout(() => {
      const newRule: BusinessRuleData = {
        id: `rule-${Date.now()}`,
        name: 'New Business Rule',
        description: 'New business rule description',
        category: 'validation',
        conditions: [],
        actions: [],
        priority: 1,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        executionCount: 0,
        successRate: 0,
      };
      setBusinessRules((prev) => [...prev, newRule]);
      setIsCreating(false);
    }, 1000);
  }, []);

  const approveRequest = useCallback((requestId: string) => {
    setApprovalRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: 'approved' as const } : request
      )
    );
  }, []);

  const rejectRequest = useCallback((requestId: string) => {
    setApprovalRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: 'rejected' as const } : request
      )
    );
  }, []);

  return {
    workflowInstances,
    businessRules,
    approvalRequests,
    isCreating,
    createRule,
    approveRequest,
    rejectRequest,
  };
}

