import { useState, useCallback, useEffect } from 'react';
import {
  UploadedFile,
  DataValidation,
  DataQualityMetrics,
  FieldMapping,
} from '../../types/ingestion';
import { transformApiFileToUploadedFile } from '../../utils/ingestion/dataTransformation';
import {
  validateUploadedFile,
  validateDataset,
  getValidationSummary,
} from '../../utils/ingestion/validation';
import { calculateDataQualityMetrics } from '../../utils/ingestion/qualityMetrics';
import { apiClient } from '../../services/apiClient';

export interface IngestionWorkflowState {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  validations: DataValidation[];
  qualityMetrics: DataQualityMetrics | null;
  mappings: FieldMapping[];
  isUploading: boolean;
  isValidating: boolean;
  isProcessing: boolean;
  isTransforming: boolean;
  currentStep: 'upload' | 'validate' | 'map' | 'transform' | 'complete';
  error: string | null;
}

export interface IngestionWorkflowActions {
  uploadFiles: (files: FileList) => Promise<void>;
  selectFile: (file: UploadedFile) => void;
  validateFile: (file: UploadedFile) => Promise<void>;
  updateMappings: (mappings: FieldMapping[]) => void;
  transformData: () => Promise<void>;
  resetWorkflow: () => void;
  deleteFile: (fileId: string) => Promise<void>;
}

