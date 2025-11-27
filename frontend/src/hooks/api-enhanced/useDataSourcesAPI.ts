// ============================================================================
// DATA SOURCES API HOOK (Enhanced with Redux)
// ============================================================================

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/unifiedStore';
import { dataSourcesActions } from '../../store/unifiedStore';
import ApiService from '../../services/ApiService';
import { useNotificationHelpers } from '../../store/hooks';
import type { UploadedFile } from '../../types/backend-aligned';

export const useDataSourcesAPI = (projectId?: string) => {
  const dispatch = useAppDispatch();
  const {
    uploadedFiles: dataSources,
    isLoading,
    error,
    uploadProgress,
  } = useAppSelector((state) => state.dataIngestion);
  const { showSuccess, showError } = useNotificationHelpers();

  const fetchDataSources = useCallback(async () => {
    if (!projectId) return;

    try {
      dispatch(dataSourcesActions.fetchDataSourcesStart());
      const sources = await ApiService.getDataSources(projectId);
      const isValidSourceArray = (data: unknown): data is Array<Record<string, unknown>> => {
        return Array.isArray(data);
      };
      
      const validSources = isValidSourceArray(sources) ? sources : [];
      const uploadedFiles: UploadedFile[] = validSources.map((file) => ({
        id: file.id,
        project_id: file.project_id,
        filename: file.filename,
        original_filename: file.filename,
        file_size: file.file_size,
        content_type: file.content_type,
        file_path: file.file_path || '',
        status: (file.status as UploadedFile['status']) || 'uploaded',
        uploaded_by: file.uploaded_by,
        created_at: file.created_at,
        updated_at: file.updated_at,
      }));

      dispatch(dataSourcesActions.fetchDataSourcesSuccess(uploadedFiles));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data sources';
      dispatch(dataSourcesActions.fetchDataSourcesFailure(errorMessage));
      showError('Failed to Load Data Sources', errorMessage);
    }
  }, [projectId, dispatch, showError]);

  const uploadFile = useCallback(
    async (
      file: File,
      metadata: {
        name: string;
        source_type: string;
      }
    ) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        dispatch(dataSourcesActions.uploadFileStart());

        const response = await ApiService.uploadFile(projectId, file, metadata.name);
        const uploadedFile: UploadedFile = {
          id: response.id,
          project_id: projectId,
          filename: response.name,
          original_filename: file.name,
          file_size: response.file_size,
          content_type: response.source_type,
          file_path: '',
          status: (response.status as UploadedFile['status']) || 'uploaded',
          uploaded_by: '',
          created_at: response.uploaded_at || new Date().toISOString(),
          updated_at: response.uploaded_at || new Date().toISOString(),
        };

        dispatch(dataSourcesActions.uploadFileSuccess(uploadedFile));
        showSuccess('File Uploaded', `File "${file.name}" uploaded successfully`);

        return { success: true, dataSource: uploadedFile };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        dispatch(
          dataSourcesActions.uploadFileFailure({
            fileId: `${file.name}-${Date.now()}`,
            error: errorMessage,
          })
        );
        showError('Upload Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const processFile = useCallback(
    async (dataSourceId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        dispatch(dataSourcesActions.processFileStart());
        const result = await ApiService.processFile(projectId, dataSourceId);
        showSuccess('File Processed', 'File processed successfully');

        return { success: true, result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
        dispatch(
          dataSourcesActions.processFileFailure({
            dataSourceId,
            error: errorMessage,
          })
        );
        showError('Processing Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, dispatch, showSuccess, showError]
  );

  const deleteDataSource = useCallback(
    async (dataSourceId: string) => {
      if (!projectId) return { success: false, error: 'No project ID' };

      try {
        await ApiService.deleteDataSource(projectId, dataSourceId);
        showSuccess('Data Source Deleted', 'Data source deleted successfully');

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete data source';
        showError('Delete Failed', errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [projectId, showSuccess, showError]
  );

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  return {
    dataSources,
    isLoading,
    error,
    uploadProgress,
    fetchDataSources,
    uploadFile,
    processFile,
    deleteDataSource,
  };
};

