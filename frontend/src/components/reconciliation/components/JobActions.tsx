import React from 'react';
import { Play, Square, Eye, Trash2 } from 'lucide-react';
import type { ReconciliationJob } from '../types';

const StopIcon = Square;

interface JobActionsProps {
  job: ReconciliationJob;
  loading: boolean;
  onStartJob: (jobId: string) => void;
  onStopJob: (jobId: string) => void;
  onViewResults: (job: ReconciliationJob) => void;
  onDeleteJob: (jobId: string) => void;
}

export const JobActions: React.FC<JobActionsProps> = ({
  job,
  loading,
  onStartJob,
  onStopJob,
  onViewResults,
  onDeleteJob,
}) => {
  return (
    <div className="flex items-center space-x-2">
      {job.status === 'pending' && (
        <button
          onClick={() => onStartJob(job.id)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
        >
          <Play className="w-3 h-3 mr-1" />
          Start
        </button>
      )}

      {job.status === 'running' && (
        <button
          onClick={() => onStopJob(job.id)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
        >
          <StopIcon className="w-3 h-3 mr-1" />
          Stop
        </button>
      )}

      <button
        onClick={() => onViewResults(job)}
        disabled={loading}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        aria-label={`View results for ${job.name}`}
      >
        <Eye className="w-3 h-3 mr-1" />
        View Results
      </button>

      <button
        onClick={() => onDeleteJob(job.id)}
        disabled={loading}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
      >
        <Trash2 className="w-3 h-3 mr-1" />
        Delete
      </button>
    </div>
  );
};