export const useIngestionWorkflow = () => {
  const [state, setState] = useState<IngestionWorkflowState>({
    files: [],
    selectedFile: null,
    validations: [],
    qualityMetrics: null,
    mappings: [],
    isUploading: false,
    isValidating: false,
    isProcessing: false,
    isTransforming: false,
    currentStep: 'upload',
    error: null,
  });

  // Upload files
  const uploadFiles = useCallback(async (files: FileList) => {
    setState((prev) => ({ ...prev, isUploading: true, error: null }));

    try {
      const uploadedFiles: UploadedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Simulate API call - in real app this would upload to backend
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const uploadedFile: UploadedFile = {
          id: `file_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          type: file.type || 'Unknown',
          status: 'processing',
          progress: 0,
          fileType: 'other',
        };

        uploadedFiles.push(uploadedFile);
      }

      setState((prev) => ({
        ...prev,
        files: [...prev.files, ...uploadedFiles],
        isUploading: false,
        currentStep: uploadedFiles.length > 0 ? 'validate' : 'upload',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  }, []);

  // Select file for processing
  const selectFile = useCallback((file: UploadedFile) => {
    setState((prev) => ({
      ...prev,
      selectedFile: file,
      validations: [],
      qualityMetrics: null,
      mappings: [],
      currentStep: 'validate',
    }));
  }, []);

  // Validate selected file
  const validateFile = useCallback(async (file: UploadedFile) => {
    if (!file) return;

    setState((prev) => ({ ...prev, isValidating: true, error: null }));

    try {
      // Simulate validation process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock data for validation
      const mockData = [
        { id: '1', name: 'John Doe', amount: 1000, date: '2024-01-01' },
        { id: '2', name: 'Jane Smith', amount: 2000, date: '2024-01-02' },
        { id: '3', name: 'Bob Johnson', amount: 1500, date: '2024-01-03' },
      ];

      const mockColumns = [
        {
          name: 'id',
          type: 'string' as const,
          nullable: false,
          unique: true,
          sampleValues: ['1', '2', '3'],
        },
        {
          name: 'name',
          type: 'string' as const,
          nullable: false,
          unique: false,
          sampleValues: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        },
        {
          name: 'amount',
          type: 'number' as const,
          nullable: false,
          unique: false,
          sampleValues: [1000, 2000, 1500],
        },
        {
          name: 'date',
          type: 'date' as const,
          nullable: false,
          unique: false,
          sampleValues: ['2024-01-01', '2024-01-02', '2024-01-03'],
        },
      ];

      const validations = validateDataset(mockData, mockColumns);
      const qualityMetrics = calculateDataQualityMetrics(mockData, mockColumns, validations);

      // Update file with processed data
      const updatedFile = {
        ...file,
        status: 'completed' as const,
        records: mockData.length,
        data: mockData,
        columns: mockColumns,
        qualityMetrics,
        validations,
      };

      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === file.id ? updatedFile : f)),
        selectedFile: updatedFile,
        validations,
        qualityMetrics,
        isValidating: false,
        currentStep: 'map',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isValidating: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      }));
    }
  }, []);

  // Update field mappings
  const updateMappings = useCallback((mappings: FieldMapping[]) => {
    setState((prev) => ({
      ...prev,
      mappings,
      currentStep: mappings.length > 0 ? 'transform' : 'map',
    }));
  }, []);

  // Transform data using mappings
  const transformData = useCallback(async () => {
    const { selectedFile, mappings } = state;
    if (!selectedFile || !selectedFile.data || mappings.length === 0) return;

    setState((prev) => ({ ...prev, isTransforming: true, error: null }));

    try {
      // Simulate transformation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Apply transformations
      const transformedData = selectedFile.data.map((row, index) => {
        const transformedRow = { ...row, id: `transformed_${index}` };

        mappings.forEach((mapping) => {
          if (row[mapping.sourceField] !== undefined) {
            let value = row[mapping.sourceField];

            // Apply transformation
            if (mapping.transformation) {
              value = applyTransformation(value, mapping.transformation);
            }

            transformedRow[mapping.targetField] = value;
          }
        });

        return transformedRow;
      });

      // Update file with transformed data
      const updatedFile = {
        ...selectedFile,
        data: transformedData,
        cleanedData: transformedData,
      };

      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === selectedFile.id ? updatedFile : f)),
        selectedFile: updatedFile,
        isTransforming: false,
        currentStep: 'complete',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isTransforming: false,
        error: error instanceof Error ? error.message : 'Transformation failed',
      }));
    }
  }, [state]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        files: prev.files.filter((f) => f.id !== fileId),
        selectedFile: prev.selectedFile?.id === fileId ? null : prev.selectedFile,
        validations: prev.selectedFile?.id === fileId ? [] : prev.validations,
        qualityMetrics: prev.selectedFile?.id === fileId ? null : prev.qualityMetrics,
        mappings: prev.selectedFile?.id === fileId ? [] : prev.mappings,
        currentStep: prev.selectedFile?.id === fileId ? 'upload' : prev.currentStep,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Delete failed',
      }));
    }
  }, []);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    setState({
      files: [],
      selectedFile: null,
      validations: [],
      qualityMetrics: null,
      mappings: [],
      isUploading: false,
      isValidating: false,
      isProcessing: false,
      isTransforming: false,
      currentStep: 'upload',
      error: null,
    });
  }, []);

  // Auto-validate when file is selected
  useEffect(() => {
    if (state.selectedFile && state.selectedFile.status === 'processing' && !state.isValidating) {
      validateFile(state.selectedFile);
    }
  }, [state.selectedFile, state.isValidating, validateFile]);

  const actions: IngestionWorkflowActions = {
    uploadFiles,
    selectFile,
    validateFile,
    updateMappings,
    transformData,
    resetWorkflow,
    deleteFile,
  };

  return {
    state,
    actions,
  };
};

// Helper function for transformations
function applyTransformation(value: any, transformation: string): any {
  if (!value) return value;

  const transformType = transformation.toLowerCase().trim();

  switch (transformType) {
    case 'trim':
      return String(value).trim();
    case 'uppercase':
      return String(value).toUpperCase();
    case 'lowercase':
      return String(value).toLowerCase();
    case 'capitalize':
      return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
    case 'number':
      const num = Number(value);
      return isNaN(num) ? value : num;
    case 'date_format':
      try {
        const date = new Date(value);
        return date.toISOString().split('T')[0];
      } catch {
        return value;
      }
    default:
      return value;
  }
}
