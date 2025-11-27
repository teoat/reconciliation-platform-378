/**
 * Custom hook for managing custom reports state and operations
 * Updated to use API services
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/logger';
import { reportsApiService } from '@/services/reportsApiService';
import { reportExportService } from '@/services/reportExportService';
import type { CustomReport } from '../types';
import { generateReportData } from '../utils/reportData';

interface UseCustomReportsOptions {
  getReconciliationData: () => { records?: unknown[] } | null;
  getCashflowData: () => { records?: unknown[] } | null;
  onProgressUpdate?: (step: string) => void;
}

export function useCustomReports({
  getReconciliationData,
  getCashflowData,
  onProgressUpdate,
}: UseCustomReportsOptions) {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterTags, setFilterTags] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Load existing reports from API
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportsApiService.getReports();
      if (response.success && response.data) {
        setReports(response.data);
        logger.info('Reports loaded successfully', { count: response.data.length });
      } else {
        // Fallback to sample data if API fails
        logger.warn('API call failed, using sample data');
        setReports(getSampleReports());
      }
    } catch (error) {
      logger.error('Failed to load reports:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Failed to load reports');
      // Fallback to sample data
      setReports(getSampleReports());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate report data (for local preview)
  const generateReport = useCallback(
    async (report: CustomReport) => {
      const reconciliationData = getReconciliationData();
      const cashflowData = getCashflowData();
      return await generateReportData(report, reconciliationData, cashflowData);
    },
    [getReconciliationData, getCashflowData]
  );

  // Export report
  const exportReport = useCallback(
    async (report: CustomReport, format: 'pdf' | 'csv' | 'xlsx') => {
      try {
        // Try to get report data from API first
        const apiResponse = await reportsApiService.getReportData(report.id);
        if (apiResponse.success && apiResponse.data) {
          const reportData = apiResponse.data;
          if (format === 'pdf') {
            await reportExportService.exportToPDF(report, reportData);
          } else if (format === 'csv') {
            await reportExportService.exportToCSV(report, reportData);
          } else if (format === 'xlsx') {
            await reportExportService.exportToXLSX(report, reportData);
          }
        } else {
          // Fallback to local generation
          const reportData = await generateReport(report);
          if (format === 'pdf') {
            await reportExportService.exportToPDF(report, reportData);
          } else if (format === 'csv') {
            await reportExportService.exportToCSV(report, reportData);
          } else if (format === 'xlsx') {
            await reportExportService.exportToXLSX(report, reportData);
          }
        }
        logger.info(`Report exported successfully: ${report.name} as ${format}`);
      } catch (error) {
        logger.error('Error exporting report', { error, reportId: report.id, format });
        throw error;
      }
    },
    [generateReport]
  );

  // Delete report
  const deleteReport = useCallback(
    async (reportId: string) => {
      try {
        const response = await reportsApiService.deleteReport(reportId);
        if (response.success) {
          setReports((prev) => prev.filter((r) => r.id !== reportId));
          logger.info('Report deleted successfully', { reportId });
        } else {
          // Optimistic update
          setReports((prev) => prev.filter((r) => r.id !== reportId));
        }
      } catch (error) {
        logger.error('Error deleting report', { error, reportId });
        // Revert optimistic update on error
        loadReports();
      }
    },
    [loadReports]
  );

  // Filter reports by tags
  const filteredReports = reports.filter(
    (report) =>
      filterTags === '' ||
      report.tags.some((tag) => tag.toLowerCase().includes(filterTags.toLowerCase()))
  );

  useEffect(() => {
    loadReports();
    onProgressUpdate?.('custom_reports_loaded');
  }, [loadReports, onProgressUpdate]);

  return {
    reports,
    filteredReports,
    selectedReport,
    showCreateModal,
    showReportModal,
    isLoading,
    filterTags,
    error,
    setSelectedReport,
    setShowCreateModal,
    setShowReportModal,
    setFilterTags,
    exportReport,
    deleteReport,
    loadReports,
  };
}

// Sample reports for fallback
function getSampleReports(): CustomReport[] {
  return [
    {
      id: 'report-001',
      name: 'Monthly Reconciliation Summary',
      description: 'Comprehensive overview of reconciliation performance for the current month',
      dataSource: 'reconciliation',
      filters: [
        {
          field: 'created_at',
          operator: 'between',
          value: ['2024-01-01', '2024-01-31'],
          label: 'Current Month',
        },
      ],
      metrics: [
        { id: 'total_records', name: 'Total Records', type: 'count', format: 'number' },
        {
          id: 'matched_records',
          name: 'Matched Records',
          type: 'sum',
          field: 'matched_count',
          format: 'number',
        },
        {
          id: 'match_rate',
          name: 'Match Rate',
          type: 'percentage',
          calculation: 'matched_records/total_records',
          format: 'percentage',
        },
      ],
      visualizations: [
        {
          type: 'bar',
          metrics: ['total_records', 'matched_records'],
          groupBy: 'category',
        },
      ],
      createdBy: 'user123',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      isPublic: true,
      tags: ['monthly', 'summary', 'performance'],
    },
  ];
}
