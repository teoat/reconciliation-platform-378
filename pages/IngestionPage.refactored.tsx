'use client';

import { useState, useCallback } from 'react';
import { useData } from '../components/DataProvider';
import { useUnifiedData } from '../components/UnifiedDataProvider';
import { useIngestionJobs, useProjects } from '../hooks/useApi';
import { Project } from '../types';

// Import all extracted types
import type {
  UploadedFile,
  DataRow,
  SortConfig,
  FilterConfig,
  PaginationConfig,
} from '../types/ingestion';

// Import all extracted utilities
import {
  cleanAndStandardizeData,
  validateData,
  analyzeDataQuality,
  inferColumnTypes,
  detectFileType,
  generateSampleData,
} from '../utils/ingestion';

// Import all extracted components
import {
  DataQualityPanel,
  ValidationResults,
  FileUploadZone,
  DataPreviewTable,
  FieldMappingEditor,
  DataTransformPanel,
} from '../components/ingestion';

// Import all extracted hooks
import {
  useDataValidation,
  useDataQuality,
  useIngestionWorkflow,
  useFieldMapping,
  useDataPreview,
} from '../hooks/ingestion';

interface IngestionPageProps {
  project: Project;
}

const IngestionPage = ({ project }: IngestionPageProps) => {
  // Context hooks
  const { currentProject, addIngestionData, transformIngestionToReconciliation } = useData();
  const { crossPageData, updateCrossPageData, workflowProgress, advanceWorkflow } = useUnifiedData();
  const { projects, createProject } = useProjects();
  const { uploadFile: uploadFileToAPI, processData: processDataWithAPI } = useIngestionJobs();

  // Workflow hook
  const {
    currentStep,
    selectedFile: workflowSelectedFile,
    setSelectedFile: setWorkflowSelectedFile,
    nextStep,
    previousStep,
  } = useIngestionWorkflow();

  // State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extracted hooks
  const { validations, validate, hasErrors } = useDataValidation();
  const { metrics, analyze } = useDataQuality();
  const {
    mappings,
    addMapping,
    updateMapping,
    removeMapping,
    autoMap,
  } = useFieldMapping(selectedFile?.columns || []);

  // Data preview hook (handles sorting, filtering, pagination)
  const {
    sortConfig,
    filters,
    pagination,
    paginatedData,
    handleSort,
    addFilter,
    removeFilter,
    clearFilters,
    handlePageChange,
    handlePageSizeChange,
  } = useDataPreview(selectedFile?.data || []);

  // File upload handler
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const newFiles: UploadedFile[] = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        fileType: detectFileType(file.name, file.type),
        file,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Process files
      for (const fileObj of newFiles) {
        const file = files.find((f) => f.name === fileObj.name)!;
        await processFile(file, fileObj);
      }
    },
    []
  );

  // Process file using utilities
  const processFile = useCallback(
    async (file: File, fileObj: UploadedFile) => {
      try {
        // Simulate processing
        const recordCount = Math.floor(Math.random() * 5000) + 500;
        const sampleData = generateSampleData(fileObj.fileType, recordCount);
        const cleaned = cleanAndStandardizeData(sampleData, fileObj.fileType);
        const columns = inferColumnTypes(cleaned);
        const quality = analyze(cleaned);
        const validated = validate(cleaned, fileObj.fileType);

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id
              ? {
                  ...f,
                  status: 'completed',
                  progress: 100,
                  data: cleaned,
                  columns,
                  qualityMetrics: quality,
                  validations: validated,
                  records: cleaned.length,
                }
              : f
          )
        );
      } catch (error) {
        console.error('Error processing file:', error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: 'error', progress: 0 } : f
          )
        );
      }
    },
    [analyze, validate]
  );

  const handleRemoveFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  }, [selectedFile]);

  const handleProcessFiles = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Process all completed files
      const completedFiles = uploadedFiles.filter((f) => f.status === 'completed');
      for (const file of completedFiles) {
        if (file.file) {
          await uploadFileToAPI(file.file, project.id, file.name, 'ingestion_data');
        }
      }
      // Sync to reconciliation
      if (currentProject) {
        transformIngestionToReconciliation(currentProject.id);
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFiles, project, currentProject, uploadFileToAPI, transformIngestionToReconciliation]);

  const handleTransform = useCallback((transformedData: DataRow[]) => {
    if (selectedFile) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === selectedFile.id ? { ...f, data: transformedData, cleanedData: transformedData } : f
        )
      );
      setSelectedFile({ ...selectedFile, data: transformedData, cleanedData: transformedData });
    }
  }, [selectedFile]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Data Ingestion</h1>
        <button
          onClick={handleProcessFiles}
          disabled={isProcessing || uploadedFiles.every((f) => f.status !== 'completed')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Process Files'}
        </button>
      </div>

      {/* File Upload Zone */}
      <FileUploadZone
        onFilesSelected={handleFilesSelected}
        uploadedFiles={uploadedFiles}
        onRemoveFile={handleRemoveFile}
      />

      {/* Selected File Details */}
      {selectedFile && (
        <div className="space-y-6">
          {/* Data Quality Panel */}
          {selectedFile.qualityMetrics && (
            <DataQualityPanel metrics={selectedFile.qualityMetrics} />
          )}

          {/* Validation Results */}
          {selectedFile.validations && selectedFile.validations.length > 0 && (
            <ValidationResults validations={selectedFile.validations} />
          )}

          {/* Data Preview Table */}
          {selectedFile.data && selectedFile.data.length > 0 && (
            <DataPreviewTable
              data={selectedFile.data}
              sortConfig={sortConfig}
              onSort={handleSort}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}

          {/* Field Mapping Editor */}
          {selectedFile.columns && (
            <FieldMappingEditor
              mappings={mappings}
              onMappingsChange={(newMappings) => {
                newMappings.forEach((m, i) => {
                  if (mappings[i]) {
                    updateMapping(i, m);
                  } else {
                    addMapping(m);
                  }
                });
              }}
              availableFields={selectedFile.columns.map((c) => c.name)}
            />
          )}

          {/* Data Transform Panel */}
          {selectedFile.data && mappings.length > 0 && (
            <DataTransformPanel
              data={selectedFile.data}
              mappings={mappings}
              onMappingsChange={(newMappings) => {
                newMappings.forEach((m, i) => updateMapping(i, m));
              }}
              onTransform={handleTransform}
            />
          )}
        </div>
      )}

      {/* File Selection */}
      {uploadedFiles.length > 0 && !selectedFile && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedFile(file)}
              >
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {file.records || 0} records • {file.status}
                  </p>
                </div>
                {file.qualityMetrics && (
                  <div className="text-sm">
                    Quality: {file.qualityMetrics.completeness}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IngestionPage;

