import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/services/logger';
import { useLoading } from '@/hooks/useLoading';
import { RetryUtility } from '@/utils/retryUtility';
import { apiClient } from '@/services/apiClient';
import { useWebSocketIntegration } from '@/hooks/useWebSocketIntegration';
import type { ReconciliationJob, ReconciliationProgress } from '../types';
import type { BackendReconciliationJob } from '@/services/apiClient/types';

interface UseReconciliationJobsOptions {
  projectId: string;
  onJobCreate?: (job: ReconciliationJob) => void;
  onJobUpdate?: (job: ReconciliationJob) => void;
  onJobDelete?: (jobId: string) => void;
}

export const useReconciliationJobs = ({
  projectId,
  onJobCreate,
  onJobUpdate,
  onJobDelete,
}: UseReconciliationJobsOptions) => {
  const { loading, withLoading } = useLoading();
  const [jobs, setJobs] = useState<ReconciliationJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<ReconciliationProgress | null>(null);

  // WebSocket integration
  const wsIntegration = useWebSocketIntegration();
  const { isConnected, subscribe } = wsIntegration;

  // Map backend job to component type
  const mapBackendJob = useCallback(
    (bj: BackendReconciliationJob): ReconciliationJob => ({
      id: bj.id,
      name: bj.name || 'Unnamed Job',
      description: bj.description,
      project_id: bj.project_id || projectId,
      source_data_source_id: (bj as BackendReconciliationJob & { source_a_id?: string; source_data_source_id?: string }).source_a_id || 
                            (bj as BackendReconciliationJob & { source_data_source_id?: string }).source_data_source_id || '',
      target_data_source_id: (bj as BackendReconciliationJob & { source_b_id?: string; target_data_source_id?: string }).source_b_id || 
                             (bj as BackendReconciliationJob & { target_data_source_id?: string }).target_data_source_id || '',
      confidence_threshold: bj.confidence_threshold || 80,
      status: bj.status || 'pending',
      progress: bj.progress || 0,
      total_records: bj.total_records,
      processed_records: bj.processed_records || 0,
      matched_records: bj.matched_records || 0,
      unmatched_records: bj.unmatched_records || 0,
      created_at: bj.created_at || new Date().toISOString(),
      updated_at: bj.updated_at || new Date().toISOString(),
      started_at: bj.started_at,
      completed_at: bj.completed_at,
      created_by: bj.created_by || '',
      settings: (bj as BackendReconciliationJob & { settings?: Record<string, unknown> }).settings,
    }),
    [projectId]
  );

  // Load reconciliation jobs
  const loadJobs = useCallback(async () => {
    await withLoading(async () => {
      try {
        setError(null);
        await RetryUtility.withRetry(
          async () => {
            const response = await apiClient.getReconciliationJobs(projectId);
            if (response.error) {
              const errorMessage = typeof response.error === 'string' 
                ? response.error 
                : response.error?.message || 'Failed to load jobs';
              throw new Error(errorMessage);
            }
            const backendJobs: BackendReconciliationJob[] = response.data || [];
            const mappedJobs: ReconciliationJob[] = backendJobs.map(mapBackendJob);
            setJobs(mappedJobs);
          },
          {
            retryCondition: (error: Error) => {
              return (
                error.name === 'NetworkError' ||
                error.message.includes('timeout') ||
                error.message.includes('502') ||
                error.message.includes('503') ||
                error.message.includes('504')
              );
            },
            onRetry: (attempt, error) => {
              logger.warning('Retrying loadJobs', { attempt, error: error.message || String(error) });
            },
          }
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs';
        setError(errorMessage);
        logger.error('Failed to load jobs', { projectId, error: err });
      }
    });
  }, [projectId, withLoading, mapBackendJob]);

  // Load job progress
  const loadJobProgress = useCallback(async (jobId: string) => {
    try {
      const response = await apiClient.getReconciliationJobProgress(jobId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      if (response.data) {
        const progress = response.data as ReconciliationProgress | Record<string, unknown>;
        setJobProgress(progress as ReconciliationProgress);
      }
    } catch (err) {
      logger.error('Failed to load job progress:', err);
    }
  }, []);

  // Create reconciliation job
  const createJob = useCallback(
    async (jobData: {
      name: string;
      description?: string;
      source_data_source_id: string;
      target_data_source_id: string;
      confidence_threshold: number;
      settings?: Record<string, unknown>;
    }): Promise<ReconciliationJob> => {
      return await withLoading(async () => {
        try {
          setError(null);
          const backendJobData: {
            name: string;
            description?: string;
            source_a_id: string;
            source_b_id: string;
            confidence_threshold: number;
            matching_rules: Array<unknown>;
            settings?: Record<string, unknown>;
          } = {
            name: jobData.name,
            description: jobData.description,
            source_a_id: jobData.source_data_source_id,
            source_b_id: jobData.target_data_source_id,
            confidence_threshold: jobData.confidence_threshold,
            matching_rules: [],
            settings: jobData.settings || {},
          };
            const response = await apiClient.createReconciliationJob(projectId, backendJobData);
          if (response.error) {
            throw new Error(getErrorMessageFromApiError(response.error));
          }

          const backendJob: BackendReconciliationJob | undefined = response.data;
          if (!backendJob) {
            throw new Error('Failed to create job: No data returned');
          }
          const newJob = mapBackendJob(backendJob);
          setJobs((prev) => [newJob, ...prev]);

          if (onJobCreate) {
            onJobCreate(newJob);
          }

          return newJob;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create job';
          setError(errorMessage);
          logger.error('Failed to create job', { projectId, jobData, error: err });
          throw err;
        }
      });
    },
    [projectId, onJobCreate, withLoading, mapBackendJob]
  );

  // Start reconciliation job
  const startJob = useCallback(
    async (jobId: string) => {
      await withLoading(async () => {
        try {
          setError(null);
          const response = await apiClient.startReconciliationJob(projectId, jobId);
          if (response.error) {
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : response.error?.message || 'Operation failed';
            throw new Error(errorMessage);
          }

          setJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? { ...job, status: 'running' as const, started_at: new Date().toISOString() }
                : job
            )
          );

          const updatedJob = jobs.find((j) => j.id === jobId);
          if (updatedJob && onJobUpdate) {
            onJobUpdate({
              ...updatedJob,
              status: 'running',
              started_at: new Date().toISOString(),
            });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to start job';
          setError(errorMessage);
          logger.error('Failed to start job', { jobId, projectId, error: err });
        }
      });
    },
    [projectId, jobs, onJobUpdate, withLoading]
  );

  // Stop reconciliation job
  const stopJob = useCallback(
    async (jobId: string) => {
      await withLoading(async () => {
        try {
          setError(null);
          const response = await apiClient.stopReconciliationJob(projectId, jobId);
          if (response.error) {
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : response.error?.message || 'Operation failed';
            throw new Error(errorMessage);
          }

          setJobs((prev) =>
            prev.map((job) => (job.id === jobId ? { ...job, status: 'cancelled' as const } : job))
          );

          const updatedJob = jobs.find((j) => j.id === jobId);
          if (updatedJob && onJobUpdate) {
            onJobUpdate({ ...updatedJob, status: 'cancelled' });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to stop job';
          setError(errorMessage);
          logger.error('Failed to stop job', { jobId, error: err });
        }
      });
    },
    [projectId, jobs, onJobUpdate, withLoading]
  );

  // Delete reconciliation job
  const deleteJob = useCallback(
    async (jobId: string) => {
      if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        return;
      }

      await withLoading(async () => {
        try {
          setError(null);
          const response = await apiClient.deleteReconciliationJob(projectId, jobId);
          if (response.error) {
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : response.error?.message || 'Operation failed';
            throw new Error(errorMessage);
          }

          setJobs((prev) => prev.filter((job) => job.id !== jobId));

          if (onJobDelete) {
            onJobDelete(jobId);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete job';
          setError(errorMessage);
          logger.error('Failed to delete job', { jobId, projectId, error: err });
        }
      });
    },
    [projectId, onJobDelete, withLoading]
  );

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to job updates
    const unsubscribeJobUpdate = subscribe('job_update', (data: unknown) => {
      const updateData = data as Record<string, unknown> & {
        job_id?: string;
        project_id?: string;
        updates?: Record<string, unknown>;
      };
      if (updateData.job_id && updateData.project_id === projectId) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === updateData.job_id ? { ...job, ...(updateData.updates || {}) } : job
          )
        );
      }
    });

    // Subscribe to reconciliation progress updates
    const unsubscribeProgressUpdate = subscribe('reconciliation:progress', (data: unknown) => {
      const wsData = data as Record<string, unknown> & {
        jobId?: string;
        job_id?: string;
        progress?: number;
        status?: string;
        processed_records?: number;
        matched_records?: number;
        unmatched_records?: number;
      };
      const jobId = (wsData.jobId || wsData.job_id) as string | undefined;
      if (jobId && jobs.some((j) => j.id === jobId)) {
        const progressData: ReconciliationProgress = {
          job_id: jobId,
          status: (wsData.status as string) || 'running',
          progress: (wsData.progress as number) || 0,
          processed_records: (wsData.processed_records as number) || 0,
          matched_records: (wsData.matched_records as number) || 0,
          unmatched_records: (wsData.unmatched_records as number) || 0,
          current_phase: 'processing',
        };

        setJobProgress(progressData);

        setJobs((prev) =>
          prev.map((job) => {
            if (job.id === jobId) {
              const updatedJob = {
                ...job,
                status: progressData.status as
                  | 'pending'
                  | 'running'
                  | 'completed'
                  | 'failed'
                  | 'cancelled',
                progress: progressData.progress,
                processed_records: progressData.processed_records,
                matched_records: progressData.matched_records,
                unmatched_records: progressData.unmatched_records,
                updated_at: new Date().toISOString(),
              };

              if (progressData.status === 'completed' && job.status !== 'completed' && onJobUpdate) {
                onJobUpdate(updatedJob);
              }

              return updatedJob;
            }
            return job;
          })
        );
      }
    });

    return () => {
      if (typeof unsubscribeJobUpdate === 'function') {
        unsubscribeJobUpdate();
      }
      if (typeof unsubscribeProgressUpdate === 'function') {
        unsubscribeProgressUpdate();
      }
    };
  }, [isConnected, projectId, jobs, subscribe, onJobUpdate]);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    jobProgress,
    isConnected,
    loadJobs,
    loadJobProgress,
    createJob,
    startJob,
    stopJob,
    deleteJob,
  };
};

