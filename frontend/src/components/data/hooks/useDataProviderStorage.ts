// Data Provider Storage Hook
import React from 'react';
import { useDataStorage } from '../storage';
import type { ProjectData } from '../../../services/dataManagement';

export const useDataProviderStorage = (
  setCurrentProject: React.Dispatch<React.SetStateAction<ProjectData | null>>,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  const {
    currentProject,
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
  } = useDataStorage(setCurrentProject, setIsLoading as any, setError as any);

  return {
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
    exportProject,
    importProject,
  };
};
