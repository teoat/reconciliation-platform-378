import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProjects } from '../../hooks/useApi'
import { apiClient } from '../../services/apiClient'
import { Button } from '../ui/Button'
import { useToast } from '../../hooks/useToast'
import { ArrowLeft, Upload, File } from 'lucide-react'

const FileUpload: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { projects, fetchProjects } = useProjects()
  const toast = useToast()
  const [selectedProject, setSelectedProject] = useState<string>('')
  
  // Check if projectId was passed via location state
  useEffect(() => {
    const state = location.state as { projectId?: string } | null
    if (state?.projectId) {
      setSelectedProject(state.projectId)
    }
  }, [location.state])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setSuccess(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedProject) {
      setError('Please select a project and file')
      return
    }

    setError(null)
    setSuccess(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const response = await apiClient.uploadFile(selectedProject, selectedFile, {
        name: selectedFile.name,
        source_type: 'file',
      })

      if (response.error) {
        const errorMsg = response.error.message || 'Upload failed'
        setError(errorMsg)
        toast.error(errorMsg)
      } else if (response.data) {
        setSuccess('File uploaded successfully!')
        toast.success('File uploaded successfully!')
        setSelectedFile(null)
        setUploadProgress(100)
        setTimeout(() => {
          // Redirect to project detail if project selected, otherwise dashboard
          if (selectedProject) {
            navigate(`/projects/${selectedProject}`)
          } else {
            navigate('/')
          }
        }, 1000)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Upload File</h1>
        <p className="text-gray-600 mt-2">Upload a file to process for reconciliation</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
            Select Project <span className="text-red-500">*</span>
          </label>
          <select
            id="project"
            required
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              No projects found. <button onClick={() => navigate('/projects/new')} className="text-blue-600 hover:underline">Create one</button>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            Select File <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <File className="w-8 h-8 text-blue-500" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        className="sr-only"
                        onChange={handleFileSelect}
                        accept=".csv,.xlsx,.xls,.txt"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV, XLSX, XLS, TXT up to 10MB</p>
                </>
              )}
            </div>
          </div>
          {selectedFile && (
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null)
                setUploadProgress(0)
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Remove file
            </button>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 text-center">Uploading... {uploadProgress}%</p>
          </div>
        )}

        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !selectedProject}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FileUpload

