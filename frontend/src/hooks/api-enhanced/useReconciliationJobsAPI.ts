// ============================================================================
// RECONCILIATION JOBS API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';
import { useAppDispatch, useAppSelector } from '../../store/unifiedStore';
import { reconciliationJobsActions } from '../../store/unifiedStore';
import ApiService from '../../services/ApiService';
import { useNotificationHelpers } from '../../store/hooks';
import type { ReconciliationJob } from '../../types/backend-aligned';

export const useReconciliationJobsAPI = (projectId?: string) => {
  const dispatch = useAppDispatch();
  const { items: jobs, isLoading, error } = useAppSelector((state) => ({
    items: state.reconciliation.jobs,
    isLoading: state.reconciliation.isLoading,
    error: state.reconciliation.error,
  }));
  const { showSuccess, showError } = useNotificationHelpers();

  const fetchJobs = useCallback(async () => {
    if (!projectId) return;

    try {
      dispatch(reconciliationJobsActions.fetchJobsStart());
      const response = await ApiService.getReconciliationJobs(projectId);
      const jobsList: ReconciliationJob[] = Array.isArray(response) 
        ? response 
        : (response && typeof response === 'object' && 'data' in response 
            ? (Array.isArray((response as { data: unknown }).data) 
                ? (response as { data: ReconciliationJob[] }).data 
                : [])
            : []);

      dispatch(reconciliationJobsActions.fetchJobsSuccess(jobsList as ReconciliationJob[]));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch reconciliation jobs';
      dispatch(reconciliationJobsActions.fetchJobsFailure(errorMessage));
      showError('Failed to Load Jobs', errorMessage);
    }
  }, [projectId, dispatch, showError]);

  const createJob = useCallback(
    async (jobData: {
      settings?: Record<string, unknown>;
      priority?: string;
      description?: string;
    }) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const newJob = await ApiService.createReconciliationJob(projectId, {
          name: 'Reconciliation Job',
          description: jobData.description,
          config: jobData.settings,
        });
        logger.warn('createReconciliationJob is deprecated - use ReconciliationApiService directly');
        showSuccess('Job Created', 'Reconciliation job created successfully');

        return { success: true, job: newJob };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
        showError('Failed to Create Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const startJob = useCallback(
    async (jobId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const updatedJob = await ApiService.startReconciliationJob(projectId, jobId);
        dispatch(reconciliationJobsActions.startJob(jobId));
        showSuccess('Job Started', 'Reconciliation job started successfully');

        return { success: true, job: updatedJob };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start job';
        showError('Failed to Start Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const stopJob = useCallback(
    async (jobId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        const updatedJob = await ApiService.stopReconciliationJob(projectId, jobId);
        showSuccess('Job Stopped', 'Reconciliation job stopped successfully');

        return { success: true, job: updatedJob };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stop job';
        showError('Failed to Stop Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, showSuccess, showError]
  );

  const deleteJob = useCallback(
    async (jobId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        await ApiService.deleteReconciliationJob(projectId, jobId);
        showSuccess('Job Deleted', 'Reconciliation job deleted successfully');

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete job';
        showError('Failed to Delete Job', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, showSuccess, showError]
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    error,
    fetchJobs,
    createJob,
    startJob,
    stopJob,
    deleteJob,
  };
};

