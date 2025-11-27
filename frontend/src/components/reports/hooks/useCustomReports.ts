/**
 * Custom hook for managing custom reports state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/logger';
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

  // Load existing reports
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from API
      // For now, we'll create some sample reports
      const sampleReports: CustomReport[] = [
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
            {
              id: 'avg_confidence',
              name: 'Avg Confidence',
              type: 'average',
              field: 'confidence_score',
              format: 'percentage',
            },
          ],
          visualizations: [
            {
              type: 'bar',
              metrics: ['total_records', 'matched_records'],
              groupBy: 'category',
            },
            {
              type: 'line',
              metrics: ['match_rate'],
              groupBy: 'date',
            },
          ],
          schedule: {
            frequency: 'monthly',
            recipients: ['manager@company.com', 'team@company.com'],
          },
          createdBy: 'user123',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z',
          isPublic: true,
          tags: ['monthly', 'summary', 'performance'],
        },
        {
          id: 'report-002',
          name: 'High-Value Transaction Analysis',
          description: 'Analysis of transactions above $100,000 for risk assessment',
          dataSource: 'cashflow',
          filters: [
            { field: 'amount', operator: 'greater_than', value: 100000, label: 'Amount > $100K' },
            {
              field: 'category',
              operator: 'in',
              value: ['transfers', 'payments'],
              label: 'High-risk categories',
            },
          ],
          metrics: [
            { id: 'transaction_count', name: 'Transaction Count', type: 'count', format: 'number' },
            {
              id: 'total_amount',
              name: 'Total Amount',
              type: 'sum',
              field: 'amount',
              format: 'currency',
            },
            {
              id: 'avg_amount',
              name: 'Average Amount',
              type: 'average',
              field: 'amount',
              format: 'currency',
            },
            {
              id: 'risk_score',
              name: 'Risk Score',
              type: 'average',
              field: 'risk_score',
              format: 'number',
            },
          ],
          visualizations: [
            {
              type: 'pie',
              metrics: ['total_amount'],
              groupBy: 'category',
            },
            {
              type: 'table',
              metrics: ['transaction_count', 'total_amount', 'avg_amount', 'risk_score'],
              sortBy: 'total_amount',
              limit: 20,
            },
          ],
          createdBy: 'user456',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z',
          isPublic: false,
          tags: ['risk', 'high-value', 'compliance'],
        },
        {
          id: 'report-003',
          name: 'User Activity Dashboard',
          description: 'User engagement and activity metrics across the platform',
          dataSource: 'users',
          filters: [
            {
              field: 'last_login',
              operator: 'greater_than',
              value: '2024-01-01',
              label: 'Active this year',
            },
          ],
          metrics: [
            { id: 'active_users', name: 'Active Users', type: 'count', format: 'number' },
            {
              id: 'total_sessions',
              name: 'Total Sessions',
              type: 'sum',
              field: 'session_count',
              format: 'number',
            },
            {
              id: 'avg_session_duration',
              name: 'Avg Session Duration',
              type: 'average',
              field: 'session_duration',
              format: 'number',
            },
            {
              id: 'projects_created',
              name: 'Projects Created',
              type: 'sum',
              field: 'projects_created',
              format: 'number',
            },
          ],
          visualizations: [
            {
              type: 'line',
              metrics: ['active_users'],
              groupBy: 'date',
            },
            {
              type: 'bar',
              metrics: ['projects_created', 'total_sessions'],
              groupBy: 'department',
            },
          ],
          schedule: {
            frequency: 'weekly',
            recipients: ['admin@company.com'],
          },
          createdBy: 'admin',
          createdAt: '2024-01-05T08:00:00Z',
          updatedAt: '2024-01-22T11:20:00Z',
          isPublic: true,
          tags: ['users', 'activity', 'engagement'],
        },
      ];

      setReports(sampleReports);
    } catch (error) {
      logger.error('Failed to load reports:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate report data
  const generateReport = useCallback(
    (report: CustomReport) => {
      const reconciliationData = getReconciliationData();
      const cashflowData = getCashflowData();
      return generateReportData(report, reconciliationData, cashflowData);
    },
    [getReconciliationData, getCashflowData]
  );

  // Export report
  const exportReport = useCallback(
    (report: CustomReport, format: 'pdf' | 'csv' | 'xlsx') => {
      const reportData = generateReport(report);

      // In a real implementation, this would generate and download the file
      logger.info(`Exporting report ${report.name} as ${format}`, reportData);

      // Simulate download
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}.${format === 'pdf' ? 'json' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [generateReport]
  );

  // Delete report
  const deleteReport = useCallback((reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }, []);

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
    setSelectedReport,
    setShowCreateModal,
    setShowReportModal,
    setFilterTags,
    exportReport,
    deleteReport,
  };
}

