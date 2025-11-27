// ============================================================================
// MEMBER DETAIL MODAL COMPONENT
// ============================================================================

import React from 'react';
import { X } from 'lucide-react';
import type { TeamMember } from '../types';
import { getRoleColor, getStatusColor } from '../utils/helpers';

interface MemberDetailModalProps {
  member: TeamMember;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-secondary-900">Member Details</h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
            title="Close member details"
            aria-label="Close member details"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={member.avatar || '/default-avatar.png'}
                alt={member.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <h4 className="text-xl font-semibold text-secondary-900">{member.name}</h4>
                <p className="text-secondary-600">{member.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-secondary-900 mb-2">Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-secondary-900 mb-2">Permissions</h5>
                <div className="flex flex-wrap gap-2">
                  {member.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-secondary-900 mb-4">Performance Metrics</h5>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-secondary-600">Tasks Completed</span>
                  <span className="text-sm font-semibold text-secondary-900">
                    {member.performance.tasksCompleted}
                  </span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((member.performance.tasksCompleted / 50) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-secondary-600">Accuracy</span>
                  <span className="text-sm font-semibold text-secondary-900">
                    {member.performance.accuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${member.performance.accuracy}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-secondary-600">Efficiency</span>
                  <span className="text-sm font-semibold text-secondary-900">
                    {member.performance.efficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${member.performance.efficiency}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-secondary-600">Collaboration</span>
                  <span className="text-sm font-semibold text-secondary-900">
                    {member.performance.collaboration.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${member.performance.collaboration}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

