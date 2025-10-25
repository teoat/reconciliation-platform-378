import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Upload, 
  FileText, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  BarChart3,
  Users,
  Clock,
  Download
} from 'lucide-react'
import { useProject } from '../hooks/useApi'
import { useDataSources } from '../hooks/useApi'
import { useReconciliationJobs } from '../hooks/useApi'
import { useReconciliationMatches } from '../hooks/useApi'
import { FileDropzone } from '../components/EnhancedDropzone'
import { DataTable, Column } from '../components/ui/DataTable'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MetricCard } from '../components/ui/MetricCard'

interface ReconciliationPageProps {}

const ReconciliationPage: React.FC<ReconciliationPageProps> = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  // Hooks
  const { project, isLoading: projectLoading } = useProject(projectId || null)
  const { dataSources, uploadFile, processFile, isLoading: dataSourcesLoading } = useDataSources(projectId || null)
  const { jobs, createJob, startJob, isLoading: jobsLoading } = useReconciliationJobs(projectId || null)
  const { matches, isLoading: matchesLoading } = useReconciliationMatches(projectId || null)
  
  // State
  const [activeTab, setActiveTab] = useState<'upload' | 'configure' | 'run' | 'results'>('upload')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [reconciliationSettings, setReconciliationSettings] = useState({
    matchingThreshold: 0.8,
    autoApprove: false,
    notificationEmail: '',
    dataSourceMapping: {}
  })

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        const result = await uploadFile(
          file,
          projectId!,
          file.name,
          'reconciliation_data'
        )
        
        if (result.success) {
          // Process the file after upload
          await processFile(result.dataSource.id)
        }
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
    setShowUploadModal(false)
  }

  // Start reconciliation job
  const handleStartReconciliation = async () => {
    if (!projectId) return
    
    const result = await createJob({
      project_id: projectId,
      settings: reconciliationSettings,
      status: 'pending'
    })
    
    if (result.success && result.job) {
      await startJob(result.job.id)
    }
  }

  // Data table columns for data sources
  const dataSourceColumns: Column<any>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'source_type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <StatusBadge 
          status={value === 'reconciliation_data' ? 'active' : 'inactive'}
          variant="outline"
        >
          {value}
        </StatusBadge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge 
          status={value === 'processed' ? 'active' : value === 'processing' ? 'warning' : 'inactive'}
        >
          {value}
        </StatusBadge>
      )
    },
    {
      key: 'created_at',
      label: 'Uploaded',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => processFile(row.id)}
            disabled={row.status === 'processing'}
          >
            Process
          </Button>
        </div>
      )
    }
  ]

  // Data table columns for reconciliation jobs
  const jobColumns: Column<any>[] = [
    {
      key: 'id',
      label: 'Job ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value.slice(0, 8)}...</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge 
          status={value === 'completed' ? 'active' : value === 'running' ? 'warning' : 'inactive'}
        >
          {value}
        </StatusBadge>
      )
    },
    {
      key: 'created_at',
      label: 'Started',
      sortable: true,
      render: (value) => new Date(value).toLocaleString()
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${row.status === 'completed' ? 100 : value || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {row.status === 'completed' ? '100%' : `${value || 0}%`}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          {row.status === 'pending' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => startJob(row.id)}
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {row.status === 'running' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {/* Pause job */}}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {row.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}/results/${row.id}`)}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              View Results
            </Button>
          )}
        </div>
      )
    }
  ]

  // Data table columns for matches
  const matchColumns: Column<any>[] = [
    {
      key: 'id',
      label: 'Match ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value.slice(0, 8)}...</span>
      )
    },
    {
      key: 'confidence_score',
      label: 'Confidence',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                value >= 0.8 ? 'bg-green-500' : 
                value >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${value * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {Math.round(value * 100)}%
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge 
          status={value === 'approved' ? 'active' : value === 'pending' ? 'warning' : 'inactive'}
        >
          {value}
        </StatusBadge>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {/* View match details */}}
          >
            View Details
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {/* Approve match */}}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {/* Reject match */}}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reconciliation data...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <Button onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
              >
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Reconciliation Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'upload', label: 'Upload Data', icon: Upload },
              { id: 'configure', label: 'Configure', icon: Settings },
              { id: 'run', label: 'Run Jobs', icon: Play },
              { id: 'results', label: 'Results', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2 inline" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Data Sources"
                value={dataSources.length}
                icon={FileText}
                trend="+2 this week"
              />
              <MetricCard
                title="Processed Files"
                value={dataSources.filter(ds => ds.status === 'processed').length}
                icon={CheckCircle}
                trend="+1 today"
              />
              <MetricCard
                title="Active Jobs"
                value={jobs.filter(job => job.status === 'running').length}
                icon={Clock}
                trend="2 running"
              />
              <MetricCard
                title="Total Matches"
                value={matches.length}
                icon={Users}
                trend="+15 this week"
              />
            </div>

            {/* Data Sources Table */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Data Sources</h3>
                  <Button
                    variant="primary"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
                <DataTable
                  data={dataSources}
                  columns={dataSourceColumns}
                  emptyMessage="No data sources uploaded yet"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Configure Tab */}
        {activeTab === 'configure' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Reconciliation Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matching Threshold
                    </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={reconciliationSettings.matchingThreshold}
                    onChange={(e) => setReconciliationSettings(prev => ({
                      ...prev,
                      matchingThreshold: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                    aria-label="Matching threshold slider"
                  />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>10%</span>
                      <span className="font-medium">
                        {Math.round(reconciliationSettings.matchingThreshold * 100)}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-approve matches
                    </label>
                  <input
                    type="checkbox"
                    checked={reconciliationSettings.autoApprove}
                    onChange={(e) => setReconciliationSettings(prev => ({
                      ...prev,
                      autoApprove: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Auto-approve matches checkbox"
                  />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Run Jobs Tab */}
        {activeTab === 'run' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Reconciliation Jobs</h3>
                  <Button
                    variant="primary"
                    onClick={handleStartReconciliation}
                    disabled={dataSources.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start New Job
                  </Button>
                </div>
                <DataTable
                  data={jobs}
                  columns={jobColumns}
                  emptyMessage="No reconciliation jobs yet"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Reconciliation Matches</h3>
                  <Button
                    variant="outline"
                    onClick={() => {/* Export results */}}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
                <DataTable
                  data={matches}
                  columns={matchColumns}
                  emptyMessage="No matches found yet"
                />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Data Files"
      >
        <div className="p-6">
          <FileDropzone
            onFilesSelected={handleFileUpload}
            accept=".csv,.xlsx,.json"
            maxFiles={5}
            maxSize={50 * 1024 * 1024} // 50MB
          />
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Reconciliation Settings"
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Email
              </label>
              <input
                type="email"
                value={reconciliationSettings.notificationEmail}
                onChange={(e) => setReconciliationSettings(prev => ({
                  ...prev,
                  notificationEmail: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email for notifications"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowSettingsModal(false)}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ReconciliationPage
