// Data Provider Updates Hook
import React from 'react';
import { useCrossPageDataUpdates } from '../updates';
import { createInitialCrossPageData } from '../initialData';
import type { CrossPageData } from '../types';

export const useDataProviderUpdates = (
  crossPageData: CrossPageData,
  setCrossPageData: React.Dispatch<React.SetStateAction<CrossPageData>>,
  checkPermission: (userId: string, resource: string, action: string) => boolean,
  logAuditEvent: (event: {
    userId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'denied';
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }) => void,
  encryptData: (data: unknown, dataType: string) => string,
  isSecurityEnabled: boolean,
  syncConnected: boolean,
  wsSyncData: (data: CrossPageData) => void
) => {
  // Adapter to convert event-object-style logAuditEvent to individual-parameters style
  const logAuditEventAdapter = (
    userId: string,
    action: string,
    resource: string,
    result: 'success' | 'failure',
    details?: Record<string, unknown>
  ) => {
    logAuditEvent({
      userId,
      action,
      resource,
      result,
      details
    });
  };

  // Adapter for wsSyncData: () => void to (data: CrossPageData) => void
  const wsSyncDataAdapter = () => {
    wsSyncData(crossPageData);
  };

  const { updateCrossPageData: updateCrossPageDataInternal, subscribeToUpdates } =
    useCrossPageDataUpdates(
      crossPageData,
      setCrossPageData,
      checkPermission,
      logAuditEventAdapter,
      encryptData,
      isSecurityEnabled,
      syncConnected,
      wsSyncDataAdapter
    );

  return {
    updateCrossPageData: updateCrossPageDataInternal,
    subscribeToUpdates,
  };
};
