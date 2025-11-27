/**
 * Report Detail Modal Component - Displays full report details
 */

import { X, Download, Share, Filter } from 'lucide-react';
import type { CustomReport } from '../types';
import { formatMetricValue, getVisualizationIcon } from '../utils/reportUtils';

interface ReportDetailModalProps {
  report: CustomReport;
  onClose: () => void;
  onExport: (report: CustomReport, format: 'pdf' | 'csv' | 'xlsx') => void;
}

export function ReportDetailModal({ report, onClose, onExport }: ReportDetailModalProps) {
  return (
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

        {/* Report Data */}
        <div className="space-y-6">
          {/* Metrics */}
          <div>
            <h4 className="text-lg font-semibold text-secondary-900 mb-4">Key Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(report.metrics ?? []).map((metric) => (
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
              {(report.visualizations ?? []).map((viz, index) => (
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

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 mt-6 pt-6 border-t border-secondary-200">
          <button
            onClick={() => onExport(report, 'pdf')}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => onExport(report, 'csv')}
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
  );
}

