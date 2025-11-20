// Reconnection Validation Component
// Displays validation results and handles reconnection issues

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { Wifi } from 'lucide-react';
import { WifiOff } from 'lucide-react';
import { DataValidationResult, DataInconsistency } from '../services/reconnectionValidationService';

interface ReconnectionValidationProps {
  validationResult: DataValidationResult | null;
  isValidating: boolean;
  lastValidation: Date | null;
  onRefresh: () => void;
  onClear: () => void;
  className?: string;
}

export const ReconnectionValidation: React.FC<ReconnectionValidationProps> = ({
  validationResult,
  isValidating,
  lastValidation,
  onRefresh,
  onClear,
  className = '',
}) => {
  const formatLastValidation = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const getSeverityColor = (severity: DataInconsistency['severity']): string => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: DataInconsistency['severity']) => {
    switch (severity) {
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!validationResult && !isValidating) {
    return null;
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          {isValidating ? (
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
          ) : validationResult?.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">Data Validation</h3>
        </div>

        <div className="flex items-center space-x-2">
          {lastValidation && (
            <span className="text-sm text-gray-500">
              Last checked: {formatLastValidation(lastValidation)}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isValidating}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isValidating ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mr-2" />
            <span className="text-gray-600">Validating data...</span>
          </div>
        ) : validationResult ? (
          <div className="space-y-4">
            {/* Status */}
            <div
              className={`p-3 rounded-lg border ${
                validationResult.isValid
                  ? 'text-green-600 bg-green-50 border-green-200'
                  : 'text-amber-600 bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {validationResult.isValid
                    ? 'Data is synchronized'
                    : `${validationResult.inconsistencies.length} inconsistencies found`}
                </span>
              </div>
            </div>

            {/* Inconsistencies */}
            {validationResult.inconsistencies.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Issues Found:</h4>
                {validationResult.inconsistencies.map((inconsistency, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getSeverityColor(inconsistency.severity)}`}
                  >
                    <div className="flex items-start space-x-2">
                      {getSeverityIcon(inconsistency.severity)}
                      <div className="flex-1">
                        <div className="font-medium">{inconsistency.field}</div>
                        <div className="text-sm mt-1">{inconsistency.description}</div>
                        {(inconsistency.expected !== undefined ||
                          inconsistency.actual !== undefined) && (
                          <div className="text-xs mt-2 space-y-1">
                            {inconsistency.expected !== undefined && (
                              <div>
                                <strong>Expected:</strong>{' '}
                                {JSON.stringify(inconsistency.expected ?? 'N/A')}
                              </div>
                            )}
                            {inconsistency.actual !== undefined && (
                              <div>
                                <strong>Actual:</strong>{' '}
                                {JSON.stringify(inconsistency.actual ?? 'N/A')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {validationResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {validationResult.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClear}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              {validationResult.requiresRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Data
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Connection Status Component
interface ConnectionStatusProps {
  isOnline: boolean;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
  lastConnected,
  lastDisconnected,
  className = '',
}) => {
  const formatConnectionTime = (date: Date | null): string => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600">Online</span>
          {lastConnected && (
            <span className="text-xs text-gray-500">
              Connected {formatConnectionTime(lastConnected)}
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600">Offline</span>
          {lastDisconnected && (
            <span className="text-xs text-gray-500">
              Disconnected {formatConnectionTime(lastDisconnected)}
            </span>
          )}
        </>
      )}
    </div>
  );
};

// Validation Summary Component
interface ValidationSummaryProps {
  validationResult: DataValidationResult | null;
  isValidating: boolean;
  onRefresh: () => void;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  validationResult,
  isValidating,
  onRefresh,
  className = '',
}) => {
  if (!validationResult && !isValidating) {
    return null;
  }

  const getStatusColor = (): string => {
    if (isValidating) return 'text-blue-600';
    if (!validationResult) return 'text-gray-600';
    if (validationResult.isValid) return 'text-green-600';
    if (validationResult.inconsistencies.some((i) => i.severity === 'critical'))
      return 'text-red-600';
    if (validationResult.inconsistencies.some((i) => i.severity === 'high'))
      return 'text-orange-600';
    return 'text-amber-600';
  };

  const getStatusText = (): string => {
    if (isValidating) return 'Validating...';
    if (!validationResult) return 'Not validated';
    if (validationResult.isValid) return 'Synchronized';
    if (validationResult.inconsistencies.some((i) => i.severity === 'critical'))
      return 'Critical issues';
    if (validationResult.inconsistencies.some((i) => i.severity === 'high'))
      return 'High priority issues';
    return 'Issues found';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isValidating ? (
        <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      ) : validationResult?.isValid ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-600" />
      )}

      <span className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</span>

      {validationResult && !validationResult.isValid && (
        <button onClick={onRefresh} className="text-xs text-blue-600 hover:text-blue-800 underline">
          Refresh
        </button>
      )}
    </div>
  );
};

export default ReconnectionValidation;
