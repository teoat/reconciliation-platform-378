/**
/**
 * Service Degraded Banner Component
 * Displays when circuit breakers are open or services are degraded
 * Essential for Agent 5 Enhancement 1: Fallback UI Components
 */

import React, { useEffect, useState } from 'react';
import { logger } from '@/services/logger';
import { AlertTriangle, X, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { Button } from './Button';
// Import ariaLiveRegionsService with type-safe access
import { ariaLiveRegionsService } from '@/utils/ariaLiveRegionsHelper';

export interface AlternativeAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface ServiceDegradedBannerProps {
  service: string;
  status: 'open' | 'half-open' | 'closed';
  message?: string;
  alternativeActions?: AlternativeAction[];
  onRetry?: () => void | Promise<void>;
  estimatedRecovery?: Date;
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * ServiceDegradedBanner - Displays service degradation status with recovery options
 */
export const ServiceDegradedBanner: React.FC<ServiceDegradedBannerProps> = ({
  service,
  status,
  message,
  alternativeActions = [],
  onRetry,
  estimatedRecovery,
  onDismiss,
  severity: _severity = 'error',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Announce service status to screen readers
  useEffect(() => {
    const statusMessage =
      status === 'open'
        ? `${service} is currently unavailable`
        : status === 'half-open'
          ? `${service} is partially available`
          : `${service} is available`;

    if (ariaLiveRegionsService && typeof ariaLiveRegionsService === 'object' && 'announceError' in ariaLiveRegionsService) {
      const ariaService = ariaLiveRegionsService as { announceError?: (message: string, options?: Record<string, unknown>) => void };
      ariaService.announceError?.(statusMessage, {
        componentId: `service-${service}`,
        action: 'service-status-changed',
        currentState: { status, service },
      });
    }
  }, [service, status]);

  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      logger.error('Retry failed:', { error: { error } });
    } finally {
      setIsRetrying(false);
    }
  };

  const statusConfig = {
    open: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      label: 'Service Unavailable',
      ariaLabel: 'Service is unavailable',
    },
    'half-open': {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      label: 'Service Partially Available',
      ariaLabel: 'Service is partially available',
    },
    closed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      label: 'Service Available',
      ariaLabel: 'Service is available',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Calculate time until recovery
  const timeUntilRecovery = estimatedRecovery
    ? Math.max(0, Math.ceil((estimatedRecovery.getTime() - Date.now()) / 1000))
    : null;

  const minutesUntilRecovery = timeUntilRecovery ? Math.ceil(timeUntilRecovery / 60) : null;

  return (
    <div
      className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 mb-4 rounded-r shadow-sm`}
      role="alert"
      aria-live="assertive"
      aria-label={config.ariaLabel}
      id={`service-degraded-${service}`}
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />

        <div className="flex-1 ml-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${config.color}`}>
              {config.label}: {service}
            </h3>
            <div className="flex items-center space-x-2">
              {(alternativeActions.length > 0 || onRetry) && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                  aria-expanded={isExpanded}
                  aria-controls={`service-actions-${service}`}
                  aria-label={isExpanded ? 'Hide actions' : 'Show actions'}
                >
                  {isExpanded ? 'Hide' : 'Actions'}
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                  aria-label="Dismiss service status"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}

          {estimatedRecovery && minutesUntilRecovery !== null && minutesUntilRecovery > 0 && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>
                Estimated recovery: {minutesUntilRecovery}{' '}
                {minutesUntilRecovery === 1 ? 'minute' : 'minutes'}
              </span>
            </div>
          )}

          {isExpanded && (
            <div id={`service-actions-${service}`} className="mt-4 space-y-2">
              {onRetry && (
                <Button
                  variant="primary"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="mr-2"
                  aria-label="Retry service connection"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {isRetrying ? 'Retrying...' : 'Retry Connection'}
                </Button>
              )}

              {alternativeActions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {alternativeActions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'secondary'}
                      onClick={action.action}
                      aria-label={action.label}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDegradedBanner;
