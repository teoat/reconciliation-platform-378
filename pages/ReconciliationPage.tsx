'use client';

import { useState, useEffect, useMemo } from 'react';
import { useData } from '../components/DataProvider';
import { useUnifiedData } from '../components/UnifiedDataProvider';
import { useProjects, useRealtimeCollaboration } from '../hooks/useApi';

// Import all extracted types
import type {
  EnhancedReconciliationRecord,
  ReconciliationMetrics,
  MatchingRule,
  FilterConfig,
  SortConfig,
  PaginationConfig,
} from '../types/reconciliation';

// Import all extracted utilities
import { applyFilters } from '../utils/reconciliation/filtering';
import { sortRecords } from '../utils/reconciliation/sorting';
import { applyMatchingRules } from '../utils/reconciliation/matching';

// Import all extracted components
import {
  ReconciliationSummary,
  ReconciliationResults,
  MatchingRules,
  ConflictResolution,
} from '../components/reconciliation';

// Import all extracted hooks
import {
  useReconciliationFilters,
  useReconciliationSort,
  useReconciliationEngine,
  useMatchingRules,
  useConflictResolution,
} from '../hooks/reconciliation';

interface ReconciliationPageProps {
  project: any;
  onProgressUpdate?: (step: string) => void;
}

const ReconciliationPage = ({ project, onProgressUpdate }: ReconciliationPageProps) => {
  // Context hooks
  const { currentProject, getReconciliationData, transformReconciliationToCashflow } = useData();
  const { crossPageData, updateCrossPageData, workflowProgress, advanceWorkflow } = useUnifiedData();
  const { projects, fetchProjects } = useProjects();
  const { isConnected, activeUsers, sendComment } = useRealtimeCollaboration('reconciliation');

  // State
  const [records, setRecords] = useState<EnhancedReconciliationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EnhancedReconciliationRecord | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extracted hooks
  const {
    filters,
    filteredRecords,
    addFilter,
    removeFilter,
    clearFilters,
  } = useReconciliationFilters(records);

  const {
    sortConfig,
    sortedRecords,
    handleSort,
    clearSort,
  } = useReconciliationSort(filteredRecords);

  const {
    rules: engineRules,
    processRecords,
    isProcessing: isEngineProcessing,
    metrics,
  } = useReconciliationEngine(records);

  const {
    rules: matchingRules,
    addRule,
    updateRule,
    removeRule,
  } = useMatchingRules();

  const {
    resolveConflict,
    getResolution,
    approveResolution,
    rejectResolution,
    hasConflict,
  } = useConflictResolution();

  // Pagination
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 50,
    totalRecords: 0,
    totalPages: 0,
  });

  // Initialize data
  useEffect(() => {
    const reconciliationData = getReconciliationData();
    if (reconciliationData && reconciliationData.records.length > 0) {
      setRecords(reconciliationData.records as EnhancedReconciliationRecord[]);
      setPagination((prev) => ({
        ...prev,
        totalRecords: reconciliationData.records.length,
        totalPages: Math.ceil(reconciliationData.records.length / prev.pageSize),
      }));
    }
    onProgressUpdate?.('reconciliation_started');
  }, [currentProject, getReconciliationData, onProgressUpdate]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return sortedRecords.slice(startIndex, endIndex);
  }, [sortedRecords, pagination]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize,
      page: 1,
      totalPages: Math.ceil(prev.totalRecords / pageSize),
    }));
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const processed = await processRecords();
      setRecords(processed);
    } catch (error) {
      console.error('Error processing records:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordClick = (record: EnhancedReconciliationRecord) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  const handleResolve = (record: EnhancedReconciliationRecord, resolution: any) => {
    resolveConflict(record.id, {
      id: `res-${Date.now()}`,
      type: 'manual',
      status: 'approved',
      resolution: resolution.resolution,
      comments: resolution.comments || [],
      attachments: [],
      resolvedAt: new Date().toISOString(),
    });
    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id ? { ...r, status: 'resolved', resolution: getResolution(r.id) } : r
      )
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reconciliation</h1>
        <button
          onClick={handleProcess}
          disabled={isProcessing || isEngineProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Process Reconciliation'}
        </button>
      </div>

      {/* Reconciliation Summary */}
      {metrics && <ReconciliationSummary metrics={metrics} />}

      {/* Matching Rules */}
      <MatchingRules
        rules={matchingRules}
        onRulesChange={(newRules) => {
          newRules.forEach((rule) => {
            if (matchingRules.find((r) => r.id === rule.id)) {
              updateRule(rule.id, rule);
            } else {
              addRule(rule);
            }
          });
        }}
        onTest={(rule) => {
          // Test rule logic
          console.log('Testing rule:', rule);
        }}
      />

      {/* Reconciliation Results */}
      <ReconciliationResults
        records={paginatedRecords}
        onRecordClick={handleRecordClick}
        onRecordEdit={(record) => {
          setSelectedRecord(record);
          setShowRecordModal(true);
        }}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
          {Math.min(pagination.page * pagination.pageSize, sortedRecords.length)} of{' '}
          {sortedRecords.length} records
        </div>
        <div className="flex items-center gap-4">
          <select
            value={pagination.pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1 disabled:opacity-50"
            >
              ←
            </button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1 disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Record Modal */}
      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Record Details</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Status: {selectedRecord.status}</h4>
                <p>Confidence: {selectedRecord.confidence}%</p>
                <p>Match Score: {selectedRecord.matchScore}</p>
              </div>

              {hasConflict(selectedRecord) && (
                <ConflictResolution
                  record={selectedRecord}
                  onResolve={(resolution) => handleResolve(selectedRecord, resolution)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Reconciliation</h3>
              <p className="text-gray-600">Running matching algorithms...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationPage;

