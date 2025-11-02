// ============================================================================
import { logger } from '@/services/logger';
// UNIFIED PAGE SYSTEM - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardPage } from './DashboardPage';
import { ProjectPage } from './ProjectPage';
import { IngestionPage } from './IngestionPage';
import ReconciliationPage from './ReconciliationPage';
import { AdjudicationPage } from './AdjudicationPage';
import { SummaryPage } from './SummaryPage';
import { VisualizationPage } from './VisualizationPage';
import { FolderOpen } from 'lucide-react';
import { Upload } from 'lucide-react';
import { GitCompare } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { FileText } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { TrendingDown } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Users } from 'lucide-react';
import { Target } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Play } from 'lucide-react';
import { Filter } from 'lucide-react';
import { Download } from 'lucide-react';
import { Eye } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Search } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { PieChart } from 'lucide-react';
import { Printer } from 'lucide-react';
import { useFrenly } from '../components/frenly/FrenlyProvider';
import { LoadingButton } from '../components/ui/LoadingSpinner';
import { Button, Input, Card, StatusBadge } from '../components/ui';
import { apiClient } from '../services/apiClient';
import { ProjectInfo } from '../types/backend-aligned';

// ============================================================================
// COMMON INTERFACES
// ============================================================================

export interface PageConfig {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  showStats?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  progress?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'range';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface ActionConfig {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

// ============================================================================
// BASE PAGE COMPONENT
// ============================================================================

interface BasePageProps {
  config: PageConfig;
  stats?: StatsCard[];
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

export const BasePage: React.FC<BasePageProps> = ({
  config,
  stats = [],
  filters = [],
  actions = [],
  children,
  loading = false,
  error = null,
}) => {
  const { updatePage } = useFrenly();
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => {
    updatePage(config.path);
  }, [config.path, updatePage]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <config.icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              {stat.trend && (
                <div className="mt-4 flex items-center">
                  {stat.trend.direction === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : stat.trend.direction === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  ) : (
                    <div className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm text-gray-600">{stat.trend.value}</span>
                </div>
              )}
              {stat.progress !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stat.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Filters
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">All {filter.label}</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={filter.type}
                      placeholder={filter.placeholder || filter.label}
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>
            {Object.values(filterValues).some((v) => v !== '') && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center justify-end space-x-3">
          {actions.map((action, index) => (
            <LoadingButton
              key={index}
              loading={action.loading || false}
              onClick={action.onClick}
              className={`${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
              } px-4 py-2 rounded-lg`}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </LoadingButton>
          ))}
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
};

// ============================================================================
// SPECIALIZED PAGE COMPONENTS
// ============================================================================

// Dashboard Page - moved to separate file

// Projects Page - moved to separate file

// Ingestion Page - moved to separate file

// Reconciliation Page - moved to separate file

  const stats: StatsCard[] = [
    {
      title: 'Total Records',
      value: records.length,
      icon: GitCompare,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Matched',
      value: records.filter((r) => r.status === 'matched').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Unmatched',
      value: records.filter((r) => r.status === 'unmatched').length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'Discrepancies',
      value: records.filter((r) => r.status === 'discrepancy').length,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'matched', label: 'Matched' },
        { value: 'unmatched', label: 'Unmatched' },
        { value: 'discrepancy', label: 'Discrepancy' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    {
      key: 'system',
      label: 'System',
      type: 'select',
      options: [
        { value: 'bank', label: 'Bank System' },
        { value: 'erp', label: 'ERP System' },
        { value: 'pos', label: 'POS System' },
      ],
    },
  ];

  const actions: ActionConfig[] = [
    {
      label: 'Start Reconciliation',
      icon: Play,
      onClick: () => {
        /* Start reconciliation */
      },
      variant: 'primary',
      loading: processing,
    },
    {
      label: 'Export Results',
      icon: Download,
      onClick: () => {
        /* Export results */
      },
      variant: 'secondary',
    },
  ];

  return (
    <BasePage config={config} stats={stats} filters={filters} actions={actions} loading={loading}>
      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Reconciliation Records ({records.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.sourceSystem} → {record.targetSystem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.status}>{record.status}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          /* View details */
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {record.status === 'unmatched' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            /* Manual match */
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BasePage>
  );
};

// Adjudication Page - moved to separate file

// Summary Page - moved to separate file

// Visualization Page - moved to separate file

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  BasePage,
  ProjectPage,
  IngestionPage,
  ReconciliationPage,
  AdjudicationPage,
  SummaryPage,
  VisualizationPage,
};
