// Data Storage & Legacy Methods Module
import { useState, useCallback, useEffect } from 'react';
import DataManagementService, { ProjectData } from '../../services/dataManagement';
import {
  IngestionData,
  ReconciliationData,
  CashflowData,
  CrossPageData,
} from './types';

export const useDataStorage = (
  setCurrentProject: React.Dispatch<React.SetStateAction<ProjectData | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const dataService = DataManagementService.getInstance();
  const [currentProjectInternal, setCurrentProjectInternal] = useState<ProjectData | null>(null);

  // Sync internal state with external state
  useEffect(() => {
    setCurrentProject(currentProjectInternal);
  }, [currentProjectInternal, setCurrentProject]);

  // Initialize with sample project if none exists
  useEffect(() => {
    if (!currentProjectInternal) {
      const sampleProject = dataService.createProject({
        id: 'sample-project',
        name: 'Sample Reconciliation Project',
        description: 'A sample project for testing the reconciliation workflow',
        status: 'active',
      });
      setCurrentProjectInternal(sampleProject);
    }
  }, [currentProjectInternal, dataService]);

  // Subscribe to project updates
  useEffect(() => {
    if (currentProjectInternal) {
      const unsubscribe = dataService.subscribe(currentProjectInternal.id, (updatedProject) => {
        setCurrentProjectInternal(updatedProject);
      });
      return unsubscribe;
    }
  }, [currentProjectInternal, dataService]);

  const createProject = useCallback((project: Partial<ProjectData>): ProjectData => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newProject = dataService.createProject(project);
      setCurrentProjectInternal(newProject);
      return newProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, setIsLoading, setError]);

  const updateProject = useCallback((projectId: string, updates: Partial<ProjectData>): ProjectData | null => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = dataService.updateProject(projectId, updates);
      if (updatedProject && currentProjectInternal?.id === projectId) {
        setCurrentProjectInternal(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, currentProjectInternal, setIsLoading, setError]);

  const addIngestionData = useCallback((projectId: string, ingestionData: IngestionData): ProjectData | null => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = dataService.addIngestionData(projectId, ingestionData);
      if (updatedProject && currentProjectInternal?.id === projectId) {
        setCurrentProjectInternal(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add ingestion data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, currentProjectInternal, setIsLoading, setError]);

  const getIngestionData = useCallback((): IngestionData | null => {
    return currentProjectInternal?.ingestionData as any || null;
  }, [currentProjectInternal]);

  const addReconciliationData = useCallback((projectId: string, reconciliationData: ReconciliationData): ProjectData | null => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = dataService.addReconciliationData(projectId, reconciliationData);
      if (updatedProject && currentProjectInternal?.id === projectId) {
        setCurrentProjectInternal(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add reconciliation data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, currentProjectInternal, setIsLoading, setError]);

  const getReconciliationData = useCallback((): ReconciliationData | null => {
    return currentProjectInternal?.reconciliationData as any || null;
  }, [currentProjectInternal]);

  const addCashflowData = useCallback((projectId: string, cashflowData: CashflowData): ProjectData | null => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = dataService.addCashflowData(projectId, cashflowData);
      if (updatedProject && currentProjectInternal?.id === projectId) {
        setCurrentProjectInternal(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add cashflow data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, currentProjectInternal, setIsLoading, setError]);

  const getCashflowData = useCallback((): CashflowData | null => {
    return currentProjectInternal?.cashflowData as any || null;
  }, [currentProjectInternal]);

  const transformIngestionToReconciliation = useCallback((projectId: string): ProjectData | null => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = dataService.transformIngestionToReconciliation(projectId);
      if (updatedProject && currentProjectInternal?.id === projectId) {
        setCurrentProjectInternal(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transform data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, currentProjectInternal, setIsLoading, setError]);

  const transformReconciliationToCashflow = useCallback((projectId: string): ProjectData | null => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedProject = dataService.transformReconciliationToCashflow(projectId);
      if (updatedProject && currentProjectInternal?.id === projectId) {
        setCurrentProjectInternal(updatedProject);
      }
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transform data';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, currentProjectInternal, setIsLoading, setError]);

  const subscribeToProject = useCallback((projectId: string, callback: (data: ProjectData) => void) => {
    return dataService.subscribe(projectId, callback);
  }, [dataService]);

  const exportProject = useCallback((projectId: string): string => {
    return dataService.exportProject(projectId);
  }, [dataService]);

  const importProject = useCallback((data: string): ProjectData | null => {
    setIsLoading(true);
    setError(null);
    
    try {
      const project = dataService.importProject(data);
      if (project) {
        setCurrentProjectInternal(project);
      }
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import project';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, setIsLoading, setError]);

  return {
    currentProject: currentProjectInternal,
    setCurrentProject: setCurrentProjectInternal,
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
    exportProject,
    importProject,
  };
};

