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
  const { updateCrossPageData: updateCrossPageDataInternal, subscribeToUpdates } =
    useCrossPageDataUpdates(
      crossPageData,
      setCrossPageData,
      checkPermission,
      logAuditEvent,
      encryptData,
      isSecurityEnabled,
      syncConnected,
      wsSyncData
    );

  return {
    updateCrossPageData: updateCrossPageDataInternal,
    subscribeToUpdates,
  };
};
