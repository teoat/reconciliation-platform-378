// Auto-Save Recovery Prompt Component
// Provides UI for handling recovered form data

import React from 'react';
import { AlertTriangle, RotateCcw, Trash2, Eye, X } from 'lucide-react';
import { RecoveryPrompt } from './autoSaveService';

interface RecoveryPromptProps {
  prompt: RecoveryPrompt;
  onAction: (action: RecoveryPrompt['action']) => void;
  onDismiss: () => void;
  onCompare?: (data: Record<string, unknown>) => void;
}

export const AutoSaveRecoveryPrompt: React.FC<RecoveryPromptProps> = ({
  prompt,
  onAction,
  onDismiss,
  onCompare,
}) => {
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const getDataPreview = (data: Record<string, unknown>): string => {
    const keys = Object.keys(data);
    if (keys.length === 0) return 'No data';
    if (keys.length <= 3) return keys.join(', ');
    return `${keys.slice(0, 3).join(', ')} and ${keys.length - 3} more...`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">Recover Form Data</h3>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-600">
            We found saved data from your previous session. Would you like to restore it?
          </p>

          {/* Data Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Saved:</span>
              <span className="text-gray-900">{formatTimestamp(prompt.timestamp)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Page:</span>
              <span className="text-gray-900">{prompt.metadata.page}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Data:</span>
              <span className="text-gray-900">{getDataPreview(prompt.data)}</span>
            </div>
            {prompt.metadata.workflowStage && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stage:</span>
                <span className="text-gray-900">{prompt.metadata.workflowStage}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => onAction('restore')}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restore</span>
            </button>

            {onCompare && (
              <button
                onClick={() => onCompare(prompt.data)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Compare</span>
              </button>
            )}

            <button
              onClick={() => onAction('discard')}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Discard</span>
            </button>
          </div>

          {/* Warning */}
          <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <strong>Note:</strong> Restoring will overwrite your current form data. Make sure you
            want to proceed before clicking Restore.
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison Modal Component
interface DataComparisonProps {
  savedData: Record<string, unknown>;
  currentData: Record<string, unknown>;
  onClose: () => void;
  onRestore: () => void;
}

export const DataComparisonModal: React.FC<DataComparisonProps> = ({
  savedData,
  currentData,
  onClose,
  onRestore,
}) => {
  const getDifferences = () => {
    const differences: Array<{
      field: string;
      saved: any;
      current: any;
      type: 'added' | 'removed' | 'changed';
    }> = [];

    // Check for changes and additions
    for (const [key, savedValue] of Object.entries(savedData)) {
      const currentValue = currentData[key];

      if (currentValue === undefined) {
        differences.push({
          field: key,
          saved: savedValue,
          current: undefined,
          type: 'added',
        });
      } else if (JSON.stringify(savedValue) !== JSON.stringify(currentValue)) {
        differences.push({
          field: key,
          saved: savedValue,
          current: currentValue,
          type: 'changed',
        });
      }
    }

    // Check for removals
    for (const [key, currentValue] of Object.entries(currentData)) {
      if (savedData[key] === undefined) {
        differences.push({
          field: key,
          saved: undefined,
          current: currentValue,
          type: 'removed',
        });
      }
    }

    return differences;
  };

  const differences = getDifferences();

  const formatValue = (value: any): string => {
    if (value === undefined) return 'Not set';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getTypeColor = (type: 'added' | 'removed' | 'changed'): string => {
    switch (type) {
      case 'added':
        return 'text-green-600 bg-green-50';
      case 'removed':
        return 'text-red-600 bg-red-50';
      case 'changed':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: 'added' | 'removed' | 'changed'): string => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'changed':
        return '~';
      default:
        return '?';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Data Comparison</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {differences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No differences found between saved and current data.
            </div>
          ) : (
            <div className="space-y-4">
              {differences.map((diff, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{diff.field}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(diff.type)}`}
                    >
                      {getTypeIcon(diff.type)} {diff.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Saved Data:</div>
                      <div className="bg-gray-50 rounded p-2 text-sm font-mono">
                        {formatValue(diff.saved)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500 mb-1">Current Data:</div>
                      <div className="bg-gray-50 rounded p-2 text-sm font-mono">
                        {formatValue(diff.current)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRestore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Restore Saved Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoSaveRecoveryPrompt;
