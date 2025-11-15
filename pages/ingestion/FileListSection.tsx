import React from 'react';
import { FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import { UploadedFile } from './types';

interface FileListSectionProps {
  uploadedFiles: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
  onDownloadFile: (fileId: string) => void;
}

const FileListSection: React.FC<FileListSectionProps> = ({
  uploadedFiles,
  onRemoveFile,
  onDownloadFile,
}) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType === 'text/csv') return '📈';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Uploaded Files</h3>
        <div className="text-sm text-secondary-500">
          {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {uploadedFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center space-x-3 p-3 border border-secondary-200 rounded-lg"
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-lg">
                {getFileIcon(file.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-sm truncate">{file.name}</span>
                {file.processingStatus === 'completed' && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                {file.processingStatus === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-secondary-500">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    file.processingStatus === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : file.processingStatus === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : file.processingStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {file.processingStatus}
                </span>
              </div>

              {file.error && <div className="mt-1 text-xs text-red-600">{file.error}</div>}
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => onDownloadFile(file.id)}
                className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemoveFile(file.id)}
                className="p-1 text-secondary-400 hover:text-red-600 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {uploadedFiles.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload files above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileListSection;
