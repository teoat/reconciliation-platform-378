import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, RefreshCw, Download, Eye, X } from 'lucide-react';
import { Button, StatusBadge } from '../components/ui';
import { Modal } from '../components/ui/Modal';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { LoadingSpinnerComponent, SkeletonText } from '../components/LoadingComponents';
import { useData } from '../components/DataProvider';
import { useReconciliation } from '../hooks/useFileReconciliation';
import { ApiService } from '../services/ApiService';
import { useToast } from '../hooks/useToast';
import { logger } from '../services/logger';
import type { ReconciliationRecord } from '../types';

// Helper component for progress bar with proper ARIA attributes
const ProgressBar: React.FC<{ progress: number; title: string }> = ({ progress, title }) => {
  const progressValue = Math.max(0, Math.min(100, progress ?? 0)); // Clamp between 0-100
  const ariaLabel = `${title} progress: ${progressValue}%`;
  return (
    <div className="mt-4">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full"
          // Dynamic width for progress bar - acceptable inline style
          style={{ width: `${progressValue}%` }}
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuenow={progressValue}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    </div>
  );
};

import { usePageOrchestration } from '../hooks/usePageOrchestration';
import {
  adjudicationPageMetadata,
  getAdjudicationOnboardingSteps,
  getAdjudicationPageContext,
  getAdjudicationWorkflowState,
  registerAdjudicationGuidanceHandlers,
  getAdjudicationGuidanceContent,
} from '../orchestration/pages/AdjudicationPageOrchestration';

