// ============================================================================
// RECONCILIATION API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import type { ApiResponse } from '../apiClient/types';
import { BaseApiService, type PaginatedResult } from './BaseApiService';
import type { ReconciliationRecord } from '../../types/index';
import type { ReconciliationStats } from '../../types/backend-aligned';
import type { ErrorHandlingResult } from '../errorHandling';

/**
 * Reconciliation API Service
 * 
 * Handles all reconciliation-related API operations including job management,
 * result retrieval, match management, and statistics.
 * 
 * @example
 * ```typescript
 * const jobs = await ReconciliationApiService.getReconciliationJobs('project-123');
 * ```
 */
export class ReconciliationApiService extends BaseApiService {
  /**
   * Fetches reconciliation jobs for a project.
   * 
   * @param projectId - Project ID
   * @param params - Query parameters
   * @param params.page - Page number (default: 1)
   * @param params.per_page - Items per page (default: 20)
   * @param params.status - Filter jobs by status
   * @returns Promise resolving to jobs list and pagination info
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const result = await ReconciliationApiService.getReconciliationJobs('project-123', {
   *   page: 1,
   *   per_page: 20,
   *   status: 'running'
   * });
   * ```
   */
  static async getReconciliationJobs(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      status?: string;
    } = {}
  ): Promise<ErrorHandlingResult<PaginatedResult<unknown> & { jobs: unknown[] }>> {
    return this.withErrorHandling(
      async () => {
        const { page = 1, per_page = 20, status } = params;
        const cacheKey = `reconciliation:jobs:${projectId}:${JSON.stringify(params)}`;

        const result = await this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.get(`/api/projects/${projectId}/reconciliation/jobs`, {
              params: { page, per_page, status },
            });

            const paginated = this.transformPaginatedResponse(response);

            return {
              jobs: paginated.items,
              items: paginated.items,
              pagination: paginated.pagination,
            };
          },
          60000 // 1 minute TTL (frequently updated)
        );

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'getReconciliationJobs',
        projectId,
      }
    );
  }

  /**
   * Fetches a single reconciliation job by ID.
   * 
   * @param jobId - Job ID to fetch
   * @returns Promise resolving to job data
   * @throws {Error} If job not found or request fails
   * 
   * @example
   * ```typescript
   * const job = await ReconciliationApiService.getReconciliationJob('job-123');
   * ```
   */
  static async getReconciliationJob(jobId: string): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const cacheKey = `reconciliation:job:${jobId}`;
        return this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.get(`/api/reconciliation/jobs/${jobId}`);
            return this.transformResponse(response);
          },
          60000 // 1 minute TTL (frequently updated)
        );
      },
      {
        component: 'ReconciliationApiService',
        action: 'getReconciliationJob',
        workflowStage: 'fetch'
      }
    );
  }

  /**
   * Starts a new reconciliation job.
   * 
   * @param projectId - Project ID
   * @param jobData - Job configuration
   * @param jobData.name - Job name
   * @param jobData.description - Job description (optional)
   * @param jobData.source_data_source_id - Source data source ID
   * @param jobData.target_data_source_id - Target data source ID
   * @param jobData.matching_rules - Optional matching rules configuration
   * @returns Promise resolving to created job data
   * @throws {Error} If validation fails or request fails
   * 
   * @example
   * ```typescript
   * const job = await ReconciliationApiService.startReconciliationJob('project-123', {
   *   name: 'Monthly Reconciliation',
   *   source_data_source_id: 'source-1',
   *   target_data_source_id: 'target-1',
   *   matching_rules: [
   *     { field: 'amount', type: 'exact', weight: 1.0 }
   *   ]
   * });
   * ```
   */
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
  ): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post(
          `/api/projects/${projectId}/reconciliation/jobs`,
          jobData
        );
        const result = this.transformResponse(response);

        // Invalidate reconciliation jobs cache
        await this.invalidateCache(`reconciliation:jobs:${projectId}:*`);

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'startReconciliationJob',
        projectId,
        workflowStage: 'start'
      }
    );
  }

  /**
   * Stops a running reconciliation job.
   * 
   * @param jobId - Job ID to stop
   * @returns Promise resolving to updated job data
   * @throws {Error} If job not found or request fails
   * 
   * @example
   * ```typescript
   * const job = await ReconciliationApiService.stopReconciliationJob('job-123');
   * ```
   */
  static async stopReconciliationJob(jobId: string): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post(`/api/reconciliation/jobs/${jobId}/stop`);
        const result = this.transformResponse(response);

        // Invalidate job cache
        await this.invalidateCache(`reconciliation:job:${jobId}`);

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'stopReconciliationJob',
        workflowStage: 'stop'
      }
    );
  }

  /**
   * Fetches reconciliation results for a job.
   * 
   * @param jobId - Job ID
   * @param params - Query parameters
   * @param params.page - Page number (default: 1)
   * @param params.per_page - Items per page (default: 20)
   * @param params.status - Filter results by status
   * @returns Promise resolving to results list and pagination info
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const result = await ReconciliationApiService.getReconciliationResults('job-123', {
   *   page: 1,
   *   status: 'matched'
   * });
   * ```
   */
  static async getReconciliationResults(
    jobId: string,
    params: {
      page?: number;
      per_page?: number;
      status?: string;
    } = {}
  ): Promise<ErrorHandlingResult<PaginatedResult<unknown> & { results: unknown[] }>> {
    return this.withErrorHandling(
      async () => {
        const { page = 1, per_page = 20, status } = params;
        const cacheKey = `reconciliation:results:${jobId}:${JSON.stringify(params)}`;

        const result = await this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.get(`/api/reconciliation/jobs/${jobId}/results`, {
              params: { page, per_page, status },
            });

            const paginated = this.transformPaginatedResponse<unknown>(response as unknown as ApiResponse<{ data?: unknown[]; items?: unknown[]; pagination?: unknown }>);

            return {
              results: paginated.items,
              items: paginated.items,
              pagination: paginated.pagination
            };
          },
          60000 // 1 minute TTL (frequently updated)
        );

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'getReconciliationResults',
        workflowStage: 'fetch'
      }
    );
  }

  /**
   * Fetches reconciliation statistics for a project.
   * 
   * @param projectId - Project ID
   * @returns Promise resolving to reconciliation statistics
   * @throws {Error} If project not found or request fails
   * 
   * @example
   * ```typescript
   * const stats = await ReconciliationApiService.getReconciliationStats('project-123');
   * // Returns: { totalRecords, matchedRecords, unmatchedRecords, confidenceScore }
   * ```
   */
  static async getReconciliationStats(projectId: string): Promise<ErrorHandlingResult<ReconciliationStats>> {
    return this.withErrorHandling(
      async () => {
        const cacheKey = `reconciliation:stats:${projectId}`;
        return this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.get(`/api/projects/${projectId}/reconciliation/stats`);
            const data = this.transformResponse<{ data?: ReconciliationStats }>(response as unknown as ApiResponse<{ data?: ReconciliationStats }>);
            return (data as { data?: ReconciliationStats })?.data || data as ReconciliationStats;
          },
          60000 // 1 minute TTL (frequently updated)
        );
      },
      {
        component: 'ReconciliationApiService',
        action: 'getReconciliationStats',
        projectId
      }
    );
  }

  /**
   * Approves a reconciliation record.
   * 
   * @param recordId - Record ID to approve
   * @returns Promise resolving to updated record data
   * @throws {Error} If record not found or request fails
   * 
   * @example
   * ```typescript
   * const record = await ReconciliationApiService.approveReconciliationRecord('record-123');
   * ```
   */
  static async approveReconciliationRecord(recordId: string): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post(`/api/reconciliation/records/${recordId}/approve`);
        const result = this.transformResponse(response);

        // Invalidate records cache
        await this.invalidateCache(`reconciliation:records:*`);

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'approveReconciliationRecord',
        workflowStage: 'approve'
      }
    );
  }

  /**
   * Rejects a reconciliation record.
   * 
   * @param recordId - Record ID to reject
   * @param reason - Optional rejection reason
   * @returns Promise resolving to updated record data
   * @throws {Error} If record not found or request fails
   * 
   * @example
   * ```typescript
   * const record = await ReconciliationApiService.rejectReconciliationRecord(
   *   'record-123',
   *   'Data mismatch'
   * );
   * ```
   */
  static async rejectReconciliationRecord(recordId: string, reason?: string): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.post(`/api/reconciliation/records/${recordId}/reject`, {
          reason,
        });
        const result = this.transformResponse(response);

        // Invalidate records cache
        await this.invalidateCache(`reconciliation:records:*`);

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'rejectReconciliationRecord',
        workflowStage: 'reject'
      }
    );
  }

  /**
   * Fetches reconciliation records for a project.
   * 
   * @param projectId - Project ID
   * @param params - Query parameters
   * @param params.page - Page number (default: 1)
   * @param params.per_page - Items per page (default: 20)
   * @param params.search - Search query
   * @param params.status - Filter by status
   * @param params.match_type - Filter by match type
   * @returns Promise resolving to records list and pagination info
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const result = await ReconciliationApiService.getReconciliationRecords('project-123', {
   *   page: 1,
   *   status: 'matched'
   * });
   * ```
   */
  static async getReconciliationRecords(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      search?: string;
      status?: string;
      match_type?: string;
    } = {}
  ): Promise<ErrorHandlingResult<PaginatedResult<unknown> & { records: unknown[] }>> {
    return this.withErrorHandling(
      async () => {
        const { page = 1, per_page = 20 } = params;
        const cacheKey = `reconciliation:records:${projectId}:${JSON.stringify(params)}`;

        const result = await this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.getReconciliationRecords(projectId, page, per_page);
            const paginated = this.transformPaginatedResponse(response);

            return {
              records: paginated.items,
              items: paginated.items,
              pagination: paginated.pagination
            };
          },
          60000 // 1 minute TTL (frequently updated)
        );

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'getReconciliationRecords',
        projectId
      }
    );
  }

  /**
   * Updates a reconciliation record.
   * 
   * @param recordId - Record ID to update
   * @param recordData - Record data to update
   * @returns Promise resolving to updated record data
   * @throws {Error} If record not found or request fails
   * 
   * @example
   * ```typescript
   * const record = await ReconciliationApiService.updateReconciliationRecord('record-123', {
   *   status: 'resolved',
   *   notes: 'Updated notes'
   * });
   * ```
   */
  static async updateReconciliationRecord(
    recordId: string,
    recordData: Record<string, unknown>
  ): Promise<ErrorHandlingResult<ReconciliationRecord>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.put(`/api/v1/reconciliation/records/${recordId}`, recordData);
        const data = this.transformResponse<ReconciliationRecord>(response as unknown as ApiResponse<ReconciliationRecord>);
        const result = data as ReconciliationRecord;

        // Invalidate records cache
        await this.invalidateCache(`reconciliation:records:*`);

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'updateReconciliationRecord',
        workflowStage: 'update'
      }
    );
  }

  /**
   * Fetches reconciliation matches for a project.
   * 
   * @param projectId - Project ID
   * @param params - Query parameters
   * @param params.page - Page number (default: 1)
   * @param params.per_page - Items per page (default: 20)
   * @param params.match_type - Filter by match type
   * @param params.status - Filter by status
   * @returns Promise resolving to matches list and pagination info
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const result = await ReconciliationApiService.getReconciliationMatches('project-123', {
   *   match_type: 'exact'
   * });
   * ```
   */
  static async getReconciliationMatches(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      match_type?: string;
      status?: string;
    } = {}
  ): Promise<ErrorHandlingResult<PaginatedResult<unknown> & { matches: unknown[] }>> {
    return this.withErrorHandling(
      async () => {
        const { page = 1, per_page = 20 } = params;
        const cacheKey = `reconciliation:matches:${projectId}:${JSON.stringify(params)}`;

        const result = await this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.getReconciliationMatches(projectId, page, per_page);
            const paginated = this.transformPaginatedResponse(response);

            return {
              matches: paginated.items,
              items: paginated.items,
              pagination: paginated.pagination
            };
          },
          60000 // 1 minute TTL (frequently updated)
        );

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'getReconciliationMatches',
        projectId
      }
    );
  }

  /**
   * Creates a new reconciliation match.
   * 
   * @param projectId - Project ID
   * @param matchData - Match data
   * @param matchData.source_record_id - Source record ID
   * @param matchData.target_record_id - Target record ID
   * @param matchData.match_type - Match type ('exact', 'fuzzy', or 'manual')
   * @param matchData.confidence_score - Confidence score (default: 1.0)
   * @returns Promise resolving to created match data
   * @throws {Error} If validation fails or request fails
   * 
   * @example
   * ```typescript
   * const match = await ReconciliationApiService.createReconciliationMatch('project-123', {
   *   source_record_id: 'record-1',
   *   target_record_id: 'record-2',
   *   match_type: 'manual',
   *   confidence_score: 0.95
   * });
   * ```
   */
  static async createReconciliationMatch(
    projectId: string,
    matchData: {
      source_record_id: string;
      target_record_id: string;
      match_type: 'exact' | 'fuzzy' | 'manual';
      confidence_score?: number;
    }
  ): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.createReconciliationMatch(projectId, {
          record_a_id: matchData.source_record_id,
          record_b_id: matchData.target_record_id,
          confidence_score: matchData.confidence_score || 1.0,
          status: 'matched'
        });
        const result = this.transformResponse(response);

        // Invalidate matches cache
        await this.invalidateCache(`reconciliation:matches:${projectId}:*`);

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'createReconciliationMatch',
        projectId,
        workflowStage: 'create'
      }
    );
  }

  /**
   * Updates an existing reconciliation match.
   * 
   * @param projectId - Project ID
   * @param matchId - Match ID to update
   * @param matchData - Match data to update
   * @param matchData.match_type - New match type
   * @param matchData.confidence_score - New confidence score
   * @param matchData.status - New status
   * @returns Promise resolving to updated match data
   * @throws {Error} If match not found or request fails
   * 
   * @example
   * ```typescript
   * const match = await ReconciliationApiService.updateReconciliationMatch(
   *   'project-123',
   *   'match-456',
   *   { status: 'resolved', confidence_score: 0.98 }
   * );
   * ```
   */
  static async updateReconciliationMatch(
    projectId: string,
    matchId: string,
    matchData: {
      match_type?: 'exact' | 'fuzzy' | 'manual';
      confidence_score?: number;
      status?: 'matched' | 'unmatched' | 'discrepancy' | 'resolved';
    }
  ): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.updateReconciliationMatch(projectId, matchId, matchData);
        const result = this.transformResponse(response);

        // Invalidate matches cache
        await this.invalidateCache(`reconciliation:matches:${projectId}:*`);

        return result;
      },
      {
        component: 'ReconciliationApiService',
        action: 'updateReconciliationMatch',
        projectId,
        workflowStage: 'update'
      }
    );
  }

  /**
   * Approves a reconciliation match (convenience method).
   * 
   * @param projectId - Project ID
   * @param matchId - Match ID to approve
   * @returns Promise resolving to updated match data
   * @throws {Error} If match not found or request fails
   * 
   * @example
   * ```typescript
   * const match = await ReconciliationApiService.approveMatch('project-123', 'match-456');
   * ```
   */
  static async approveMatch(projectId: string, matchId: string): Promise<ErrorHandlingResult<unknown>> {
    return this.updateReconciliationMatch(projectId, matchId, { status: 'matched' });
  }

  /**
   * Rejects a reconciliation match (convenience method).
   * 
   * @param projectId - Project ID
   * @param matchId - Match ID to reject
   * @returns Promise resolving to updated match data
   * @throws {Error} If match not found or request fails
   * 
   * @example
   * ```typescript
   * const match = await ReconciliationApiService.rejectMatch('project-123', 'match-456');
   * ```
   */
  static async rejectMatch(projectId: string, matchId: string): Promise<ErrorHandlingResult<unknown>> {
    return this.updateReconciliationMatch(projectId, matchId, { status: 'unmatched' });
  }
}
