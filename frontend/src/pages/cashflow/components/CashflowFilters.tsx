/**
 * Cashflow Filters Component
 * 
 * Advanced filtering panel for expense categories
 */

import React from 'react';
import { Filter, Trash2 } from 'lucide-react';
import type { FilterConfig } from '@/pages/cashflow/types';

interface CashflowFiltersProps {
  filters: FilterConfig[];
  showFilters: boolean;
  onToggleFilters: () => void;
  onSetFilters: (filters: FilterConfig[]) => void;
  onClearFilters: () => void;
}

export const CashflowFilters: React.FC<CashflowFiltersProps> = ({
  filters,
  showFilters,
  onToggleFilters,
  onSetFilters,
  onClearFilters,
}) => {
  return (
    <div className="card mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onToggleFilters}
            className={`btn-secondary flex items-center space-x-2 ${
              filters.some(f => f.active) ? 'bg-primary-100 text-primary-700' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {filters.filter(f => f.active).length > 0 && (
              <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                {filters.filter(f => f.active).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-secondary-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-secondary-900">Advanced Filters</h4>
              <button
                onClick={onClearFilters}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Quick Filters */}
            <div className="border-t border-secondary-200 pt-4">
              <h5 className="font-medium text-secondary-900 mb-2">Quick Filters</h5>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onSetFilters([
                      {
                        field: 'status',
                        operator: 'equals',
                        value: 'balanced',
                        active: true,
                      },
                    ]);
                  }}
                  className="btn-secondary text-xs"
                >
                  Balanced Only
                </button>
                <button
                  onClick={() => {
                    onSetFilters([
                      {
                        field: 'status',
                        operator: 'equals',
                        value: 'discrepancy',
                        active: true,
                      },
                    ]);
                  }}
                  className="btn-secondary text-xs"
                >
                  Discrepancies Only
                </button>
                <button
                  onClick={() => {
                    onSetFilters([
                      {
                        field: 'discrepancy',
                        operator: 'greaterThan',
                        value: 0,
                        active: true,
                      },
                    ]);
                  }}
                  className="btn-secondary text-xs"
                >
                  Positive Discrepancies
                </button>
                <button
                  onClick={() => {
                    onSetFilters([
                      {
                        field: 'discrepancy',
                        operator: 'lessThan',
                        value: 0,
                        active: true,
                      },
                    ]);
                  }}
                  className="btn-secondary text-xs"
                >
                  Negative Discrepancies
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

