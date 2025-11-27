/**
 * Hook for workflow builder logic
 */

import { useState, useCallback } from 'react';
import type { WorkflowData } from '../types';
import { initializeSampleWorkflows } from '../utils/helpers';

export function useWorkflowBuilder() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>(initializeSampleWorkflows());
  const [isCreating, setIsCreating] = useState(false);

  const createWorkflow = useCallback(() => {
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
  }, [workflows.length]);

  return {
    workflows,
    setWorkflows,
    isCreating,
    createWorkflow,
  };
}

