// ============================================================================
// DATA INGESTION SLICE
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { uploadFile, fetchUploadedFiles } from '../asyncThunkUtils';
import type { DataIngestionState } from '../types';
import type { UploadedFile } from '../../types/backend-aligned';

const initialDataIngestionState: DataIngestionState = {
  uploadedFiles: [],
  processedData: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,
};

export const dataIngestionSlice = createSlice({
  name: 'dataIngestion',
  initialState: initialDataIngestionState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Compatibility actions for useApiEnhanced.ts (dataSourcesActions)
    fetchDataSourcesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchDataSourcesSuccess: (state, action: PayloadAction<UploadedFile[]>) => {
      state.uploadedFiles = action.payload || [];
      state.isLoading = false;
      state.error = null;
    },
    fetchDataSourcesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    uploadFileStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.uploadProgress = 0;
    },
    uploadFileSuccess: (state, action: PayloadAction<UploadedFile>) => {
      state.uploadedFiles.unshift(action.payload);
      state.uploadProgress = 100;
      state.isLoading = false;
      state.error = null;
    },
    uploadFileFailure: (state, action: PayloadAction<{ fileId: string; error: string }>) => {
      state.isLoading = false;
      state.error = action.payload.error;
      state.uploadProgress = 0;
    },
    processFileStart: (state) => {
      state.isLoading = true;
    },
    processFileSuccess: (state, action: PayloadAction<UploadedFile>) => {
      const index = state.uploadedFiles.findIndex((f) => f.id === action.payload.id);
      if (index !== -1) {
        state.uploadedFiles[index] = action.payload;
      }
      state.isLoading = false;
    },
    processFileFailure: (state, action: PayloadAction<{ dataSourceId: string; error: string }>) => {
      state.isLoading = false;
      state.error = action.payload.error;
    },
  },
  extraReducers: (builder) => {
    // Upload File
    builder
      .addCase(uploadFile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as unknown;
        if (payload && typeof payload === 'object') {
          const file = payload as Partial<UploadedFile>;
          if (file.id) {
            state.uploadedFiles.unshift(file as UploadedFile);
          }
        }
        state.uploadProgress = 100;
        state.error = null;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.uploadProgress = 0;
      })
      // Fetch Files
      .addCase(fetchUploadedFiles.fulfilled, (state, action) => {
        state.uploadedFiles = (action.payload as UploadedFile[]) || [];
      });
  },
});

export const dataSourcesActions = dataIngestionSlice.actions; // Alias for compatibility
export default dataIngestionSlice.reducer;

