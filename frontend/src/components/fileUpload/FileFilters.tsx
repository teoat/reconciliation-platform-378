'use client';
import React from 'react';
import { FileSearch } from 'lucide-react';

interface FileFiltersProps {
  search: string;
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
}

export const FileFilters: React.FC<FileFiltersProps> = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <div className="relative">
          <FileSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
            aria-label="Search files"
          />
        </div>
      </div>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="uploaded">Uploaded</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
};

