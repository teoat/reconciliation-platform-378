import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, Trash2 } from 'lucide-react';
import { useData } from '@/components/DataProvider';
import { useToast } from '@/hooks/useToast';
import { PageConfig, StatsCard, ActionConfig } from '@/types/common';
import { UploadedFile } from '@/types/ingestion';

import { Modal } from '@/components/ui/Modal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinnerComponent } from '@/components/LoadingComponents';
import { BasePage } from '@/components/BasePage';
import { ProgressBar } from '@/components/ui/ProgressBar';

import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  ingestionPageMetadata,
  getIngestionOnboardingSteps,
  getIngestionPageContext,
  getIngestionWorkflowState,
  registerIngestionGuidanceHandlers,
  getIngestionGuidanceContent,
} from '@/orchestration/pages/IngestionPageOrchestration';
import { useIngestionUpload } from '@/hooks/ingestion/useIngestionUpload';
import { useIngestionFileOperations } from '@/hooks/ingestion/useIngestionFileOperations';

const IngestionPageContent: React.FC = () => {
  const { currentProject } = useData();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processingStatus, setProcessingStatus] = useState<
    'idle' | 'processing' | 'completed' | 'error'
  >('idle');

  // Use custom hooks for upload and file operations
  const { isUploading, uploadFiles } = useIngestionUpload({
    projectId: currentProject?.id || null,
    onUploadSuccess: (uploadedFiles) => {
      setFiles((prev) => [...prev, ...uploadedFiles]);
      setProcessingStatus('processing');
    },
  });

  const {
    previewFile,
    previewContent,
    isLoadingPreview,
    deletingFileId,
    handleFilePreview,
    handleFileDelete,
    setPreviewFile,
    setPreviewContent,
  } = useIngestionFileOperations({
    projectId: currentProject?.id || null,
    files,
    setFiles,
  });

  // Page Orchestration with Frenly AI
  const { updatePageContext, trackFeatureUsage, trackFeatureError, trackUserAction } =
    usePageOrchestration({
      pageMetadata: ingestionPageMetadata,
      getPageContext: () =>
        getIngestionPageContext(
          currentProject?.id,
          files.length,
          files.filter((f) => f.status === 'completed').length,
          processingStatus,
          currentProject?.name
        ),
      getOnboardingSteps: () =>
        getIngestionOnboardingSteps(
          files.length > 0,
          files.filter((f) => f.status === 'completed').length > 0
        ),
      getWorkflowState: () =>
        getIngestionWorkflowState(
          files.length,
          files.filter((f) => f.status === 'completed').length,
          processingStatus
        ),
      registerGuidanceHandlers: () => registerIngestionGuidanceHandlers(),
      getGuidanceContent: (topic) => getIngestionGuidanceContent(topic),
      onContextChange: (changes) => {
        logger.debug('Ingestion context changed', { changes });
      },
    });

  // Update context when files change
  useEffect(() => {
    updatePageContext({
      uploadedFilesCount: files.length,
      validatedFilesCount: files.filter((f) => f.status === 'completed').length,
      processingStatus: files.some((f) => f.status === 'processing')
        ? 'processing'
        : files.every((f) => f.status === 'completed' || f.status === 'error')
          ? 'completed'
          : 'idle',
    });
  }, [files, updatePageContext]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    trackFeatureUsage('file-upload', 'upload-started', { fileCount: selectedFiles.length });
    trackUserAction('file-upload', 'upload-button');

    try {
      const fileArray = Array.from(selectedFiles);
      await uploadFiles(fileArray);
      trackFeatureUsage('file-upload', 'upload-success', { fileCount: fileArray.length });
    } catch (error) {
      trackFeatureError('file-upload', error instanceof Error ? error : new Error('Upload failed'));
    }
  };

  const config: PageConfig = {
    title: 'Data Ingestion',
    description: 'Upload and process your data files for reconciliation',
    icon: Upload,
    path: '/ingestion',
    showStats: true,
    showActions: true,
  };

  const stats: StatsCard[] = [
    {
      title: 'Total Files',
      value: files.length,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Processed Files',
      value: files.filter((f) => f.status === 'completed').length,
      icon: () => <div>✓</div>,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Processing Files',
      value: files.filter((f) => f.status === 'processing').length,
      icon: () => <div>⟳</div>,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Failed Files',
      value: files.filter((f) => f.status === 'error').length,
      icon: () => <div>⚠️</div>,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const actions: ActionConfig[] = [
    {
      label: isUploading ? 'Uploading...' : 'Upload Files',
      icon: Upload,
      onClick: () => {
        document.getElementById('file-upload')?.click();
      },
      variant: 'primary',
      loading: isUploading,
    },
  ];

  return (
    <BasePage config={config} stats={stats} actions={actions}>
      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-8 text-center transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-600 mb-4">
              Support for CSV, Excel (.xlsx, .xls), and other data formats
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
              id="file-upload"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </label>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Uploaded Files ({files.length})
          </h2>
        </div>
        <div className="p-6">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">{file.name}</h3>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFilePreview(file.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        aria-label={`Preview file ${file.name}`}
                        title={`Preview ${file.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        disabled={deletingFileId === file.id}
                        className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingFileId === file.id ? (
                          <LoadingSpinnerComponent size="sm" color="primary" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => {
          setPreviewFile(null);
          setPreviewContent(null);
        }}
        title={previewFile ? `Preview: ${previewFile.name}` : ''}
        size="lg"
      >
        {previewFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">File Name</p>
                <p className="text-sm text-gray-900">{previewFile.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Size</p>
                <p className="text-sm text-gray-900">
                  {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-sm text-gray-900">{previewFile.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-sm text-gray-900">{previewFile.status}</p>
              </div>
              {previewFile.uploaded_at && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Uploaded At</p>
                  <p className="text-sm text-gray-900">
                    {new Date(previewFile.uploaded_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinnerComponent size="md" />
                  <span className="ml-2 text-sm text-gray-600">Loading preview...</span>
                </div>
              ) : previewContent ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">Content Preview</p>
                    {previewContent.truncated && (
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        Preview truncated
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-3 max-h-64 overflow-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {previewContent.preview || 'No preview available'}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500">
                    Showing first 10 lines or 1KB of content for security.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Click the preview button to load file content.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </BasePage>
  );
};

export const IngestionPage: React.FC = () => (
  <ErrorBoundary
    fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
        <p className="text-red-600 mt-2">
          Unable to load the data ingestion page. Please refresh the page.
        </p>
      </div>
    }
  >
    <IngestionPageContent />
  </ErrorBoundary>
);
