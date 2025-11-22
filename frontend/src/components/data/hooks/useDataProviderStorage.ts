// Data Provider Storage Hook
import { useState } from 'react';
import { useDataStorage } from '../storage';
import { ProjectData } from '../../../services/dataManagement';

export const useDataProviderStorage = (
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  const {
    currentProject: _unused,
    setCurrentProject: _unusedSetter,
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
  } = useDataStorage(setCurrentProject, setIsLoading, setError);

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
