// ============================================================================
// ASSIGNMENTS TAB COMPONENT
// ============================================================================

import React from 'react';
import { UserCheck, Eye, MessageSquare } from 'lucide-react';
import type { Assignment, TeamMember } from '../types';
import { getPriorityColor } from '../utils/helpers';

interface AssignmentsTabProps {
  assignments: Assignment[];
  teamMembers: TeamMember[];
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({ assignments, teamMembers }) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="border border-secondary-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">
                    Assignment - {assignment.recordId}
                  </h3>
                  <p className="text-sm text-secondary-600">{assignment.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(assignment.priority)}`}>
                  {assignment.priority}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    assignment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : assignment.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : assignment.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {assignment.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="text-secondary-600">Assigned to:</span>
                <span className="ml-2 text-secondary-900">
                  {teamMembers.find((m) => m.id === assignment.assignedTo)?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Due Date:</span>
                <span className="ml-2 text-secondary-900">
                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Assigned by:</span>
                <span className="ml-2 text-secondary-900">
                  {teamMembers.find((m) => m.id === assignment.assignedBy)?.name || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="btn-primary text-sm flex-1">
                <Eye className="w-4 h-4 mr-1" />
                View Record
              </button>
              <button className="btn-secondary text-sm flex-1">
                <MessageSquare className="w-4 h-4 mr-1" />
                Add Comment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

