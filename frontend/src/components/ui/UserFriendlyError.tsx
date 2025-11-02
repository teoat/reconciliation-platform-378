/**
 * User-Friendly Error Component
 * Provides actionable error messages with recovery suggestions
 * Essential for Task 5.4: Error Messaging UX
 */

import React, { useState } from 'react';
import { AlertCircle, X, RefreshCw, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
// Import ariaLiveRegionsService with fallback
import ariaLiveRegionsServiceModule from '../services/ariaLiveRegionsService';
const ariaLiveRegionsService = 
  (ariaLiveRegionsServiceModule as any).ariaLiveRegionsService || 
  (ariaLiveRegionsServiceModule as any).default?.getInstance?.() ||
  ariaLiveRegionsServiceModule;

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface UserFriendlyErrorProps {
  error: Error | string;
  title?: string;
  context?: string;
  recoveryActions?: ErrorRecoveryAction[];
  suggestions?: string[];
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
  errorId?: string;
}

/**
 * UserFriendlyError - Displays actionable error messages with recovery options
 */
export const UserFriendlyError: React.FC<UserFriendlyErrorProps> = ({
  error,
  title,
  context,
  recoveryActions = [],
  suggestions = [],
  onDismiss,
  severity = 'error',
  showDetails = false,
  errorId,
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isRecovering, setIsRecovering] = useState(false);

  const errorMessage = error instanceof Error ? error.message : error;
  const errorTitle = title || (error instanceof Error ? error.name : 'Error');

  // Announce error to screen readers
  React.useEffect(() => {
    if (error) {
      ariaLiveRegionsService.announceError(errorMessage, {
        componentId: errorId,
        action: 'error-displayed',
        currentState: { severity, context },
      });
    }
  }, [error, errorMessage, severity, context, errorId]);

  const handleRecovery = async (action: ErrorRecoveryAction) => {
    setIsRecovering(true);
    try {
      await action.action();
      if (onDismiss) {
        onDismiss();
      }
    } catch (recoveryError) {
      // Handle recovery error
      console.error('Recovery action failed:', recoveryError);
    } finally {
      setIsRecovering(false);
    }
  };

  const severityClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={`rounded-lg border p-4 ${severityClasses[severity]}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      id={errorId ? `error-${errorId}` : undefined}
    >
      <div className="flex items-start">
        <AlertCircle className={`h-5 w-5 ${iconColors[severity]} flex-shrink-0 mt-0.5`} aria-hidden="true" />
        
        <div className="flex-1 ml-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${severity === 'error' ? 'text-red-900' : severity === 'warning' ? 'text-yellow-900' : 'text-blue-900'}`}>
              {errorTitle}
            </h3>
            <div className="flex items-center space-x-2">
              {(recoveryActions.length > 0 || suggestions.length > 0) && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                  aria-expanded={ariaExpandedValue}
                  aria-controls={errorId ? `error-details-${errorId}` : 'error-details'}
                >
                  {isExpanded ? (
                    <>
                      <span className="sr-only">Hide</span>
                      <ChevronUp className="h-4 w-4 inline" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      <span className="sr-only">Show</span>
                      <ChevronDown className="h-4 w-4 inline" aria-hidden="true" />
                    </>
                  )}
                  {isExpanded ? ' Less' : ' More'}
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <p className="mt-1 text-sm">{errorMessage}</p>
          
          {context && (
            <p className="mt-2 text-sm opacity-90">
              <span className="font-medium">Context:</span> {context}
            </p>
          )}

          {/* Expanded details with recovery actions and suggestions */}
          {isExpanded && (
            <div
              id={errorId ? `error-details-${errorId}` : 'error-details'}
              className="mt-4 space-y-4"
            >
              {/* Recovery Actions */}
              {recoveryActions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Recovery Options:</h4>
                  <div className="flex flex-wrap gap-2">
                    {recoveryActions.map((action, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleRecovery(action)}
                        disabled={isRecovering}
                        className={`
                          inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                          ${
                            action.variant === 'primary'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : action.variant === 'secondary'
                              ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        aria-label={action.label}
                      >
                        {isRecovering ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                            Recovering...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                            {action.label}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center">
                    <HelpCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                    Suggestions:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFriendlyError;

