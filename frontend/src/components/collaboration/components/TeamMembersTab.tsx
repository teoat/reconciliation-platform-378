// ============================================================================
// TEAM MEMBERS TAB COMPONENT
// ============================================================================

import React from 'react';
import { Search, Eye, MessageSquare } from 'lucide-react';
import type { TeamMember } from '../types';
import { getStatusColor, getRoleColor, filterMembers } from '../utils/helpers';

interface TeamMembersTabProps {
  members: TeamMember[];
  searchTerm: string;
  filterRole: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onFilterRoleChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onViewMember: (member: TeamMember) => void;
}

export const TeamMembersTab: React.FC<TeamMembersTabProps> = ({
  members,
  searchTerm,
  filterRole,
  filterStatus,
  onSearchChange,
  onFilterRoleChange,
  onFilterStatusChange,
  onViewMember,
}) => {
  const filteredMembers = filterMembers(members, searchTerm, filterRole, filterStatus);

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={(e) => onFilterRoleChange(e.target.value)}
          className="input-field"
          title="Filter by role"
          aria-label="Filter team members by role"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="analyst">Analyst</option>
          <option value="viewer">Viewer</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="input-field"
          title="Filter by status"
          aria-label="Filter team members by status"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="away">Away</option>
          <option value="busy">Busy</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative">
                <img
                  src={member.avatar || '/default-avatar.png'}
                  alt={member.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    member.status === 'online'
                      ? 'bg-green-500'
                      : member.status === 'away'
                        ? 'bg-yellow-500'
                        : member.status === 'busy'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900">{member.name}</h3>
                <p className="text-sm text-secondary-600">{member.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                {member.role}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Workload:</span>
                <span className="text-secondary-900">{member.workload}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Tasks Completed:</span>
                <span className="text-secondary-900">{member.performance.tasksCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Accuracy:</span>
                <span className="text-secondary-900">{member.performance.accuracy.toFixed(1)}%</span>
              </div>
            </div>

            {member.currentActivity && (
              <div className="mt-3 p-2 bg-secondary-50 rounded text-sm">
                <span className="text-secondary-600">Currently:</span>
                <span className="ml-2 text-secondary-900">{member.currentActivity}</span>
              </div>
            )}

            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => onViewMember(member)}
                className="btn-secondary text-sm flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
              <button className="btn-primary text-sm flex-1">
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

