'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EnhancedProject, ProjectTemplate } from '../../types/project';

interface ProjectFormModalProps {
  project?: EnhancedProject | null;
  templates: ProjectTemplate[];
  onSave: () => void;
  onClose: () => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  project,
  templates,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'draft',
    category: project?.category || 'financial',
    tags: project?.tags || [],
    priority: project?.priority || 'medium',
    department: project?.department || '',
    fiscalPeriod: project?.fiscalPeriod || '',
    complianceRequirements: project?.complianceRequirements || [],
    template: project?.template || null,
    estimatedDuration: project?.estimatedDuration || '',
    budget: project?.budget || 0,
  });

  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-name-input" className="block text-sm font-medium text-secondary-700 mb-2">
                Project Name *
              </label>
              <input
                id="project-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="project-category-select" className="block text-sm font-medium text-secondary-700 mb-2">Category</label>
              <select
                id="project-category-select"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as EnhancedProject['category'],
                  }))
                }
                className="input-field"
              >
                <option value="financial">Financial</option>
                <option value="inventory">Inventory</option>
                <option value="customer">Customer</option>
                <option value="payment">Payment</option>
                <option value="hr">HR</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="project-description-textarea" className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
            <textarea
              id="project-description-textarea"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              className="input-field"
              rows={3}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-status-select" className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
              <select
                id="project-status-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as EnhancedProject['status'],
                  }))
                }
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="project-priority-select" className="block text-sm font-medium text-secondary-700 mb-2">Priority</label>
              <select
                id="project-priority-select"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as EnhancedProject['priority'],
                  }))
                }
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Department and Fiscal Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-department-input" className="block text-sm font-medium text-secondary-700 mb-2">
                Department
              </label>
              <input
                id="project-department-input"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="Enter department"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="project-fiscal-period-input" className="block text-sm font-medium text-secondary-700 mb-2">
                Fiscal Period
              </label>
              <input
                id="project-fiscal-period-input"
                type="text"
                value={formData.fiscalPeriod}
                onChange={(e) => setFormData((prev) => ({ ...prev, fiscalPeriod: e.target.value }))}
                placeholder="e.g., Q4 2023"
                className="input-field"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="block text-sm font-medium text-secondary-700 mb-2" role="group" aria-label="Tags">Tags</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full flex items-center space-x-2"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <button onClick={addTag} className="btn-secondary">
                Add
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label htmlFor="project-template-select" className="block text-sm font-medium text-secondary-700 mb-2">
              Project Template
            </label>
            <select
              id="project-template-select"
              value={formData.template?.id || ''}
              onChange={(e) => {
                const template = templates.find((t) => t.id === e.target.value);
                setFormData((prev) => ({ ...prev, template: template || null }));
              }}
              className="input-field"
            >
              <option value="">No Template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>

          {/* Budget and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-estimated-duration-input" className="block text-sm font-medium text-secondary-700 mb-2">
                Estimated Duration
              </label>
              <input
                id="project-estimated-duration-input"
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, estimatedDuration: e.target.value }))
                }
                placeholder="e.g., 3 days"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="project-budget-input" className="block text-sm font-medium text-secondary-700 mb-2">
                Budget ($)
              </label>
              <input
                id="project-budget-input"
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0"
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!formData.name.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {project ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
