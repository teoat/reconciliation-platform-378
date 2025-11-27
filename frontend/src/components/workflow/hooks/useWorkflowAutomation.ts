/**
 * Workflow Automation Hook
 */

import { useState, useEffect } from 'react';
import type {
  WorkflowData,
  BusinessRuleData,
  WorkflowInstanceData,
  ApprovalRequestData,
  TabId,
} from '../types';
import {
  initializeSampleWorkflows,
  initializeSampleRules,
  initializeSampleInstances,
  initializeSampleApprovals,
} from '../utils/initializers';

export const useWorkflowAutomation = (onProgressUpdate?: (step: string) => void) => {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstanceData[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRuleData[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestData[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowData | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('workflows');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    initializeWorkflowAutomation();
    onProgressUpdate?.('workflow_automation_started');
  }, [onProgressUpdate]);

  const initializeWorkflowAutomation = () => {
    setWorkflows(initializeSampleWorkflows());
    setBusinessRules(initializeSampleRules());
    setWorkflowInstances(initializeSampleInstances());
    setApprovalRequests(initializeSampleApprovals());
  };

  const handleCreateWorkflow = () => {
    setIsCreating(true);
    setTimeout(() => {
      const newWorkflow: WorkflowData = {
        id: `workflow-${Date.now()}`,
        name: 'New Workflow',
        type: 'approve',
        description: 'New workflow description',
        conditions: [],
        actions: [],
        priority: 'medium',
        status: 'pending',
        order: workflows.length + 1,
      };
      setWorkflows((prev) => [...prev, newWorkflow]);
      setIsCreating(false);
    }, 1000);
  };

  const handleCreateRule = () => {
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
  };

  const handleApproveRequest = (requestId: string) => {
    setApprovalRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: 'approved' as const } : request
      )
    );
  };

  const handleRejectRequest = (requestId: string) => {
    setApprovalRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: 'rejected' as const } : request
      )
    );
  };

  return {
    workflows,
    workflowInstances,
    businessRules,
    approvalRequests,
    selectedWorkflow,
    showWorkflowModal,
    activeTab,
    isCreating,
    setSelectedWorkflow,
    setShowWorkflowModal,
    setActiveTab,
    handleCreateWorkflow,
    handleCreateRule,
    handleApproveRequest,
    handleRejectRequest,
  };
};

