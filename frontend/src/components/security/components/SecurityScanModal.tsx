/**
 * Security Scan Modal Component
 */

import { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { securityApiService } from '@/services/securityApiService';
import { logger } from '@/services/logger';
import Select from '../../ui/Select';

interface SecurityScanModalProps {
  onClose: () => void;
}

interface Vulnerability {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
  recommendation?: string;
  category?: string;
}

interface ScanSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues?: number;
  lowIssues?: number;
}

interface SecurityScanResults {
  summary?: ScanSummary;
  vulnerabilities?: Vulnerability[];
  timestamp?: string;
  scanId?: string;
}

export function SecurityScanModal({ onClose }: SecurityScanModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<SecurityScanResults | null>(null);
  const [scope, setScope] = useState<'full' | 'policies' | 'access' | 'compliance'>('full');
  const [error, setError] = useState<string | null>(null);

  const runScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const response = await securityApiService.runSecurityScan({ scope });
      if (response.success && response.data) {
        setScanId(response.data.scanId);
        pollScanStatus(response.data.scanId);
      } else {
        setError('Failed to start security scan');
      }
    } catch (err) {
      logger.error('Error running security scan', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to start security scan');
      setIsScanning(false);
    }
  };

  const pollScanStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await securityApiService.getSecurityScanStatus(id);
        if (response.success && response.data) {
          if (response.data.status === 'completed') {
            setScanResults(response.data.results);
            setIsScanning(false);
            clearInterval(interval);
          } else if (response.data.status === 'failed') {
            setError('Security scan failed');
            setIsScanning(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        logger.error('Error polling scan status', { error: err });
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 2000);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (isScanning) {
        setError('Scan timeout - please try again');
        setIsScanning(false);
      }
    }, 300000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-primary-600" />
            <div>
              <h3 className="text-2xl font-semibold text-secondary-900">Security Scan</h3>
              <p className="text-sm text-secondary-600">Run comprehensive security assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label="Close scan modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          {!isScanning && !scanResults && (
            <>
              <Select
                label="Scan Scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
                options={[
                  { value: 'full', label: 'Full System Scan' },
                  { value: 'policies', label: 'Security Policies Only' },
                  { value: 'access', label: 'Access Control Only' },
                  { value: 'compliance', label: 'Compliance Only' },
                ]}
                fullWidth
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-6 border-t border-secondary-200">
                <button onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={runScan} className="btn-primary flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Start Scan</span>
                </button>
              </div>
            </>
          )}

          {isScanning && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <h4 className="text-lg font-semibold text-secondary-900 mb-2">Scanning...</h4>
              <p className="text-secondary-600">Please wait while we analyze your security configuration</p>
            </div>
          )}

          {scanResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="text-sm text-secondary-600 mb-1">Total Issues</div>
                  <div className="text-2xl font-bold text-secondary-900">
                    {scanResults.summary?.totalIssues || 0}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600 mb-1">Critical</div>
                  <div className="text-2xl font-bold text-red-900">
                    {scanResults.summary?.criticalIssues || 0}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-600 mb-1">High</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {scanResults.summary?.highIssues || 0}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-secondary-900 mb-4">Vulnerabilities</h4>
                <div className="space-y-3">
                  {scanResults.vulnerabilities?.map((vuln: Vulnerability, index: number) => (
                    <div
                      key={index}
                      className="border border-secondary-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {vuln.severity === 'critical' || vuln.severity === 'high' ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-yellow-600" />
                          )}
                          <h5 className="font-semibold text-secondary-900">{vuln.title}</h5>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            vuln.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : vuln.severity === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {vuln.severity}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600 mb-2">{vuln.description}</p>
                      <p className="text-sm text-secondary-700">
                        <strong>Recommendation:</strong> {vuln.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-6 border-t border-secondary-200">
                <button onClick={onClose} className="btn-primary">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

