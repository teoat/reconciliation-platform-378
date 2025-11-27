// ============================================================================
// WORKSPACES TAB COMPONENT
// ============================================================================

import React from 'react';
import { Building, Eye, Users } from 'lucide-react';
import type { Workspace } from '../types';

interface WorkspacesTabProps {
  workspaces: Workspace[];
  onViewWorkspace: (workspace: Workspace) => void;
}

export const WorkspacesTab: React.FC<WorkspacesTabProps> = ({ workspaces, onViewWorkspace }) => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-secondary-900">{workspace.name}</h3>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  workspace.settings.visibility === 'public'
                    ? 'bg-green-100 text-green-800'
                    : workspace.settings.visibility === 'private'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {workspace.settings.visibility}
              </span>
            </div>

            <p className="text-sm text-secondary-600 mb-3">{workspace.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-secondary-600">Members:</span>
                <span className="ml-2 text-secondary-900">{workspace.statistics.totalMembers}</span>
              </div>
              <div>
                <span className="text-secondary-600">Active:</span>
                <span className="ml-2 text-secondary-900">{workspace.statistics.activeMembers}</span>
              </div>
              <div>
                <span className="text-secondary-600">Tasks:</span>
                <span className="ml-2 text-secondary-900">{workspace.statistics.tasksCompleted}</span>
              </div>
              <div>
                <span className="text-secondary-600">Efficiency:</span>
                <span className="ml-2 text-secondary-900">
                  {workspace.statistics.averageEfficiency.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onViewWorkspace(workspace)}
                className="btn-secondary text-sm flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
              <button className="btn-primary text-sm flex-1">
                <Users className="w-4 h-4 mr-1" />
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

