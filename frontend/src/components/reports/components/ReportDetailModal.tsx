/**
 * Report Detail Modal Component - Displays full report details with real data
 */

import { useState, useEffect } from 'react';
import { X, Download, Share, Filter, AlertCircle } from 'lucide-react';
import type { CustomReport } from '../types';
import { formatMetricValue } from '../utils/reportUtils';
import { ReportChart } from './ReportChart';
import { ShareReportModal } from './ShareReportModal';
import { reportExportService } from '@/services/reportExportService';
import { reportsApiService } from '@/services/reportsApiService';
import { logger } from '@/services/logger';
import type { ReportData } from '../types';

interface ReportDetailModalProps {
  report: CustomReport;
  onClose: () => void;
  onExport: (report: CustomReport, format: 'pdf' | 'csv' | 'xlsx') => void;
}

export function ReportDetailModal({ report, onClose, onExport }: ReportDetailModalProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, [report.id]);

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reportsApiService.getReportData(report.id);
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError('Failed to load report data');
      }
    } catch (error) {
      logger.error('Error loading report data', { error });
      setError(error instanceof Error ? error.message : 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'xlsx') => {
    if (!reportData) return;

    try {
      if (format === 'pdf') {
        await reportExportService.exportToPDF(report, reportData);
      } else if (format === 'csv') {
        await reportExportService.exportToCSV(report, reportData);
      } else if (format === 'xlsx') {
        await reportExportService.exportToXLSX(report, reportData);
      }
      onExport(report, format);
    } catch (error) {
      logger.error('Error exporting report', { error, format });
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-secondary-900">{report.name}</h3>
              <p className="text-secondary-600">{report.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
              aria-label="Close report modal"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-secondary-600">Loading report data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-secondary-900 mb-2">Error Loading Data</h4>
                <p className="text-secondary-600 mb-4">{error}</p>
                <button onClick={loadReportData} className="btn-primary">
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metrics */}
              {reportData && (
                <div>
                  <h4 className="text-lg font-semibold text-secondary-900 mb-4">Key Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(report.metrics ?? []).map((metric) => {
                      const value = reportData.metrics[metric.id] || 0;
                      return (
                        <div key={metric.id} className="p-4 bg-secondary-50 rounded-lg">
                          <div className="text-sm text-secondary-600 mb-1">{metric.name}</div>
                          <div className="text-2xl font-bold text-secondary-900">
                            {formatMetricValue(value, metric.format)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Visualizations */}
              {reportData && (
                <div>
                  <h4 className="text-lg font-semibold text-secondary-900 mb-4">Visualizations</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(report.visualizations ?? []).map((viz, index) => (
                      <div key={index} className="p-4 border border-secondary-200 rounded-lg">
                        <ReportChart
                          visualization={viz}
                          metrics={report.metrics}
                          data={reportData}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Applied Filters</h4>
                <div className="space-y-2">
                  {(report.filters ?? []).map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 bg-secondary-50 rounded"
                    >
                      <Filter className="w-4 h-4 text-secondary-500" />
                      <span className="text-sm text-secondary-700">{filter.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 mt-6 pt-6 border-t border-secondary-200">
            <button
              onClick={() => handleExport('pdf')}
              className="btn-secondary flex items-center space-x-2"
              disabled={isLoading || !reportData}
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary flex items-center space-x-2"
              disabled={isLoading || !reportData}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="btn-secondary flex items-center space-x-2"
              disabled={isLoading || !reportData}
            >
              <Download className="w-4 h-4" />
              <span>Export XLSX</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Share className="w-4 h-4" />
              <span>Share Report</span>
            </button>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareReportModal report={report} onClose={() => setShowShareModal(false)} />
      )}
    </>
  );
}
