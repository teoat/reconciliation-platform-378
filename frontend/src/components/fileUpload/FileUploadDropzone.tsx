import React from 'react';

interface FileUploadDropzoneProps {
  onFilesDropped?: (files: File[]) => void;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({ onFilesDropped }) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFilesDropped?.(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <p className="text-gray-500">Drag and drop files here</p>
    </div>
  );
};

export default FileUploadDropzone;
