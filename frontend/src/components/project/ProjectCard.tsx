import React, { useState, memo, useMemo, useCallback } from 'react';
import { Edit, Archive, Copy, MoreVertical, Trash2, Activity } from 'lucide-react';
import { EnhancedProject } from '../../types/project';

// Enhanced Project Card Component
interface ProjectCardProps {
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

export const ProjectCard: React.FC<ProjectCardProps> = memo(
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
    const [showActions, setShowActions] = useState(false);

    // Memoize handlers to prevent unnecessary re-renders
    const handleToggleActions = useCallback(() => {
      setShowActions((prev) => !prev);
    }, []);

    const handleEditClick = useCallback(() => {
      onEdit();
      setShowActions(false);
    }, [onEdit]);

    const handleCloneClick = useCallback(() => {
      onClone();
      setShowActions(false);
    }, [onClone]);

    const handleArchiveClick = useCallback(() => {
      onArchive();
      setShowActions(false);
    }, [onArchive]);

    const handleDeleteClick = useCallback(() => {
      onDelete();
      setShowActions(false);
    }, [onDelete]);

    // Memoize computed values
    const statusColor = useMemo(
      () => getStatusColor(project.status),
      [project.status, getStatusColor]
    );
    const priorityColor = useMemo(
      () => getPriorityColor(project.priority),
      [project.priority, getPriorityColor]
    );
    const categoryIcon = useMemo(
      () => getCategoryIcon(project.category),
      [project.category, getCategoryIcon]
    );

    // Memoize card classes
    const cardClasses = useMemo(
      () =>
        `card hover:shadow-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`,
      [isSelected]
    );

    return (
      <div className={cardClasses}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="rounded border-secondary-300"
            />
            <div className="p-2 bg-primary-100 rounded-lg">
              <span className="text-lg">{categoryIcon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 mb-1 line-clamp-1">{project.name}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColor}`}>
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {project.alerts.length > 0 && (
              <div className="flex items-center space-x-1">
                {project.alerts.map((alert, index) => (
                  <div key={index} title={alert.message}>
                    {getAlertIcon(alert.type)}
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <button
                onClick={handleToggleActions}
                className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 bg-white border border-secondary-200 rounded-lg shadow-lg z-10 min-w-48">
                  <div className="py-1">
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleCloneClick}
                      className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Clone</span>
                    </button>
                    <button
                      onClick={handleArchiveClick}
                      className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-secondary-600 text-sm mb-4 line-clamp-2">{project.description}</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary-700">Progress</span>
            <span className="text-sm text-secondary-600">
              {project.progress.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress.completionPercentage}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-secondary-500">
            {project.progress.currentStep.charAt(0).toUpperCase() +
              project.progress.currentStep.slice(1)}
          </div>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-full">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <div className="text-secondary-600">Records</div>
            <div className="font-medium">{project.recordCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-secondary-600">Match Rate</div>
            <div className="font-medium">{project.matchRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-secondary-600">Department</div>
            <div className="font-medium">{project.department || 'N/A'}</div>
          </div>
          <div>
            <div className="text-secondary-600">Budget</div>
            <div className="font-medium">
              {project.budget ? `$${project.budget.toLocaleString()}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div className="mb-4 pt-4 border-t border-secondary-200">
          <div className="flex items-center space-x-2 text-sm text-secondary-500">
            <Activity className="w-4 h-4" />
            <span className="truncate">
              {project.lastActivity.user}: {project.lastActivity.action}
            </span>
          </div>
          <div className="text-xs text-secondary-400 mt-1">
            {new Date(project.lastActivity.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button onClick={onSelect} className="flex-1 btn-primary text-sm">
            Open Project
          </button>
          <button onClick={handleToggleActions} className="btn-secondary p-2">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
