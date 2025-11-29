/**
/**
 * Error Code Display Component
 * Displays error codes with screen reader support
 * Essential for Agent 5 Enhancement 2: Enhanced Error Display
 */

import { logger } from '@/services/logger';

import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
// Import ariaLiveRegionsService with type-safe access
import { ariaLiveRegionsService } from '@/utils/ariaLiveRegionsHelper';

export interface ErrorCodeDisplayProps {
  errorCode?: string;
  correlationId?: string;
  timestamp?: Date;
  className?: string;
  showLabel?: boolean;
}

/**
 * ErrorCodeDisplay - Displays error codes with accessibility support
 */
export const ErrorCodeDisplay: React.FC<ErrorCodeDisplayProps> = ({
  errorCode,
  correlationId,
  timestamp,
  className = '',
  showLabel = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedItem(item);

      // Announce to screen readers
      if (ariaLiveRegionsService && typeof ariaLiveRegionsService === 'object' && 'announceStatus' in ariaLiveRegionsService) {
        const service = ariaLiveRegionsService as { announceStatus?: (message: string, options?: Record<string, unknown>) => void };
        service.announceStatus?.(`${item} copied to clipboard`, {
          componentId: 'error-code-display',
          action: 'code-copied',
        });
      }

      setTimeout(() => {
        setCopied(false);
        setCopiedItem(null);
      }, 2000);
    } catch (error) {
      logger.error('Failed to copy:', { error: { error } });
    }
  };

  // Use formatTimeAgo for relative time, or formatDate for full timestamp
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!errorCode && !correlationId) {
    return null;
  }

  return (
    <div className={`error-code-display space-y-2 ${className}`}>
      {errorCode && (
        <div className="flex items-center space-x-2">
          {showLabel && (
            <label className="text-xs font-medium text-gray-700 sr-only" htmlFor="error-code">
              Error Code
            </label>
          )}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            <Code className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <code
              id="error-code"
              className="text-sm font-mono text-gray-900"
              aria-label={`Error code: ${errorCode}`}
            >
              {errorCode}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(errorCode, 'Error code')}
              className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              aria-label={`Copy error code ${errorCode} to clipboard`}
            >
              {copied && copiedItem === 'Error code' ? (
                <>
                  <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                  <span className="sr-only">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Copy error code</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {correlationId && (
        <div className="flex items-center space-x-2">
          {showLabel && (
            <label className="text-xs font-medium text-gray-700 sr-only" htmlFor="correlation-id">
              Correlation ID
            </label>
          )}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            <Code className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <code
              id="correlation-id"
              className="text-sm font-mono text-gray-900"
              aria-label={`Correlation ID: ${correlationId}`}
            >
              {correlationId}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(correlationId, 'Correlation ID')}
              className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              aria-label={`Copy correlation ID ${correlationId} to clipboard`}
            >
              {copied && copiedItem === 'Correlation ID' ? (
                <>
                  <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                  <span className="sr-only">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Copy correlation ID</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {timestamp && (
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span aria-label={`Error timestamp: ${formatTimestamp(timestamp)}`}>
            {formatTimestamp(timestamp)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ErrorCodeDisplay;