// Interfaces (shared with main index.tsx)
// Icon component props interface
interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export interface PageConfig {
  title: string;
  description: string;
  icon: React.ComponentType<IconProps>;
  path: string;
  showStats?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
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
  icon: React.ComponentType<IconProps>;
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

  // Filter records based on filter values (to be passed to children)
  const filterRecords = (records: ReconciliationRecord[]) => {
    return records.filter((record) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;
        const recordValue = (record as Record<string, unknown>)[key] || '';
        return String(recordValue).toLowerCase().includes(String(value).toLowerCase());
      });
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilterValues({});
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <SkeletonText lines={1} className="w-1/4" />
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
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
                <ProgressBar
                  progress={stat.progress}
                  title={stat.title}
                />
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

const AdjudicationPageContent: React.FC = () => {
  const { currentProject } = useData();
  const toast = useToast();
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);

  // Page Orchestration with Frenly AI
  const {
    updatePageContext,
    trackFeatureUsage,
    trackFeatureError,
    trackUserAction,
  } = usePageOrchestration({
    pageMetadata: adjudicationPageMetadata,
    getPageContext: () =>
      getAdjudicationPageContext(
        currentProject?.id,
        records.length,
        records.filter((r) => r.status === 'approved' || r.status === 'resolved').length,
        records.filter((r) => r.status === 'pending').length,
        currentProject?.name
      ),
    getOnboardingSteps: () =>
      getAdjudicationOnboardingSteps(
        records.length > 0,
        records.filter((r) => r.status === 'approved' || r.status === 'resolved').length > 0
      ),
    getWorkflowState: () =>
      getAdjudicationWorkflowState(
        records.length,
        records.filter((r) => r.status === 'approved' || r.status === 'resolved').length,
        records.filter((r) => r.status === 'approved').length
      ),
    registerGuidanceHandlers: () => registerAdjudicationGuidanceHandlers(),
    getGuidanceContent: (topic) => getAdjudicationGuidanceContent(topic),
    onContextChange: (changes) => {
      logger.debug('Adjudication context changed', { changes });
    },
  });

  useEffect(() => {
    if (currentProject?.id) {
      handleRefresh();
    }
  }, [currentProject?.id]);

  // Update context when records change
  useEffect(() => {
    updatePageContext({
      matchesCount: records.length,
      resolvedCount: records.filter((r) => r.status === 'approved' || r.status === 'resolved').length,
      pendingCount: records.filter((r) => r.status === 'pending').length,
    });
  }, [records, updatePageContext]);

  const handleRefresh = async () => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    setIsRefreshing(true);
    try {
      const response = await ApiService.getReconciliationRecords(currentProject.id, {
        page: 1,
        per_page: 100,
      });
      setRecords(response.records || []);
      toast.success('Records refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh records';
      logger.error('Refresh failed', { 
        error: errorMessage,
        projectId: currentProject?.id 
      });
      toast.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    if (records.length === 0) {
      toast.warning('No records to export');
      return;
    }
    setIsExporting(true);
    try {
      logger.info('Exporting records for project', { projectId: currentProject.id });
      const data = records.map((r) => ({
        sourceSystem: r.sourceSystem,
        targetSystem: r.targetSystem,
        amount: r.amount,
        discrepancyAmount: r.discrepancyAmount,
        status: r.status,
        priority: r.priority,
      }));
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map((row) => Object.values(row).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'adjudication-records.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export records';
      logger.error('Export failed', {
        error: errorMessage,
        projectId: currentProject.id,
      });
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetails = (recordId: string) => {
    const record = records.find((r) => r.id === recordId);
    if (record) {
      setSelectedRecord(record);
    }
  };

  const handleApprove = async (recordId: string) => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    try {
      await ApiService.approveMatch(currentProject.id, recordId);
      setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status: 'approved' } : r)));
      toast.success('Record approved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve record';
      logger.error('Approve failed', { 
        error: errorMessage,
        recordId,
        projectId: currentProject?.id 
      });
      toast.error(errorMessage);
    }
  };

  const handleReject = async (recordId: string) => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    try {
      await ApiService.rejectMatch(currentProject.id, recordId);
      setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status: 'rejected' } : r)));
      toast.success('Record rejected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject record';
      logger.error('Reject failed', { 
        error: errorMessage,
        recordId,
        projectId: currentProject?.id 
      });
      toast.error(errorMessage);
    }
  };

  const config: PageConfig = {
    title: 'Adjudication',
    description: 'Review and resolve discrepancies',
    icon: CheckCircle,
    path: '/adjudication',
    showStats: true,
    showFilters: true,
    showActions: true,
  };

  const stats: StatsCard[] = [
    {
      title: 'Total Records',
      value: records.length,
      icon: CheckCircle,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Pending',
      value: records.filter((r) => r.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Approved',
      value: records.filter((r) => r.status === 'approved').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Rejected',
      value: records.filter((r) => r.status === 'rejected').length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
  ];

  const actions: ActionConfig[] = [
    {
      label: isRefreshing ? 'Refreshing...' : 'Refresh',
      icon: RefreshCw,
      onClick: handleRefresh,
      variant: 'secondary',
      loading: isRefreshing,
    },
    {
      label: isExporting ? 'Exporting...' : 'Export',
      icon: Download,
      onClick: handleExport,
      variant: 'secondary',
      loading: isExporting,
    },
  ];

  return (
    <BasePage config={config} stats={stats} filters={filters} actions={actions}>
      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Discrepancy Records ({records.length})
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
                  Discrepancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
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
                    ${record.discrepancyAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.status}>{record.status}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.priority}>{record.priority}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(record.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {record.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(record.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(record.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Details Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? 'Record Details' : ''}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Source System</p>
                <p className="text-sm text-gray-900">
                  {selectedRecord.source_system || selectedRecord.sourceSystem || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Target System</p>
                <p className="text-sm text-gray-900">
                  {selectedRecord.target_system || selectedRecord.targetSystem || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Amount</p>
                <p className="text-sm text-gray-900">
                  ${(selectedRecord.amount || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Discrepancy Amount</p>
                <p className="text-sm text-gray-900">
                  $
                  {(
                    selectedRecord.discrepancy_amount ||
                    selectedRecord.discrepancyAmount ||
                    0
                  ).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-sm text-gray-900">
                  <StatusBadge status={selectedRecord.status}>{selectedRecord.status}</StatusBadge>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Priority</p>
                <p className="text-sm text-gray-900">
                  <StatusBadge status={selectedRecord.priority}>
                    {selectedRecord.priority || 'medium'}
                  </StatusBadge>
                </p>
              </div>
              {(selectedRecord.confidence_score || selectedRecord.confidence) && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Confidence Score</p>
                  <p className="text-sm text-gray-900">
                    {((selectedRecord.confidence_score || selectedRecord.confidence) * 100).toFixed(
                      1
                    )}
                    %
                  </p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200 flex space-x-2">
              {selectedRecord.status === 'pending' && (
                <>
                  <Button
                    onClick={() => handleApprove(selectedRecord.id)}
                    variant="primary"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedRecord.id)}
                    variant="danger"
                    size="sm"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </BasePage>
  );
};

export const AdjudicationPage: React.FC = () => (
  <ErrorBoundary
    fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
        <p className="text-red-600 mt-2">
          Unable to load the adjudication page. Please refresh the page.
        </p>
      </div>
    }
  >
    <AdjudicationPageContent />
  </ErrorBoundary>
);
