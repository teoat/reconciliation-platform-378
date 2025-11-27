/**
 * Workflow Detail Modal Component
 */

import { X } from 'lucide-react';
import type { WorkflowData, WorkflowCondition, WorkflowAction } from '../types';
import { getStatusColor, getPriorityColor } from '../utils/formatters';

interface WorkflowDetailModalProps {
  workflow: WorkflowData;
  onClose: () => void;
}

export const WorkflowDetailModal = ({ workflow, onClose }: WorkflowDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-secondary-900">Workflow Details</h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-4">
              Workflow Information
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-secondary-600">Name</span>
                <span className="text-sm text-secondary-900">{workflow.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-secondary-600">Type</span>
                <span className="text-sm text-secondary-900">{workflow.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-secondary-600">Priority</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(workflow.priority)}`}
                >
                  {workflow.priority}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-secondary-600">Status</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workflow.status)}`}
                >
                  {workflow.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-secondary-600">Timeout</span>
                <span className="text-sm text-secondary-900">
                  {workflow.timeout || 'N/A'} hours
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-4">Description</h4>
            <p className="text-secondary-700">{workflow.description}</p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-semibold text-secondary-900 mb-4">Conditions</h4>
          <div className="space-y-2">
            {workflow.conditions.map((condition: WorkflowCondition) => (
              <div key={condition.id} className="p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-secondary-900">
                    {condition.field}
                  </span>
                  <span className="text-sm text-secondary-600">{condition.operator}</span>
                  <span className="text-sm text-secondary-900">{String(condition.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-semibold text-secondary-900 mb-4">Actions</h4>
          <div className="space-y-2">
            {workflow.actions.map((action: WorkflowAction) => (
              <div key={action.id} className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">{action.type}</span>
                  <span className="text-sm text-blue-700">
                    {JSON.stringify(action.parameters)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

