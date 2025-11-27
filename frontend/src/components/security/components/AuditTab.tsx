/**
 * Audit Logs Tab Component
 */

import { useState } from 'react';
import { Activity, Eye } from 'lucide-react';
import type { AuditLog } from '../types';
import { getStatusColor, getSeverityColor } from '../utils/formatters';
import { formatTimeAgo } from '../../../utils/common/dateFormatting';
import { AuditLogDetailModal } from './AuditLogDetailModal';

interface AuditTabProps {
  auditLogs: AuditLog[];
}

export const AuditTab = ({ auditLogs }: AuditTabProps) => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="p-6">
      <div className="space-y-3">
        {auditLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-secondary-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-secondary-900">{log.userName}</span>
                  <span className="text-sm text-secondary-600">{log.action}</span>
                  <span className="text-sm text-secondary-500">{log.resource}</span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-secondary-500 mt-1">
                  <span>{log.ipAddress}</span>
                  <span>{formatTimeAgo(log.timestamp)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.result)}`}
              >
                {log.result}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.riskLevel)}`}
              >
                {log.riskLevel}
              </span>
              <button
                onClick={() => {
                  setSelectedLog(log);
                  setShowModal(true);
                }}
                className="p-1 text-secondary-400 hover:text-secondary-600"
                title="View Details"
                aria-label={`View details for audit log ${log.id}`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => {
            setShowModal(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

