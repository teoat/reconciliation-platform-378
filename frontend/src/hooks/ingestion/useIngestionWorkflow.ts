import { useState, useCallback, useEffect } from 'react';
import {
  UploadedFile,
  DataValidation,
  DataQualityMetrics,
  FieldMapping,
} from '../../types/ingestion';
import { transformApiFileToUploadedFile } from '@/utils/ingestion/dataTransformation';
import {
  validateUploadedFile,
  validateDataset,
  getValidationSummary,
} from '@/utils/ingestion/validation';
import { calculateDataQualityMetrics } from '@/utils/ingestion/qualityMetrics';
import { apiClient } from '@/services/apiClient';
import { getErrorMessage } from '@/utils/errorExtraction';

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

/**
 * Hook for managing the complete ingestion workflow
 *
 * @returns {Object} Ingestion workflow state and functions
 * @returns {IngestionWorkflowState} returns.state - Current workflow state
 * @returns {Function} returns.uploadFiles - Function to upload files
 * @returns {Function} returns.selectFile - Function to select a file for processing
 * @returns {Function} returns.validateFile - Function to validate selected file
 * @returns {Function} returns.updateMappings - Function to update field mappings
 * @returns {Function} returns.transformData - Function to transform data using mappings
 * @returns {Function} returns.resetWorkflow - Function to reset the workflow
 */
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
    error: null,
  });

  /**
   * Upload files to the ingestion workflow
   *
   * @param {FileList} files - Files to upload
   */
  const uploadFiles = useCallback(async (files: FileList) => {
    setState((prev) => ({ ...prev, isUploading: true, error: null }));

    try {
      const uploadedFiles: UploadedFile[] = [];

      // Generate mock data
      const mockData = {
        records: [
          { id: '1', name: 'John Doe', amount: 1000, date: '2024-01-01' },
          { id: '2', name: 'Jane Smith', amount: 2000, date: '2024-01-02' },
          { id: '3', name: 'Bob Johnson', amount: 1500, date: '2024-01-03' },
        ],
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Simulate API call - in real app this would upload to backend
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = {
          id: `upload_${Date.now()}`,
          records: Math.floor(Math.random() * 1000),
        };

        const uploadedFile: UploadedFile = {
          id: result.id,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'completed',
          progress: 100,
          records: result.records,
          data: mockData,
        };

        uploadedFiles.push(uploadedFile);
      }

      setState((prev) => ({
        ...prev,
        files: [...prev.files, ...uploadedFiles],
        isUploading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: getErrorMessage(error as Error, 'Upload failed'),
      }));
    }
  }, []);

  /**
   * Select a file for processing in the workflow
   *
   * @param {UploadedFile} file - File to select
   */
  const selectFile = useCallback((file: UploadedFile) => {
    setState((prev) => ({
      ...prev,
      selectedFile: file,
    }));
  }, []);

  // Validate selected file
  /**
   * Validate a specific file
   *
   * @param {UploadedFile} file - File to validate
   */
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

      const mockColumns: any[] = [
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
      const qualityMetrics = calculateDataQualityMetrics(mockData, mockColumns, validations.map(v => ({ severity: v.severity })));

      // Update file with processed data
      const updatedFile: UploadedFile = {
        ...file,
        status: 'completed' as const,
        records: mockData.length,
        data: { records: mockData },
        columns: mockColumns,
        qualityMetrics: {
          ...qualityMetrics,
          uniqueness: qualityMetrics.duplicates > 0 ? 100 - (qualityMetrics.duplicates / mockData.length) * 100 : 100,
          overallScore: (qualityMetrics.completeness + qualityMetrics.accuracy + qualityMetrics.consistency + qualityMetrics.validity) / 4,
        } as DataQualityMetrics & { uniqueness: number; overallScore: number },
        validations: validations as unknown as DataValidation[],
      };

      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === file.id ? updatedFile : f)),
        selectedFile: updatedFile,
        validations: validations as unknown as DataValidation[],
        qualityMetrics,
        isValidating: false,
      } as unknown as IngestionWorkflowState));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isValidating: false,
        error: getErrorMessage(error as Error, 'Validation failed'),
      }));
    }
  }, []);

  // Update field mappings
  const updateMappings = useCallback((mappings: FieldMapping[]) => {
    setState((prev) => ({
      ...prev,
      mappings,
    }));
  }, []);

  // Helper function to apply transformations to data
  const applyDataTransformations = useCallback(
    (data: Record<string, unknown>[], mappings: FieldMapping[]): Record<string, unknown>[] => {
      return data.map((row, index) => {
        const transformedRow: Record<string, unknown> = { ...row, id: `transformed_${index}` };

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
    },
    []
  );

  // Transform data using mappings
  const transformData = useCallback(async () => {
    const { selectedFile, mappings } = state;
    if (!selectedFile || !selectedFile.data || !selectedFile.data.records || mappings.length === 0) return;

    setState((prev) => ({ ...prev, isTransforming: true, error: null }));

    try {
      // Simulate transformation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const dataArray = Array.isArray(selectedFile.data.records)
        ? selectedFile.data.records
        : [selectedFile.data.records || {}];
      const transformedData = applyDataTransformations(dataArray as Record<string, unknown>[], mappings);

      // Update file with transformed data
      const updatedFile: UploadedFile = {
        ...selectedFile,
        cleanedData: transformedData,
      };

      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === selectedFile.id ? updatedFile : f)),
        selectedFile: updatedFile,
        isTransforming: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isTransforming: false,
        error: getErrorMessage(error as Error, 'Transformation failed'),
      }));
    }
  }, [state, applyDataTransformations]);

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
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: getErrorMessage(error as Error, 'Delete failed'),
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
function applyTransformation(value: unknown, transformation: string): unknown {
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
    case 'number': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    case 'date_format':
      try {
        const date = new Date(value as string | number);
        return date.toISOString().split('T')[0];
      } catch {
        return value;
      }
    default:
      return value;
  }
}