import React from 'react';
import {
  GitCompare,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  AlertCircle,
  Square,
  Calendar,
  Target,
  Database,
} from 'lucide-react';
import type { ReconciliationJob } from '../types';
import { JobActions } from './JobActions';

const StopIcon = Square;

// Memoized job item component to prevent unnecessary re-renders
interface JobItemProps {
  job: ReconciliationJob;
  loading: boolean;
  onViewResults: (job: ReconciliationJob) => void;
  onStartJob: (jobId: string) => void;
  onStopJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

const JobItem: React.FC<JobItemProps> = ({
  job,
  loading,
  onViewResults,
  onStartJob,
  onStopJob,
  onDeleteJob,
  getStatusColor,
  getStatusIcon,
}) => {
  const progressValue = job.status === 'running' && job.total_records && job.total_records > 0
    ? Math.round((job.processed_records / job.total_records) * 100)
    : 0;

  return (
    <div className="p-6 hover:bg-gray-50">
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

          {job.description && <p className="mt-1 text-sm text-gray-600">{job.description}</p>}

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
                aria-valuenow={progressValue}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Job ${job.name} is ${progressValue} percent complete`}
              >
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: job.total_records
                      ? `${(job.processed_records / job.total_records) * 100}%`
                      : '0%',
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}
        </div>

        <JobActions
          job={job}
          loading={loading}
          onStartJob={onStartJob}
          onStopJob={onStopJob}
          onViewResults={onViewResults}
          onDeleteJob={onDeleteJob}
        />
      </div>
    </div>
  );
};

interface JobListProps {
  jobs: ReconciliationJob[];
  loading: boolean;
  onRefresh: () => void;
  onViewResults: (job: ReconciliationJob) => void;
  onStartJob: (jobId: string) => void;
  onStopJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  loading,
  onRefresh,
  onViewResults,
  onStartJob,
  onStopJob,
  onDeleteJob,
  getStatusColor,
  getStatusIcon,
}) => {
  if (loading && jobs.length === 0) {
    return (
      <div className="p-6 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-6 text-center">
        <GitCompare className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">No reconciliation jobs found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {jobs.map((job) => {
        const progressValue = job.status === 'running' && job.total_records && job.total_records > 0
          ? Math.round((job.processed_records / job.total_records) * 100)
          : 0;

        return (
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
                      aria-valuenow={progressValue}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Job ${job.name} is ${progressValue} percent complete`}
                    >
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: job.total_records
                            ? `${(job.processed_records / job.total_records) * 100}%`
                            : '0%',
                        }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}
              </div>

              <JobActions
                job={job}
                loading={loading}
                onStartJob={onStartJob}
                onStopJob={onStopJob}
                onViewResults={onViewResults}
                onDeleteJob={onDeleteJob}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
