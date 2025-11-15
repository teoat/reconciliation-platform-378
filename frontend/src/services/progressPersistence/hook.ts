// Progress Persistence React Hook
import { ProgressSnapshot } from './types';
import { ProgressPersistenceService } from './service';

export const useProgressPersistence = () => {
  const service = ProgressPersistenceService.getInstance();

  const startOperation = (context: {
    operationId: string;
    operationType: ProgressSnapshot['operationType'];
    userId: string;
    projectId: string;
    metadata?: Record<string, unknown>;
  }) => {
    return service.startOperation(context);
  };

  const updateProgress = (operationId: string, updates: Partial<ProgressSnapshot>) => {
    return service.updateProgress(operationId, updates);
  };

  const completeOperation = (operationId: string, finalData?: unknown) => {
    return service.completeOperation(operationId, finalData);
  };

  const failOperation = (operationId: string, error: Error) => {
    return service.failOperation(operationId, error);
  };

  const pauseOperation = (operationId: string) => {
    return service.pauseOperation(operationId);
  };

  const resumeOperation = (operationId: string) => {
    return service.resumeOperation(operationId);
  };

  const cancelOperation = (operationId: string) => {
    return service.cancelOperation(operationId);
  };

  const getResumableOperations = () => {
    return service.getResumableOperations();
  };

  const getOperationHistory = (operationId: string) => {
    return service.getOperationHistory(operationId);
  };

  const getActiveOperations = () => {
    return service.getActiveOperations();
  };

  const getOperationSnapshot = (operationId: string) => {
    return service.getOperationSnapshot(operationId);
  };

  const cleanupOldSnapshots = () => {
    service.cleanupOldSnapshots();
  };

  const exportOperationData = (operationId: string) => {
    return service.exportOperationData(operationId);
  };

  const importOperationData = (data: string) => {
    return service.importOperationData(data);
  };

  return {
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    pauseOperation,
    resumeOperation,
    cancelOperation,
    getResumableOperations,
    getOperationHistory,
    getActiveOperations,
    getOperationSnapshot,
    cleanupOldSnapshots,
    exportOperationData,
    importOperationData,
  };
};
