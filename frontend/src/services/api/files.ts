// Files API Service
import { apiClient } from '../apiClient';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export const filesApi = {
  async upload(file: File): Promise<FileMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<FileMetadata>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async download(fileId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async delete(fileId: string): Promise<void> {
    await apiClient.delete(`/files/${fileId}`);
  },

  async list(): Promise<FileMetadata[]> {
    const response = await apiClient.get<FileMetadata[]>('/files');
    return response.data;
  },
};
