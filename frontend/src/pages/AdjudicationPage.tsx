import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Clock, AlertCircle, RefreshCw, Download, Eye } from 'lucide-react';
import { Button, StatusBadge } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useData } from '@/components/DataProvider';
import { ApiService } from '@/services/ApiService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import type { ReconciliationRecord } from '@/types/reconciliation';
import { BasePage, PageConfig, StatsCard, FilterConfig, ActionConfig } from '@/components/BasePage';

// Define ReconciliationStatus locally since it's not exported from types
type ReconciliationStatus = 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'reviewed';

// Extended type for AdjudicationPage that includes additional properties from API
interface ExtendedReconciliationRecord {
  id: string;
  reconciliationId?: string;
  sourceARecordId?: string;
  sourceBRecordId?: string;
  sources?: Array<{
    systemName?: string;
    data?: { amount?: number;[key: string]: unknown };
    [key: string]: unknown;
  }>;
  difference?: number;
  discrepancyAmount?: number;
  discrepancy_amount?: number;
  confidence?: number;
  confidenceScore?: number;
  confidence_score?: number;
  matchScore?: number;
  status: ReconciliationStatus;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  adjudicationPageMetadata,
  getAdjudicationOnboardingSteps,
  getAdjudicationPageContext,
  getAdjudicationWorkflowState,
  registerAdjudicationGuidanceHandlers,
  getAdjudicationGuidanceContent,
} from '@/orchestration/pages/AdjudicationPageOrchestration';

