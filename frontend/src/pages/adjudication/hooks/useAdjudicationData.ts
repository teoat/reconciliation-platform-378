import { useState, useEffect } from 'react';
import { useData } from '@/components/DataProvider';
import { ReconciliationApiService } from '@/services/api/reconciliation';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import type { ExtendedReconciliationRecord } from '@/types/adjudication';

/**
 * Hook for managing adjudication page data
 */
export const useAdjudicationData = () => {
  const { currentProject } = useData();
  const toast = useToast();
  const [records, setRecords] = useState<ExtendedReconciliationRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExtendedReconciliationRecord | null>(null);

  useEffect(() => {
    if (currentProject?.id) {
      handleRefresh();
    }
  }, [currentProject?.id]);

  const handleRefresh = async () => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    setIsRefreshing(true);
    try {
      const response = await ReconciliationApiService.getReconciliationRecords(currentProject.id);
      if (response.records) {
        setRecords(response.records as unknown as ExtendedReconciliationRecord[]);
        logger.info('Adjudication records refreshed', { count: response.records.length });
      }
    } catch (error) {
      logger.error('Failed to refresh adjudication records', { error });
      toast.error('Failed to refresh records');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    setIsExporting(true);
    try {
      // Use ReconciliationApiService to get records and export them
      const response = await ReconciliationApiService.getReconciliationRecords(currentProject.id);
      if (response.records && response.records.length > 0) {
        // Create a blob and download
        const dataStr = JSON.stringify(response.records, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reconciliation-results-${currentProject.id}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Export started');
      }
    } catch (error) {
      logger.error('Failed to export records', { error });
      toast.error('Failed to export records');
    } finally {
      setIsExporting(false);
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
  };
};

