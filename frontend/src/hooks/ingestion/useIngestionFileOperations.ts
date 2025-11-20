/**
 * Custom hook for handling file operations (preview, delete) in the Ingestion page
 * Extracted from IngestionPage.tsx to improve code organization and reusability
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { ApiService } from '../../services/ApiService';
import { useToast } from '../useToast';
import { logger } from '../../services/logger';
import { UploadedFile } from '../../types/ingestion';

export interface UseIngestionFileOperationsOptions {
  projectId: string | null;
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

export interface UseIngestionFileOperationsReturn {
  previewFile: UploadedFile | null;
  previewContent: unknown;
  isLoadingPreview: boolean;
  deletingFileId: string | null;
  handleFilePreview: (fileId: string) => Promise<void>;
  handleFileDelete: (fileId: string) => Promise<void>;
  setPreviewFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>;
  setPreviewContent: React.Dispatch<React.SetStateAction<unknown>>;
}

/**
 * Hook for managing file preview and delete operations
 * @param options - Configuration options
 * @returns File operation state and functions
 */
export function useIngestionFileOperations({
  projectId,
  files,
  setFiles,
}: UseIngestionFileOperationsOptions): UseIngestionFileOperationsReturn {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [previewContent, setPreviewContent] = useState<unknown>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [deletingFileId, setIsDeleting] = useState<string | null>(null);
  const toast = useToast();

  const handleFilePreview = useCallback(
    async (fileId: string) => {
      if (!projectId) {
        toast.warning('No project selected');
        return;
      }

      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      setIsLoadingPreview(true);
      try {
        const response = await apiClient.getFilePreview(projectId, fileId);
        if (response.success && response.data) {
          setPreviewFile(file);
          setPreviewContent(response.data);
        } else {
          toast.error('Failed to load file preview');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load file preview';
        toast.error(errorMsg);
        logger.error('Preview failed', { error: errorMsg, fileId, projectId });
      } finally {
        setIsLoadingPreview(false);
      }
    },
    [projectId, files, toast]
  );

  const handleFileDelete = useCallback(
    async (fileId: string) => {
      if (!projectId) {
        toast.warning('No project selected');
        return;
      }

      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      setIsDeleting(fileId);
      try {
        await ApiService.deleteDataSource(projectId, fileId);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success('File deleted successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
        toast.error(errorMessage);
        logger.error('Delete failed', { error: errorMessage, fileId, projectId });
      } finally {
        setIsDeleting(null);
      }
    },
    [projectId, files, setFiles, toast]
  );

  return {
    previewFile,
    previewContent,
    isLoadingPreview,
    deletingFileId,
    handleFilePreview,
    handleFileDelete,
    setPreviewFile,
    setPreviewContent,
  };
}
