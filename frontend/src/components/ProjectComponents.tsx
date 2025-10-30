'use client'

import { useState } from 'react'
import {
  FolderOpen,
  Edit,
  Archive,
  Copy,
  MoreVertical,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  Layers,
  X
} from 'lucide-react'
import { EnhancedProject, ProjectTemplate, ProjectAnalytics, ProjectFilters } from '../types/project'

// Enhanced Project Card Component
interface ProjectCardProps {
  project: EnhancedProject
  isSelected: boolean
  onSelect: () => void
  onToggleSelection: () => void
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onClone: () => void
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
  getCategoryIcon: (category: string) => string
  getAlertIcon: (type: string) => React.ReactNode
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
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
  getAlertIcon
}) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`card hover:shadow-lg transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      }`}
    >
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
            <span className="text-lg">{getCategoryIcon(project.category)}</span>
          </div>
          <div>
            <h3 className="font-semibold text-secondary-900 mb-1 line-clamp-1">
              {project.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
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
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-8 bg-white border border-secondary-200 rounded-lg shadow-lg z-10 min-w-48">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onEdit()
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      onClone()
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Clone</span>
                  </button>
                  <button
                    onClick={() => {
                      onArchive()
                      setShowActions(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive</span>
                  </button>
                  <button
                    onClick={() => {
                      onDelete()
                      setShowActions(false)
                    }}
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
      <p className="text-secondary-600 text-sm mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary-700">Progress</span>
          <span className="text-sm text-secondary-600">{project.progress.completionPercentage}%</span>
        </div>
        <div className="w-full bg-secondary-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress.completionPercentage}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-secondary-500">
          {project.progress.currentStep.charAt(0).toUpperCase() + project.progress.currentStep.slice(1)}
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
        <button
          onClick={onSelect}
          className="flex-1 btn-primary text-sm"
        >
          Open Project
        </button>
        <button
          onClick={() => setShowActions(!showActions)}
          className="btn-secondary p-2"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Project List Item Component
interface ProjectListItemProps extends ProjectCardProps {}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
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
  getAlertIcon
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
              <h3 className="font-semibold text-secondary-900 truncate">
                {project.name}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
              </span>
            </div>
            <p className="text-secondary-600 text-sm mb-2 line-clamp-1">
              {project.description}
            </p>
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
              <div className="text-xs text-secondary-500">
                {project.progress.currentStep}
              </div>
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
          <button
            onClick={onSelect}
            className="btn-primary text-sm"
          >
            Open
          </button>
          <button
            onClick={onEdit}
            className="btn-secondary p-2"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onClone}
            className="btn-secondary p-2"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onArchive}
            className="btn-secondary p-2"
          >
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
  )
}

// Project Table Row Component
interface ProjectTableRowProps extends ProjectCardProps {}

export const ProjectTableRow: React.FC<ProjectTableRowProps> = ({
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
  getAlertIcon
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
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
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
          <span className="text-sm text-secondary-600">{project.progress.completionPercentage}%</span>
        </div>
      </td>
      
      <td className="py-4 px-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
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
  )
}

// Project Form Modal Component
interface ProjectFormModalProps {
  project?: EnhancedProject | null
  templates: ProjectTemplate[]
  onSave: () => void
  onClose: () => void
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  project,
  templates,
  onSave,
  onClose
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
    budget: project?.budget || 0
  })

  const [newTag, setNewTag] = useState('')

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            {project ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
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
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              className="input-field"
              rows={3}
            />
          </div>
          
          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
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
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Enter department"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Fiscal Period
              </label>
              <input
                type="text"
                value={formData.fiscalPeriod}
                onChange={(e) => setFormData(prev => ({ ...prev, fiscalPeriod: e.target.value }))}
                placeholder="e.g., Q4 2023"
                className="input-field"
              />
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Tags
            </label>
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
              <button
                onClick={addTag}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
          </div>
          
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Project Template
            </label>
            <select
              value={formData.template?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value)
                setFormData(prev => ({ ...prev, template: template || null }))
              }}
              className="input-field"
            >
              <option value="">No Template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          </div>
          
          {/* Budget and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                placeholder="e.g., 3 days"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="input-field"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
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
  )
}

// Template Modal Component
interface TemplateModalProps {
  templates: ProjectTemplate[]
  onSelect: (template: ProjectTemplate) => void
  onClose: () => void
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  templates,
  onSelect,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            Choose Project Template
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div
                key={template.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelect(template)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-lg bg-${template.color}-100`}>
                    <span className="text-2xl">{template.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${template.color}-100 text-${template.color}-800`}>
                      {template.complexity}
                    </span>
                  </div>
                </div>
                
                <p className="text-secondary-600 text-sm mb-4">{template.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-secondary-400" />
                    <span className="text-secondary-600">{template.estimatedDuration}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-secondary-400" />
                    <span className="text-secondary-600">{template.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Modal Component
interface AnalyticsModalProps {
  analytics: ProjectAnalytics
  projects: EnhancedProject[]
  onClose: () => void
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  analytics,
  projects,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            Project Analytics Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Total Projects</p>
                  <p className="text-2xl font-bold text-secondary-900">{analytics.totalProjects}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Active Projects</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.activeProjects}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Completed This Month</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.completedThisMonth}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.successRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
          
          {/* Category Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Projects by Category</h3>
            <div className="space-y-3">
              {Object.entries(analytics.categoryDistribution).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-secondary-700 capitalize">{category}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(count / analytics.totalProjects) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-secondary-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Team Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Team Performance</h3>
            <div className="space-y-4">
              {analytics.teamPerformance.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <div>
                    <div className="font-medium text-secondary-900">{member.user}</div>
                    <div className="text-sm text-secondary-600">
                      {member.projectsCompleted} projects completed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-secondary-900">
                      {member.averageTime} days avg
                    </div>
                    <div className="text-sm text-secondary-600">completion time</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Filters Modal Component
interface FiltersModalProps {
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  onClose: () => void
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = (key: keyof ProjectFilters, value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            Advanced Filters
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">
              Status
            </label>
            <div className="space-y-2">
              {(['draft', 'active', 'completed', 'archived'] as const).map(status => (
                <label key={status} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => toggleArrayFilter('status', status as any)}
                    className="rounded border-secondary-300"
                  />
                  <span className="text-sm text-secondary-700 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">
              Category
            </label>
            <div className="space-y-2">
              {['financial', 'inventory', 'customer', 'payment', 'hr', 'custom'].map(category => (
                <label key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={() => toggleArrayFilter('category', category)}
                    className="rounded border-secondary-300"
                  />
                  <span className="text-sm text-secondary-700 capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">
              Priority
            </label>
            <div className="space-y-2">
              {['low', 'medium', 'high', 'urgent'].map(priority => (
                <label key={priority} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(priority)}
                    onChange={() => toggleArrayFilter('priority', priority)}
                    className="rounded border-secondary-300"
                  />
                  <span className="text-sm text-secondary-700 capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200">
          <button
            onClick={() => onFiltersChange({
              searchTerm: '',
              status: [],
              category: [],
              tags: [],
              createdBy: [],
              dateRange: { start: '', end: '' },
              priority: [],
              department: []
            })}
            className="btn-secondary"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
