// Conflict resolution hook
import { useState, useCallback } from 'react';
import type { EnhancedReconciliationRecord, Resolution } from '../../types/reconciliation/index';

export const useConflictResolution = () => {
  const [resolutions, setResolutions] = useState<Map<string, Resolution>>(new Map());

  const resolveConflict = useCallback(
    (recordId: string, resolution: Resolution) => {
      setResolutions((prev) => {
        const newMap = new Map(prev);
        newMap.set(recordId, resolution);
        return newMap;
      });
    },
    []
  );

  const getResolution = useCallback(
    (recordId: string): Resolution | undefined => {
      return resolutions.get(recordId);
    },
    [resolutions]
  );

  const approveResolution = useCallback(
    (recordId: string) => {
      const resolution = resolutions.get(recordId);
      if (resolution) {
        resolveConflict(recordId, {
          ...resolution,
          status: 'approved',
          resolvedAt: new Date().toISOString(),
        });
      }
    },
    [resolutions, resolveConflict]
  );

  const rejectResolution = useCallback(
    (recordId: string) => {
      const resolution = resolutions.get(recordId);
      if (resolution) {
        resolveConflict(recordId, {
          ...resolution,
          status: 'rejected',
          resolvedAt: new Date().toISOString(),
        });
      }
    },
    [resolutions, resolveConflict]
  );

  const escalateResolution = useCallback(
    (recordId: string, assignedTo: string) => {
      const resolution = resolutions.get(recordId);
      if (resolution) {
        resolveConflict(recordId, {
          ...resolution,
          status: 'escalated',
          assignedTo,
          assignedAt: new Date().toISOString(),
        });
      }
    },
    [resolutions, resolveConflict]
  );

  const hasConflict = useCallback(
    (record: EnhancedReconciliationRecord): boolean => {
      return (
        record.status === 'discrepancy' ||
        record.status === 'unmatched' ||
        (record.difference !== undefined && Math.abs(record.difference) > 0.01)
      );
    },
    []
  );

  return {
    resolutions,
    resolveConflict,
    getResolution,
    approveResolution,
    rejectResolution,
    escalateResolution,
    hasConflict,
  };
};

