// Auto-Save Form Hook
// Provides easy integration of auto-save functionality into forms

import React from 'react'
import { useAutoSave } from '../services/autoSaveService'
import { AutoSaveRecoveryPrompt, DataComparisonModal } from './AutoSaveRecoveryPrompt'

interface UseAutoSaveFormOptions {
  formId: string
  metadata: {
    page: string
    userId?: string
    projectId?: string
    workflowStage?: string
  }
  enabled?: boolean
  onDataRestore?: (data: Record<string, any>) => void
  onDataCompare?: (data: Record<string, any>) => void
}

export const useAutoSaveForm = ({
  formId,
  metadata,
  enabled = true,
  onDataRestore,
  onDataCompare
}: UseAutoSaveFormOptions) => {
  const [formData, setFormData] = React.useState<Record<string, any>>({})
  const [showComparison, setShowComparison] = React.useState(false)
  const [comparisonData, setComparisonData] = React.useState<Record<string, any> | null>(null)

  const getData = React.useCallback(() => formData, [formData])

  const {
    isAutoSaving,
    lastSaved,
    recoveryPrompt,
    handleRecovery,
    clearRecovery,
    manualSave
  } = useAutoSave(formId, getData, metadata, enabled)

  // Handle recovery actions
  const handleRecoveryAction = React.useCallback((action: 'restore' | 'discard' | 'compare') => {
    if (action === 'restore') {
      if (recoveryPrompt) {
        setFormData(recoveryPrompt.data)
        onDataRestore?.(recoveryPrompt.data)
        handleRecovery('restore')
      }
    } else if (action === 'compare') {
      if (recoveryPrompt) {
        setComparisonData(recoveryPrompt.data)
        setShowComparison(true)
        onDataCompare?.(recoveryPrompt.data)
      }
    } else {
      handleRecovery('discard')
    }
  }, [recoveryPrompt, handleRecovery, onDataRestore, onDataCompare])

  // Handle comparison restore
  const handleComparisonRestore = React.useCallback(() => {
    if (comparisonData) {
      setFormData(comparisonData)
      onDataRestore?.(comparisonData)
    }
    setShowComparison(false)
    setComparisonData(null)
    clearRecovery()
  }, [comparisonData, onDataRestore, clearRecovery])

  // Update form data
  const updateFormData = React.useCallback((updates: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Set specific field
  const setField = React.useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Get specific field
  const getField = React.useCallback((field: string) => {
    return formData[field]
  }, [formData])

  // Clear form data
  const clearFormData = React.useCallback(() => {
    setFormData({})
  }, [])

  // Reset form data
  const resetFormData = React.useCallback((initialData: Record<string, any> = {}) => {
    setFormData(initialData)
  }, [])

  return {
    // Form data management
    formData,
    updateFormData,
    setField,
    getField,
    clearFormData,
    resetFormData,
    
    // Auto-save status
    isAutoSaving,
    lastSaved,
    
    // Recovery handling
    recoveryPrompt,
    handleRecoveryAction,
    clearRecovery,
    
    // Manual save
    manualSave,
    
    // Comparison modal
    showComparison,
    comparisonData,
    setShowComparison,
    handleComparisonRestore
  }
}

// Auto-Save Form Component
interface AutoSaveFormProps {
  formId: string
  metadata: {
    page: string
    userId?: string
    projectId?: string
    workflowStage?: string
  }
  children: (props: {
    formData: Record<string, any>
    updateFormData: (updates: Record<string, any>) => void
    setField: (field: string, value: any) => void
    getField: (field: string) => any
    clearFormData: () => void
    resetFormData: (initialData?: Record<string, any>) => void
    isAutoSaving: boolean
    lastSaved: Date | null
    manualSave: () => void
  }) => React.ReactNode
  enabled?: boolean
  onDataRestore?: (data: Record<string, any>) => void
  onDataCompare?: (data: Record<string, any>) => void
}

export const AutoSaveForm: React.FC<AutoSaveFormProps> = ({
  formId,
  metadata,
  children,
  enabled = true,
  onDataRestore,
  onDataCompare
}) => {
  const {
    formData,
    updateFormData,
    setField,
    getField,
    clearFormData,
    resetFormData,
    isAutoSaving,
    lastSaved,
    manualSave,
    recoveryPrompt,
    handleRecoveryAction,
    clearRecovery,
    showComparison,
    comparisonData,
    setShowComparison,
    handleComparisonRestore
  } = useAutoSaveForm({
    formId,
    metadata,
    enabled,
    onDataRestore,
    onDataCompare
  })

  return {
    formData,
    updateFormData,
    setField,
    getField,
    clearFormData,
    resetFormData,
    isAutoSaving,
    lastSaved,
    manualSave,
    recoveryPrompt,
    handleRecoveryAction,
    clearRecovery,
    showComparison,
    comparisonData,
    setShowComparison,
    handleComparisonRestore
  }
}

// Auto-Save Status Indicator Component
interface AutoSaveStatusProps {
  isAutoSaving: boolean
  lastSaved: Date | null
  className?: string
}

export const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  isAutoSaving,
  lastSaved,
  className = ''
}) => {
  const formatLastSaved = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {isAutoSaving ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span className="text-blue-600">Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <div className="rounded-full h-3 w-3 bg-green-500"></div>
          <span className="text-gray-600">Saved {formatLastSaved(lastSaved)}</span>
        </>
      ) : (
        <>
          <div className="rounded-full h-3 w-3 bg-gray-300"></div>
          <span className="text-gray-500">Not saved</span>
        </>
      )}
    </div>
  )
}

export default useAutoSaveForm
