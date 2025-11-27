/**
 * Workflow Executor Component - UI for viewing workflow instances
 */

import { Activity } from 'lucide-react';
import type { WorkflowInstanceData, WorkflowData } from '../types';
import { getStatusColor, getPriorityColor } from '../utils/helpers';

interface WorkflowExecutorProps {
  instances: WorkflowInstanceData[];
  workflows: WorkflowData[];
}

export const WorkflowExecutor = ({ instances, workflows }: WorkflowExecutorProps) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {instances.map((instance) => (
          <div key={instance.id} className="border border-secondary-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">
                    Instance - {instance.recordId}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Workflow:{' '}
                    {workflows.find((w) => w.id === instance.workflowId)?.name || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(instance.status)}`}
                >
                  {instance.status}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(instance.priority)}`}
                >
                  {instance.priority}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Started:</span>
                <span className="ml-2 text-secondary-900">
                  {instance.startedAt
                    ? new Date(instance.startedAt).toLocaleString()
                    : 'Not started'}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Assigned to:</span>
                <span className="ml-2 text-secondary-900">
                  {instance.assignedTo || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Current Step:</span>
                <span className="ml-2 text-secondary-900">{instance.currentStep}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

