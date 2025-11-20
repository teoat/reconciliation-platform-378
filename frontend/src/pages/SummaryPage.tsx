import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Printer, Download, TrendingUp } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { usePageOrchestration } from '../hooks/usePageOrchestration';
import {
  summaryPageMetadata,
  getSummaryOnboardingSteps,
  getSummaryPageContext,
  getSummaryWorkflowState,
  registerSummaryGuidanceHandlers,
  getSummaryGuidanceContent,
} from '../orchestration/pages/SummaryPageOrchestration';

// Interfaces (shared with main index.tsx)
export interface PageConfig {
  title: string;
  description: string;
  icon: React.ComponentType<Record<string, unknown>>;
  path: string;
  showStats?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<Record<string, unknown>>;
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
  icon: React.ComponentType<Record<string, unknown>>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

// BasePage component (simplified for this extraction)
interface BasePageProps {
  config: PageConfig;
  stats?: StatsCard[];
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

const BasePage: React.FC<BasePageProps> = ({
  config,
  stats = [],
  filters = [],
  actions = [],
  children,
  loading = false,
  error = null,
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilterValues({});
  };

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
          <div className="w-5 h-5 text-red-500 mr-2">⚠️</div>
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
                  <p className="text-2xl font-bold text-gray-900">{stat.value ?? 'N/A'}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              {stat.progress !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stat.progress ?? 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {filters && filters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="w-5 h-5 mr-2 text-blue-600">⚲</div>
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
                      aria-label={filter.label}
                      title={filter.label}
                    >
                      <option value="">All {filter.label}</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type}
                      placeholder={filter.placeholder || filter.label}
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  )}
                </div>
              ))}
            </div>
            {Object.values(filterValues).some((v) => v !== '') && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center justify-end space-x-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
              } px-4 py-2 rounded-lg flex items-center`}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
};

const SummaryPageContent: React.FC = () => {
  const [data] = useState<Record<string, unknown> | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'json'>('csv');

  // Page Orchestration with Frenly AI
  const { updatePageContext, trackFeatureUsage, trackFeatureError } = usePageOrchestration({
    pageMetadata: summaryPageMetadata,
    getPageContext: () =>
      getSummaryPageContext(
        undefined, // projectId
        data
          ? Number((data.reconciliationSummary as Record<string, unknown>)?.totalRecords ?? 0)
          : 0,
        0, // exportedReportsCount
        undefined // projectName
      ),
    getOnboardingSteps: () =>
      getSummaryOnboardingSteps(
        data !== null,
        false // hasExportedData
      ),
    getWorkflowState: () => getSummaryWorkflowState(),
    registerGuidanceHandlers: () =>
      registerSummaryGuidanceHandlers(
        () => setShowExportModal(true),
        () => setShowExportModal(true)
      ),
    getGuidanceContent: (topic) => getSummaryGuidanceContent(topic),
  });

  const config: PageConfig = {
    title: 'Summary & Export',
    description: 'Generate final reports and export reconciliation data',
    icon: FileText,
    path: '/summary',
    showStats: true,
    showActions: true,
  };

  const stats: StatsCard[] = data
    ? [
        {
          title: 'Total Records',
          value: Number((data.reconciliationSummary as Record<string, unknown>)?.totalRecords ?? 0),
          icon: FileText,
          color: 'bg-blue-100 text-blue-600',
        },
        {
          title: 'Matched',
          value: Number(
            (data.reconciliationSummary as Record<string, unknown>)?.matchedRecords ?? 0
          ),
          icon: CheckCircle,
          color: 'bg-green-100 text-green-600',
        },
        {
          title: 'Unmatched',
          value: Number(
            (data.reconciliationSummary as Record<string, unknown>)?.unmatchedRecords ?? 0
          ),
          icon: AlertCircle,
          color: 'bg-red-100 text-red-600',
        },
        {
          title: 'Discrepancies',
          value: Number(
            (data.reconciliationSummary as Record<string, unknown>)?.discrepancyRecords ?? 0
          ),
          icon: AlertCircle,
          color: 'bg-yellow-100 text-yellow-600',
        },
      ]
    : [];

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    if (!data) return;

    switch (exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'json':
        exportToJSON();
        break;
    }
    setShowExportModal(false);
  };

  const exportToCSV = () => {
    if (!data?.systemBreakdown) return;

    const headers = ['System', 'Total Records', 'Matched', 'Unmatched', 'Match Rate'];
    const rows = (data.systemBreakdown as Array<Record<string, unknown>>).map((system) => {
      const matched = Number(system.matched ?? 0);
      const records = Number(system.records ?? 0);
      return [
        system.system ?? 'Unknown',
        records,
        matched,
        Number(system.unmatched ?? 0),
        records > 0 ? `${((matched / records) * 100).toFixed(1)}%` : '0%',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reconciliation-summary.csv';
    link.click();
  };

  const exportToPDF = () => {
    // For PDF, we'll use the browser's print functionality
    window.print();
  };

  const exportToJSON = () => {
    if (!data) return;

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reconciliation-summary.json';
    link.click();
  };

  const actions: ActionConfig[] = [
    {
      label: 'Print',
      icon: Printer,
      onClick: () => window.print(),
      variant: 'secondary',
    },
    {
      label: 'Export',
      icon: Download,
      onClick: handleExport,
      variant: 'secondary',
    },
  ];

  return (
    <BasePage config={config} stats={stats} actions={actions}>
      {/* System Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">System Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matched
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unmatched
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(Array.isArray(data?.systemBreakdown) ? data.systemBreakdown : []).map(
                (system: Record<string, unknown>, index: number) => {
                  const matched = Number(system.matched ?? 0);
                  const records = Number(system.records ?? 0);
                  const matchRate = records > 0 ? (matched / records) * 100 : 0;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {String(system.system ?? 'Unknown')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {records}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {matched}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(system.unmatched ?? 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            matchRate >= 90
                              ? 'text-green-600'
                              : matchRate >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {matchRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations and Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Recommendations
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(Array.isArray(data?.recommendations) ? data.recommendations : []).map(
                (recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Next Steps
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {(Array.isArray(data?.nextSteps) ? data.nextSteps : []).map(
                (step: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Summary Data"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="export-format" className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              id="export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf' | 'json')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Export Format"
              title="Select export format"
            >
              <option value="csv">CSV - Comma Separated Values</option>
              <option value="pdf">PDF - Portable Document Format</option>
              <option value="json">JSON - JavaScript Object Notation</option>
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">What will be exported:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• System breakdown with match rates</li>
              <li>• Reconciliation summary statistics</li>
              <li>• Recommendations and next steps</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleExportConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Export
            </button>
          </div>
        </div>
      </Modal>
    </BasePage>
  );
};

export const SummaryPage: React.FC = () => (
  <ErrorBoundary
    fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
        <p className="text-red-600 mt-2">
          Unable to load the summary page. Please refresh the page.
        </p>
      </div>
    }
  >
    <SummaryPageContent />
  </ErrorBoundary>
);
