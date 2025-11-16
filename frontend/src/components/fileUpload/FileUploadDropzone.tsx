'use client';
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadDropzoneProps {
  dragActive: boolean;
  maxFileSize: number;
  allowedTypes: string[];
  multiple: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onFileSelect: (files: File[]) => void;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  dragActive,
  maxFileSize,
  allowedTypes,
  multiple,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onFileSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      role="region"
      aria-label="File upload drop zone"
    >
      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Drop files here or click to upload
      </h3>
      <p className="text-gray-600 mb-4">
        Support for CSV, Excel files up to {Math.round(maxFileSize / 1024 / 1024)}MB
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
        aria-label="Choose files to upload"
      >
        <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
        Choose Files
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes.join(',')}
        onChange={(e) => {
          if (e.target.files) {
            onFileSelect(Array.from(e.target.files));
          }
        }}
        className="hidden"
        aria-label="File input"
      />
    </div>
  );
};

