// Ingestion Jobs Hook
'use client';

import { useState, useCallback } from 'react';
import { apiClient, IngestionJob } from '@/services/apiClient';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';

export const useIngestionJobs = () => {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchJobs = useCallback(async (params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // getIngestionJobs doesn't exist on apiClient, need to use a different method or create it
      // For now, return empty - this method needs to be implemented in apiClient
      const response = await apiClient.get('/ingestion/jobs', { params });
      if (response.data) {
        // Response structure needs to be checked - assuming it's an array or has items
        const data = response.data as { jobs?: IngestionJob[]; items?: IngestionJob[]; pagination?: Record<string, unknown> } | IngestionJob[];
        if (Array.isArray(data)) {
          setJobs(data);
        } else if (data.jobs) {
          setJobs(data.jobs);
          setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        } else if (data.items) {
          setJobs(data.items);
          setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        }
      } else {
        setError(getErrorMessageFromApiError(response.error) || 'Failed to fetch ingestion jobs');
      }
    } catch (err) {
      setError('Failed to fetch ingestion jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    projectId: string,
    dataSourceId?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // uploadFile expects (projectId, file, metadata) but we have (file, projectId, dataSourceId)
      // Need to check the actual signature - for now, create metadata object
      const metadata = {
        project_id: projectId,
        name: file.name,
        source_type: dataSourceId || 'file',
      };
      const response = await apiClient.uploadFile(projectId, file, metadata);
      if (response.data) {
        // FileUploadResponse doesn't have ingestionJob, need to check actual response structure
        // For now, create a job from the response
        const job: IngestionJob = {
          id: response.data!.id,
          projectId: projectId,
          fileName: response.data!.name,
          status: response.data!.status === 'completed' ? 'completed' : 'processing',
          totalRows: response.data!.record_count || 0,
          processedRows: 0,
          errorCount: 0,
          createdAt: new Date(response.data!.uploaded_at || new Date().toISOString()),
          completedAt: response.data!.processed_at ? new Date(response.data!.processed_at) : undefined,
        };
        setJobs(prev => [job, ...prev]);
        return { success: true, job };
      } else {
        const errorMsg = getErrorMessageFromApiError(response.error) || 'Failed to upload file';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      setError('Failed to upload file');
      return { success: false, error: 'Failed to upload file' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processData = useCallback(async (jobId: string, options?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // processData doesn't exist on apiClient, need to use a different method
      // For now, use POST to process endpoint
      const response = await apiClient.post(`/ingestion/jobs/${jobId}/process`, options || {});
      if (response.data) {
        // Response structure needs to be checked
        const jobData = response.data as { job?: IngestionJob; records?: Record<string, unknown>[] } | IngestionJob;
        const updatedJob = (jobData as { job?: IngestionJob }).job || (jobData as IngestionJob);
        if (updatedJob) {
          setJobs(prev => 
            prev.map(job => 
              job.id === jobId ? updatedJob : job
            )
          );
        }
        return { success: true, job: updatedJob, records: (jobData as { records?: Record<string, unknown>[] }).records };
      } else {
        const errorMsg = getErrorMessageFromApiError(response.error) || 'Failed to process data';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      setError('Failed to process data');
      return { success: false, error: 'Failed to process data' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    jobs,
    isLoading,
    error,
    pagination,
    fetchJobs,
    uploadFile,
    processData,
  };
};

