'use client';
import React from 'react';
import {
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
} from 'lucide-react';

interface FileIconProps {
  contentType: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ contentType, className = 'w-5 h-5' }) => {
  if (contentType.includes('csv')) return <FileText className={className} aria-label="CSV file" />;
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) {
    return <FileSpreadsheet className={className} aria-label="Excel file" />;
  }
  if (contentType.includes('pdf')) return <FileText className={className} aria-label="PDF file" />;
  if (contentType.includes('image')) return <FileImage className={className} aria-label="Image file" />;
  if (contentType.includes('video')) return <FileVideo className={className} aria-label="Video file" />;
  if (contentType.includes('audio')) return <FileAudio className={className} aria-label="Audio file" />;
  return <File className={className} aria-label="File" />;
};

