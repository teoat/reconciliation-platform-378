// Data Provider Updates Hook
import { useCrossPageDataUpdates } from './updates';
import { createInitialCrossPageData } from './initialData';

export const useDataProviderUpdates = (
  crossPageData: any,
  setCrossPageData: any,
  checkPermission: any,
  logAuditEvent: any,
  encryptData: any,
  isSecurityEnabled: any,
  syncConnected: any,
  wsSyncData: any
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
