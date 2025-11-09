// Simplified File Dropzone Component
// Reduced from 467 lines to ~100 lines by using the consolidated fileService

import React, { useCallback, useState } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { fileService } from '../services/fileService'

interface FileDropzoneProps {
  onFilesSelected?: (files: File[]) => void
  onUploadComplete?: (fileData: any) => void
  onUploadError?: (error: Error) => void
  accept?: string
  maxFiles?: number
  maxSize?: number
  className?: string
  disabled?: boolean
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  onUploadComplete,
  onUploadError,
  accept = '.csv,.xlsx,.json,.xml',
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  className = '',
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadSessions, setUploadSessions] = useState<Map<string, any>>(new Map())
  const [errors, setErrors] = useState<string[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    setErrors([])

    // Validate files
    const validationErrors: string[] = []
    
    if (files.length > maxFiles) {
      validationErrors.push(`Maximum ${maxFiles} files allowed`)
    }

    for (const file of files) {
      if (file.size > maxSize) {
        validationErrors.push(`${file.name} exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`)
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      onUploadError?.(new Error(validationErrors.join(', ')))
      return
    }

    onFilesSelected?.(files)

    // Upload files
    for (const file of files) {
      try {
        const session = await fileService.startUpload(file)
        setUploadSessions(prev => new Map(prev).set(session.id, session))
        
        // TODO: Implement event listeners for upload completion/failure
        // Listen for upload completion
        // fileService.addListener('uploadCompleted', (event) => {
        //   if (event.data.session.id === session.id) {
        //     setUploadSessions(prev => {
        //       const newMap = new Map(prev)
        //       newMap.delete(session.id)
        //       return newMap
        //     })
        //     onUploadComplete?.(event.data.fileData)
        //   }
        // })

        // fileService.addListener('uploadFailed', (event) => {
        //   if (event.data.session.id === session.id) {
        //     setUploadSessions(prev => {
        //       const newMap = new Map(prev)
        //       newMap.delete(session.id)
        //       return newMap
        //     })
        //     onUploadError?.(new Error(event.data.error))
        //   }
        // })

      } catch (error) {
        onUploadError?.(error instanceof Error ? error : new Error('Upload failed'))
      }
    }
  }, [maxFiles, maxSize, onFilesSelected, onUploadComplete, onUploadError])

  const removeFile = useCallback((sessionId: string) => {
    fileService.cancelUpload(sessionId)
    setUploadSessions(prev => {
      const newMap = new Map(prev)
      newMap.delete(sessionId)
      return newMap
    })
  }, [])

  const getTotalProgress = (): number => {
    if (uploadSessions.size === 0) return 0
    
    let totalProgress = 0
    for (const session of Array.from(uploadSessions.values())) {
      totalProgress += session.progress
    }
    
    return Math.round(totalProgress / uploadSessions.size)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports: {accept} (max {Math.round(maxSize / 1024 / 1024)}MB)
        </p>
        
        <input
          id="file-input"
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
          aria-label="File upload input"
          title="Select files to upload"
        />
      </div>

      {/* Upload Progress */}
      {uploadSessions.size > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploading {uploadSessions.size} file(s)</span>
            <span>{getTotalProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getTotalProgress()}%` }}
            />
          </div>
        </div>
      )}

      {/* File List */}
      {uploadSessions.size > 0 && (
        <div className="mt-4 space-y-2">
          {Array.from(uploadSessions.values()).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{session.fileName}</p>
                  <p className="text-xs text-gray-500">{session.progress}% complete</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(session.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Remove file"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}