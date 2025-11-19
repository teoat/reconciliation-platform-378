/**
 * Error History Component
 * Displays a history of errors with filtering and search
 * Essential for Agent 5 Enhancement 2: Enhanced Error Display
 */

import React, { useState, useMemo } from 'react';
import { X, Search, Filter, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ErrorCodeDisplay } from './ErrorCodeDisplay';
import { Button } from './Button';

export interface ErrorHistoryItem {
  id: string;
  timestamp: Date;
  error: Error | string;
  title?: string;
  errorCode?: string;
  correlationId?: string;
  severity?: 'error' | 'warning' | 'info';
  context?: string;
}

export interface ErrorHistoryProps {
  errors: ErrorHistoryItem[];
  onErrorSelect?: (error: ErrorHistoryItem) => void;
  onErrorDismiss?: (errorId: string) => void;
  maxItems?: number;
  className?: string;
}

/**
 * ErrorHistory - Displays error history with filtering and search
 */
export const ErrorHistory: React.FC<ErrorHistoryProps> = ({
  errors,
  onErrorSelect,
  onErrorDismiss,
  maxItems = 10,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filter and sort errors
  const filteredErrors = useMemo(() => {
    let filtered = errors;

    // Filter by severity
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(error => error.severity === filterSeverity);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(error => {
        const errorMessage = typeof error.error === 'string' ? error.error : error.error.message;
        const title = error.title || '';
        const context = error.context || '';
        const errorCode = error.errorCode || '';
        const correlationId = error.correlationId || '';

        return (
          errorMessage.toLowerCase().includes(query) ||
          title.toLowerCase().includes(query) ||
          context.toLowerCase().includes(query) ||
          errorCode.toLowerCase().includes(query) ||
          correlationId.toLowerCase().includes(query)
        );
      });
    }

    // Sort errors
    filtered = [...filtered].sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.timestamp.getTime() - a.timestamp.getTime();
      } else {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
    });

    // Limit items
    return filtered.slice(0, maxItems);
  }, [errors, filterSeverity, searchQuery, sortOrder, maxItems]);

  const toggleError = (errorId: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(errorId)) {
        next.delete(errorId);
      } else {
        next.add(errorId);
      }
      return next;
    });
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const severityClasses = {
    error: 'bg-red-100 text-red-800 border-red-400',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    info: 'bg-blue-100 text-blue-800 border-blue-400',
  };

  if (errors.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" aria-hidden="true" />
        <p>No errors in history</p>
      </div>
    );
  }

  return (
    <div className={`error-history ${className}`}>
      {/* Search and Filter Controls */}
      <div className="mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search errors..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search error history"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as 'all' | 'error' | 'warning' | 'info')}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by severity"
            >
              <option value="all">All Severities</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              aria-label="Sort order"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="space-y-2" role="list" aria-label="Error history">
        {filteredErrors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No errors found matching your criteria</p>
          </div>
        ) : (
          filteredErrors.map((errorItem) => {
            const isExpanded = expandedErrors.has(errorItem.id);
            const errorMessage = typeof errorItem.error === 'string' 
              ? errorItem.error 
              : errorItem.error.message;
            const severity = errorItem.severity || 'error';
            const severityClass = severityClasses[severity];

            return (
              <div
                key={errorItem.id}
                className={`border-l-4 ${severityClass.split(' ')[0]} border rounded-r shadow-sm ${severityClass.split(' ').slice(1).join(' ')}`}
                role="listitem"
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-sm">
                          {errorItem.title || 'Error'}
                        </h4>
                        <span className="text-xs opacity-75">
                          {formatTimestamp(errorItem.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm mb-2">{errorMessage}</p>

                      {errorItem.context && (
                        <p className="text-xs opacity-75 mb-2">
                          Context: {errorItem.context}
                        </p>
                      )}

                      {/* Error Code and Correlation ID */}
                      {(errorItem.errorCode || errorItem.correlationId) && isExpanded && (
                        <div className="mt-2">
                          <ErrorCodeDisplay
                            errorCode={errorItem.errorCode}
                            correlationId={errorItem.correlationId}
                            timestamp={errorItem.timestamp}
                            showLabel={true}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        type="button"
                        onClick={() => toggleError(errorItem.id)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                        aria-expanded={isExpanded ? 'true' : 'false'}
                        aria-label={isExpanded ? 'Collapse error details' : 'Expand error details'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>

                      {onErrorDismiss && (
                        <button
                          type="button"
                          onClick={() => onErrorDismiss(errorItem.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                          aria-label="Dismiss error"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}

                      {onErrorSelect && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onErrorSelect(errorItem)}
                          aria-label="View error details"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ErrorHistory;


