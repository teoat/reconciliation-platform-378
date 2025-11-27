/**
 * Workflow Builder Component - UI for building workflows
 */

import { Workflow, Settings } from 'lucide-react';
import type { WorkflowData } from '../types';
import { getStatusColor, getPriorityColor } from '../utils/helpers';

interface WorkflowBuilderProps {
  workflows: WorkflowData[];
  onWorkflowSelect: (workflow: WorkflowData) => void;
  onCreateWorkflow: () => void;
  isCreating: boolean;
}

export const WorkflowBuilder = ({
  workflows,
  onWorkflowSelect,
  onCreateWorkflow,
  isCreating,
}: WorkflowBuilderProps) => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Workflow className="w-4 h-4" />
                <h3 className="font-semibold text-secondary-900">{workflow.name}</h3>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}
              >
                {workflow.status}
              </span>
            </div>
            <p className="text-sm text-secondary-600 mb-3">{workflow.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(workflow.priority)}`}
              >
                {workflow.priority}
              </span>
              <button
                onClick={() => onWorkflowSelect(workflow)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={onCreateWorkflow}
          disabled={isCreating}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
        >
          <Settings className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>
    </div>
  );
};

