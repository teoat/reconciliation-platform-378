import React from 'react';
import { useData } from '../components/DataProvider';
import { PageConfig, StatsCard, ActionConfig } from '../../types/common';
import { BasePage } from '../components/BasePage';
import { FileUploadZone } from '../components/ingestion/FileUploadZone';
import { DataPreviewTable } from '../components/ingestion/DataPreviewTable';
import { FilePreviewModal } from '../components/ingestion/FilePreviewModal';
import { DataQualityPanel } from '../components/ingestion/DataQualityPanel';
import { ValidationResults } from '../components/ingestion/ValidationResults';
import { FieldMappingEditor } from '../components/ingestion/FieldMappingEditor';
import { DataTransformPanel } from '../components/ingestion/DataTransformPanel';
import { useIngestionWorkflow } from '../hooks/ingestion/useIngestionWorkflow';
import { useToast } from '../hooks/useToast';
import { Upload, FileText, Eye, Trash2 } from 'lucide-react';

const IngestionPageContent: React.FC = () => {
  const { currentProject } = useData();
  const toast = useToast();
  const { state, actions } = useIngestionWorkflow();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    try {
      await actions.uploadFiles(event.target.files);
    } catch (error) {
      toast.error('Failed to upload files');
    }
  };

  const handleFilePreview = async (fileId: string) => {
    // This would be implemented with the preview hook
    toast.info('Preview functionality would be implemented here');
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      await actions.deleteFile(fileId);
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error('Failed to delete file');
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
      value: state.files.length,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Processed Files',
      value: state.files.filter((f) => f.status === 'completed').length,
      icon: () => <div>✓</div>,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Processing Files',
      value: state.files.filter((f) => f.status === 'processing').length,
      icon: () => <div>⟳</div>,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Failed Files',
      value: state.files.filter((f) => f.status === 'error').length,
      icon: () => <div>⚠️</div>,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const actionsConfig: ActionConfig[] = [
    {
      label: state.isUploading ? 'Uploading...' : 'Upload Files',
      icon: Upload,
      onClick: () => {
        document.getElementById('file-upload')?.click();
      },
      variant: 'primary',
      loading: state.isUploading,
    },
  ];

  return (
    <BasePage config={config} stats={stats} actions={actionsConfig}>
      <div className="space-y-6">
        {/* Upload Section */}
        <FileUploadZone onFileUpload={handleFileUpload} isUploading={state.isUploading} />

        {/* Files List */}
        <DataPreviewTable
          files={state.files}
          onFilePreview={handleFilePreview}
          onFileDelete={handleFileDelete}
          isDeleting={null} // Would need to track individual deletions
        />

        {/* Quality & Validation Section */}
        {state.selectedFile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataQualityPanel metrics={state.qualityMetrics} isLoading={state.isValidating} />
            <ValidationResults validations={state.validations} isLoading={state.isValidating} />
          </div>
        )}

        {/* Field Mapping Section */}
        {state.selectedFile && state.currentStep === 'map' && (
          <FieldMappingEditor
            sourceColumns={state.selectedFile.columns || []}
            targetColumns={[]} // Would need target schema
            mappings={state.mappings}
            onMappingsChange={actions.updateMappings}
            isLoading={false}
          />
        )}

        {/* Data Transformation Section */}
        {state.selectedFile && state.currentStep === 'transform' && (
          <DataTransformPanel
            data={state.selectedFile.data || []}
            columns={state.selectedFile.columns || []}
            mappings={state.mappings}
            onTransformComplete={(transformedData) => {
              // Handle transformed data
              toast.success('Data transformation completed');
            }}
            isLoading={state.isTransforming}
          />
        )}

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={false} // Would be controlled by preview state
          onClose={() => {}}
          previewFile={null}
          previewContent={null}
          isLoadingPreview={false}
        />
      </div>
    </BasePage>
  );
};

export const IngestionPage: React.FC = () => <IngestionPageContent />;
