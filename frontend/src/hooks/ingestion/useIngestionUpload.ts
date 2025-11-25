/**
 * Custom hook for handling file uploads in the Ingestion page
 * Extracted from IngestionPage.tsx to improve code organization and reusability
 */

import { useState, useCallback } from 'react';
import { ApiService } from '../../services/ApiService';
import { useToast } from '../useToast';
import { logger } from '@/services/logger';
import { UploadedFile } from '@/types/ingestion';
import { getErrorMessage, toError } from '@/utils/errorExtraction';

export interface UseIngestionUploadOptions {
  projectId: string | null;
  onUploadSuccess?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
}

export interface UseIngestionUploadReturn {
  isUploading: boolean;
  uploadFile: (file: File) => Promise<UploadedFile | null>;
  uploadFiles: (files: File[]) => Promise<UploadedFile[]>;
}

/**
 * Hook for managing file uploads in the ingestion page
 * @param options - Configuration options for the upload hook
 * @returns Upload state and functions
 */
export function useIngestionUpload({
  projectId,
  onUploadSuccess,
  onUploadError,
}: UseIngestionUploadOptions): UseIngestionUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      if (!projectId) {
        toast.warning('No project selected');
        return null;
      }

      setIsUploading(true);
      try {
        const result = await ApiService.uploadFile(projectId, file, 'reconciliation_data');

        if (!result) {
          throw new Error('Upload failed - no response received');
        }

        const uploadedFile: UploadedFile = {
          id: result.id || `upload_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: (result.status as UploadedFile['status']) || 'processing',
          progress: 0,
        };

        toast.success('File uploaded successfully');
        onUploadSuccess?.([uploadedFile]);
        return uploadedFile;
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'Failed to upload file');
        logger.error('Upload failed', {
          error: errorMessage,
          projectId,
        });
        toast.error(errorMessage);
        const uploadError = toError(error, errorMessage);
        onUploadError?.(uploadError);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [projectId, toast, onUploadSuccess, onUploadError]
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadedFile[]> => {
      const uploadedFiles: UploadedFile[] = [];
      for (const file of files) {
        const result = await uploadFile(file);
        if (result) {
          uploadedFiles.push(result);
        }
      }
      if (uploadedFiles.length > 0) {
        toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      }
      return uploadedFiles;
    },
    [uploadFile, toast]
  );

  return {
    isUploading,
    uploadFile,
    uploadFiles,
  };
}
