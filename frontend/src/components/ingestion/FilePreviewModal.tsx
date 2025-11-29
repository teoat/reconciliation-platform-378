import React from 'react';
import { Modal } from '../ui/Modal';
import { LoadingSpinnerComponent } from '../LoadingComponents';
import { UploadedFile } from '../../types/ingestion/index';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewFile: UploadedFile | null;
  previewContent: {
    file_id: string;
    filename: string;
    content_type: string;
    size: number;
    preview: string;
    truncated: boolean;
  } | null;
  isLoadingPreview: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  previewFile,
  previewContent,
  isLoadingPreview,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
              <p className="text-sm text-gray-900">{formatFileSize(previewFile.size)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Type</p>
              <p className="text-sm text-gray-900">{previewFile.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-sm text-gray-900">{previewFile.status}</p>
            </div>
            {previewFile.uploadedAt && (
              <div>
                <p className="text-sm font-medium text-gray-600">Uploaded At</p>
                <p className="text-sm text-gray-900">
                  {new Date(previewFile.uploadedAt).toLocaleString()}
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
  );
};
