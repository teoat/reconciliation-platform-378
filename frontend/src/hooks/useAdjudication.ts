import { useState, useEffect } from 'react';
import { ApiService } from '@/services/ApiService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { useData } from '@/components/DataProvider';
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  adjudicationPageMetadata,
  getAdjudicationOnboardingSteps,
  getAdjudicationPageContext,
  getAdjudicationWorkflowState,
  registerAdjudicationGuidanceHandlers,
  getAdjudicationGuidanceContent,
} from '@/orchestration/pages/AdjudicationPageOrchestration';
import type { ExtendedReconciliationRecord, ReconciliationStatus } from '@/types/adjudication';

export const useAdjudication = () => {
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

  return {
    records,
    isRefreshing,
    isExporting,
    selectedRecord,
    setSelectedRecord,
    handleRefresh,
    handleExport,
    handleViewDetails,
    handleApprove,
    handleReject,
  };
};
