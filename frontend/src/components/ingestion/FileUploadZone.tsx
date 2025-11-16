import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  acceptedTypes?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
  isUploading,
  acceptedTypes = '.csv,.xlsx,.xls,.json',
}) => {
  return (
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
            accept={acceptedTypes}
            className="hidden"
            id="file-upload"
            onChange={onFileUpload}
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </label>
        </div>
      </div>
    </div>
  );
};
