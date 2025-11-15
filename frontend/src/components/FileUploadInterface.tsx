'use client'
import { logger } from '@/services/logger'
import { getErrorMessageFromApiError } from '../utils/errorExtraction'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useLoading } from '../hooks/useLoading'
import { RetryUtility } from '../utils/retryUtility'
import { Upload } from 'lucide-react'
import { File } from 'lucide-react'
import { FileText } from 'lucide-react'
import { FileCheck } from 'lucide-react'
import { FileX } from 'lucide-react'
import { FilePlus } from 'lucide-react'
import { FileMinus } from 'lucide-react'
import { FileEdit } from 'lucide-react'
import { FileSearch } from 'lucide-react'
import { X } from 'lucide-react'
import { CheckCircle } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Download } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { Settings } from 'lucide-react'
import { Eye } from 'lucide-react'
import { Edit } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Minus } from 'lucide-react'
import { ArrowUpDown } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { ChevronUp } from 'lucide-react'
import { ChevronLeft } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import { Users } from 'lucide-react'
import { Target } from 'lucide-react'
import { TrendingUp } from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import { PieChart } from 'lucide-react'
import { Activity } from 'lucide-react'
import { Zap } from 'lucide-react'
import { Shield } from 'lucide-react'
import { Info } from 'lucide-react'
import { CheckSquare } from 'lucide-react'
import { Square } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { Hash } from 'lucide-react'
import { Type } from 'lucide-react'
import { MapPin } from 'lucide-react'
import { Layers } from 'lucide-react'
import { Workflow } from 'lucide-react'
import { MessageSquare } from 'lucide-react'
import { Bell } from 'lucide-react'
import { Star } from 'lucide-react'
import { Bookmark } from 'lucide-react'
import { Share2 } from 'lucide-react'
import { Copy } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import { Database } from 'lucide-react'
import { Cloud } from 'lucide-react'
import { Server } from 'lucide-react'
import { Wifi } from 'lucide-react'
import { Lock } from 'lucide-react'
import { Unlock } from 'lucide-react'
import { Key } from 'lucide-react'
import { Globe } from 'lucide-react'
import { Mail } from 'lucide-react'
import { Phone } from 'lucide-react'
import { User } from 'lucide-react'
import { UserCheck } from 'lucide-react'
import { UserX } from 'lucide-react'
import { UserPlus } from 'lucide-react'
import { UserMinus } from 'lucide-react'
import { Crown } from 'lucide-react'
import { Award } from 'lucide-react'
import { Trophy } from 'lucide-react'
import { Medal } from 'lucide-react'
import { Flag } from 'lucide-react'
import { Tag } from 'lucide-react'
import { Folder } from 'lucide-react'
import { FileArchive } from 'lucide-react'
import { FileImage } from 'lucide-react'
import { FileVideo } from 'lucide-react'
import { FileAudio } from 'lucide-react'
import { FileSpreadsheet } from 'lucide-react'
import { FileCode } from 'lucide-react'
import { FileJson } from 'lucide-react'
import { Play } from 'lucide-react'
import { Pause } from 'lucide-react'
import { Square as StopIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { apiClient } from '../services/apiClient'
import { useWebSocketIntegration } from '../hooks/useWebSocketIntegration'

// Types
interface FileInfo {
  id: string
  filename: string
  size: number
  content_type: string
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed'
  project_id: string
  data_source_id?: string
  description?: string
  uploaded_by: string
  uploaded_at: string
  processed_at?: string
  record_count?: number
  error_message?: string
  file_path?: string
}

interface FileUploadRequest {
  project_id: string
  data_source_id?: string
  description?: string
}

interface ProcessingResult {
  file_id: string
  status: string
  record_count: number
  processing_time_ms: number
  errors: string[]
  warnings: string[]
}

interface FileUploadInterfaceProps {
  projectId: string
  onUploadComplete?: (file: FileInfo) => void
  onUploadError?: (error: string) => void
  onProcessingComplete?: (result: ProcessingResult) => void
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  multiple?: boolean
}

// Main File Upload Interface Component
export const FileUploadInterface: React.FC<FileUploadInterfaceProps> = ({
  projectId,
  onUploadComplete,
  onUploadError,
  onProcessingComplete,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  multiple = true
}) => {
  // State management
  const [files, setFiles] = useState<FileInfo[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map())
  const [dragActive, setDragActive] = useState(false)
  const { loading, withLoading } = useLoading(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // WebSocket integration for real-time updates
  const { isConnected, subscribe } = useWebSocketIntegration()

  // Load files - using unified utilities
  const loadFiles = useCallback(async () => {
    await withLoading(async () => {
      try {
        setError(null)
        
        // This would need to be implemented in the API client
        // const response = await apiClient.getProjectFiles(projectId)
        // if (response.error) {
        //   throw new Error(response.error.message)
        // }
        // setFiles(response.data || [])
        
        // For now, using mock data
        setFiles([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files')
      }
    })
  }, [projectId, withLoading])

  // Upload file
  const uploadFile = useCallback(async (file: File, request: FileUploadRequest) => {
    const fileId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Add file to uploading state
      setUploadingFiles(prev => new Map(prev).set(fileId, 0))
      
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', request.project_id)
      if (request.data_source_id) {
        formData.append('data_source_id', request.data_source_id)
      }
      if (request.description) {
        formData.append('description', request.description)
      }

      // Upload file
      const response = await apiClient.uploadFile(projectId, file, {
        name: file.name,
        project_id: request.project_id,
        source_type: 'file'
      })

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error))
      }

      const uploadedFile = response.data
      
      // Remove from uploading state
      setUploadingFiles(prev => {
        const newMap = new Map(prev)
        newMap.delete(fileId)
        return newMap
      })

      // Add to files list
      setFiles(prev => [uploadedFile, ...prev])
      
      if (onUploadComplete) {
        onUploadComplete(uploadedFile)
      }

      return uploadedFile
    } catch (err) {
      // Remove from uploading state
      setUploadingFiles(prev => {
        const newMap = new Map(prev)
        newMap.delete(fileId)
        return newMap
      })
      
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      
      if (onUploadError) {
        onUploadError(errorMessage)
      }
      
      throw err
    }
  }, [projectId, onUploadComplete, onUploadError])

  // Process file
  const processFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.processFile(projectId, fileId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      const result = response.data
      
      // Update file status
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              status: 'completed' as const,
              processed_at: new Date().toISOString(),
              record_count: result.record_count
            }
          : file
      ))
      
      if (onProcessingComplete) {
        onProcessingComplete(result)
      }
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
      
      // Update file status to failed
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              status: 'failed' as const,
              error_message: err instanceof Error ? err.message : 'Processing failed'
            }
          : file
      ))
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId, onProcessingComplete])

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.deleteDataSource(projectId, fileId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      setFiles(prev => prev.filter(file => file.id !== fileId))
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  // Handle file selection
  const handleFiles = useCallback(async (fileList: File[]) => {
    const validFiles = fileList.filter(file => {
      // Check file size
      if (file.size > maxFileSize) {
        setError(`File ${file.name} is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`)
        return false
      }
      
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has an unsupported type. Allowed types: ${allowedTypes.join(', ')}`)
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    // Upload files
    for (const file of validFiles) {
      try {
        await uploadFile(file, {
          project_id: projectId,
          description: `Uploaded ${file.name}`
        })
      } catch (err) {
        logger.error('Failed to upload file:', err)
      }
    }
  }, [maxFileSize, allowedTypes, uploadFile, projectId])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return

    // Subscribe to file processing updates
    const unsubscribeFileUpdate = subscribe('file_update', (data: {
      project_id: string;
      file_id: string;
      updates: Partial<{
        status: string;
        progress: number;
        error?: string;
        processed_records?: number;
      }>;
    }) => {
      if (data.project_id === projectId) {
        setFiles(prev => prev.map(file => 
          file.id === data.file_id 
            ? { ...file, ...data.updates }
            : file
        ))
      }
    })

    return () => {
      unsubscribeFileUpdate()
    }
  }, [isConnected, projectId, subscribe])

  // Load files on mount
  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Filter files
  const filteredFiles = files.filter(file => {
    if (filters.status && file.status !== filters.status) return false
    if (filters.search && !file.filename.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Get file icon
  const getFileIcon = (contentType: string) => {
    if (contentType.includes('csv')) return <FileText className="w-5 h-5" />
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5" />
    if (contentType.includes('pdf')) return <FileText className="w-5 h-5" />
    if (contentType.includes('image')) return <FileImage className="w-5 h-5" />
    if (contentType.includes('video')) return <FileVideo className="w-5 h-5" />
    if (contentType.includes('audio')) return <FileAudio className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'text-blue-600 bg-blue-100'
      case 'uploaded': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'uploaded': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Activity className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">File Upload</h2>
          <p className="text-gray-600">Upload and manage data files for reconciliation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Files
          </button>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to upload
        </h3>
        <p className="text-gray-600 mb-4">
          Support for CSV, Excel files up to {Math.round(maxFileSize / 1024 / 1024)}MB
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(Array.from(e.target.files))
            }
          }}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploadingFiles.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Uploading Files</h4>
          {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
            <div key={fileId} className="mb-2">
              <div className="flex items-center justify-between text-sm text-blue-700 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div className="text-sm text-red-700">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <FileSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Files List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Uploaded Files ({filteredFiles.length})</h3>
        </div>
        
        {loading && files.length === 0 ? (
          <div className="p-6 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-6 text-center">
            <File className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No files uploaded yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload your first file
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFiles.map((file) => (
              <div key={file.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.content_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900 truncate">{file.filename}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                          {getStatusIcon(file.status)}
                          <span className="ml-1 capitalize">{file.status}</span>
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(file.uploaded_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-1" />
                          {formatFileSize(file.size)}
                        </div>
                        {file.record_count && (
                          <div className="flex items-center">
                            <Hash className="w-4 h-4 mr-1" />
                            {file.record_count.toLocaleString()} records
                          </div>
                        )}
                      </div>
                      
                      {file.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4 inline mr-1" />
                          {file.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'uploaded' && (
                      <button
                        onClick={() => processFile(file.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Process
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteFile(file.id)}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          projectId={projectId}
          onUpload={uploadFile}
          onClose={() => setShowUploadModal(false)}
          maxFileSize={maxFileSize}
          allowedTypes={allowedTypes}
          multiple={multiple}
        />
      )}
    </div>
  )
}

// Upload Modal Component
interface UploadModalProps {
  projectId: string
  onUpload: (file: File, request: FileUploadRequest) => Promise<FileInfo>
  onClose: () => void
  maxFileSize: number
  allowedTypes: string[]
  multiple: boolean
}

const UploadModal: React.FC<UploadModalProps> = ({ 
  projectId, 
  onUpload, 
  onClose, 
  maxFileSize, 
  allowedTypes, 
  multiple 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [formData, setFormData] = useState<FileUploadRequest>({
    project_id: projectId,
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) return

    try {
      setLoading(true)
      setError(null)

      for (const file of selectedFiles) {
        await onUpload(file, formData)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
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
            <label className="block text-sm font-medium text-gray-700">Select Files</label>
            <input
              type="file"
              multiple={multiple}
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Selected Files</label>
              <div className="mt-1 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
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
              disabled={loading || selectedFiles.length === 0}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FileUploadInterface
