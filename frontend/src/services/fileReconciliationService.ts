// File Upload and Reconciliation API Service
// This service handles file uploads, data processing, and reconciliation operations

import { apiClient, ApiResponse } from './apiClient'

export interface DataSource {
  id: string
  project_id: string
  name: string
  source_type: string
  file_path?: string
  file_size?: number
  file_hash?: string
  schema?: any
  status: string
  created_at: string
  updated_at: string
}

export interface ReconciliationJob {
  id: string
  project_id: string
  name: string
  description?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  confidence_threshold: number
  settings?: any
  created_at: string
  updated_at: string
}

export interface ReconciliationResult {
  id: string
  project_id: string
  file_id_a: string
  file_id_b: string
  match_id: string
  match_score: number
  match_type: 'exact' | 'fuzzy' | 'partial'
  reconciled_at: string
  status: 'matched' | 'unmatched' | 'adjudicated'
  details: any
}

export interface ProjectAnalytics {
  project_id: string
  total_files: number
  total_reconciliation_runs: number
  total_matched_records: number
  total_unmatched_records: number
  average_match_score: number
  last_reconciliation_date?: string
}

class FileReconciliationService {
  // File Upload Methods
  async uploadFile(
    file: File,
    projectId: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<DataSource>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${apiClient['baseURL']}/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: {
            message: data.error?.message || 'Upload failed',
            statusCode: response.status,
            timestamp: new Date().toISOString(),
            path: `/projects/${projectId}/files`,
            method: 'POST',
          },
        }
      }

      return { data }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Upload failed',
          statusCode: 0,
          timestamp: new Date().toISOString(),
          path: `/projects/${projectId}/files`,
          method: 'POST',
        },
      }
    }
  }

  async getFilesForProject(projectId: string): Promise<ApiResponse<DataSource[]>> {
    return apiClient.makeRequest<DataSource[]>(`/projects/${projectId}/files`)
  }

  async getFileById(projectId: string, fileId: string): Promise<ApiResponse<DataSource>> {
    return apiClient.makeRequest<DataSource>(`/projects/${projectId}/files/${fileId}`)
  }

  async deleteFile(projectId: string, fileId: string): Promise<ApiResponse<void>> {
    return apiClient.makeRequest<void>(`/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE',
    })
  }

  // Reconciliation Methods
  async startReconciliation(
    projectId: string,
    fileIdA: string,
    fileIdB: string
  ): Promise<ApiResponse<ReconciliationResult[]>> {
    return apiClient.makeRequest<ReconciliationResult[]>(
      `/projects/${projectId}/reconcile/${fileIdA}/${fileIdB}`,
      {
        method: 'POST',
      }
    )
  }

  async getReconciliationResults(projectId: string): Promise<ApiResponse<ReconciliationResult[]>> {
    return apiClient.makeRequest<ReconciliationResult[]>(`/projects/${projectId}/reconciliation-results`)
  }

  async getProjectAnalytics(projectId: string): Promise<ApiResponse<ProjectAnalytics>> {
    return apiClient.makeRequest<ProjectAnalytics>(`/projects/${projectId}/analytics`)
  }

  // Dashboard Methods
  async getDashboardData(): Promise<ApiResponse<any>> {
    return apiClient.makeRequest<any>('/dashboard')
  }

  // System Methods
  async getSystemStatus(): Promise<ApiResponse<{
    status: string
    uptime: string
    version: string
    timestamp: string
  }>> {
    return apiClient.makeRequest<{
      status: string
      uptime: string
      version: string
      timestamp: string
    }>('/system/status', { skipAuth: true })
  }

  async getSystemMetrics(): Promise<ApiResponse<string>> {
    return apiClient.makeRequest<string>('/system/metrics')
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{
    status: string
    timestamp: string
    version: string
  }>> {
    return apiClient.makeRequest<{
      status: string
      timestamp: string
      version: string
    }>('/health', { skipAuth: true })
  }
}

// Export singleton instance
export const fileReconciliationService = new FileReconciliationService()
export default fileReconciliationService
