'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLoading } from '../hooks/useLoading'
import { RetryUtility } from '../utils/retryUtility'
import { useWebSocket } from '../services/webSocketService'
import * as Icons from 'lucide-react'

// Use namespace import for better tree-shaking and smaller bundle
const {
  GitCompare, CheckCircle, XCircle, AlertTriangle, Filter, Search, Download, RefreshCw,
  Settings, Eye, Edit, Trash2, Plus, Minus, ArrowUpDown, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, MoreHorizontal, Users, Clock, Target, TrendingUp, BarChart3, PieChart, Activity,
  Zap, Shield, AlertCircle, Info, CheckSquare, Calendar, DollarSign, Hash, Type, MapPin, Layers,
  Workflow, MessageSquare, Bell, Star, Bookmark, Share2, Copy, ExternalLink, Database, Cloud,
  Server, Wifi, Lock, Unlock, Key, Globe, Mail, Phone, User, UserCheck, UserX, UserPlus,
  UserMinus, Crown, Award, Trophy, Medal, Flag, Tag, Folder, File, FileText, FileCheck, FileX,
  FilePlus, FileMinus, FileEdit, FileSearch, X, GitBranch, GitCommit, GitMerge, GitPullRequest,
  Network, Upload, FileArchive, FileImage, FileVideo, FileAudio, FileSpreadsheet, FileCode,
  FileJson, Play, Pause, Square
} = Icons as any

const StopIcon = Square
import { apiClient } from '../services/apiClient'
import { useWebSocketIntegration } from '../hooks/useWebSocketIntegration'
import { useDebounce } from '../hooks/useDebounce'
import { celebrateHighConfidence, celebrateJobComplete } from '../utils/confetti'

// Types
interface ReconciliationJob {
  id: string
  name: string
  description?: string
  project_id: string
  source_data_source_id: string
  target_data_source_id: string
  confidence_threshold: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  total_records?: number
  processed_records: number
  matched_records: number
  unmatched_records: number
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  created_by: string
  settings?: any
}

interface ReconciliationProgress {
  job_id: string
  status: string
  progress: number
  total_records?: number
  processed_records: number
  matched_records: number
  unmatched_records: number
  current_phase: string
  estimated_completion?: string
}

interface ReconciliationResult {
  id: string
  job_id: string
  source_record_id: string
  target_record_id: string
  match_type: 'exact' | 'fuzzy' | 'manual' | 'unmatched'
  confidence_score: number
  status: 'matched' | 'unmatched' | 'discrepancy' | 'resolved'
  created_at: string
  updated_at: string
}

interface CreateReconciliationJobRequest {
  name: string
  description?: string
  source_data_source_id: string
  target_data_source_id: string
  confidence_threshold: number
  settings?: any
}

interface ReconciliationInterfaceProps {
  projectId: string
  onJobSelect?: (job: ReconciliationJob) => void
  onJobCreate?: (job: ReconciliationJob) => void
  onJobUpdate?: (job: ReconciliationJob) => void
  onJobDelete?: (jobId: string) => void
}

