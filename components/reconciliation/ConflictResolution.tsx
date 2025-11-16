// Conflict Resolution Component
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import type { EnhancedReconciliationRecord, Resolution } from '../../types/reconciliation';

interface ConflictResolutionProps {
  record: EnhancedReconciliationRecord;
  onResolve: (resolution: Partial<Resolution>) => void;
  className?: string;
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  record,
  onResolve,
  className = '',
}) => {
  const [resolution, setResolution] = useState<Partial<Resolution>>({
    type: 'manual',
    status: 'pending',
    resolution: '',
    comments: [],
  });

  const handleResolve = () => {
    onResolve({
      ...resolution,
      resolvedAt: new Date().toISOString(),
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold">Conflict Resolution</h3>
      </div>

      {record.status === 'discrepancy' && record.difference && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">
            Discrepancy detected: {Math.abs(record.difference)}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="resolution-type" className="block text-sm font-medium text-gray-700 mb-2">
            Resolution Type
          </label>
          <select
            id="resolution-type"
            value={resolution.type}
            onChange={(e) =>
              setResolution({ ...resolution, type: e.target.value as Resolution['type'] })
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution Details
          </label>
          <textarea
            value={resolution.resolution}
            onChange={(e) => setResolution({ ...resolution, resolution: e.target.value })}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Describe the resolution..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comments
          </label>
          <div className="space-y-2">
            {resolution.comments?.map((comment, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{comment}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setResolution({ ...resolution, status: 'rejected' })}
            className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 inline mr-2" />
            Reject
          </button>
          <button
            onClick={handleResolve}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

