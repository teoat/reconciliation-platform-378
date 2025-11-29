import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button, StatusBadge } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import type { ExtendedReconciliationRecord } from '@/types/adjudication';

interface RecordModalProps {
  record: ExtendedReconciliationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (recordId: string) => void;
  onReject: (recordId: string) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={record ? 'Record Details' : ''} size="lg">
      {record && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Source System</p>
              <p className="text-sm text-gray-900">{record.sources?.[0]?.systemName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Target System</p>
              <p className="text-sm text-gray-900">
                {record.sources?.[1]?.systemName || record.sources?.[0]?.systemName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Amount</p>
              <p className="text-sm text-gray-900">
                $
                {((record.sources?.[0]?.data as { amount?: number })?.amount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Discrepancy Amount</p>
              <p className="text-sm text-gray-900">
                ${(record.discrepancy_amount || record.discrepancyAmount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-sm text-gray-900">
                <StatusBadge status={record.status || 'pending'}>
                  {record.status || 'pending'}
                </StatusBadge>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Priority</p>
              <p className="text-sm text-gray-900">
                <StatusBadge status={record.priority || 'medium'}>
                  {record.priority || 'medium'}
                </StatusBadge>
              </p>
            </div>
            {(record.confidence_score || record.confidence || record.matchScore) && (
              <div>
                <p className="text-sm font-medium text-gray-600">Confidence Score</p>
                <p className="text-sm text-gray-900">
                  {(
                    (record.confidence_score ?? record.confidence ?? record.matchScore ?? 0) * 100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-200 flex space-x-2">
            {record.status === 'pending' && (
              <>
                <Button onClick={() => onApprove(record.id)} variant="primary" size="sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button onClick={() => onReject(record.id)} variant="danger" size="sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
