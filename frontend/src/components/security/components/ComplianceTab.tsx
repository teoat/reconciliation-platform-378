/**
 * Compliance Tab Component
 */

import { useState } from 'react';
import { CheckCircle, Eye, Download } from 'lucide-react';
import type { ComplianceReport } from '../types';
import { getStatusColor, getFrameworkColor } from '../utils/formatters';
import { ComplianceReportModal } from './ComplianceReportModal';

interface ComplianceTabProps {
  reports: ComplianceReport[];
  onViewReport?: (report: ComplianceReport) => void;
}

export const ComplianceTab = ({ reports, onViewReport }: ComplianceTabProps) => {
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleView = (report: ComplianceReport) => {
    setSelectedReport(report);
    setShowModal(true);
    onViewReport?.(report);
  };
  return (
    <div className="p-6">
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{report.name}</h3>
                  <p className="text-sm text-secondary-600">
                    {report.framework.toUpperCase()} Framework
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getFrameworkColor(report.framework)}`}
                >
                  {report.framework.toUpperCase()}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}
                >
                  {report.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span className="text-secondary-600">Score:</span>
                <span className="ml-2 text-secondary-900">{report.score}%</span>
              </div>
              <div>
                <span className="text-secondary-600">Last Assessment:</span>
                <span className="ml-2 text-secondary-900">
                  {new Date(report.lastAssessment).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Findings:</span>
                <span className="ml-2 text-secondary-900">{report.findings.length}</span>
              </div>
              <div>
                <span className="text-secondary-600">Next Assessment:</span>
                <span className="ml-2 text-secondary-900">
                  {new Date(report.nextAssessment).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleView(report)}
                className="btn-secondary text-sm flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Report
              </button>
              <button className="btn-primary text-sm flex-1">
                <Download className="w-4 h-4 mr-1" />
                Export Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedReport && (
        <ComplianceReportModal
          report={selectedReport}
          onClose={() => {
            setShowModal(false);
            setSelectedReport(null);
          }}
        />
      )}
    </div>
  );
};

