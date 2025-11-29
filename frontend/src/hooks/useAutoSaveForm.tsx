// Auto-Save Form Hook
// Provides easy integration of auto-save functionality into forms

import React from 'react'
// NOTE: Auto-save service implementation is pending
// This hook provides a stub implementation for form data management
// When autoSaveService is implemented, replace stub with actual service integration
// import { useAutoSave } from '../services/autoSaveService'
import { AutoSaveRecoveryPrompt, DataComparisonModal } from '@/components/AutoSaveRecoveryPrompt'

interface UseAutoSaveFormOptions {
  formId: string
  metadata: {
    page: string
    userId?: string
    projectId?: string
    workflowStage?: string
  }
  enabled?: boolean
  onDataRestore?: (data: Record<string, unknown>) => void
  onDataCompare?: (data: Record<string, unknown>) => void
}

export const useAutoSaveForm = ({
  formId: _formId,
  metadata: _metadata,
  enabled: _enabled = true,
  onDataRestore,
  onDataCompare
}: UseAutoSaveFormOptions) => {
  const [formData, setFormData] = React.useState<Record<string, unknown>>({})
  const [showComparison, setShowComparison] = React.useState(false)
  const [comparisonData, setComparisonData] = React.useState<Record<string, unknown> | null>(null)

  // NOTE: Auto-save service integration pending
  // Stub implementations for now - provides form data management without auto-save
  // When autoSaveService is implemented, integrate here
  const isAutoSaving = false;
  const lastSaved = null;
  type RecoveryPromptType = {
    timestamp: number;
    data: Record<string, unknown>;
    metadata: {
      page: string;
      workflowStage?: string;
    };
    action: 'restore' | 'discard' | 'compare';
  };
  const recoveryPrompt: RecoveryPromptType | null = null as RecoveryPromptType | null;
  const handleRecovery = () => {};
  const clearRecovery = () => {};
  const manualSave = () => {};

  // Handle recovery actions
  const handleRecoveryAction = React.useCallback((action: 'restore' | 'discard' | 'compare') => {
    if (action === 'restore') {
      if (recoveryPrompt) {
        setFormData(recoveryPrompt.data)
        onDataRestore?.(recoveryPrompt.data)
        handleRecovery()
      }
    } else if (action === 'compare') {
      if (recoveryPrompt) {
        setComparisonData(recoveryPrompt.data)
        setShowComparison(true)
        onDataCompare?.(recoveryPrompt.data)
      }
    } else {
      handleRecovery()
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
  const updateFormData = React.useCallback((updates: Record<string, unknown>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Set specific field
  const setField = React.useCallback((field: string, value: unknown) => {
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
  const resetFormData = React.useCallback((initialData: Record<string, unknown> = {}) => {
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
    setComparisonData,
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
    formData: Record<string, unknown>
    updateFormData: (updates: Record<string, unknown>) => void
    setField: (field: string, value: unknown) => void
    getField: (field: string) => unknown
    clearFormData: () => void
    resetFormData: (initialData?: Record<string, unknown>) => void
    isAutoSaving: boolean
    lastSaved: Date | null
    manualSave: () => void
  }) => React.ReactNode
  enabled?: boolean
  onDataRestore?: (data: Record<string, unknown>) => void
  onDataCompare?: (data: Record<string, unknown>) => void
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
    setComparisonData,
    handleComparisonRestore
  } = useAutoSaveForm({
    formId,
    metadata,
    enabled,
    onDataRestore,
    onDataCompare
  })

  return (
    <>
      {children({
        formData,
        updateFormData,
        setField,
        getField,
        clearFormData,
        resetFormData,
        isAutoSaving,
        lastSaved,
        manualSave
      })}

      {/* Recovery Prompt */}
      {recoveryPrompt && (
        <AutoSaveRecoveryPrompt
          prompt={recoveryPrompt}
          onAction={handleRecoveryAction}
          onDismiss={clearRecovery}
          onCompare={(data: Record<string, unknown>) => {
            setComparisonData(data)
            setShowComparison(true)
            onDataCompare?.(data)
          }}
        />
      )}

      {/* Comparison Modal */}
      {showComparison && comparisonData && (
        <DataComparisonModal
          savedData={comparisonData}
          currentData={formData}
          onClose={() => setShowComparison(false)}
          onRestore={handleComparisonRestore}
        />
      )}
    </>
  )
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
