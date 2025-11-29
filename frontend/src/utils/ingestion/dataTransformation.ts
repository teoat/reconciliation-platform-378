// Data transformation utilities for ingestion
import type { UploadedFile } from '@/types/ingestion/index';

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
  const status = (apiFile.status || 'processing') as UploadedFile['status'];
  const fileType = (apiFile.fileType || 'other') as UploadedFile['fileType'];
  const progress = typeof apiFile.progress === 'number' ? apiFile.progress : 0;
  
  return {
    id: apiFile.id,
    name: apiFile.name || apiFile.filename || '',
    size: apiFile.size || 0,
    type: apiFile.type || apiFile.content_type || 'Unknown',
    status,
    progress,
    records: typeof apiFile.records === 'number' ? apiFile.records : undefined,
    data: Array.isArray(apiFile.data) ? apiFile.data as UploadedFile['data'] : undefined,
    columns: Array.isArray(apiFile.columns) ? apiFile.columns as UploadedFile['columns'] : [],
    fileType,
    qualityMetrics: apiFile.qualityMetrics && typeof apiFile.qualityMetrics === 'object' && 'completeness' in apiFile.qualityMetrics
      ? apiFile.qualityMetrics as UploadedFile['qualityMetrics']
      : {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          validity: 0,
          duplicates: 0,
          errors: 0,
        },
    validations: Array.isArray(apiFile.validations) ? apiFile.validations as UploadedFile['validations'] : [],
    mappings: Array.isArray(apiFile.mappings) ? apiFile.mappings as UploadedFile['mappings'] : [],
    cleanedData: Array.isArray(apiFile.cleanedData) ? apiFile.cleanedData as UploadedFile['cleanedData'] : [],
    originalData: Array.isArray(apiFile.originalData) ? apiFile.originalData : undefined,
    extractedContent: apiFile.extractedContent,
    chatMessages: Array.isArray(apiFile.chatMessages) ? apiFile.chatMessages as UploadedFile['chatMessages'] : undefined,
    contractAnalysis: apiFile.contractAnalysis && typeof apiFile.contractAnalysis === 'object' && 'parties' in apiFile.contractAnalysis
      ? apiFile.contractAnalysis as UploadedFile['contractAnalysis']
      : undefined,
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
        aValue = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        bValue = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }

    // Normalize values to strings or numbers for safe comparison
    const aComparable = typeof aValue === 'number' || typeof aValue === 'string' ? aValue : String(aValue ?? '');
    const bComparable = typeof bValue === 'number' || typeof bValue === 'string' ? bValue : String(bValue ?? '');

    if (aComparable < bComparable) return direction === 'asc' ? -1 : 1;
    if (aComparable > bComparable) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};