// Main Reconciliation Interface Component
export const ReconciliationInterface: React.FC<ReconciliationInterfaceProps> = ({
  projectId,
  onJobSelect,
  onJobCreate,
  onJobUpdate,
  onJobDelete
}) => {
  // State management
  const [jobs, setJobs] = useState<ReconciliationJob[]>([])
  const [selectedJob, setSelectedJob] = useState<ReconciliationJob | null>(null)
  const [jobProgress, setJobProgress] = useState<ReconciliationProgress | null>(null)
  
  // Real-time progress tracking
  const { isConnected: wsConnected, progress: realtimeProgress } = useWebSocketIntegration()
  
  // Update job progress when real-time updates arrive
  useEffect(() => {
    if (realtimeProgress && selectedJob && realtimeProgress.job_id === selectedJob.id) {
      // Celebrate when job completes
      if (realtimeProgress.status === 'completed' && selectedJob.status !== 'completed') {
        celebrateJobComplete()
      }
      
      setJobProgress(realtimeProgress)
      
      // Update the job in the jobs list
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === realtimeProgress.job_id 
            ? {
                ...job,
                 status: realtimeProgress.status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
                progress: realtimeProgress.progress,
                processed_records: realtimeProgress.processed_records,
                matched_records: realtimeProgress.matched_records,
                unmatched_records: realtimeProgress.unmatched_records,
                updated_at: new Date().toISOString()
              }
            : job
        )
      )
    }
  }, [realtimeProgress, selectedJob])
  
  // Subscribe to job progress when a job is selected
  useEffect(() => {
    if (selectedJob && wsConnected) {
      // WebSocket subscription handled by useWebSocketIntegration
      return () => {
        // Cleanup handled internally
      }
    }
  }, [selectedJob, wsConnected])
  const [results, setResults] = useState<ReconciliationResult[]>([])
  const [loading, setLoading] = useState(false)
  
  // Track which results we've already celebrated to avoid pathological celebrations
  useEffect(() => {
    const highConfidenceResults = results.filter(r => r.confidence_score >= 95)
    if (highConfidenceResults.length > 0) {
      // Only celebrate if this is a new batch
      const shouldCelebrate = !sessionStorage.getItem('celebratedResults')
      if (shouldCelebrate) {
        celebrateHighConfidence()
        sessionStorage.setItem('celebratedResults', 'true')
        // Clear after 5 seconds to allow re-celebration for new batches
        setTimeout(() => sessionStorage.removeItem('celebratedResults'), 5000)
      }
    }
  }, [results.length])
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0
  })

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }))
  }, [debouncedSearch])

  // WebSocket integration for real-time updates (avoiding duplicate declaration)
  const wsIntegration = useWebSocketIntegration()
  const { isConnected, subscribe } = wsIntegration

  // Load reconciliation jobs - using unified utilities
  const loadJobs = useCallback(async () => {
    await withLoading(async () => {
      try {
        setError(null)
        
        const response = await apiClient.getReconciliationJobs(projectId)
        if (response.error) {
          throw new Error(response.error.message)
        }
        
        setJobs(response.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs')
      }
    })
  }, [projectId, withLoading])

  // Load job progress
  const loadJobProgress = useCallback(async (jobId: string) => {
    try {
      const response = await apiClient.getReconciliationJobProgress(jobId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      setJobProgress(response.data)
    } catch (err) {
      console.error('Failed to load job progress:', err)
    }
  }, [])

  // Load job results
  const loadJobResults = useCallback(async (jobId: string, page = 1, perPage = 20) => {
    try {
      const response = await apiClient.getReconciliationJobResults(jobId, page, perPage)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      setResults((response.data as any)?.data || [])
      setPagination(prev => ({
        ...prev,
        page: (response.data as any)?.page || page,
        perPage: (response.data as any)?.per_page || perPage,
        total: (response.data as any)?.total || 0
      }))
    } catch (err) {
      console.error('Failed to load job results:', err)
    }
  }, [])

  // Create reconciliation job
  const createJob = useCallback(async (jobData: CreateReconciliationJobRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.createReconciliationJob(projectId, jobData)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      const newJob = response.data
      setJobs(prev => [newJob, ...prev])
      setShowCreateModal(false)
      
      if (onJobCreate) {
        onJobCreate(newJob)
      }
      
      return newJob
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId, onJobCreate])

  // Start reconciliation job Nightmare
  const startJob = useCallback(async (jobId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.startReconciliationJob(projectId, jobId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // Update job status
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'running' as const, started_at: new Date().toISOString() }
          : job
      ))
      
      // Polling is now handled by the separate normalized useEffect below
      // which properly cleans up on unmount
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Stop reconciliation job
  const stopJob = useCallback(async (jobId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.cancelReconciliationJob(jobId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      // Update job status
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'cancelled' as const }
          : job
      ))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop job')
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete reconciliation job
  const deleteJob = useCallback(async (jobId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.deleteReconciliationJob(projectId, jobId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      setJobs(prev => prev.filter(job => job.id !== jobId))
      
      if (onJobDelete) {
        onJobDelete(jobId)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job')
    } finally {
      setLoading(false)
    }
  }, [projectId, onJobDelete])

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return

    // Subscribe to job updates
    const unsubscribeJobUpdate = subscribe('job_update', (data: any) => {
      if (data.job_id && data.project_id === projectId) {
        setJobs(prev => prev.map(job => 
          job.id === data.job_id 
            ? { ...job, ...data.updates }
            : job
        ))
      }
    })

    // Subscribe to progress updates
    const unsubscribeProgressUpdate = subscribe('job_progress', (data: any) => {
      if (data.job_id === selectedJob?.id) {
        setJobProgress(data.progress)
      }
    })

    return () => {
      if (unsubscribeJobUpdate) unsubscribeJobUpdate()
      if (unsubscribeProgressUpdate) unsubscribeProgressUpdate()
    }
  }, [isConnected, projectId, selectedJob?.id, subscribe])

  // Load jobs on mount
  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  // Poll for progress updates when job is running - FIXED: Proper cleanup on unmount
  useEffect(() => {
    if (selectedJob?.status !== 'running') return
    
    const interval = setInterval(() => {
      loadJobProgress(selectedJob.id)
    }, 2000)
    
    // Cleanup interval on unmount or when job status changes
    return () => {
      clearInterval(interval)
    }
  }, [selectedJob?.id, selectedJob?.status, loadJobProgress])

  // Filter jobs based on current filters
  const filteredJobs = jobs.filter(job => {
    if (filters.status && job.status !== filters.status) return false
    if (filters.search && !job.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-800 bg-yellow-100'
      case 'running': return 'text-blue-800 bg-blue-100'
      case 'completed': return 'text-green-800 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'running': return <Activity className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      case 'cancelled': return <StopIcon className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reconciliation Jobs</h2>
          <p className="text-gray-600">Manage and monitor reconciliation processes</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Real-time Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </button>
          <button
            onClick={loadJobs}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search reconciliation jobs"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Reconciliation Jobs ({filteredJobs.length})</h3>
        </div>
        
        {loading && jobs.length === 0 ? (
          <div className="p-6 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-6 text-center">
            <GitCompare className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No reconciliation jobs found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first job
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{job.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </span>
                    </div>
                    
                    {job.description && (
                      <p className="mt-1 text-sm text-gray-600">{job.description}</p>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Threshold: {job.confidence_threshold}%
                      </div>
                      {job.total_records && (
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-1" />
                          {job.total_records.toLocaleString()} records
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {job.status === 'running' && job.total_records && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{job.processed_records} / {job.total_records}</span>
                        </div>
                        <div 
                          className="w-full bg-gray-200 rounded-full h-2"
                          role="progressbar"
                          aria-valuenow={Math.round((job.processed_records / job.total_records) * 100)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Job ${job.name} is ${Math.round((job.processed_records / job.total_records) * 100)} percent complete`}
                        >
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(job.processed_records / job.total_records) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {job.status === 'pending' && (
                      <button
                        onClick={() => startJob(job.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </button>
                    )}
                    
                    {job.status === 'running' && (
                      <button
                        onClick={() => stopJob(job.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                      >
                        <StopIcon className="w-3 h-3 mr-1" />
                        Stop
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedJob(job)
                        setShowResultsModal(true)
                        loadJobResults(job.id)
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Results
                    </button>
                    
                    <button
                      onClick={() => deleteJob(job.id)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          projectId={projectId}
          onCreateJob={createJob}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Results Modal */}
      {showResultsModal && selectedJob && (
        <ResultsModal
          job={selectedJob}
          results={results}
          progress={jobProgress}
          onClose={() => setShowResultsModal(false)}
        />
      )}
    </div>
  )
}

// Create Job Modal Component
interface CreateJobModalProps {
  projectId: string
  onCreateJob: (jobData: CreateReconciliationJobRequest) => Promise<void>
  onClose: () => void
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ projectId, onCreateJob, onClose }) => {
  const [formData, setFormData] = useState<CreateReconciliationJobRequest>({
    name: '',
    description: '',
    source_data_source_id: '',
    target_data_source_id: '',
    confidence_threshold: 80,
    settings: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await onCreateJob(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create Reconciliation Job</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Source Data Source ID</label>
            <input
              type="text"
              required
              value={formData.source_data_source_id}
              onChange={(e) => setFormData(prev => ({ ...prev, source_data_source_id: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target Data Source ID</label>
            <input
              type="text"
              required
              value={formData.target_data_source_id}
              onChange={(e) => setFormData(prev => ({ ...prev, target_data_source_id: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confidence Threshold (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.confidence_threshold}
               onChange={(e) => setFormData(prev => ({ ...prev, confidence_threshold: Number(e.target.value) || 0 }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Results Modal Component
interface ResultsModalProps {
  job: ReconciliationJob
  results: ReconciliationResult[]
  progress: ReconciliationProgress | null
  onClose: () => void
}

const ResultsModal: React.FC<ResultsModalProps> = ({ job, results, progress, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Job Results: {job.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Summary */}
        {progress && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Progress Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">{progress.processed_records}</div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">{progress.matched_records}</div>
                <div className="text-sm text-gray-600">Matched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{progress.unmatched_records}</div>
                <div className="text-sm text-gray-600">Unmatched</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{progress.progress}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Record
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Record
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.source_record_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.target_record_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.match_type === 'exact' ? 'bg-green-100 text-green-800' :
                      result.match_type === 'fuzzy' ? 'bg-yellow-100 text-yellow-800' :
                      result.match_type === 'manual' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.match_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.confidence_score}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.status === 'matched' ? 'bg-green-100 text-green-800' :
                      result.status === 'unmatched' ? 'bg-red-100 text-red-800' :
                      result.status === 'discrepancy' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No results available yet</p>
          </div>
        )}

        <div className="flex items-center justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReconciliationInterface
