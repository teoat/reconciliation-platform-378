// ============================================================================
// UNIFIED PAGE SYSTEM - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  FolderOpen, Upload, GitCompare, CheckCircle, BarChart3, FileText,
  TrendingUp, TrendingDown, Clock, Users, Target, AlertCircle,
  Play, Filter, Download, Eye, Trash2, RefreshCw, Plus, Search,
  Calendar, PieChart, Printer
} from 'lucide-react'
import { useFrenly } from '../components/frenly/FrenlyProvider'
import { LoadingButton } from '../components/ui/LoadingSpinner'
import { Button, Input, Card, StatusBadge } from '../components/ui'
import { apiClient } from '../services/apiClient'
import { ProjectInfo } from '../types/backend-aligned'

// ============================================================================
// COMMON INTERFACES
// ============================================================================

export interface PageConfig {
  title: string
  description: string
  icon: React.ComponentType<any>
  path: string
  showStats?: boolean
  showFilters?: boolean
  showActions?: boolean
}

export interface StatsCard {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  progress?: number
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'text' | 'date' | 'range'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

export interface ActionConfig {
  label: string
  icon: React.ComponentType<any>
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

// ============================================================================
// BASE PAGE COMPONENT
// ============================================================================

interface BasePageProps {
  config: PageConfig
  stats?: StatsCard[]
  filters?: FilterConfig[]
  actions?: ActionConfig[]
  children: React.ReactNode
  loading?: boolean
  error?: string | null
}

export const BasePage: React.FC<BasePageProps> = ({
  config,
  stats = [],
  filters = [],
  actions = [],
  children,
  loading = false,
  error = null
}) => {
  const { updatePage } = useFrenly()
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})

  useEffect(() => {
    updatePage(config.path)
  }, [config.path, updatePage])

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilterValues({})
  }, [])

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
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    )
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
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : stat.trend.direction === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
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
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Filters
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filters.map(filter => (
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
                      {filter.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={filter.type}
                      placeholder={filter.placeholder || filter.label}
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>
            {Object.values(filterValues).some(v => v !== '') && (
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
            <LoadingButton
              key={index}
              loading={action.loading || false}
              onClick={action.onClick}
              className={`${
                action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                'bg-gray-600 text-white hover:bg-gray-700'
              } px-4 py-2 rounded-lg`}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </LoadingButton>
          ))}
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  )
}

// ============================================================================
// SPECIALIZED PAGE COMPONENTS
// ============================================================================

