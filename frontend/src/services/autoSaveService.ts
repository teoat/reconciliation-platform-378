// Auto-Save Service
// Provides functionality for auto-saving form data

import { useState, useEffect, useCallback } from 'react'

export interface RecoveryPrompt {
  data: Record<string, unknown>
  timestamp: string
  metadata?: Record<string, unknown>
}

export const useAutoSave = (
  formId: string,
  getData: () => Record<string, unknown>,
  metadata?: Record<string, unknown>,
  enabled: boolean = true
) => {
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [recoveryPrompt, setRecoveryPrompt] = useState<RecoveryPrompt | null>(null)
  
  const saveData = useCallback((data: Record<string, unknown>) => {
    if (!enabled) return
    
    try {
      setIsAutoSaving(true)
      const key = `autosave_${formId}`
      const saveData = {
        data,
        metadata,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(key, JSON.stringify(saveData))
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }, [formId, metadata, enabled])
  
  const loadData = useCallback((): Record<string, unknown> | null => {
    try {
      const key = `autosave_${formId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        setRecoveryPrompt(parsed)
        return parsed.data
      }
    } catch (error) {
      console.error('Auto-save load failed:', error)
    }
    return null
  }, [formId])
  
  const clearData = useCallback(() => {
    try {
      const key = `autosave_${formId}`
      localStorage.removeItem(key)
      setRecoveryPrompt(null)
    } catch (error) {
      console.error('Auto-save clear failed:', error)
    }
  }, [formId])
  
  const handleRecovery = useCallback((action: 'restore' | 'discard') => {
    if (action === 'discard') {
      clearData()
    }
    setRecoveryPrompt(null)
  }, [clearData])
  
  const clearRecovery = useCallback(() => {
    setRecoveryPrompt(null)
  }, [])
  
  const manualSave = useCallback(() => {
    const data = getData()
    saveData(data)
  }, [getData, saveData])
  
  // Check for existing saved data on mount
  useEffect(() => {
    loadData()
  }, [loadData])
  
  return {
    isAutoSaving,
    lastSaved,
    recoveryPrompt,
    handleRecovery,
    clearRecovery,
    manualSave,
    saveData,
    loadData,
    clearData
  }
}
