import React from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface JobFiltersProps {
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
}) => {
  const debouncedSearch = useDebounce(searchQuery, 300);

  React.useEffect(() => {
    // This allows parent to react to debounced search
  }, [debouncedSearch]);

  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search reconciliation jobs"
          />
        </div>
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        aria-label="Filter by job status"
        title="Filter by job status"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="running">Running</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
};
