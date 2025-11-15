'use client';

import React, { memo } from 'react';
import { Edit } from 'lucide-react';
import { Archive } from 'lucide-react';
import { Copy } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { EnhancedProject } from '../../types/project';

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
  getAlertIcon: (type: string) => React.ReactNode;
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
    getAlertIcon,
  }) => {
    return (
      <tr className="border-b border-secondary-100 hover:bg-secondary-50">
        <td className="py-4 px-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="rounded border-secondary-300"
          />
        </td>

        <td className="py-4 px-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getCategoryIcon(project.category)}</span>
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
                style={{ width: `${project.progress.completionPercentage}%` }}
              />
            </div>
            <span className="text-sm text-secondary-600">
              {project.progress.completionPercentage}%
            </span>
          </div>
        </td>

        <td className="py-4 px-4">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}
          >
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
          </span>
        </td>

        <td className="py-4 px-4">
          <span className="text-sm text-secondary-600">{project.department || 'N/A'}</span>
        </td>

        <td className="py-4 px-4">
          <div className="text-sm">
            <div className="text-secondary-900">{project.lastActivity.user}</div>
            <div className="text-secondary-500">{project.lastActivity.action}</div>
            <div className="text-xs text-secondary-400">
              {new Date(project.lastActivity.timestamp).toLocaleDateString()}
            </div>
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
