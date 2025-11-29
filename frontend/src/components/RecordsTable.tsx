import React from 'react';
import { CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Button, StatusBadge } from '@/components/ui';
import type { ExtendedReconciliationRecord } from '@/types/adjudication';

interface RecordsTableProps {
  records: ExtendedReconciliationRecord[];
  onViewDetails: (recordId: string) => void;
  onApprove: (recordId: string) => void;
  onReject: (recordId: string) => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  onViewDetails,
  onApprove,
  onReject,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          Discrepancy Records ({records.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                System
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discrepancy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(record as unknown as ExtendedReconciliationRecord).sources?.[0]?.systemName ||
                    'unknown'}{' '}
                  →{' '}
                  {(record as unknown as ExtendedReconciliationRecord).sources?.[1]?.systemName ||
                    (record as unknown as ExtendedReconciliationRecord).sources?.[0]?.systemName ||
                    'unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $
                  {(
                    (
                      (record as unknown as ExtendedReconciliationRecord).sources?.[0]?.data as {
                        amount?: number;
                      }
                    )?.amount || 0
                  ).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${(record.discrepancyAmount ?? 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={record.status}>{record.status}</StatusBadge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={record.priority || 'medium'}>
                    {record.priority || 'medium'}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(record.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {record.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onApprove(record.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReject(record.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
