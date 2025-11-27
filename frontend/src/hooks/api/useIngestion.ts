// Ingestion Jobs Hook
'use client';

import { useState, useCallback } from 'react';
import { apiClient, IngestionJob } from '../../services/apiClient';

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
      const response = await apiClient.getIngestionJobs(params);
      if (response.data) {
        setJobs(response.data.jobs);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to fetch ingestion jobs');
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
      const response = await apiClient.uploadFile(file, projectId, dataSourceId);
      if (response.data) {
        setJobs(prev => [response.data!.ingestionJob, ...prev]);
        return { success: true, job: response.data.ingestionJob };
      } else {
        setError(response.error?.message || 'Failed to upload file');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      setError('Failed to upload file');
      return { success: false, error: 'Failed to upload file' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processData = useCallback(async (jobId: string, options?: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.processData(jobId, options);
      if (response.data) {
        setJobs(prev => 
          prev.map(job => 
            job.id === jobId ? response.data!.job : job
          )
        );
        return { success: true, job: response.data.job, records: response.data.records };
      } else {
        setError(response.error?.message || 'Failed to process data');
        return { success: false, error: response.error?.message };
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

