'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import DataManagementService, { ProjectData, UploadedFile, ReconciliationRecord, ExpenseCategory } from '../services/dataManagement'

interface DataContextType {
  // Current project data
  currentProject: ProjectData | null
  setCurrentProject: (project: ProjectData | null) => void
  
  // Data management methods
  createProject: (project: Partial<ProjectData>) => ProjectData
  updateProject: (projectId: string, updates: Partial<ProjectData>) => ProjectData | null
  
  // Ingestion data methods
  addIngestionData: (projectId: string, ingestionData: any) => ProjectData | null
  getIngestionData: () => any
  
  // Reconciliation data methods
  addReconciliationData: (projectId: string, reconciliationData: any) => ProjectData | null
  getReconciliationData: () => any
  
  // Cashflow data methods
  addCashflowData: (projectId: string, cashflowData: any) => ProjectData | null
  getCashflowData: () => any
  
  // Data transformation methods
  transformIngestionToReconciliation: (projectId: string) => ProjectData | null
  transformReconciliationToCashflow: (projectId: string) => ProjectData | null
  
  // Real-time updates
  subscribeToProject: (projectId: string, callback: (data: ProjectData) => void) => () => void
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Utility methods
  exportProject: (projectId: string) => string
  importProject: (data: string) => ProjectData | null
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const dataService = DataManagementService.getInstance()

  // Initialize with sample project if none exists
  useEffect(() => {
    if (!currentProject) {
      const sampleProject = dataService.createProject({
        id: 'sample-project',
        name: 'Sample Reconciliation Project',
        description: 'A sample project for testing the reconciliation workflow',
        status: 'active'
      })
      setCurrentProject(sampleProject)
    }
  }, [currentProject, dataService])

  // Subscribe to project updates
  useEffect(() => {
    if (currentProject) {
      const unsubscribe = dataService.subscribe(currentProject.id, (updatedProject) => {
        setCurrentProject(updatedProject)
      })
      return unsubscribe
    }
  }, [currentProject, dataService])

  const createProject = (project: Partial<ProjectData>): ProjectData => {
    setIsLoading(true)
    setError(null)
    
    try {
      const newProject = dataService.createProject(project)
      setCurrentProject(newProject)
      return newProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateProject = (projectId: string, updates: Partial<ProjectData>): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.updateProject(projectId, updates)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const addIngestionData = (projectId: string, ingestionData: any): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.addIngestionData(projectId, ingestionData)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ingestion data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getIngestionData = () => {
    return currentProject?.ingestionData || null
  }

  const addReconciliationData = (projectId: string, reconciliationData: any): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.addReconciliationData(projectId, reconciliationData)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reconciliation data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getReconciliationData = () => {
    return currentProject?.reconciliationData || null
  }

  const addCashflowData = (projectId: string, cashflowData: any): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.addCashflowData(projectId, cashflowData)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add cashflow data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getCashflowData = () => {
    return currentProject?.cashflowData || null
  }

  const transformIngestionToReconciliation = (projectId: string): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.transformIngestionToReconciliation(projectId)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transform data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const transformReconciliationToCashflow = (projectId: string): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedProject = dataService.transformReconciliationToCashflow(projectId)
      if (updatedProject && currentProject?.id === projectId) {
        setCurrentProject(updatedProject)
      }
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transform data')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToProject = (projectId: string, callback: (data: ProjectData) => void) => {
    return dataService.subscribe(projectId, callback)
  }

  const exportProject = (projectId: string): string => {
    return dataService.exportProject(projectId)
  }

  const importProject = (data: string): ProjectData | null => {
    setIsLoading(true)
    setError(null)
    
    try {
      const project = dataService.importProject(data)
      if (project) {
        setCurrentProject(project)
      }
      return project
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue: DataContextType = {
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    addIngestionData,
    getIngestionData,
    addReconciliationData,
    getReconciliationData,
    addCashflowData,
    getCashflowData,
    transformIngestionToReconciliation,
    transformReconciliationToCashflow,
    subscribeToProject,
    isLoading,
    error,
    exportProject,
    importProject
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = (): DataContextType => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export default DataProvider
