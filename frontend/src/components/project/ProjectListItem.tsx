import React, { memo } from 'react';
import { Edit, Archive, Copy, Trash2 } from 'lucide-react';
import { EnhancedProject } from '@/types/project/index';

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
              aria-label={`Select project ${project.name}`}
              title={`Select project ${project.name}`}
            />

            <div className="p-2 bg-primary-100 rounded-lg">
              <span className="text-lg">{getCategoryIcon(project.category || 'custom')}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-secondary-900 truncate">{project.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                {project.priority && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}
                  >
                    {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                  </span>
                )}
              </div>
              <p className="text-secondary-600 text-sm mb-2 line-clamp-1">{project.description}</p>
              <div className="flex items-center space-x-4 text-sm text-secondary-500">
                <span>{(project.recordCount || 0).toLocaleString()} records</span>
                <span>{(project.matchRate || 0).toFixed(1)}% match rate</span>
                <span>{project.department || 'No department'}</span>
              </div>
            </div>

            {project.progress && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-secondary-900">
                    {project.progress.completionPercentage || 0}%
                  </div>
                  <div className="text-xs text-secondary-500">{project.progress.currentStep || 'N/A'}</div>
                </div>

                <div className="w-16 bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress.completionPercentage || 0}%` }}
                  />
                </div>

                {project.alerts && project.alerts.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {project.alerts.map((alert, index) => (
                      <div key={index} title={alert.message}>
                        {getAlertIcon(alert.type)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button 
              onClick={onSelect} 
              className="btn-primary text-sm"
              aria-label={`Open project ${project.name}`}
              title={`Open project ${project.name}`}
            >
              Open
            </button>
            <button 
              onClick={onEdit} 
              className="btn-secondary p-2"
              aria-label={`Edit project ${project.name}`}
              title={`Edit project ${project.name}`}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={onClone} 
              className="btn-secondary p-2"
              aria-label={`Clone project ${project.name}`}
              title={`Clone project ${project.name}`}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={onArchive} 
              className="btn-secondary p-2"
              aria-label={`Archive project ${project.name}`}
              title={`Archive project ${project.name}`}
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="btn-secondary p-2 text-red-600 hover:text-red-700"
              aria-label={`Delete project ${project.name}`}
              title={`Delete project ${project.name}`}
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
