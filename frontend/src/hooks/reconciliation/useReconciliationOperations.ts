/**
 * Custom hook for handling reconciliation operations
 * Extracted from ReconciliationPage.tsx to improve code organization and reusability
 */

import { useState, useCallback } from 'react';
import { logger } from '../../services/logger';
import { useReconciliationJobs } from '../useApi';

export interface UseReconciliationOperationsOptions {
  projectId: string | null;
  onJobCreated?: (jobId: string) => void;
  onJobStarted?: (jobId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseReconciliationOperationsReturn {
  isCreatingJob: boolean;
  isStartingJob: boolean;
  error: Error | null;
  startReconciliation: () => Promise<void>;
}

/**
 * Hook for managing reconciliation job creation and execution
 * @param options - Configuration options
 * @returns Reconciliation operation state and functions
 */
export function useReconciliationOperations({
  projectId,
  onJobCreated,
  onJobStarted,
  onError,
}: UseReconciliationOperationsOptions): UseReconciliationOperationsReturn {
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { createJob, startJob } = useReconciliationJobs(projectId);

  const startReconciliation = useCallback(async () => {
    if (!projectId) {
      const err = new Error('No project ID available');
      setError(err);
      onError?.(err);
      return;
    }

    setIsCreatingJob(true);
    setError(null);

    try {
      const result = await createJob({
        project_id: projectId,
        name: `Reconciliation Job ${new Date().toISOString()}`,
        description: 'Automated reconciliation job',
        status: 'pending',
      });

      if (result.success && result.job) {
        onJobCreated?.(result.job.id);
        setIsCreatingJob(false);
        setIsStartingJob(true);

        await startJob(result.job.id);
        onJobStarted?.(result.job.id);
      } else {
        const err = new Error('Failed to create reconciliation job');
        setError(err);
        onError?.(err);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start reconciliation job');
      setError(error);
      logger.error('Reconciliation start failed', { error, projectId });
      onError?.(error);
    } finally {
      setIsCreatingJob(false);
      setIsStartingJob(false);
    }
  }, [projectId, createJob, startJob, onJobCreated, onJobStarted, onError]);

  return {
    isCreatingJob,
    isStartingJob,
    error,
    startReconciliation,
  };
}
