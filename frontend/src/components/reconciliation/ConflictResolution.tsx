import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { EnhancedReconciliationRecord } from '../../types/reconciliation';

interface ConflictResolutionProps {
  conflicts: EnhancedReconciliationRecord[];
  onResolveConflict: (recordId: string, resolution: 'approve' | 'reject' | 'escalate') => void;
  onBulkResolve: (recordIds: string[], resolution: 'approve' | 'reject' | 'escalate') => void;
  isLoading?: boolean;
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflicts,
  onResolveConflict,
  onBulkResolve,
  isLoading = false,
}) => {
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([]);
  const [viewingConflict, setViewingConflict] = useState<EnhancedReconciliationRecord | null>(null);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'escalate' | null>(null);

  const handleSelectConflict = (recordId: string) => {
    setSelectedConflicts((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    setSelectedConflicts(
      selectedConflicts.length === conflicts.length ? [] : conflicts.map((c) => c.id)
    );
  };

  const handleBulkAction = () => {
    if (bulkAction && selectedConflicts.length > 0) {
      onBulkResolve(selectedConflicts, bulkAction);
      setSelectedConflicts([]);
      setBulkAction(null);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'discrepancy':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'escalated':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Conflict Resolution</h3>
              <span className="px-2 py-1 text-sm bg-orange-100 text-orange-800 rounded-full">
                {conflicts.length} conflicts
              </span>
            </div>

            {selectedConflicts.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{selectedConflicts.length} selected</span>
                <select
                  value={bulkAction || ''}
                  onChange={(e) => setBulkAction(e.target.value as 'approve' | 'reject' | 'escalate' | null)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">Bulk action</option>
                  <option value="approve">Approve All</option>
                  <option value="reject">Reject All</option>
                  <option value="escalate">Escalate All</option>
                </select>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>

          {conflicts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No conflicts to resolve</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedConflicts.length === conflicts.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </div>

              {/* Conflict List */}
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedConflicts.includes(conflict.id)}
                        onChange={() => handleSelectConflict(conflict.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">Record {conflict.id}</span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conflict.status)}`}
                          >
                            {conflict.status}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(conflict.riskLevel)}`}
                          >
                            {conflict.riskLevel} risk
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          <div className="grid grid-cols-2 gap-4">
                            {conflict.sources.map((source, index) => (
                              <div key={index} className="bg-white p-3 rounded border">
                                <div className="font-medium text-gray-900 mb-1">
                                  {source.systemName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Confidence: {source.confidence}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingConflict(conflict)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onResolveConflict(conflict.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onResolveConflict(conflict.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onResolveConflict(conflict.id, 'escalate')}
                          >
                            Escalate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Conflict Details Modal */}
      <Modal
        isOpen={!!viewingConflict}
        onClose={() => setViewingConflict(null)}
        title={`Conflict Details - ${viewingConflict?.id}`}
        size="lg"
      >
        {viewingConflict && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                <span
                  className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(viewingConflict.status)}`}
                >
                  {viewingConflict.status}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Risk Level</h4>
                <span
                  className={`px-2 py-1 text-sm font-medium rounded-full ${getRiskColor(viewingConflict.riskLevel)}`}
                >
                  {viewingConflict.riskLevel}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Confidence</h4>
                <span className="text-sm text-gray-900">{viewingConflict.confidence}%</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Match Score</h4>
                <span className="text-sm text-gray-900">{viewingConflict.matchScore}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Data Sources</h4>
              <div className="space-y-3">
                {viewingConflict.sources.map((source, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{source.systemName}</h5>
                      <span className="text-sm text-gray-600">
                        Confidence: {source.confidence}%
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded border text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(source.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
