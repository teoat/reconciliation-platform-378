// Create Job Modal Component
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CreateReconciliationJobRequest } from './types';

interface CreateJobModalProps {
  projectId: string;
  onCreateJob: (jobData: CreateReconciliationJobRequest) => Promise<unknown>;
  onClose: () => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  projectId,
  onCreateJob,
  onClose,
}) => {
  const [formData, setFormData] = useState<CreateReconciliationJobRequest>({
    name: '',
    description: '',
    source_data_source_id: '',
    target_data_source_id: '',
    confidence_threshold: 80,
    settings: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onCreateJob(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create Reconciliation Job</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="job-name" className="block text-sm font-medium text-gray-700">
              Job Name
            </label>
            <input
              id="job-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter job name"
              title="Job Name"
              aria-label="Job Name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="job-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Enter job description (optional)"
              title="Job Description"
              aria-label="Job Description"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="source-data-source-id"
              className="block text-sm font-medium text-gray-700"
            >
              Source Data Source ID
            </label>
            <input
              id="source-data-source-id"
              type="text"
              required
              value={formData.source_data_source_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, source_data_source_id: e.target.value }))
              }
              placeholder="Enter source data source ID"
              title="Source Data Source ID"
              aria-label="Source Data Source ID"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="target-data-source-id"
              className="block text-sm font-medium text-gray-700"
            >
              Target Data Source ID
            </label>
            <input
              id="target-data-source-id"
              type="text"
              required
              value={formData.target_data_source_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, target_data_source_id: e.target.value }))
              }
              placeholder="Enter target data source ID"
              title="Target Data Source ID"
              aria-label="Target Data Source ID"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="confidence-threshold"
              className="block text-sm font-medium text-gray-700"
            >
              Confidence Threshold (%)
            </label>
            <input
              id="confidence-threshold"
              type="number"
              min="0"
              max="100"
              value={formData.confidence_threshold}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confidence_threshold: Number(e.target.value) || 0,
                }))
              }
              placeholder="Enter confidence threshold (0-100)"
              title="Confidence Threshold (%)"
              aria-label="Confidence Threshold Percentage"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
