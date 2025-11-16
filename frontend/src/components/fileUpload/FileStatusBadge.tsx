'use client';
import React from 'react';
import {
  Loader2,
  CheckCircle,
  Activity,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface FileStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export const FileStatusBadge: React.FC<FileStatusBadgeProps> = ({
  status,
  showIcon = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600 bg-blue-100';
      case 'uploaded':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin" aria-label="Uploading" />;
      case 'uploaded':
        return <CheckCircle className="w-4 h-4" aria-label="Uploaded" />;
      case 'processing':
        return <Activity className="w-4 h-4" aria-label="Processing" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" aria-label="Completed" />;
      case 'failed':
        return <XCircle className="w-4 h-4" aria-label="Failed" />;
      default:
        return <AlertCircle className="w-4 h-4" aria-label="Unknown status" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        status
      )}`}
      aria-label={`File status: ${status}`}
    >
      {showIcon && <span className="mr-1">{getStatusIcon(status)}</span>}
      <span className="capitalize">{status}</span>
    </span>
  );
};

