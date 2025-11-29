'use client';

import React, { memo } from 'react';
import { EnhancedProject } from '@/types/project/index';

interface ProjectTableRowProps {
  project: EnhancedProject;
  isSelected: boolean;
  onSelect: () => void;
  onToggleSelection: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onClone: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getCategoryIcon: (category: string) => string;
  getAlertIcon?: (type: string) => React.ReactNode;
}

export const ProjectTableRow: React.FC<ProjectTableRowProps> = memo(
  ({
    project,
    isSelected,
    onSelect,
    onToggleSelection,
    onEdit,
    onDelete,
    onArchive,
    onClone,
    getStatusColor,
    getPriorityColor,
    getCategoryIcon,
    getAlertIcon: _getAlertIcon,
  }) => {
    return (
      <tr className="border-b border-secondary-100 hover:bg-secondary-50">
        <td className="py-4 px-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="rounded border-secondary-300"
            aria-label={`Select project ${project.name}`}
            title={`Select project ${project.name}`}
          />
        </td>

        <td className="py-4 px-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getCategoryIcon(project.category || 'custom')}</span>
            <div>
              <div className="font-medium text-secondary-900">{project.name}</div>
              <div className="text-sm text-secondary-500">{project.description}</div>
            </div>
          </div>
        </td>

        <td className="py-4 px-4">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </td>

        <td className="py-4 px-4">
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-secondary-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress?.completionPercentage || 0}%` }}
              />
            </div>
            <span className="text-sm text-secondary-600">
              {project.progress?.completionPercentage || 0}%
            </span>
          </div>
        </td>

        <td className="py-4 px-4">
          {project.priority && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}
            >
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </span>
          )}
        </td>

        <td className="py-4 px-4">
          <span className="text-sm text-secondary-600">{project.department || 'N/A'}</span>
        </td>

        <td className="py-4 px-4">
          <div className="text-sm">
            {typeof project.lastActivity === 'object' && 'user' in project.lastActivity ? (
              <>
                <div className="text-secondary-900">{project.lastActivity.user}</div>
                <div className="text-secondary-500">{project.lastActivity.action}</div>
                <div className="text-xs text-secondary-400">
                  {new Date(project.lastActivity.timestamp).toLocaleDateString()}
                </div>
              </>
            ) : (
              <div className="text-secondary-500">
                {typeof project.lastActivity === 'string' || project.lastActivity instanceof Date
                  ? new Date(project.lastActivity).toLocaleDateString()
                  : 'No recent activity'}
              </div>
            )}
          </div>
        </td>

        <td className="py-4 px-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={onSelect}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Open
            </button>
            <button
              onClick={onEdit}
              className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={onClone}
              className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
            >
              Clone
            </button>
            <button
              onClick={onArchive}
              className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
            >
              Archive
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  }
);

ProjectTableRow.displayName = 'ProjectTableRow';
