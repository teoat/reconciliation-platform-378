/**
 * Compliance Report Detail Modal
 */

import { X, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ComplianceReport } from '../types';
import { securityApiService } from '@/services/securityApiService';
import { logger } from '@/services/logger';
import { useState, useEffect } from 'react';

interface ComplianceReportModalProps {
  report: ComplianceReport;
  onClose: () => void;
}

export function ComplianceReportModal({ report, onClose }: ComplianceReportModalProps) {
  const [fullReport, setFullReport] = useState<ComplianceReport | null>(report);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFullReport();
  }, [report.id]);

  const loadFullReport = async () => {
    setIsLoading(true);
    try {
      const response = await securityApiService.getComplianceReport(report.id);
      if (response.success && response.data) {
        setFullReport(response.data);
      }
    } catch (error) {
      logger.error('Error loading compliance report', { error });
    } finally {
      setIsLoading(false);
    }
  };

  if (!fullReport) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-secondary-900">{fullReport.name}</h3>
            <p className="text-secondary-600">{fullReport.framework.toUpperCase()} Framework</p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Loading report...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Compliance Score</div>
                <div className="text-2xl font-bold text-secondary-900">{fullReport.score}%</div>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Status</div>
                <div className="text-2xl font-bold text-secondary-900 capitalize">{fullReport.status}</div>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Findings</div>
                <div className="text-2xl font-bold text-secondary-900">{fullReport.findings.length}</div>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Last Assessment</div>
                <div className="text-sm font-semibold text-secondary-900">
                  {new Date(fullReport.lastAssessment).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-4">Findings</h4>
              <div className="space-y-3">
                {fullReport.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="border border-secondary-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {finding.severity === 'critical' || finding.severity === 'high' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-yellow-600" />
                        )}
                        <h5 className="font-semibold text-secondary-900">{finding.title}</h5>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          finding.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : finding.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mb-2">{finding.description}</p>
                    <div className="flex items-center justify-between text-xs text-secondary-500">
                      <span>Status: {finding.status}</span>
                      <span>Due: {new Date(finding.dueDate).toLocaleDateString()}</span>
                      <span>Assigned to: {finding.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {fullReport.recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Recommendations</h4>
                <ul className="list-disc list-inside space-y-2">
                  {fullReport.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-secondary-700">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-6 border-t border-secondary-200">
              <button onClick={onClose} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

