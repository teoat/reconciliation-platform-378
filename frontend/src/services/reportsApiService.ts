/**
 * Reports API Service
 * Handles all API calls related to custom reports
 */

import { apiClient, type ApiResponse } from './apiClient';
import type { RequestConfig } from './apiClient/types';
import type { CustomReport, ReportFilter, ReportMetric, ReportVisualization } from '../components/reports/types';

export interface CreateReportRequest {
  name: string;
  description: string;
  dataSource: 'reconciliation' | 'cashflow' | 'projects' | 'users';
  filters: ReportFilter[];
  metrics: ReportMetric[];
  visualizations: ReportVisualization[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  isPublic: boolean;
  tags: string[];
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {
  id: string;
}

export interface ShareReportRequest {
  reportId: string;
  userIds: string[];
  permissions: 'view' | 'edit';
  expiresAt?: string;
}

export interface ExportReportRequest {
  reportId: string;
  format: 'pdf' | 'csv' | 'xlsx';
}

class ReportsApiService {
  /**
   * Get all reports
   */
  async getReports(): Promise<ApiResponse<CustomReport[]>> {
    return apiClient.makeRequest<CustomReport[]>('/api/reports', {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Get a single report by ID
   */
  async getReport(reportId: string): Promise<ApiResponse<CustomReport>> {
    return apiClient.makeRequest<CustomReport>(`/api/reports/${reportId}`, {
      method: 'GET',
      cache: true,
    });
  }

  /**
   * Create a new report
   */
  async createReport(data: CreateReportRequest): Promise<ApiResponse<CustomReport>> {
    return apiClient.makeRequest<CustomReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Update an existing report
   */
  async updateReport(data: UpdateReportRequest): Promise<ApiResponse<CustomReport>> {
    return apiClient.makeRequest<CustomReport>(`/api/reports/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string): Promise<ApiResponse<void>> {
    return apiClient.makeRequest<void>(`/api/reports/${reportId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Share a report with users
   */
  async shareReport(data: ShareReportRequest): Promise<ApiResponse<{ shareLink: string }>> {
    return apiClient.makeRequest<{ shareLink: string }>(`/api/reports/${data.reportId}/share`, {
      method: 'POST',
      body: JSON.stringify({
        userIds: data.userIds,
        permissions: data.permissions,
        expiresAt: data.expiresAt,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Export a report
   */
  async exportReport(data: ExportReportRequest): Promise<ApiResponse<Blob>> {
    const response = await apiClient.makeRequest<Blob>(`/api/reports/${data.reportId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format: data.format }),
      headers: {
        'Content-Type': 'application/json',
      },
    } as RequestConfig & { responseType?: 'blob' });

    return response;
  }

  /**
   * Get report execution data (with filters applied)
   */
  async getReportData(reportId: string): Promise<ApiResponse<{ data: unknown[]; metrics: Record<string, number> }>> {
    return apiClient.makeRequest<{ data: unknown[]; metrics: Record<string, number> }>(
      `/api/reports/${reportId}/execute`,
      {
        method: 'GET',
        cache: false,
      }
    );
  }
}

export const reportsApiService = new ReportsApiService();

