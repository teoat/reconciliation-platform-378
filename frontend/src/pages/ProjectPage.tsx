import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Eye, Trash2, Search, Calendar, Users } from 'lucide-react';
import { Button, Card, StatusBadge, Modal } from '../components/ui';
import { ProjectInfo } from '../types/backend-aligned';
import { ApiService } from '../services/ApiService';
import { useToast } from '../hooks/useToast';
import { useForm } from '../hooks/useForm';
import { logger } from '../services/logger';

// Interfaces (shared with main index.tsx)
export interface PageConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  path: string;
  showStats?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  progress?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'range';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface ActionConfig {
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

// BasePage component (simplified for this extraction)
interface BasePageProps {
  config: PageConfig;
  stats?: StatsCard[];
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

const BasePage: React.FC<BasePageProps> = ({
  config,
  stats = [],
  filters = [],
  actions = [],
  children,
  loading = false,
  error = null,
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilterValues({});
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <div className="w-5 h-5 text-red-500 mr-2">⚠️</div>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <config.icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              {stat.trend && (
                <div className="mt-4 flex items-center">
                  {stat.trend.direction === 'up' ? (
                    <div className="w-4 h-4 text-green-500 mr-1">↑</div>
                  ) : stat.trend.direction === 'down' ? (
                    <div className="w-4 h-4 text-red-500 mr-1">↓</div>
                  ) : (
                    <div className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm text-gray-600">{stat.trend.value}</span>
                </div>
              )}
              {stat.progress !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stat.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-5 h-5 mr-2 text-blue-600">⚲</div>
              Filters
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">All {filter.label}</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type}
                      placeholder={filter.placeholder || filter.label}
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  )}
                </div>
              ))}
            </div>
            {Object.values(filterValues).some((v) => v !== '') && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center justify-end space-x-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              className={`${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
              } px-4 py-2 rounded-lg`}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
};

export const ProjectPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const createProjectForm = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validationRules: {
      name: {
        required: true,
        minLength: 3,
        maxLength: 100,
        custom: (value) => {
          if (value && typeof value === 'string' && value.trim().length > 0) {
            // Check for valid project name (alphanumeric, spaces, hyphens, underscores)
            const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
            if (!validNameRegex.test(value)) {
              return 'Project name can only contain letters, numbers, spaces, hyphens, and underscores';
            }
          }
          return null;
        },
      },
      description: {
        maxLength: 500,
      },
    },
    onSubmit: async (values) => {
      const newProject = await ApiService.createProject({
        name: (values.name as string).trim(),
        description: (values.description as string)?.trim() || undefined,
      });

      setProjects((prev) => [newProject as unknown as ProjectInfo, ...prev]);
      setShowCreateModal(false);
      createProjectForm.reset();
      toast.success('Project created successfully');
    },
  });
  const toast = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call when available
      const mockProjects: ProjectInfo[] = [
        {
          id: '1',
          name: 'Q4 Financial Reconciliation',
          description: 'Quarterly financial statement reconciliation',
          owner_id: 'user1',
          owner_email: 'user@example.com',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          job_count: 5,
          data_source_count: 3,
        },
        {
          id: '2',
          name: 'Inventory Audit',
          description: 'Monthly inventory reconciliation',
          owner_id: 'user1',
          owner_email: 'user@example.com',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          job_count: 2,
          data_source_count: 1,
        },
      ];
      setProjects(mockProjects);
    } catch (error) {
      logger.error('Failed to load projects', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Mock delete - replace with actual API call when available
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      logger.error('Failed to delete project', { error, projectId });
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const config: PageConfig = {
    title: 'Project Management',
    description: 'Manage your reconciliation projects',
    icon: FolderOpen,
    path: '/projects',
    showStats: true,
    showFilters: true,
    showActions: true,
  };

  const stats: StatsCard[] = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FolderOpen,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Active Projects',
      value: projects.filter((p) => p.status === 'active').length,
      icon: () => <div>✓</div>,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Pending Projects',
      value: projects.filter((p) => p.status === 'pending').length,
      icon: () => <div>⏳</div>,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Completed Projects',
      value: projects.filter((p) => p.status === 'completed').length,
      icon: () => <div>🎯</div>,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
  ];

  const handleCreateProject = async () => {
    await createProjectForm.handleSubmit();
  };

  const actions: ActionConfig[] = [
    {
      label: 'Create Project',
      icon: Plus,
      onClick: () => setShowCreateModal(true),
      variant: 'primary',
    },
  ];

  return (
    <BasePage config={config} stats={stats} filters={filters} actions={actions} loading={loading}>
      {/* Projects List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Projects ({filteredProjects.length})
            </h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No projects found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        )}
                      </div>
                      <StatusBadge status={project.status}>{project.status}</StatusBadge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {project.job_count || 0} jobs
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            /* Navigate to project */
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          /* Navigate to project */
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              id="project-name"
              type="text"
              value={String(createProjectForm.values.name || '')}
              onChange={(e) => createProjectForm.handleChange('name', e.target.value)}
              onBlur={() => createProjectForm.handleBlur('name')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                createProjectForm.errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter project name"
              required
            />
            {createProjectForm.errors.name && createProjectForm.touched.name && (
              <p className="text-sm text-red-600 mt-1">{createProjectForm.errors.name}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="project-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="project-description"
              value={String(createProjectForm.values.description || '')}
              onChange={(e) => createProjectForm.handleChange('description', e.target.value)}
              onBlur={() => createProjectForm.handleBlur('description')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                createProjectForm.errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter project description (optional)"
              rows={3}
            />
            {createProjectForm.errors.description && createProjectForm.touched.description && (
              <p className="text-sm text-red-600 mt-1">{createProjectForm.errors.description}</p>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={createProjectForm.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={createProjectForm.isSubmitting || !createProjectForm.isValid}
            >
              {createProjectForm.isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </BasePage>
  );
};
