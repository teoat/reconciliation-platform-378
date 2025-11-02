'use client';
import { logger } from '@/services/logger';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoading } from '../hooks/useLoading';
import { RetryUtility } from '../utils/retryUtility';
import {
  GitCompare,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Plus,
  Play,
  Square,
  Clock,
  Activity,
  AlertCircle,
  Calendar,
  Target,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CreateJobModal } from './reconciliation/CreateJobModal';
import { ResultsModal } from './reconciliation/ResultsModal';
import type {
  ReconciliationJob,
  ReconciliationProgress,
  ReconciliationResult,
  CreateReconciliationJobRequest,
  ReconciliationInterfaceProps,
} from './reconciliation/types';

const StopIcon = Square;
import { apiClient } from '../services/apiClient';
import { useWebSocketIntegration } from '../hooks/useWebSocketIntegration';
import { useDebounce } from '../hooks/useDebounce';
import { celebrateHighConfidence, celebrateJobComplete } from '../utils/confetti';

// Main Reconciliation Interface Component
export const ReconciliationInterface: React.FC<ReconciliationInterfaceProps> = ({
  projectId,
  onJobSelect,
  onJobCreate,
  onJobUpdate,
  onJobDelete,
}) => {
  // Loading state management
  const { loading, withLoading } = useLoading();

  // State management
  const [jobs, setJobs] = useState<ReconciliationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ReconciliationJob | null>(null);
  const [jobProgress, setJobProgress] = useState<ReconciliationProgress | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Track which results we've already celebrated to avoid pathological celebrations
  useEffect(() => {
    const highConfidenceResults = results.filter((r) => r.confidence_score >= 95);
    if (highConfidenceResults.length > 0) {
      // Only celebrate if this is a new batch
      const shouldCelebrate = !sessionStorage.getItem('celebratedResults');
      if (shouldCelebrate) {
        celebrateHighConfidence();
        sessionStorage.setItem('celebratedResults', 'true');
        // Clear after 5 seconds to allow re-celebration for new batches
        setTimeout(() => sessionStorage.removeItem('celebratedResults'), 5000);
      }
    }
  }, [results.length]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
  });

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // WebSocket integration - single instance
  const wsIntegration = useWebSocketIntegration();
  const { isConnected, subscribe } = wsIntegration;

  // Load reconciliation jobs with retry logic
  const loadJobs = useCallback(async () => {
    await withLoading(async () => {
      try {
        setError(null);
        await RetryUtility.withRetry(
          async () => {
            const response = await apiClient.getReconciliationJobs(projectId);
            if (response.error) {
              throw new Error(response.error.message);
            }
            setJobs(response.data || []);
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
              logger.warn('Retrying loadJobs', { attempt, error: error.message });
            },
          }
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs';
        setError(errorMessage);
        logger.error('Failed to load jobs', { projectId, error: err });
      }
    });
  }, [projectId, withLoading]);

  // Load job progress
  const loadJobProgress = useCallback(async (jobId: string) => {
    try {
      const response = await apiClient.getReconciliationJobProgress(jobId);
      if (response.error) {
        throw new Error(response.error.message);
      }

      setJobProgress(response.data);
    } catch (err) {
      logger.error('Failed to load job progress:', err);
    }
  }, []);

  // Load job results with pagination and retry logic
  const loadJobResults = useCallback(
    async (jobId: string, page = pagination.page, perPage = pagination.perPage) => {
      setResultsLoading(true);
      try {
        await RetryUtility.withRetry(
          async () => {
            const response = await apiClient.getReconciliationJobResults(jobId, page, perPage);
            if (response.error) {
              throw new Error(response.error.message);
            }

            const data = response.data as
              | {
                  data?: ReconciliationResult[];
                  page?: number;
                  per_page?: number;
                  total?: number;
                }
              | undefined;
            setResults(data?.data || []);
            setPagination((prev) => ({
              ...prev,
              page: data?.page ?? page,
              perPage: data?.per_page ?? perPage,
              total: data?.total ?? 0,
            }));
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
              logger.warn('Retrying loadJobResults', {
                jobId,
                page,
                perPage,
                attempt,
                error: error.message,
              });
            },
          }
        );
      } catch (err) {
        logger.error('Failed to load job results', {
          jobId,
          page,
          perPage,
          error: err,
        });
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setResultsLoading(false);
      }
    },
    [pagination.page, pagination.perPage]
  );

  // Create reconciliation job
  const createJob = useCallback(
    async (jobData: CreateReconciliationJobRequest) => {
      return await withLoading(async () => {
        try {
          setError(null);
          const response = await apiClient.createReconciliationJob(projectId, jobData);
          if (response.error) {
            throw new Error(response.error.message);
          }

          const newJob = response.data;
          setJobs((prev) => [newJob, ...prev]);
          setShowCreateModal(false);

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
    [projectId, onJobCreate, withLoading]
  );

  // Start reconciliation job
  const startJob = useCallback(
    async (jobId: string) => {
      await withLoading(async () => {
        try {
          setError(null);
          const response = await apiClient.startReconciliationJob(projectId, jobId);
          if (response.error) {
            throw new Error(response.error.message);
          }

          // Update job status
          setJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? { ...job, status: 'running' as const, started_at: new Date().toISOString() }
                : job
            )
          );

          if (onJobUpdate) {
            const updatedJob = jobs.find((j) => j.id === jobId);
            if (updatedJob) {
              onJobUpdate({
                ...updatedJob,
                status: 'running',
                started_at: new Date().toISOString(),
              });
            }
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
          const response = await apiClient.cancelReconciliationJob(jobId);
          if (response.error) {
            throw new Error(response.error.message);
          }

          // Update job status
          setJobs((prev) =>
            prev.map((job) => (job.id === jobId ? { ...job, status: 'cancelled' as const } : job))
          );

          if (onJobUpdate) {
            const updatedJob = jobs.find((j) => j.id === jobId);
            if (updatedJob) {
              onJobUpdate({ ...updatedJob, status: 'cancelled' });
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to stop job';
          setError(errorMessage);
          logger.error('Failed to stop job', { jobId, error: err });
        }
      });
    },
    [jobs, onJobUpdate, withLoading]
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
            throw new Error(response.error.message);
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
    const unsubscribeJobUpdate = subscribe(
      'job_update',
      (data: Record<string, unknown> & {
        job_id?: string;
        project_id?: string;
        updates?: Record<string, unknown>;
      }) => {
        if (data.job_id && data.project_id === projectId) {
          setJobs((prev) =>
            prev.map((job) =>
              job.id === data.job_id ? { ...job, ...(data.updates || {}) } : job
            )
          );
        }
      }
    );

    // Subscribe to reconciliation progress updates - use actual event name from backend
    const unsubscribeProgressUpdate = subscribe(
      'reconciliation:progress',
      (data: Record<string, unknown> & {
        jobId?: string;
        job_id?: string;
        progress?: number;
        status?: string;
        processed_records?: number;
        matched_records?: number;
        unmatched_records?: number;
      }) => {
        const jobId = (data.jobId || data.job_id) as string | undefined;
        if (jobId && (jobId === selectedJob?.id || jobs.some((j) => j.id === jobId))) {
          const progressData: ReconciliationProgress = {
            job_id: jobId,
            status: (data.status as string) || 'running',
            progress: (data.progress as number) || 0,
            processed_records: (data.processed_records as number) || 0,
            matched_records: (data.matched_records as number) || 0,
            unmatched_records: (data.unmatched_records as number) || 0,
            current_phase: 'processing',
          };

          if (jobId === selectedJob?.id) {
            setJobProgress(progressData);
          }

          // Update the job in the jobs list
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

                // Celebrate when job completes
                if (
                  progressData.status === 'completed' &&
                  job.status !== 'completed' &&
                  onJobUpdate
                ) {
                  celebrateJobComplete();
                  onJobUpdate(updatedJob);
                }

                return updatedJob;
              }
              return job;
            })
          );
        }
      }
    );

    return () => {
      if (unsubscribeJobUpdate) unsubscribeJobUpdate();
      if (unsubscribeProgressUpdate) unsubscribeProgressUpdate();
    };
  }, [isConnected, projectId, selectedJob?.id, jobs, subscribe, onJobUpdate]);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Poll for progress updates when job is running (fallback if WebSocket fails)
  useEffect(() => {
    if (selectedJob?.status !== 'running' || isConnected) return;

    const interval = setInterval(() => {
      loadJobProgress(selectedJob.id);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedJob?.id, selectedJob?.status, isConnected, loadJobProgress]);

  // Handle results modal open/close
  const handleOpenResults = useCallback(
    (job: ReconciliationJob) => {
      setSelectedJob(job);
      setShowResultsModal(true);
      loadJobResults(job.id);
    },
    [loadJobResults]
  );

  const handleCloseResults = useCallback(() => {
    setShowResultsModal(false);
    setSelectedJob(null);
    setResults([]);
    setJobProgress(null);
  }, []);

  // High-confidence celebration with job-scoped throttling
  useEffect(() => {
    if (!selectedJob) return;

    const highConfidenceResults = results.filter((r) => r.confidence_score >= 95);
    if (highConfidenceResults.length > 0) {
      const key = `celebratedResults:${selectedJob.id}`;
      const shouldCelebrate = !sessionStorage.getItem(key);
      if (shouldCelebrate) {
        celebrateHighConfidence();
        sessionStorage.setItem(key, 'true');
        setTimeout(() => sessionStorage.removeItem(key), 5000);
      }
    }
  }, [results.length, selectedJob]);

  // Memoized filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filters.status && job.status !== filters.status) return false;
      if (filters.search && !job.name.toLowerCase().includes(filters.search.toLowerCase()))
        return false;
      return true;
    });
  }, [jobs, filters]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'running':
        return 'text-blue-800 bg-blue-100';
      case 'completed':
        return 'text-green-800 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'running':
        return <Activity className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <StopIcon className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (!selectedJob) return;
    const nextPage = pagination.page + 1;
    const maxPage = Math.ceil(pagination.total / pagination.perPage);
    if (nextPage <= maxPage) {
      loadJobResults(selectedJob.id, nextPage, pagination.perPage);
    }
  }, [selectedJob, pagination, loadJobResults]);

  const handlePrevPage = useCallback(() => {
    if (!selectedJob) return;
    const prevPage = pagination.page - 1;
    if (prevPage >= 1) {
      loadJobResults(selectedJob.id, prevPage, pagination.perPage);
    }
  }, [selectedJob, pagination, loadJobResults]);

  const handlePerPageChange = useCallback(
    (newPerPage: number) => {
      if (!selectedJob) return;
      loadJobResults(selectedJob.id, 1, newPerPage);
    },
    [selectedJob, loadJobResults]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reconciliation Jobs</h2>
          <p className="text-gray-600">Manage and monitor reconciliation processes</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Real-time Connection Status */}
          <div
            className="flex items-center space-x-2"
            title={isConnected ? 'Real-time updates active' : 'Some updates may be delayed'}
          >
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </button>
          <button
            onClick={loadJobs}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search reconciliation jobs"
            />
          </div>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filter by job status"
          title="Filter by job status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Reconciliation Jobs ({filteredJobs.length})
          </h3>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="p-6 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-6 text-center">
            <GitCompare className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No reconciliation jobs found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first job
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{job.name}</h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}
                      >
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </span>
                    </div>

                    {job.description && (
                      <p className="mt-1 text-sm text-gray-600">{job.description}</p>
                    )}

                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Threshold: {job.confidence_threshold}%
                      </div>
                      {job.total_records && (
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-1" />
                          {job.total_records.toLocaleString()} records
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {job.status === 'running' && job.total_records && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {job.processed_records} / {job.total_records}
                          </span>
                        </div>
                        <div
                          className="w-full bg-gray-200 rounded-full h-2"
                          role="progressbar"
                          aria-valuenow={job.total_records ? Math.round((job.processed_records / job.total_records) * 100) : 0}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Job ${job.name} is ${job.total_records ? Math.round((job.processed_records / job.total_records) * 100) : 0} percent complete`}
                        >
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: job.total_records ? `${(job.processed_records / job.total_records) * 100}%` : '0%',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {job.status === 'pending' && (
                      <button
                        onClick={() => startJob(job.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </button>
                    )}

                    {job.status === 'running' && (
                      <button
                        onClick={() => stopJob(job.id)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                      >
                        <StopIcon className="w-3 h-3 mr-1" />
                        Stop
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowResultsModal(true);
                        loadJobResults(job.id);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Results
                    </button>

                    <button
                      onClick={() => deleteJob(job.id)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          projectId={projectId}
          onCreateJob={createJob}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Results Modal */}
      {showResultsModal && selectedJob && (
        <ResultsModal
          job={selectedJob}
          results={results}
          progress={jobProgress}
          onClose={() => setShowResultsModal(false)}
        />
      )}
    </div>
  );
};

export default ReconciliationInterface;
