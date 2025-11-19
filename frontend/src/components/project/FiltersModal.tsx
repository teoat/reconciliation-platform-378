'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ProjectFilters } from '../../types/project';

interface FiltersModalProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onClose: () => void;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  filters,
  onFiltersChange,
  onClose,
}) => {
  const updateFilter = (key: keyof ProjectFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof ProjectFilters, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Advanced Filters</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">Status</label>
            <div className="space-y-2">
              {(['draft', 'active', 'completed', 'archived'] as const).map((status) => (
                <label key={status} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => toggleArrayFilter('status', status)}
                    className="rounded border-secondary-300"
                  />
                  <span className="text-sm text-secondary-700 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">Category</label>
            <div className="space-y-2">
              {['financial', 'inventory', 'customer', 'payment', 'hr', 'custom'].map((category) => (
                <label key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={() => toggleArrayFilter('category', category)}
                    className="rounded border-secondary-300"
                  />
                  <span className="text-sm text-secondary-700 capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">Priority</label>
            <div className="space-y-2">
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <label key={priority} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(priority)}
                    onChange={() => toggleArrayFilter('priority', priority)}
                    className="rounded border-secondary-300"
                  />
                  <span className="text-sm text-secondary-700 capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={
                    filters.dateRange.start
                      ? filters.dateRange.start.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={
                    filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''
                  }
                  onChange={(e) =>
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-6 border-t border-secondary-200">
          <button
            onClick={() =>
              onFiltersChange({
                searchQuery: '',
                status: [],
                category: [],
                tags: [],
                department: [],
                dateRange: { start: undefined, end: undefined },
                budgetRange: { min: undefined, max: undefined },
                matchRateRange: { min: undefined, max: undefined },
                priority: [],
              })
            }
            className="btn-secondary"
          >
            Clear All
          </button>
          <button onClick={onClose} className="btn-primary">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
