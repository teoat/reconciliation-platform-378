import React from 'react';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { UploadedFile } from '../../types/ingestion';
import { LoadingSpinnerComponent } from '../LoadingComponents';

interface DataPreviewTableProps {
  files: UploadedFile[];
  onFilePreview: (fileId: string) => void;
  onFileDelete: (fileId: string) => void;
  isDeleting?: string | null;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  files,
  onFilePreview,
  onFileDelete,
  isDeleting,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
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
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onFilePreview(file.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      aria-label={`Preview file ${file.name}`}
                      title={`Preview ${file.name}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onFileDelete(file.id)}
                      disabled={isDeleting === file.id}
                      className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting === file.id ? (
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
  );
};
