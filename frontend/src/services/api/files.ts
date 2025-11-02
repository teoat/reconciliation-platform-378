// ============================================================================
// FILE MANAGEMENT API SERVICE
// ============================================================================

import { apiClient } from '../apiClient';
import { FileUploadResponse } from '../apiClient/types';

export class FilesApiService {
  static async uploadFile(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);

      const response = await apiClient.uploadFile(formData, onProgress);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data as FileUploadResponse;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to upload file');
    }
  }

  static async getFiles(projectId: string, params: {
    page?: number;
    per_page?: number;
    type?: string;
  } = {}) {
    try {
      const { page = 1, per_page = 20, type } = params;
      const response = await apiClient.get(`/api/projects/${projectId}/files`, {
        params: { page, per_page, type },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        files: response.data?.data || [],
        pagination: response.data?.pagination || {
          page,
          per_page,
          total: response.data?.data?.length || 0,
          total_pages: Math.ceil((response.data?.data?.length || 0) / per_page),
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
        throw new Error(response.error.message);
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
        throw new Error(response.error.message);
      }
      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  }

  static async getFilePreview(fileId: string) {
    try {
      const response = await apiClient.get(`/api/files/${fileId}/preview`);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch file preview');
    }
  }

  static async downloadFile(fileId: string) {
    try {
      const response = await apiClient.get(`/api/files/${fileId}/download`, {
        responseType: 'blob',
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to download file');
    }
  }
}

