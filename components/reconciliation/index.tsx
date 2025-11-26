'use client';

import React from 'react';

// Stub components for reconciliation workflow
// These are placeholders until the full components are migrated

export const ReconciliationSummary: React.FC<{
  totalRecords?: number;
  matchedRecords?: number;
  unmatchedRecords?: number;
  discrepancyRecords?: number;
  className?: string;
}> = ({ totalRecords = 0, matchedRecords = 0, unmatchedRecords = 0, discrepancyRecords = 0, className = '' }) => (
  <div className={`reconciliation-summary p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">Summary</h3>
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold">{totalRecords}</div>
        <div className="text-sm text-gray-500">Total</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-green-600">{matchedRecords}</div>
        <div className="text-sm text-gray-500">Matched</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-yellow-600">{unmatchedRecords}</div>
        <div className="text-sm text-gray-500">Unmatched</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-red-600">{discrepancyRecords}</div>
        <div className="text-sm text-gray-500">Discrepancies</div>
      </div>
    </div>
  </div>
);

export const ReconciliationResults: React.FC<{
  results?: { matched: number; unmatched: number; discrepancies: number };
  className?: string;
}> = ({ results = { matched: 0, unmatched: 0, discrepancies: 0 }, className = '' }) => (
  <div className={`reconciliation-results p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">Results</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Matched:</span>
        <span className="font-bold text-green-600">{results.matched}</span>
      </div>
      <div className="flex justify-between">
        <span>Unmatched:</span>
        <span className="font-bold text-yellow-600">{results.unmatched}</span>
      </div>
      <div className="flex justify-between">
        <span>Discrepancies:</span>
        <span className="font-bold text-red-600">{results.discrepancies}</span>
      </div>
    </div>
  </div>
);

export const MatchingRules: React.FC<{
  rules?: Array<{ id: string; field: string; operator: string; threshold?: number }>;
  onRuleChange?: (rules: Array<{ id: string; field: string; operator: string; threshold?: number }>) => void;
  className?: string;
}> = ({ rules = [], onRuleChange, className = '' }) => (
  <div className={`matching-rules p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">Matching Rules</h3>
    {rules.map((rule) => (
      <div key={rule.id} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
        <span className="text-sm font-medium">{rule.field}</span>
        <span className="text-gray-400">{rule.operator}</span>
        {rule.threshold !== undefined && (
          <span className="text-sm text-blue-600">{rule.threshold}%</span>
        )}
      </div>
    ))}
    {rules.length === 0 && (
      <div className="text-sm text-gray-500">No matching rules defined</div>
    )}
  </div>
);

export const ConflictResolution: React.FC<{
  conflicts?: Array<{ id: string; sourceValue: unknown; targetValue: unknown; field: string }>;
  onResolve?: (id: string, resolution: 'source' | 'target' | 'custom', customValue?: unknown) => void;
  className?: string;
}> = ({ conflicts = [], onResolve, className = '' }) => (
  <div className={`conflict-resolution p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">Conflict Resolution</h3>
    {conflicts.map((c) => (
      <div key={c.id} className="mb-4 p-3 border border-orange-200 rounded bg-orange-50">
        <div className="text-sm font-medium text-gray-700 mb-2">{c.field}</div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
          <div>
            <span className="text-gray-500">Source:</span> {String(c.sourceValue)}
          </div>
          <div>
            <span className="text-gray-500">Target:</span> {String(c.targetValue)}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onResolve?.(c.id, 'source')}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Use Source
          </button>
          <button
            onClick={() => onResolve?.(c.id, 'target')}
            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Use Target
          </button>
        </div>
      </div>
    ))}
    {conflicts.length === 0 && (
      <div className="text-sm text-gray-500">No conflicts to resolve</div>
    )}
  </div>
);

export const ReconciliationResultsPanel: React.FC<{
  results?: { matched: number; unmatched: number; discrepancies: number };
  className?: string;
}> = ReconciliationResults;

export const MatchingRulesEditor: React.FC<{
  rules?: Array<{ id: string; field: string; operator: string; threshold?: number }>;
  onRuleChange?: (rules: Array<{ id: string; field: string; operator: string; threshold?: number }>) => void;
  className?: string;
}> = MatchingRules;

export const DiscrepancyViewer: React.FC<{
  discrepancies?: Array<{ id: string; sourceValue: unknown; targetValue: unknown; field: string }>;
  onResolve?: (id: string, resolution: 'source' | 'target' | 'custom') => void;
  className?: string;
}> = ConflictResolution as any;

export const ReconciliationTable: React.FC<{
  data?: Array<{ id: string; status: 'matched' | 'unmatched' | 'discrepancy'; source: Record<string, unknown>; target?: Record<string, unknown> }>;
  onRowSelect?: (id: string) => void;
  className?: string;
}> = ({ data = [], onRowSelect, className = '' }) => (
  <div className={`reconciliation-table overflow-auto ${className}`}>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.slice(0, 20).map((row) => (
          <tr key={row.id} className="hover:bg-gray-50">
            <td className="px-4 py-2 text-sm">{row.id}</td>
            <td className="px-4 py-2">
              <span className={`px-2 py-1 rounded text-xs ${
                row.status === 'matched' ? 'bg-green-100 text-green-800' :
                row.status === 'unmatched' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {row.status}
              </span>
            </td>
            <td className="px-4 py-2">
              <button
                onClick={() => onRowSelect?.(row.id)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ToleranceEditor: React.FC<{
  tolerances?: Record<string, number>;
  onChange?: (field: string, value: number) => void;
  className?: string;
}> = ({ tolerances = {}, onChange, className = '' }) => (
  <div className={`tolerance-editor p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">Tolerance Settings</h3>
    {Object.entries(tolerances).map(([field, value]) => (
      <div key={field} className="flex items-center justify-between mb-2">
        <span className="text-sm">{field}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange?.(field, Number(e.target.value))}
          className="w-32"
        />
        <span className="text-sm text-gray-600 w-12 text-right">{value}%</span>
      </div>
    ))}
  </div>
);

export const BatchActionsPanel: React.FC<{
  selectedCount?: number;
  onApprove?: () => void;
  onReject?: () => void;
  onExport?: () => void;
  className?: string;
}> = ({ selectedCount = 0, onApprove, onReject, onExport, className = '' }) => (
  <div className={`batch-actions-panel p-4 bg-white rounded-lg shadow flex items-center justify-between ${className}`}>
    <span className="text-sm text-gray-600">
      {selectedCount} items selected
    </span>
    <div className="flex gap-2">
      <button
        onClick={onApprove}
        disabled={selectedCount === 0}
        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={onReject}
        disabled={selectedCount === 0}
        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
      <button
        onClick={onExport}
        disabled={selectedCount === 0}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        Export
      </button>
    </div>
  </div>
);
