// File Upload Zone Component
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import type { UploadedFile } from '../../types/ingestion';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
  className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  uploadedFiles,
  onRemoveFile,
  className = '',
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV, JSON, Excel, PDF, and more
            </p>
          </>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-700">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <FileItem key={file.id} file={file} onRemove={onRemoveFile} />
          ))}
        </div>
      )}
    </div>
  );
};

interface FileItemProps {
  file: UploadedFile;
  onRemove: (fileId: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <FileText className="w-5 h-5 text-gray-400" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{file.name}</div>
          <div className="text-xs text-gray-500">
            {file.size} bytes •{' '}
            <span className={getStatusColor(file.status)}>{file.status}</span>
          </div>
        </div>
      </div>
      {file.progress < 100 && (
        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
      <button
        onClick={() => onRemove(file.id)}
        className="p-1 hover:bg-gray-200 rounded"
        aria-label="Remove file"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};

