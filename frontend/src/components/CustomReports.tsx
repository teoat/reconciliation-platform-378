'use client';
import { logger } from '@/services/logger';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Share, 
  Filter, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Save, 
  Eye, 
  Settings, 
  X 
} from 'lucide-react';
import { useData } from './DataProvider';
import type { BackendProject } from '../services/apiClient/types';
import type { ReconciliationData } from './data/types';
import type { ReconciliationRecord } from '@/types/index';

// Custom Report Interfaces
interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | number | boolean | string[] | null;
  label: string;
}

interface ReportMetric {
  id: string;
  name: string;
  type: 'count' | 'sum' | 'average' | 'percentage' | 'trend';
  field?: string;
  calculation?: string;
  format: 'number' | 'currency' | 'percentage' | 'date';
}

interface ReportVisualization {
  type: 'table' | 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  metrics: string[];
  groupBy?: string;
  sortBy?: string;
  limit?: number;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  dataSource: 'reconciliation' | 'cashflow' | 'projects' | 'users';
  filters: ReportFilter[];
  metrics: ReportMetric[];
  visualizations: ReportVisualization[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
}

interface CustomReportsProps {
  project: BackendProject;
  onProgressUpdate?: (step: string) => void;
}

const CustomReports = ({ project, onProgressUpdate }: CustomReportsProps) => {
  const { getReconciliationData, getCashflowData } = useData();
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

  // Filter reports by tags
  const filteredReports = reports.filter(
    (report) =>
      filterTags === '' ||
      report.tags.some((tag) => tag.toLowerCase().includes(filterTags.toLowerCase()))
  );

  // Generate report data
  const generateReportData = useCallback(
    (report: CustomReport) => {
      const reconciliationData = getReconciliationData();
      const cashflowData = getCashflowData();

      // Apply filters
      let data: ReconciliationRecord[] = [];
      switch (report.dataSource) {
        case 'reconciliation':
          data = reconciliationData?.records || [];
          break;
        case 'cashflow':
          data = cashflowData?.records || [];
          break;
        case 'projects':
          data = []; // Would fetch project data
          break;
        case 'users':
          data = []; // Would fetch user data
          break;
      }

      // Apply filters
      data = data.filter((record) => {
        return report.filters.every((filter) => {
          const recordValue = (record as unknown as Record<string, unknown>)[filter.field];
          const filterValue = filter.value;
          
          switch (filter.operator) {
            case 'equals':
              return recordValue === filterValue;
            case 'contains':
              return String(recordValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'greater_than':
              return Number(recordValue) > Number(filterValue);
            case 'less_than':
              return Number(recordValue) < Number(filterValue);
            case 'between':
              if (Array.isArray(filterValue) && filterValue.length >= 2) {
                return (
                  Number(recordValue) >= Number(filterValue[0]) && 
                  Number(recordValue) <= Number(filterValue[1])
                );
              }
              return false;
            case 'in':
              return Array.isArray(filterValue) && typeof recordValue !== 'undefined' 
                ? filterValue.some(val => {
                    const valStr = String(val);
                    const recordStr = String(recordValue);
                    return val === recordValue || valStr === recordStr;
                  })
                : false;
            default:
              return true;
          }
        });
      });

      // Calculate metrics
      const metricsData: Record<string, number> = {};
      report.metrics.forEach((metric) => {
        switch (metric.type) {
          case 'count':
            metricsData[metric.id] = data.length;
            break;
          case 'sum':
            if (metric.field) {
              metricsData[metric.id] = data.reduce(
                (sum, record) => {
                  const fieldValue = (record as unknown as Record<string, unknown>)[metric.field!];
                  return sum + (Number(fieldValue) || 0);
                },
                0
              );
            }
            break;
          case 'average': {
            if (metric.field) {
              const values = data
                .map((record) => {
                  const fieldValue = (record as unknown as Record<string, unknown>)[metric.field!];
                  return Number(fieldValue) || 0;
                })
                .filter((v) => v > 0);
              metricsData[metric.id] =
                values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            }
            break;
          }
          case 'percentage':
            if (metric.calculation) {
              // Simple calculation parser (would need more robust implementation)
              const [numerator, denominator] = metric.calculation.split('/');
              const num = metricsData[numerator] || 0;
              const den = metricsData[denominator] || 1;
              metricsData[metric.id] = (num / den) * 100;
            }
            break;
        }
      });

      return { data, metrics: metricsData };
    },
    [getReconciliationData, getCashflowData]
  );

  // Export report
  const exportReport = useCallback(
    (report: CustomReport, format: 'pdf' | 'csv' | 'xlsx') => {
      const reportData = generateReportData(report);

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
    [generateReportData]
  );

  // Delete report
  const deleteReport = useCallback((reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }, []);

  // Format metric value
  const formatMetricValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value.toLocaleString();
    }
  };

  // Get visualization icon
  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'line':
        return <TrendingUp className="w-4 h-4" />;
      case 'pie':
        return <PieChart className="w-4 h-4" />;
      case 'table':
        return <FileText className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    loadReports();
    onProgressUpdate?.('custom_reports_loaded');
  }, [loadReports, onProgressUpdate]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Loading Custom Reports
            </h3>
            <p className="text-secondary-600">Fetching your saved reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Custom Reports</h1>
            <p className="text-secondary-600">
              Create, manage, and share custom reports with advanced filtering and visualization
              options
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filter by tags..."
              value={filterTags}
              onChange={(e) => setFilterTags(e.target.value)}
              className="input-field"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </button>
          </div>
        </div>

        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-8 h-8 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-secondary-900">{report.name}</h3>
                  <p className="text-sm text-secondary-600">{report.dataSource}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowReportModal(true);
                  }}
                  className="p-1 text-secondary-400 hover:text-secondary-600"
                  title="View Report"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportReport(report, 'pdf')}
                  className="p-1 text-secondary-400 hover:text-secondary-600"
                  title="Export PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteReport(report.id)}
                  className="p-1 text-secondary-400 hover:text-red-600"
                  title="Delete Report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-secondary-600 mb-4">{report.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {(report.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Metrics Preview */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-secondary-900">Key Metrics:</h4>
              <div className="grid grid-cols-2 gap-2">
                {(report.metrics || []).slice(0, 4).map((metric) => (
                  <div key={metric.id} className="text-xs">
                    <div className="text-secondary-600">{metric.name}</div>
                    <div className="font-semibold text-secondary-900">
                      {formatMetricValue(Math.random() * 1000, metric.format)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visualizations */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-secondary-900">Visualizations:</h4>
              <div className="flex flex-wrap gap-1">
                {(report.visualizations || []).map((viz, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded"
                  >
                    {getVisualizationIcon(viz.type)}
                    <span className="capitalize">{viz.type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-secondary-200">
              <div className="flex items-center justify-between text-xs text-secondary-500">
                <span>Updated: {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : 'N/A'}</span>
                {report.schedule && (
                  <span className="text-primary-600">{report.schedule.frequency} report</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No reports found</h3>
          <p className="text-secondary-600 mb-4">
            {filterTags
              ? 'Try adjusting your filter criteria.'
              : 'Create your first custom report to get started.'}
          </p>
          {!filterTags && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Your First Report
            </button>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-secondary-900">{selectedReport.name}</h3>
                <p className="text-secondary-600">{selectedReport.description}</p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Report Data */}
            <div className="space-y-6">
              {/* Metrics */}
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Key Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(selectedReport.metrics || []).map((metric) => (
                    <div key={metric.id} className="p-4 bg-secondary-50 rounded-lg">
                      <div className="text-sm text-secondary-600 mb-1">{metric.name}</div>
                      <div className="text-2xl font-bold text-secondary-900">
                        {formatMetricValue(Math.random() * 10000, metric.format)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visualizations */}
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Visualizations</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(selectedReport.visualizations || []).map((viz, index) => (
                    <div key={index} className="p-4 border border-secondary-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-4">
                        {getVisualizationIcon(viz.type)}
                        <span className="font-medium text-secondary-900 capitalize">
                          {viz.type} Chart
                        </span>
                      </div>
                      <div className="h-48 bg-secondary-50 rounded flex items-center justify-center">
                        <span className="text-secondary-500">
                          Chart visualization would render here
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Applied Filters</h4>
                <div className="space-y-2">
                  {(selectedReport.filters || []).map((filter, index) => (
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

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 mt-6 pt-6 border-t border-secondary-200">
              <button
                onClick={() => exportReport(selectedReport, 'pdf')}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => exportReport(selectedReport, 'csv')}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button className="btn-primary flex items-center space-x-2">
                <Share className="w-4 h-4" />
                <span>Share Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">Create Custom Report</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center py-8">
                <Settings className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-secondary-900 mb-2">Report Builder</h4>
                <p className="text-secondary-600">
                  Advanced report creation interface would be implemented here
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6 pt-6 border-t border-secondary-200">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Create Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomReports;