// Dashboard Page
export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getDashboardData()
      
      if (response.error) {
        setError(response.error.message)
      } else if (response.data) {
        setDashboardData(response.data)
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const config: PageConfig = {
    title: 'Smart Dashboard',
    description: 'AI-powered insights and project prioritization',
    icon: BarChart3,
    path: '/dashboard',
    showStats: true
  }

  const stats: StatsCard[] = dashboardData ? [
    {
      title: 'Productivity Score',
      value: `${Math.round(dashboardData.user_metrics?.overall_score * 100 || 0)}%`,
      icon: Target,
      color: 'bg-blue-100 text-blue-600',
      trend: {
        direction: dashboardData.user_metrics?.productivity_trend === 'increasing' ? 'up' : 'down',
        value: dashboardData.user_metrics?.productivity_trend || 'stable'
      }
    },
    {
      title: 'Completion Rate',
      value: `${Math.round(dashboardData.user_metrics?.project_completion_rate * 100 || 0)}%`,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      progress: dashboardData.user_metrics?.project_completion_rate * 100 || 0
    },
    {
      title: 'Avg Task Time',
      value: `${dashboardData.user_metrics?.average_task_time?.toFixed(1) || 0}h`,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Active Projects',
      value: dashboardData.prioritized_projects?.length || 0,
      icon: Users,
      color: 'bg-purple-100 text-purple-600'
    }
  ] : []

  return (
    <BasePage config={config} stats={stats} loading={loading} error={error}>
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prioritized Projects */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Prioritized Projects
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.prioritized_projects?.map((project: any) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          {Math.round(project.priority_score * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Priority Score</span>
                        <span>{Math.round(project.priority_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${project.priority_score * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {project.smart_recommendations?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {project.smart_recommendations.slice(0, 2).map((rec: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Insights & Next Actions */}
          <div className="space-y-6">
            {/* Smart Insights */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-green-600" />
                  Smart Insights
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.smart_insights?.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" />
                  Next Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {dashboardData.next_actions?.map((action: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </BasePage>
  )
}

// Projects Page
export const ProjectPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  
  useEffect(() => {
    loadProjects()
  }, [])
  
  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getProjects()
      if (response.data) {
        setProjects(response.data.projects || [])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateProject = async (projectData: { name: string; description?: string }) => {
    try {
      const response = await apiClient.createProject(projectData)
      if (response.data) {
        setProjects(prev => [...prev, response.data as unknown as ProjectInfo])
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }
  
  const handleDeleteProject = async (projectId: string) => {
    try {
      await apiClient.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }
  
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const config: PageConfig = {
    title: 'Project Management',
    description: 'Manage your reconciliation projects',
    icon: FolderOpen,
    path: '/projects',
    showStats: true,
    showFilters: true,
    showActions: true
  }

  const stats: StatsCard[] = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FolderOpen,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Active Projects',
      value: projects.filter(p => p.status === 'active').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Pending Projects',
      value: projects.filter(p => p.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Completed Projects',
      value: projects.filter(p => p.status === 'completed').length,
      icon: Target,
      color: 'bg-purple-100 text-purple-600'
    }
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'archived', label: 'Archived' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ]
    }
  ]

  const actions: ActionConfig[] = [
    {
      label: 'Create Project',
      icon: Plus,
      onClick: () => setShowCreateModal(true),
      variant: 'primary'
    }
  ]

  return (
    <BasePage 
      config={config} 
      stats={stats} 
      filters={filters} 
      actions={actions}
      loading={loading}
    >
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
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
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
              {filteredProjects.map(project => (
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
                          onClick={() => {/* Navigate to project */}}
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
                        onClick={() => {/* Navigate to project */}}
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
    </BasePage>
  )
}

// Ingestion Page
export const IngestionPage: React.FC = () => {
  const [files, setFiles] = useState<any[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)

  const config: PageConfig = {
    title: 'Data Ingestion',
    description: 'Upload and process your data files for reconciliation',
    icon: Upload,
    path: '/ingestion',
    showStats: true,
    showActions: true
  }

  const stats: StatsCard[] = [
    {
      title: 'Total Files',
      value: files.length,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Processed Files',
      value: files.filter(f => f.status === 'completed').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Processing Files',
      value: files.filter(f => f.status === 'processing').length,
      icon: RefreshCw,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Failed Files',
      value: files.filter(f => f.status === 'error').length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600'
    }
  ]

  const actions: ActionConfig[] = [
    {
      label: 'Upload Files',
      icon: Upload,
      onClick: () => {/* Handle file upload */},
      variant: 'primary'
    }
  ]

  return (
    <BasePage config={config} stats={stats} actions={actions}>
      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-600 mb-4">
              Support for CSV, Excel (.xlsx, .xls), and other data formats
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </label>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Uploaded Files ({files.length})
          </h2>
        </div>
        <div className="p-6">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">{file.name}</h3>
                        <p className="text-sm text-gray-600">
                          {file.size} • {file.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(file)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Delete file */}}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BasePage>
  )
}

// Reconciliation Page
export const ReconciliationPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const config: PageConfig = {
    title: 'Reconciliation',
    description: 'Match and compare records between systems',
    icon: GitCompare,
    path: '/reconciliation',
    showStats: true,
    showFilters: true,
    showActions: true
  }

  const stats: StatsCard[] = [
    {
      title: 'Total Records',
      value: records.length,
      icon: GitCompare,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Matched',
      value: records.filter(r => r.status === 'matched').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Unmatched',
      value: records.filter(r => r.status === 'unmatched').length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Discrepancies',
      value: records.filter(r => r.status === 'discrepancy').length,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600'
    }
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'matched', label: 'Matched' },
        { value: 'unmatched', label: 'Unmatched' },
        { value: 'discrepancy', label: 'Discrepancy' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      key: 'system',
      label: 'System',
      type: 'select',
      options: [
        { value: 'bank', label: 'Bank System' },
        { value: 'erp', label: 'ERP System' },
        { value: 'pos', label: 'POS System' }
      ]
    }
  ]

  const actions: ActionConfig[] = [
    {
      label: 'Start Reconciliation',
      icon: Play,
      onClick: () => {/* Start reconciliation */},
      variant: 'primary',
      loading: processing
    },
    {
      label: 'Export Results',
      icon: Download,
      onClick: () => {/* Export results */},
      variant: 'secondary'
    }
  ]

  return (
    <BasePage 
      config={config} 
      stats={stats} 
      filters={filters} 
      actions={actions}
      loading={loading}
    >
      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Reconciliation Records ({records.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.sourceSystem} → {record.targetSystem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.status}>{record.status}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* View details */}}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {record.status === 'unmatched' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Manual match */}}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BasePage>
  )
}

// Adjudication Page
export const AdjudicationPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const config: PageConfig = {
    title: 'Adjudication',
    description: 'Review and resolve discrepancies',
    icon: CheckCircle,
    path: '/adjudication',
    showStats: true,
    showFilters: true,
    showActions: true
  }

  const stats: StatsCard[] = [
    {
      title: 'Total Records',
      value: records.length,
      icon: CheckCircle,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Pending',
      value: records.filter(r => r.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Approved',
      value: records.filter(r => r.status === 'approved').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Rejected',
      value: records.filter(r => r.status === 'rejected').length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600'
    }
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'resolved', label: 'Resolved' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ]
    }
  ]

  const actions: ActionConfig[] = [
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: () => {/* Refresh data */},
      variant: 'secondary'
    },
    {
      label: 'Export',
      icon: Download,
      onClick: () => {/* Export data */},
      variant: 'secondary'
    }
  ]

  return (
    <BasePage 
      config={config} 
      stats={stats} 
      filters={filters} 
      actions={actions}
      loading={loading}
    >
      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Discrepancy Records ({records.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discrepancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.sourceSystem} → {record.targetSystem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.discrepancyAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.status}>{record.status}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.priority}>{record.priority}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {record.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* Approve */}}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* Reject */}}
                            className="text-red-600 hover:text-red-700"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BasePage>
  )
}

// Summary Page
export const SummaryPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  const config: PageConfig = {
    title: 'Summary & Export',
    description: 'Generate final reports and export reconciliation data',
    icon: FileText,
    path: '/summary',
    showStats: true,
    showActions: true
  }

  const stats: StatsCard[] = data ? [
    {
      title: 'Total Records',
      value: data.reconciliationSummary?.totalRecords || 0,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Matched',
      value: data.reconciliationSummary?.matchedRecords || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Unmatched',
      value: data.reconciliationSummary?.unmatchedRecords || 0,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Discrepancies',
      value: data.reconciliationSummary?.discrepancyRecords || 0,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600'
    }
  ] : []

  const actions: ActionConfig[] = [
    {
      label: 'Print',
      icon: Printer,
      onClick: () => window.print(),
      variant: 'secondary'
    },
    {
      label: 'Export',
      icon: Download,
      onClick: () => setShowExportModal(true),
      variant: 'secondary'
    }
  ]

  return (
    <BasePage 
      config={config} 
      stats={stats} 
      actions={actions}
      loading={loading}
    >
      {/* System Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">System Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matched
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unmatched
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.systemBreakdown?.map((system: any, index: number) => {
                const matchRate = (system.matched / system.records) * 100
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {system.system}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {system.records}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {system.matched}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {system.unmatched}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        matchRate >= 90 ? 'text-green-600' :
                        matchRate >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {matchRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations and Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Recommendations
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data?.recommendations?.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Next Steps
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {data?.nextSteps?.map((step: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BasePage>
  )
}

// Visualization Page
export const VisualizationPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChart, setSelectedChart] = useState('overview')

  const config: PageConfig = {
    title: 'Visualization',
    description: 'Analytics and insights for reconciliation data',
    icon: BarChart3,
    path: '/visualization',
    showStats: true,
    showActions: true
  }

  const stats: StatsCard[] = data ? [
    {
      title: 'Total Records',
      value: data.reconciliationStats?.totalRecords || 0,
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Matched',
      value: data.reconciliationStats?.matchedRecords || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Unmatched',
      value: data.reconciliationStats?.unmatchedRecords || 0,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Discrepancies',
      value: data.reconciliationStats?.discrepancyRecords || 0,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600'
    }
  ] : []

  const actions: ActionConfig[] = [
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: () => {/* Refresh data */},
      variant: 'secondary'
    },
    {
      label: 'Export',
      icon: Download,
      onClick: () => {/* Export charts */},
      variant: 'secondary'
    }
  ]

  return (
    <BasePage 
      config={config} 
      stats={stats} 
      actions={actions}
      loading={loading}
    >
      {/* Chart Selection */}
      <div className="flex items-center space-x-2">
        <Button
          variant={selectedChart === 'overview' ? 'primary' : 'ghost'}
          onClick={() => setSelectedChart('overview')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={selectedChart === 'systems' ? 'primary' : 'ghost'}
          onClick={() => setSelectedChart('systems')}
        >
          <PieChart className="w-4 h-4 mr-2" />
          Systems
        </Button>
        <Button
          variant={selectedChart === 'trends' ? 'primary' : 'ghost'}
          onClick={() => setSelectedChart('trends')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trends
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
            <div className="space-y-2">
              {data?.priorityDistribution?.map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color || '#3B82F6' }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Levels</h3>
            <div className="space-y-2">
              {data?.confidenceLevels?.map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color || '#3B82F6' }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Key Insights</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Match Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {data?.reconciliationStats ? 
                      ((data.reconciliationStats.matchedRecords / data.reconciliationStats.totalRecords) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discrepancy Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {data?.reconciliationStats ? 
                      ((data.reconciliationStats.discrepancyRecords / data.reconciliationStats.totalRecords) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Focus on high-priority discrepancies to improve overall accuracy</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">Consider automated matching for records with &gt;90% confidence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BasePage>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  BasePage,
  DashboardPage,
  ProjectPage,
  IngestionPage,
  ReconciliationPage,
  AdjudicationPage,
  SummaryPage,
  VisualizationPage
}