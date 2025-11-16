/**
 * Extracted components from IngestionPage
 * These components were extracted to improve maintainability and reduce file size
 */

import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * File Upload Section Component
 */
export const FileUploadSection: React.FC<{
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}> = ({ onUpload, isUploading }) => {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Drag and drop files here or click to browse</p>
          <Button
            variant="primary"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.onchange = (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                onUpload(files);
              };
              input.click();
            }}
            disabled={isUploading}
            aria-label="Upload files"
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

/**
 * File List Component
 */
export const FileList: React.FC<{
  files: Array<{ id: string; name: string; status: string; size?: number }>;
  onRemove?: (id: string) => void;
}> = ({ files, onRemove }) => {
  if (files.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No files uploaded yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              role="listitem"
            >
              <div className="flex items-center space-x-3">
                {file.status === 'processed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" aria-label="Processed" />
                ) : file.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" aria-label="Error" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400" aria-label="Processing" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  {file.size && (
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  )}
                </div>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(file.id)}
                  aria-label={`Remove ${file.name}`}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

/**
 * Upload Statistics Component
 */
export const UploadStatistics: React.FC<{
  totalFiles: number;
  processedFiles: number;
  totalSize: number;
}> = ({ totalFiles, processedFiles, totalSize }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Files</p>
          <p className="text-2xl font-semibold text-gray-900" aria-label={`Total files: ${totalFiles}`}>
            {totalFiles}
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-1">Processed</p>
          <p className="text-2xl font-semibold text-green-600" aria-label={`Processed files: ${processedFiles}`}>
            {processedFiles}
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Size</p>
          <p className="text-2xl font-semibold text-gray-900" aria-label={`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`}>
            {(totalSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </Card>
    </div>
  );
};

