'use client';
import { logger } from '@/services/logger';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { CreateJobModal } from './reconciliation/CreateJobModal';
import { ResultsModal } from './reconciliation/ResultsModal';
import { JobList } from './reconciliation/components/JobList';
import { JobFilters } from './reconciliation/components/JobFilters';
import { useReconciliationJobs } from './reconciliation/hooks/useReconciliationJobs';
import type {
  ReconciliationJob,
  ReconciliationProgress,
  ReconciliationResult,
  CreateReconciliationJobRequest,
  ReconciliationInterfaceProps,
} from './reconciliation/types';

const StopIcon = Square;
import { apiClient } from '../services/apiClient';
import { RetryUtility } from '../utils/retryUtility';
import { celebrateHighConfidence, celebrateJobComplete } from '../utils/confetti';

// Main Reconciliation Interface Component
export const ReconciliationInterface: React.FC<ReconciliationInterfaceProps> = ({
  projectId,
  onJobCreate,
  onJobUpdate,
  onJobDelete,
}) => {
  // Use the custom hook for job management
  const {
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
  } = useReconciliationJobs({
    projectId,
    onJobCreate,
    onJobUpdate,
    onJobDelete,
  });

  // Results state
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ReconciliationJob | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // Load job results with pagination and retry logic
const loadJobResults = useCallback(
    async (jobId: string, page = 1, perPage = 20) => {
      setResultsLoading(true);
      try {
        await RetryUtility.withRetry(
          async () => {
            const response = await apiClient.getReconciliationJobResults(jobId, page, perPage);
            if (response.error) {
              const { getErrorMessageFromApiError } = await import('../utils/errorExtraction');
              throw new Error(getErrorMessageFromApiError(response.error));
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
          },
          {
            retryCondition: (error: Error | unknown) => {
              if (!(error instanceof Error)) return false;
              return (
                error.name === 'NetworkError' ||
                error.message.includes('timeout') ||
                error.message.includes('502') ||
                error.message.includes('503') ||
                error.message.includes('504')
              );
            },
            onRetry: (attempt, error) => {
              const errorMessage = error instanceof Error ? error.message : String(error);
              logger.warning('Retrying loadJobResults', {
                jobId,
                page,
                perPage,
                attempt,
                error: errorMessage,
              });
            },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Failed to load job results', { jobId, page, perPage, error: errorMessage });
          setResults([]);
        } finally {
          setResultsLoading(false);
        }
      },
      [apiClient]
    );

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
  }, []);

  // Update filters when search changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
  }, [searchQuery]);

  // Poll for progress updates when job is running (fallback if WebSocket fails)
  useEffect(() => {
    if (selectedJob?.status !== 'running' || isConnected) return;

    const interval = setInterval(() => {
      if (selectedJob) {
        loadJobProgress(selectedJob.id);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedJob?.id, selectedJob?.status, isConnected, loadJobProgress]);

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

    // Celebrate job completion
    if (selectedJob.status === 'completed' && onJobUpdate) {
      const completedKey = `celebratedCompletion:${selectedJob.id}`;
      const shouldCelebrate = !sessionStorage.getItem(completedKey);
      if (shouldCelebrate) {
        celebrateJobComplete();
        sessionStorage.setItem(completedKey, 'true');
      }
    }
  }, [results.length, selectedJob, onJobUpdate]);

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
      <JobFilters
        searchQuery={searchQuery}
        statusFilter={filters.status}
        onSearchChange={setSearchQuery}
        onStatusChange={(status) => setFilters((prev) => ({ ...prev, status }))}
      />

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
          <JobList
            jobs={filteredJobs}
            loading={loading}
            onRefresh={loadJobs}
            onViewResults={handleOpenResults}
            onStartJob={startJob}
            onStopJob={stopJob}
            onDeleteJob={deleteJob}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          projectId={projectId}
          onCreateJob={async (jobData) => {
            await createJob(jobData);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Results Modal */}
      {showResultsModal && selectedJob && (
        <ResultsModal
          job={selectedJob}
          results={results}
          progress={jobProgress}
          loading={resultsLoading}
          onClose={handleCloseResults}
        />
      )}
    </div>
  );
};

export default ReconciliationInterface;
