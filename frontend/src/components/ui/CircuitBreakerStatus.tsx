/**
import { logger } from '@/services/logger';

/**
 * Circuit Breaker Status Component
 * Visual indicator for service health and circuit breaker state
 * Essential for Agent 5 Enhancement 1: Fallback UI Components
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Tooltip } from './Tooltip';
// Import ariaLiveRegionsService with type-safe access
import { ariaLiveRegionsService } from '@/utils/ariaLiveRegionsHelper';
import { formatTime } from '@/utils/common/dateFormatting';

export interface CircuitBreakerStatusProps {
  service: string;
  status: 'open' | 'half-open' | 'closed';
  failureCount?: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
  onRetry?: () => void | Promise<void>;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * CircuitBreakerStatus - Visual indicator for service health
 */
export const CircuitBreakerStatus: React.FC<CircuitBreakerStatusProps> = ({
  service,
  status,
  failureCount = 0,
  lastFailureTime,
  nextRetryTime,
  onRetry,
  showDetails = true,
  size = 'md',
  className = '',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [_tooltipOpen, setTooltipOpen] = useState(false);

  // Announce status changes to screen readers
  useEffect(() => {
    const statusMessage =
      status === 'open'
        ? `${service} circuit breaker is open`
        : status === 'half-open'
          ? `${service} circuit breaker is half-open`
          : `${service} circuit breaker is closed`;

    if (ariaLiveRegionsService && typeof ariaLiveRegionsService === 'object' && 'announceStatus' in ariaLiveRegionsService) {
      const liveService = ariaLiveRegionsService as { announceStatus: (message: string, context?: Record<string, unknown>) => void };
      liveService.announceStatus(statusMessage, {
        componentId: `circuit-breaker-${service}`,
        action: 'circuit-breaker-status-changed',
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
      bgColor: 'bg-red-100',
      borderColor: 'border-red-500',
      label: 'Open',
      description: 'Service unavailable - requests are being blocked',
      ariaLabel: 'Circuit breaker is open, service unavailable',
    },
    'half-open': {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-500',
      label: 'Half-Open',
      description: 'Service testing - limited requests allowed',
      ariaLabel: 'Circuit breaker is half-open, service testing',
    },
    closed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-500',
      label: 'Closed',
      description: 'Service available - requests are flowing',
      ariaLabel: 'Circuit breaker is closed, service available',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeSizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  // Use consolidated date formatting utilities
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return formatTime(date);
  };

  const tooltipContent = showDetails ? (
    <div className="space-y-2 text-xs">
      <div className="font-semibold">{service}</div>
      <div>{config.description}</div>
      {failureCount > 0 && <div>Failure count: {failureCount}</div>}
      {lastFailureTime && <div>Last failure: {getRelativeTime(lastFailureTime)}</div>}
      {nextRetryTime && status === 'open' && <div>Next retry: {formatTime(nextRetryTime)}</div>}
    </div>
  ) : (
    config.description
  );

  return (
    <div className={`inline-flex items-center ${className}`}>
      <Tooltip content={tooltipContent}>
        <div
          className={`inline-flex items-center space-x-1.5 ${config.bgColor} ${config.borderColor} border rounded-full ${badgeSizeClasses[size]} cursor-help`}
          role="status"
          aria-live="polite"
          aria-label={config.ariaLabel}
          id={`circuit-breaker-${service}`}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          onFocus={() => setTooltipOpen(true)}
          onBlur={() => setTooltipOpen(false)}
        >
          <Icon className={`${sizeClasses[size]} ${config.color}`} aria-hidden="true" />
          <span className={`font-medium ${config.color}`}>{config.label}</span>
          {showDetails && failureCount > 0 && (
            <span className={`${config.color} text-xs opacity-75`}>({failureCount})</span>
          )}
        </div>
      </Tooltip>

      {onRetry && status === 'open' && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="ml-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
          aria-label="Retry service connection"
        >
          <RefreshCw
            className={`${sizeClasses[size]} ${isRetrying ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span className="sr-only">Retry connection</span>
        </button>
      )}
    </div>
  );
};

export default CircuitBreakerStatus;
