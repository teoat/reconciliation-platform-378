/**
 * Audit Log Detail Modal
 */

import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { AuditLog } from '../types';
import { securityApiService } from '@/services/securityApiService';
import { logger } from '@/services/logger';
import { useState, useEffect } from 'react';
import { formatTimeAgo } from '../../../utils/common/dateFormatting';

interface AuditLogDetailModalProps {
  log: AuditLog;
  onClose: () => void;
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  const [fullLog, setFullLog] = useState<AuditLog | null>(log);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFullLog();
  }, [log.id]);

  const loadFullLog = async () => {
    setIsLoading(true);
    try {
      const response = await securityApiService.getAuditLog(log.id);
      if (response.success && response.data) {
        setFullLog(response.data);
      }
    } catch (error) {
      logger.error('Error loading audit log', { error });
    } finally {
      setIsLoading(false);
    }
  };

  if (!fullLog) return null;

  const getResultIcon = () => {
    switch (fullLog.result) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getResultIcon()}
            <div>
              <h3 className="text-2xl font-semibold text-secondary-900">Audit Log Details</h3>
              <p className="text-sm text-secondary-600">{fullLog.action}</p>
            </div>
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
              <p className="text-secondary-600">Loading log details...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">User</div>
                <div className="font-semibold text-secondary-900">{fullLog.userName}</div>
                <div className="text-xs text-secondary-500 mt-1">{fullLog.userId}</div>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Action</div>
                <div className="font-semibold text-secondary-900">{fullLog.action}</div>
                <div className="text-xs text-secondary-500 mt-1">{fullLog.resource}</div>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Result</div>
                <div className="font-semibold text-secondary-900 capitalize">{fullLog.result}</div>
                <div className="text-xs text-secondary-500 mt-1">
                  Risk Level: {fullLog.riskLevel}
                </div>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-sm text-secondary-600 mb-1">Timestamp</div>
                <div className="font-semibold text-secondary-900">
                  {new Date(fullLog.timestamp).toLocaleString()}
                </div>
                <div className="text-xs text-secondary-500 mt-1">{formatTimeAgo(fullLog.timestamp)}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-secondary-900 mb-2">Network Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary-600">IP Address:</span>
                  <span className="ml-2 text-secondary-900">{fullLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-secondary-600">User Agent:</span>
                  <span className="ml-2 text-secondary-900 text-xs">{fullLog.userAgent}</span>
                </div>
              </div>
            </div>

            {Object.keys(fullLog.details).length > 0 && (
              <div>
                <h4 className="font-semibold text-secondary-900 mb-2">Details</h4>
                <div className="bg-secondary-50 rounded-lg p-4">
                  <pre className="text-sm text-secondary-700 whitespace-pre-wrap">
                    {JSON.stringify(fullLog.details, null, 2)}
                  </pre>
                </div>
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

