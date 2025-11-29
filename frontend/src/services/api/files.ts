// ============================================================================
// FILE MANAGEMENT API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { BaseApiService } from './BaseApiService';
import { FileUploadResponse } from '../apiClient/types';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';
import type { ErrorHandlingResult } from '../errorHandling';

export class FilesApiService extends BaseApiService {
  static async uploadFile(
    projectId: string,
    file: File,
    _onProgress?: (progress: number) => void
  ): Promise<ErrorHandlingResult<FileUploadResponse>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.uploadFile(
          projectId,
          file,
          { project_id: projectId, name: file.name, source_type: 'file' }
        );
        const result = this.transformResponse<FileUploadResponse>(response);

        // Invalidate files cache
        await this.invalidateCache(`files:${projectId}:*`);

        return result;
      },
      {
        component: 'FilesApiService',
        action: 'uploadFile',
        projectId
      }
    );
  }

  static async getFiles(
    projectId: string,
    params: {
      page?: number;
      per_page?: number;
      type?: string;
    } = {}
  ) {
    try {
      const { page = 1, per_page = 20, type } = params;
      const response = await apiClient.get(`/api/projects/${projectId}/files`, {
        params: { page, per_page, type },
      });

      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }

      return {
        files: (response.data as { data?: unknown[] })?.data || [],
        pagination: (response.data as { pagination?: unknown })?.pagination || {
          page,
          per_page,
          total: (response.data as { data?: unknown[] })?.data?.length || 0,
          total_pages: Math.ceil(((response.data as { data?: unknown[] })?.data?.length || 0) / per_page),
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch files');
    }
  }

  static async getFileById(fileId: string) {
    try {
      const response = await apiClient.get(`/api/files/${fileId}`);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch file');
    }
  }

  static async deleteFile(fileId: string) {
    try {
      const response = await apiClient.delete(`/api/files/${fileId}`);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  }

  static async processFile(projectId: string, dataSourceId: string) {
    try {
      const response = await apiClient.processFile(projectId, dataSourceId);
      if (response.error) {
        throw new Error(getErrorMessageFromApiError(response.error));
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to process file');
    }
  }

  static async getFilePreview(fileId: string): Promise<ErrorHandlingResult<unknown>> {
    return this.withErrorHandling(
      async () => {
        const cacheKey = `file:${fileId}:preview`;
        return this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.get(`/api/files/${fileId}/preview`);
            return this.transformResponse(response);
          },
          300000 // 5 minutes TTL
        );
      },
      {
        component: 'FilesApiService',
        action: 'getFilePreview'
      }
    );
  }

  static async downloadFile(fileId: string): Promise<ErrorHandlingResult<Blob>> {
    return this.withErrorHandling(
      async () => {
        const response = await apiClient.get(`/api/files/${fileId}/download`, {
          responseType: 'blob',
        });
        if (response.error) {
          throw new Error(getErrorMessageFromApiError(response.error));
        }
        return response.data as Blob;
      },
      {
        component: 'FilesApiService',
        action: 'downloadFile'
      }
    );
  }
}
