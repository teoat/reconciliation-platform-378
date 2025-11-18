// ============================================================================
// RECONCILIATION API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import type { ReconciliationRecord, ReconciliationStats } from '../../types/index';
import type { ReconciliationMatch } from '../../store/unifiedStore';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

export class ReconciliationApiService {
  static async getReconciliationJobs(projectId: string, params: {
    page?: number;
    per_page?: number;
    status?: string;
  } = {}) {
    try {
      const { page = 1, per_page = 20, status } = params;
      const response = await apiClient.get(`/api/projects/${projectId}/reconciliation/jobs`, {
        params: { page, per_page, status },
      });

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      return {
        jobs: response.data?.data || [],
        pagination: response.data?.pagination || {
          page,
          per_page,
          total: response.data?.data?.length || 0,
          total_pages: Math.ceil((response.data?.data?.length || 0) / per_page),
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch reconciliation jobs');
    }
  }

  static async getReconciliationJob(jobId: string) {
    try {
      const response = await apiClient.get(`/api/reconciliation/jobs/${jobId}`);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch reconciliation job');
    }
  }

  static async startReconciliationJob(
    projectId: string,
    jobData: {
      name: string;
      description?: string;
      source_data_source_id: string;
      target_data_source_id: string;
      matching_rules?: Array<{
        field: string;
        type: 'exact' | 'fuzzy' | 'numeric' | 'date';
        threshold?: number;
        weight?: number;
      }>;
    }
  ) {
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/reconciliation/jobs`, jobData);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start reconciliation job');
    }
  }

  static async stopReconciliationJob(jobId: string) {
    try {
      const response = await apiClient.post(`/api/reconciliation/jobs/${jobId}/stop`);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to stop reconciliation job');
    }
  }

  static async getReconciliationResults(jobId: string, params: {
    page?: number;
    per_page?: number;
    status?: string;
  } = {}) {
    try {
      const { page = 1, per_page = 20, status } = params;
      const response = await apiClient.get(`/api/reconciliation/jobs/${jobId}/results`, {
        params: { page, per_page, status },
      });

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      return {
        results: response.data?.data || [],
        pagination: response.data?.pagination || {
          page,
          per_page,
          total: response.data?.data?.length || 0,
          total_pages: Math.ceil((response.data?.data?.length || 0) / per_page),
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch reconciliation results');
    }
  }

  static async getReconciliationStats(projectId: string) {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/reconciliation/stats`);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data as ReconciliationStats;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch reconciliation stats');
    }
  }

  static async approveReconciliationRecord(recordId: string) {
    try {
      const response = await apiClient.post(`/api/reconciliation/records/${recordId}/approve`);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to approve reconciliation record');
    }
  }

  static async rejectReconciliationRecord(recordId: string, reason?: string) {
    try {
      const response = await apiClient.post(`/api/reconciliation/records/${recordId}/reject`, { reason });
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reject reconciliation record');
    }
  }
}

