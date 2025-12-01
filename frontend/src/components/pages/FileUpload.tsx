import React from 'react';

export const FileUpload: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">File Upload</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">Drag and drop files here or click to browse</p>
      </div>
    </div>
  );
};

export default FileUpload;
