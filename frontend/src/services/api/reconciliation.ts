// ============================================================================
// RECONCILIATION API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import type { ReconciliationRecord } from '../../types/index';
import type { ReconciliationStats } from '../../types/backend-aligned';
import type { ReconciliationMatch } from '../../store/unifiedStore';
import { getErrorMessageFromApiError } from '../../utils/errorExtraction';

export class ReconciliationApiService {
  static async getReconciliationJobs(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      status?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20, status } = params;
      const response = await apiClient.get(`/api/projects/${projectId}/reconciliation/jobs`, {
        params: { page, per_page, status },
      });

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      const responseData = response.data as { data?: unknown[]; pagination?: unknown } | undefined;
      return {
        jobs: responseData?.data || [],
        pagination: responseData?.pagination || {
          page,
          per_page,
          total: (responseData?.data as unknown[])?.length || 0,
          total_pages: Math.ceil(((responseData?.data as unknown[])?.length || 0) / per_page),
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation jobs'
      );
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
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation job'
      );
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
      const response = await apiClient.post(
        `/api/projects/${projectId}/reconciliation/jobs`,
        jobData
      );
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to start reconciliation job'
      );
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

  static async getReconciliationResults(
    jobId: string,
    params: {
      page?: number;
      per_page?: number;
      status?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20, status } = params;
      const response = await apiClient.get(`/api/reconciliation/jobs/${jobId}/results`, {
        params: { page, per_page, status },
      });

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      const responseData = response.data as { data?: unknown[]; pagination?: unknown } | undefined;
      return {
        results: responseData?.data || [],
        pagination: responseData?.pagination || {
          page,
          per_page,
          total: (responseData?.data as unknown[])?.length || 0,
          total_pages: Math.ceil(((responseData?.data as unknown[])?.length || 0) / per_page),
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation results'
      );
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
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch reconciliation stats'
      );
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
      throw new Error(
        error instanceof Error ? error.message : 'Failed to approve reconciliation record'
      );
    }
  }

  static async rejectReconciliationRecord(recordId: string, reason?: string) {
    try {
      const response = await apiClient.post(`/api/reconciliation/records/${recordId}/reject`, {
        reason,
      });
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to reject reconciliation record'
      );
    }
  }

  static async getReconciliationRecords(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
      match_type?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20 } = params;
      const response = await apiClient.getReconciliationRecords(projectId, page, per_page);

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      return {
        records: response.data?.items || [],
        pagination: response.data ? {
          page: response.data.page,
          per_page: response.data.per_page,
          total: response.data.total,
          total_pages: response.data.total_pages,
        } : {
          page,
          per_page,
          total: 0,
          total_pages: 0,
        }
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch reconciliation records');
    }
  }

  static async getReconciliationMatches(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      match_type?: string;
      status?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20 } = params;
      const response = await apiClient.getReconciliationMatches(projectId, page, per_page);

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      return {
        matches: response.data?.items || [],
        pagination: response.data ? {
          page: response.data.page,
          per_page: response.data.per_page,
          total: response.data.total,
          total_pages: response.data.total_pages,
        } : {
          page,
          per_page,
          total: 0,
          total_pages: 0,
        }
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch reconciliation matches');
    }
  }

  static async createReconciliationMatch(
    projectId: string,
    matchData: {
      source_record_id: string;
      target_record_id: string;
      match_type: 'exact' | 'fuzzy' | 'manual';
      confidence_score?: number;
    }
  ) {
    try {
      const response = await apiClient.createReconciliationMatch(projectId, {
        record_a_id: matchData.source_record_id,
        record_b_id: matchData.target_record_id,
        confidence_score: matchData.confidence_score || 1.0,
        status: 'matched'
      });
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create reconciliation match');
    }
  }

  static async updateReconciliationMatch(
    projectId: string,
    matchId: string,
    matchData: {
      match_type?: 'exact' | 'fuzzy' | 'manual';
      confidence_score?: number;
      status?: 'matched' | 'unmatched' | 'discrepancy' | 'resolved';
    }
  ) {
    try {
      const response = await apiClient.updateReconciliationMatch(projectId, matchId, matchData);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update reconciliation match');
    }
  }

  static async approveMatch(projectId: string, matchId: string) {
    return this.updateReconciliationMatch(projectId, matchId, { status: 'matched' });
  }

  static async rejectMatch(projectId: string, matchId: string) {
    return this.updateReconciliationMatch(projectId, matchId, { status: 'unmatched' });
  }
}
