import React, { useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import { APP_CONFIG, API_ENDPOINTS } from '@/config/AppConfig';
import { useTier4Callback } from '@/utils/tier4Helpers';

interface IngestionPageProps {
  project: any;
  onProgressUpdate: (step: string) => void;
}

const IngestionPage: React.FC<IngestionPageProps> = ({ project, onProgressUpdate }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    // Simple validation
    const validFiles = selectedFiles.filter(file =>
      file.size <= APP_CONFIG.MAX_FILE_SIZE &&
      APP_CONFIG.ALLOWED_FILE_TYPES.some(ext => file.name.endsWith(ext))
    );

    if (validFiles.length !== selectedFiles.length) {
      alert('Some files were rejected due to size or type restrictions.');
    }

    setFiles(validFiles);
  }, []);

  // Tier 4 enabled upload handler
  const handleUpload = useTier4Callback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const projectId = project?.id || 'default';
    const uploadUrl = API_ENDPOINTS.INGESTION.UPLOAD(projectId);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgressUpdate(`Uploading ${file.name}...`);

        // Use the orchestrated apiClient which handles retries and error reporting
        await apiClient.upload(uploadUrl, file, (percent) => {
          // Calculate overall progress
          const fileContribution = 100 / files.length;
          const currentBase = i * fileContribution;
          const currentProgress = currentBase + (percent * (1 / files.length));
          setUploadProgress(currentProgress);
        });

        onProgressUpdate(`Processed ${file.name}`);
      }

      onProgressUpdate('Data ingestion completed successfully');
      setFiles([]); // Clear queue on success
    } catch (error) {
      // Error is already logged to Tier 4 system by apiClient
      // We just update local UI state
      onProgressUpdate('Upload failed. Please try again.');
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [files, project, onProgressUpdate], {
    componentName: 'IngestionPage_Upload',
    timeout: 0, // Disable timeout for the wrapper, let individual requests handle it
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Ingestion</h1>
          <p className="mt-2 text-gray-600">
            Upload and process data files for project: <strong>{project?.name || 'Unknown Project'}</strong>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">Upload files</span>
                <span className="mt-1 block text-sm text-gray-500">
                  CSV, Excel, or JSON files up to {APP_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB each
                </span>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                accept={APP_CONFIG.ALLOWED_FILE_TYPES.join(',')}
                className="sr-only"
                onChange={handleFileSelect}
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Select Files
            </button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Files</h3>

            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => removeFile(index)}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing... {uploadProgress.toFixed(0)}%
                  </>
                ) : (
                  `Upload ${files.length} File${files.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported File Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">CSV Files</h4>
              <p className="text-sm text-gray-600">
                Comma-separated values with headers. Supports various delimiters and encodings.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Excel Files</h4>
              <p className="text-sm text-gray-600">
                .xlsx and .xls formats. Multiple sheets supported with automatic detection.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">JSON Files</h4>
              <p className="text-sm text-gray-600">
                Structured data in JSON format. Supports nested objects and arrays.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Database Exports</h4>
              <p className="text-sm text-gray-600">SQL dumps and other database export formats.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngestionPage;