const AdjudicationPageContent: React.FC = () => {
  const { currentProject } = useData();
  const toast = useToast();
  const [records, setRecords] = useState<ExtendedReconciliationRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExtendedReconciliationRecord | null>(null);

  // Page Orchestration with Frenly AI
  const { updatePageContext } = usePageOrchestration({
    pageMetadata: adjudicationPageMetadata,
    getPageContext: () =>
      getAdjudicationPageContext(
        currentProject?.id,
        records.length,
        records.filter((r) => {
          const status = r.status as string;
          return (
            status === 'approved' ||
            status === 'resolved' ||
            status === 'reviewed' ||
            status === 'matched'
          );
        }).length,
        records.filter((r) => {
          const status = r.status as string;
          return status === 'pending' || status === 'unmatched';
        }).length,
        currentProject?.name
      ),
    getOnboardingSteps: () =>
      getAdjudicationOnboardingSteps(
        records.length > 0,
        records.filter((r) => {
          const status = r.status as string;
          return (
            status === 'approved' ||
            status === 'resolved' ||
            status === 'reviewed' ||
            status === 'matched'
          );
        }).length > 0
      ),
    getWorkflowState: () =>
      getAdjudicationWorkflowState(
        records.length,
        records.filter((r) => {
          const status = r.status as string;
          return (
            status === 'approved' ||
            status === 'resolved' ||
            status === 'reviewed' ||
            status === 'matched'
          );
        }).length,
        records.filter((r) => {
          const status = r.status as string;
          return status === 'approved' || status === 'reviewed' || status === 'matched';
        }).length
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
      resolvedCount: records.filter(
        (r) =>
          (r.status as string) === 'approved' ||
          (r.status as string) === 'resolved' ||
          (r.status as string) === 'reviewed'
      ).length,
      pendingCount: records.filter((r) => (r.status as string) === 'pending').length,
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
      // Convert ReconciliationResultDetail[] to ReconciliationRecord[]
      const records = (response.records || []).map((detail) => ({
        id: detail.id,
        projectId: detail.job_id,
        sourceId: detail.source_a_id,
        targetId: detail.source_b_id,
        sourceSystem: '',
        targetSystem: '',
        amount: 0,
        currency: '',
        transactionDate: detail.created_at,
        description: '',
        status: 'pending' as ReconciliationStatus,
        confidence: detail.confidence_score,
        confidence_score: detail.confidence_score,
        discrepancies: [],
        metadata: {
          source: {},
          target: {},
          computed: {},
          tags: [],
          notes: [],
        },
        createdAt: detail.created_at,
        updatedAt: detail.created_at,
      }));
      setRecords(records as ExtendedReconciliationRecord[]);
      toast.success('Records refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh records';
      logger.error('Refresh failed', {
        error: errorMessage,
        projectId: currentProject?.id,
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
      const data = records.map((r) => {
        const enhanced = r as ExtendedReconciliationRecord;
        return {
          sourceSystem: enhanced.sources?.[0]?.systemName || 'unknown',
          targetSystem:
            enhanced.sources?.[1]?.systemName || enhanced.sources?.[0]?.systemName || 'unknown',
          amount: (enhanced.sources?.[0]?.data as { amount?: number })?.amount || 0,
          discrepancyAmount: enhanced.difference || r.discrepancyAmount || 0,
          status: r.status,
          priority: r.priority,
        };
      });
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
      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, status: 'reviewed' as ReconciliationStatus } : r
        )
      );
      toast.success('Record approved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve record';
      logger.error('Approve failed', {
        error: errorMessage,
        recordId,
        projectId: currentProject?.id,
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
      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, status: 'unmatched' as ReconciliationStatus } : r
        )
      );
      toast.success('Record rejected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject record';
      logger.error('Reject failed', {
        error: errorMessage,
        recordId,
        projectId: currentProject?.id,
      });
      toast.error(errorMessage);
    }
  };

  const config: PageConfig = useMemo(() => ({
    title: 'Adjudication',
    description: 'Review and resolve discrepancies',
    icon: CheckCircle,
    path: '/adjudication',
    showStats: true,
    showFilters: true,
    showActions: true,
  }), []);

  const stats: StatsCard[] = useMemo(() => [
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
      value: records.filter((r) => (r.status as string) === 'approved' || r.status === 'reviewed')
        .length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Rejected',
      value: records.filter((r) => (r.status as string) === 'rejected' || r.status === 'unmatched')
        .length,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
    },
  ], [records]);

  const filters: FilterConfig[] = useMemo(() => [
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
  ], []);

  const actions: ActionConfig[] = useMemo(() => [
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
  ], [isRefreshing, isExporting, handleRefresh, handleExport]);

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
                    {(record as unknown as ExtendedReconciliationRecord).sources?.[0]?.systemName ||
                      'unknown'}{' '}
                    →{' '}
                    {(record as unknown as ExtendedReconciliationRecord).sources?.[1]?.systemName ||
                      (record as unknown as ExtendedReconciliationRecord).sources?.[0]
                        ?.systemName ||
                      'unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    $
                    {(
                      (
                        (record as unknown as ExtendedReconciliationRecord).sources?.[0]?.data as {
                          amount?: number;
                        }
                      )?.amount || 0
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(record.discrepancyAmount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.status}>{record.status}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={record.priority || 'medium'}>
                      {record.priority || 'medium'}
                    </StatusBadge>
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
                  {selectedRecord.sources?.[0]?.systemName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Target System</p>
                <p className="text-sm text-gray-900">
                  {selectedRecord.sources?.[1]?.systemName ||
                    selectedRecord.sources?.[0]?.systemName ||
                    'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Amount</p>
                <p className="text-sm text-gray-900">
                  $
                  {(
                    (selectedRecord.sources?.[0]?.data as { amount?: number })?.amount || 0
                  ).toLocaleString()}
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
                  <StatusBadge status={selectedRecord.status || 'pending'}>
                    {selectedRecord.status || 'pending'}
                  </StatusBadge>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Priority</p>
                <p className="text-sm text-gray-900">
                  <StatusBadge status={selectedRecord.priority || 'medium'}>
                    {selectedRecord.priority || 'medium'}
                  </StatusBadge>
                </p>
              </div>
              {(selectedRecord.confidence_score ||
                selectedRecord.confidence ||
                selectedRecord.matchScore) && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confidence Score</p>
                    <p className="text-sm text-gray-900">
                      {(
                        (selectedRecord.confidence_score ??
                          selectedRecord.confidence ??
                          selectedRecord.matchScore ??
                          0) * 100
                      ).toFixed(1)}
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
