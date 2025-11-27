/**
 * Report Card Component - Displays a single report in the grid
 */

import { FileText, Eye, Download, Trash2 } from 'lucide-react';
import type { CustomReport } from '../types';
import { formatMetricValue, getVisualizationIcon } from '../utils/reportUtils';

interface ReportCardProps {
  report: CustomReport;
  onView: (report: CustomReport) => void;
  onExport: (report: CustomReport) => void;
  onDelete: (reportId: string) => void;
}

export function ReportCard({ report, onView, onExport, onDelete }: ReportCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
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
            onClick={() => onView(report)}
            className="p-1 text-secondary-400 hover:text-secondary-600"
            title="View Report"
            aria-label={`View report ${report.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onExport(report)}
            className="p-1 text-secondary-400 hover:text-secondary-600"
            title="Export PDF"
            aria-label={`Export report ${report.name}`}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(report.id)}
            className="p-1 text-secondary-400 hover:text-red-600"
            title="Delete Report"
            aria-label={`Delete report ${report.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-secondary-600 mb-4">{report.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {(report.tags ?? []).map((tag) => (
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
          {(report.metrics ?? []).slice(0, 4).map((metric) => (
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
          {(report.visualizations ?? []).map((viz, index) => (
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
          <span>
            Updated:{' '}
            {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : 'N/A'}
          </span>
          {report.schedule && (
            <span className="text-primary-600">{report.schedule.frequency} report</span>
          )}
        </div>
      </div>
    </div>
  );
}

