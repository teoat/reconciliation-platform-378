import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { UploadedFile } from './types';

interface FileUploadSectionProps {
  onFilesUploaded: (files: File[]) => void;
  isUploading: boolean;
  uploadedFiles: UploadedFile[];
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFilesUploaded,
  isUploading,
  uploadedFiles,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesUploaded(acceptedFiles);
      setDragActive(false);
    },
    [onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">File Upload</h2>
        <div className="text-sm text-secondary-500">
          {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive || dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-secondary-300 hover:border-primary-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-secondary-400 mb-4" />
        <div className="text-lg font-medium text-secondary-900 mb-2">
          {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
        </div>
        <div className="text-sm text-secondary-500">
          Supports PDF, images, videos, spreadsheets, and text files (max 100MB each)
        </div>
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full animate-pulse"
                style={{ width: '60%' }}
              ></div>
            </div>
            <div className="text-xs text-secondary-500 mt-1">Processing files...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;
