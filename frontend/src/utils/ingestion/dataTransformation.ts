// Data transformation utilities for ingestion
import { UploadedFile } from '@/types/ingestion';

/**
 * API file response type (partial, matches what the API returns)
 */
export interface ApiFileResponse {
  id: string;
  name?: string;
  filename?: string;
  size?: number;
  type?: string;
  content_type?: string;
  status?: string;
  progress?: number;
  records?: unknown;
  data?: unknown;
  columns?: unknown;
  fileType?: string;
  qualityMetrics?: unknown;
  validations?: unknown;
  mappings?: unknown;
  cleanedData?: unknown;
  originalData?: unknown;
  extractedContent?: unknown;
  chatMessages?: unknown;
  contractAnalysis?: unknown;
  previewUrl?: string;
  thumbnailUrl?: string;
  file?: File;
}

/**
 * Converts bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Transforms API response to UploadedFile format
 */
export const transformApiFileToUploadedFile = (apiFile: ApiFileResponse): UploadedFile => {
  return {
    id: apiFile.id,
    name: apiFile.name || apiFile.filename,
    size: apiFile.size || 0,
    type: apiFile.type || apiFile.content_type || 'Unknown',
    status: apiFile.status || 'processing',
    progress: apiFile.progress || 0,
    records: apiFile.records,
    data: apiFile.data,
    columns: apiFile.columns,
    fileType: apiFile.fileType || 'other',
    qualityMetrics: apiFile.qualityMetrics,
    validations: apiFile.validations,
    mappings: apiFile.mappings,
    cleanedData: apiFile.cleanedData,
    originalData: apiFile.originalData,
    extractedContent: apiFile.extractedContent,
    chatMessages: apiFile.chatMessages,
    contractAnalysis: apiFile.contractAnalysis,
    previewUrl: apiFile.previewUrl,
    thumbnailUrl: apiFile.thumbnailUrl,
    file: apiFile.file,
  };
};

/**
 * Filters files by status
 */
export const filterFilesByStatus = (
  files: UploadedFile[],
  status: UploadedFile['status']
): UploadedFile[] => {
  return files.filter((file) => file.status === status);
};

/**
 * Calculates file statistics
 */
export const calculateFileStats = (files: UploadedFile[]) => {
  return {
    total: files.length,
    completed: filterFilesByStatus(files, 'completed').length,
    processing: filterFilesByStatus(files, 'processing').length,
    failed: filterFilesByStatus(files, 'error').length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
  };
};

/**
 * Sorts files by various criteria
 */
export const sortFiles = (
  files: UploadedFile[],
  sortBy: 'name' | 'size' | 'date' | 'status',
  direction: 'asc' | 'desc' = 'asc'
): UploadedFile[] => {
  return [...files].sort((a, b) => {
    let aValue: unknown;
    let bValue: unknown;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'size':
        aValue = a.size;
        bValue = b.size;
        break;
      case 'date':
        // Assuming uploaded_at is a string, convert to timestamp
        aValue = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
        bValue = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};
