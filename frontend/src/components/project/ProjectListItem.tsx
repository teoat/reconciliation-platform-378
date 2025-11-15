import React, { memo } from 'react';
import { Edit, Archive, Copy, Trash2 } from 'lucide-react';
import { EnhancedProject } from '../../types/project';

// Project List Item Component
interface ProjectListItemProps {
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

export const ProjectListItem: React.FC<ProjectListItemProps> = memo(
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
      <div
        className={`card hover:shadow-md transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="rounded border-secondary-300"
            />

            <div className="p-2 bg-primary-100 rounded-lg">
              <span className="text-lg">{getCategoryIcon(project.category)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-secondary-900 truncate">{project.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}
                >
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </span>
              </div>
              <p className="text-secondary-600 text-sm mb-2 line-clamp-1">{project.description}</p>
              <div className="flex items-center space-x-4 text-sm text-secondary-500">
                <span>{project.recordCount.toLocaleString()} records</span>
                <span>{project.matchRate.toFixed(1)}% match rate</span>
                <span>{project.department || 'No department'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-secondary-900">
                  {project.progress.completionPercentage}%
                </div>
                <div className="text-xs text-secondary-500">{project.progress.currentStep}</div>
              </div>

              <div className="w-16 bg-secondary-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress.completionPercentage}%` }}
                />
              </div>

              {project.alerts.length > 0 && (
                <div className="flex items-center space-x-1">
                  {project.alerts.map((alert, index) => (
                    <div key={index} title={alert.message}>
                      {getAlertIcon(alert.type)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button onClick={onSelect} className="btn-primary text-sm">
              Open
            </button>
            <button onClick={onEdit} className="btn-secondary p-2">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={onClone} className="btn-secondary p-2">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={onArchive} className="btn-secondary p-2">
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="btn-secondary p-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ProjectListItem.displayName = 'ProjectListItem';
