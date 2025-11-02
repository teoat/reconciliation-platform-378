/**
 * Fallback Content Component
 * Displays cached/fallback content when services are degraded
 * Essential for Agent 5 Enhancement 1: Fallback UI Components
 */

import React, { useEffect, useState } from 'react';
import { Database, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './Button';
// Import ariaLiveRegionsService with fallback
import ariaLiveRegionsServiceModule from '../../services/ariaLiveRegionsService';
const ariaLiveRegionsService = 
  (ariaLiveRegionsServiceModule as any).ariaLiveRegionsService || 
  (ariaLiveRegionsServiceModule as any).default?.getInstance?.() ||
  ariaLiveRegionsServiceModule;

export interface FallbackContentProps {
  service: string;
  fallbackData?: any;
  cacheTimestamp?: Date;
  message?: string;
  showRefreshOption?: boolean;
  onRefresh?: () => void | Promise<void>;
  children?: React.ReactNode;
  className?: string;
}

/**
 * FallbackContent - Displays cached/fallback content with refresh options
 */
export const FallbackContent: React.FC<FallbackContentProps> = ({
  service,
  fallbackData,
  cacheTimestamp,
  message,
  showRefreshOption = true,
  onRefresh,
  children,
  className = '',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate relative time
  const getRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  // Announce cached content to screen readers
  useEffect(() => {
    const cacheMessage = cacheTimestamp
      ? `Showing cached data for ${service} from ${getRelativeTime(cacheTimestamp)}`
      : `Showing cached data for ${service}`;

    ariaLiveRegionsService?.announceStatus?.(cacheMessage, {
      componentId: `fallback-${service}`,
      action: 'cached-content-displayed',
      currentState: { service, cacheTimestamp },
    });
  }, [service, cacheTimestamp]);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Cached Data Indicator */}
      <div
        className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r shadow-sm"
        role="status"
        aria-live="polite"
        aria-label={`Cached data for ${service}`}
        id={`fallback-indicator-${service}`}
      >
        <div className="flex items-start">
          <Database className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          
          <div className="flex-1 ml-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-yellow-800">
                  Showing cached data
                </p>
                {cacheTimestamp && (
                  <div className="flex items-center space-x-1 text-xs text-yellow-700">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{getRelativeTime(cacheTimestamp)}</span>
                  </div>
                )}
              </div>
              
              {showRefreshOption && onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  aria-label="Refresh data"
                >
                  <RefreshCw 
                    className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
                    aria-hidden="true" 
                  />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              )}
            </div>

            {message && (
              <p className="mt-1 text-xs text-yellow-700">{message}</p>
            )}

            <p className="mt-2 text-xs text-yellow-600">
              Service "{service}" is currently unavailable. This data may not be up to date.
            </p>
          </div>
        </div>
      </div>

      {/* Fallback Content */}
      {children && (
        <div 
          className="fallback-content"
          aria-label={`Cached content for ${service}`}
        >
          {children}
        </div>
      )}

      {/* Fallback Data Display */}
      {fallbackData && !children && (
        <div 
          className="fallback-data p-4 bg-gray-50 rounded border"
          aria-label={`Cached data for ${service}`}
        >
          <pre className="text-xs overflow-auto">
            {JSON.stringify(fallbackData, null, 2)}
          </pre>
        </div>
      )}

      {/* No Data Available */}
      {!fallbackData && !children && (
        <div
          className="bg-gray-50 border border-gray-200 p-6 rounded text-center"
          role="status"
          aria-live="polite"
        >
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-gray-600">
            No cached data available for {service}. Please try refreshing when the service is available.
          </p>
        </div>
      )}
    </div>
  );
};

export default FallbackContent;

