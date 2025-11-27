/**
 * Approvals Tab Component
 */

import { CheckCircle, XCircle } from 'lucide-react';
import type { ApprovalRequestData } from '../types';
import { getStatusColor, getPriorityColor, formatCurrency } from '../utils/formatters';

interface ApprovalsTabProps {
  approvals: ApprovalRequestData[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const ApprovalsTab = ({ approvals, onApprove, onReject }: ApprovalsTabProps) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {approvals.map((request) => (
          <div key={request.id} className="border border-secondary-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">
                    Approval Request - {request.recordId}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Requested by: {request.requestedBy} •{' '}
                    {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}
                >
                  {request.status}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}
                >
                  {request.priority}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <span className="text-secondary-600">Assigned to:</span>
                <span className="ml-2 text-secondary-900">{request.assignedTo}</span>
              </div>
              <div>
                <span className="text-secondary-600">Due Date:</span>
                <span className="ml-2 text-secondary-900">
                  {request.dueDate
                    ? new Date(request.dueDate).toLocaleString()
                    : 'No due date'}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Amount:</span>
                <span className="ml-2 text-secondary-900">
                  {request.metadata.amount
                    ? formatCurrency(request.metadata.amount as number)
                    : 'N/A'}
                </span>
              </div>
            </div>
            {request.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onApprove(request.id)}
                  className="btn-primary text-sm flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  className="btn-secondary text-sm flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

