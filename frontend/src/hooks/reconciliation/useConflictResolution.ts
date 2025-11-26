import { useState, useCallback } from 'react';
import { EnhancedReconciliationRecord } from '@/types/reconciliation';

// Extended resolution type for conflict resolution
interface ConflictResolution {
  status?: 'pending' | 'approved' | 'rejected' | 'escalated';
  resolvedAt?: string;
  resolution?: string;
  comments?: string[];
  assignedTo?: string;
  assignedAt?: string;
}

// Type guard for ConflictResolution
function isConflictResolution(obj: unknown): obj is ConflictResolution {
  if (!obj || typeof obj !== 'object') return false;
  const resolution = obj as Record<string, unknown>;
  if (resolution.status && typeof resolution.status !== 'string') return false;
  if (resolution.resolvedAt && typeof resolution.resolvedAt !== 'string') return false;
  if (resolution.resolution && typeof resolution.resolution !== 'string') return false;
  if (resolution.comments && !Array.isArray(resolution.comments)) return false;
  return true;
}

// Helper to safely get resolution status
function getResolutionStatus(record: EnhancedReconciliationRecord): 'pending' | 'approved' | 'rejected' | 'escalated' | undefined {
  if (!record.resolution) return undefined;
  if (isConflictResolution(record.resolution)) {
    return record.resolution.status;
  }
  // Fallback: check if resolution is an object with status property
  if (typeof record.resolution === 'object' && record.resolution !== null) {
    const res = record.resolution as Record<string, unknown>;
    if (typeof res.status === 'string') {
      return res.status as 'pending' | 'approved' | 'rejected' | 'escalated';
    }
  }
  return undefined;
}

// Helper to safely get resolution comments
function getResolutionComments(record: EnhancedReconciliationRecord): string[] {
  if (!record.resolution) return [];
  if (isConflictResolution(record.resolution)) {
    return record.resolution.comments || [];
  }
  // Fallback: check if resolution is an object with comments property
  if (typeof record.resolution === 'object' && record.resolution !== null) {
    const res = record.resolution as Record<string, unknown>;
    if (Array.isArray(res.comments)) {
      return res.comments.filter((c): c is string => typeof c === 'string');
    }
  }
  return [];
}

export interface ConflictResolutionState {
  conflicts: EnhancedReconciliationRecord[];
  resolvedConflicts: EnhancedReconciliationRecord[];
  pendingConflicts: EnhancedReconciliationRecord[];
  selectedConflicts: string[];
  bulkAction: 'approve' | 'reject' | 'escalate' | null;
  isResolving: boolean;
  resolutionStats: {
    total: number;
    approved: number;
    rejected: number;
    escalated: number;
    pending: number;
  };
  error: string | null;
}

export interface ConflictResolutionActions {
  setConflicts: (conflicts: EnhancedReconciliationRecord[]) => void;
  resolveConflict: (
    conflictId: string,
    resolution: 'approve' | 'reject' | 'escalate',
    comment?: string
  ) => void;
  bulkResolve: (
    conflictIds: string[],
    resolution: 'approve' | 'reject' | 'escalate',
    comment?: string
  ) => void;
  selectConflict: (conflictId: string) => void;
  selectAllConflicts: () => void;
  deselectAllConflicts: () => void;
  setBulkAction: (action: 'approve' | 'reject' | 'escalate' | null) => void;
  addComment: (conflictId: string, comment: string) => void;
  assignConflict: (conflictId: string, assignee: string) => void;
  escalateConflict: (conflictId: string, reason: string) => void;
  getConflictById: (conflictId: string) => EnhancedReconciliationRecord | undefined;
  getConflictsByPriority: (
    priority: 'low' | 'medium' | 'high' | 'critical'
  ) => EnhancedReconciliationRecord[];
  getConflictsByRisk: (
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ) => EnhancedReconciliationRecord[];
  exportResolvedConflicts: () => EnhancedReconciliationRecord[];
  reset: () => void;
}

export const useConflictResolution = () => {
  const [state, setState] = useState<ConflictResolutionState>({
    conflicts: [],
    resolvedConflicts: [],
    pendingConflicts: [],
    selectedConflicts: [],
    bulkAction: null,
    isResolving: false,
    resolutionStats: {
      total: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      pending: 0,
    },
    error: null,
  });

  const setConflicts = useCallback((conflicts: EnhancedReconciliationRecord[]) => {
    const pendingConflicts = conflicts.filter((c) => getResolutionStatus(c) === 'pending');
    const resolvedConflicts = conflicts.filter((c) => getResolutionStatus(c) !== 'pending');

    setState((prev) => ({
      ...prev,
      conflicts,
      pendingConflicts,
      resolvedConflicts,
      resolutionStats: calculateResolutionStats(conflicts),
    }));
  }, []);

  const resolveConflict = useCallback(
    (conflictId: string, resolution: 'approve' | 'reject' | 'escalate', comment?: string) => {
      setState((prev) => {
        const updatedConflicts = prev.conflicts.map((conflict) => {
          if (conflict.id === conflictId) {
            const currentResolution = isConflictResolution(conflict.resolution) 
              ? conflict.resolution 
              : (typeof conflict.resolution === 'object' && conflict.resolution !== null 
                  ? conflict.resolution as Partial<ConflictResolution>
                  : {});
            return {
              ...conflict,
              resolution: {
                ...currentResolution,
                status:
                  resolution === 'approve'
                    ? 'approved'
                    : resolution === 'reject'
                      ? 'rejected'
                      : 'escalated',
                resolvedAt: new Date().toISOString(),
                comments: comment ? [comment] : [],
              } as ConflictResolution,
            };
          }
          return conflict;
        });

        const pendingConflicts = updatedConflicts.filter((c) => getResolutionStatus(c) === 'pending');
        const resolvedConflicts = updatedConflicts.filter(
          (c) => getResolutionStatus(c) !== 'pending'
        );

        return {
          ...prev,
          conflicts: updatedConflicts,
          pendingConflicts,
          resolvedConflicts,
          selectedConflicts: prev.selectedConflicts.filter((id) => id !== conflictId),
          resolutionStats: calculateResolutionStats(updatedConflicts),
        };
      });
    },
    []
  );

  const bulkResolve = useCallback(
    (conflictIds: string[], resolution: 'approve' | 'reject' | 'escalate', comment?: string) => {
      setState((prev) => ({ ...prev, isResolving: true }));

      // Simulate async operation
      setTimeout(() => {
        setState((prev) => {
          const updatedConflicts = prev.conflicts.map((conflict) => {
            if (conflictIds.includes(conflict.id)) {
              const currentResolution = isConflictResolution(conflict.resolution) 
                ? conflict.resolution 
                : (typeof conflict.resolution === 'object' && conflict.resolution !== null 
                    ? conflict.resolution as Partial<ConflictResolution>
                    : {});
              const existingComments = getResolutionComments(conflict);
              return {
                ...conflict,
                resolution: {
                  ...currentResolution,
                  status:
                    resolution === 'approve'
                      ? 'approved'
                      : resolution === 'reject'
                        ? 'rejected'
                        : 'escalated',
                  resolvedAt: new Date().toISOString(),
                  resolution: comment || `${resolution} action taken`,
                  comments: [
                    ...existingComments,
                    comment ? `Bulk resolution: ${comment}` : `Bulk marked as ${resolution}`,
                  ].filter(Boolean),
                } as ConflictResolution,
              };
            }
            return conflict;
          });

          const pendingConflicts = updatedConflicts.filter(
            (c) => getResolutionStatus(c) === 'pending'
          );
          const resolvedConflicts = updatedConflicts.filter(
            (c) => getResolutionStatus(c) !== 'pending'
          );

          return {
            ...prev,
            conflicts: updatedConflicts,
            pendingConflicts,
            resolvedConflicts,
            selectedConflicts: prev.selectedConflicts.filter((id) => !conflictIds.includes(id)),
            bulkAction: null,
            isResolving: false,
            resolutionStats: calculateResolutionStats(updatedConflicts),
          };
        });
      }, 1000);
    },
    []
  );

  const selectConflict = useCallback((conflictId: string) => {
    setState((prev) => ({
      ...prev,
      selectedConflicts: prev.selectedConflicts.includes(conflictId)
        ? prev.selectedConflicts.filter((id) => id !== conflictId)
        : [...prev.selectedConflicts, conflictId],
    }));
  }, []);

  const selectAllConflicts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedConflicts: prev.pendingConflicts.map((c) => c.id),
    }));
  }, []);

  const deselectAllConflicts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedConflicts: [],
    }));
  }, []);

  const setBulkAction = useCallback((action: 'approve' | 'reject' | 'escalate' | null) => {
    setState((prev) => ({ ...prev, bulkAction: action }));
  }, []);

  const addComment = useCallback((conflictId: string, comment: string) => {
    setState((prev) => ({
      ...prev,
      conflicts: prev.conflicts.map((conflict) =>
        conflict.id === conflictId
          ? {
              ...conflict,
              resolution: {
                ...(isConflictResolution(conflict.resolution) ? conflict.resolution : {}),
                comments: [
                  ...getResolutionComments(conflict),
                  `${new Date().toISOString()}: ${comment}`,
                ],
              } as ConflictResolution,
            }
          : conflict
      ),
    }));
  }, []);

  const assignConflict = useCallback((conflictId: string, assignee: string) => {
    setState((prev) => ({
      ...prev,
      conflicts: prev.conflicts.map((conflict) =>
        conflict.id === conflictId
          ? {
              ...conflict,
              resolution: {
                ...conflict.resolution,
                assignedTo: assignee,
                assignedAt: new Date().toISOString(),
              } as ConflictResolution,
            }
          : conflict
      ),
    }));
  }, []);

  const escalateConflict = useCallback(
    (conflictId: string, reason: string) => {
      resolveConflict(conflictId, 'escalate', `Escalated: ${reason}`);
    },
    [resolveConflict]
  );

  const getConflictById = useCallback(
    (conflictId: string) => {
      return state.conflicts.find((c) => c.id === conflictId);
    },
    [state.conflicts]
  );

  const getConflictsByPriority = useCallback(
    (priority: 'low' | 'medium' | 'high' | 'critical') => {
      return state.conflicts.filter((c) => c.metadata.priority === priority);
    },
    [state.conflicts]
  );

  const getConflictsByRisk = useCallback(
    (riskLevel: 'low' | 'medium' | 'high' | 'critical') => {
      return state.conflicts.filter((c) => c.riskLevel === riskLevel);
    },
    [state.conflicts]
  );

  const exportResolvedConflicts = useCallback(() => {
    return state.resolvedConflicts;
  }, [state.resolvedConflicts]);

  const reset = useCallback(() => {
    setState({
      conflicts: [],
      resolvedConflicts: [],
      pendingConflicts: [],
      selectedConflicts: [],
      bulkAction: null,
      isResolving: false,
      resolutionStats: {
        total: 0,
        approved: 0,
        rejected: 0,
        escalated: 0,
        pending: 0,
      },
      error: null,
    });
  }, []);

  const actions: ConflictResolutionActions = {
    setConflicts,
    resolveConflict,
    bulkResolve,
    selectConflict,
    selectAllConflicts,
    deselectAllConflicts,
    setBulkAction,
    addComment,
    assignConflict,
    escalateConflict,
    getConflictById,
    getConflictsByPriority,
    getConflictsByRisk,
    exportResolvedConflicts,
    reset,
  };

  return {
    state,
    actions,
  };
};

// Helper function to calculate resolution statistics
function calculateResolutionStats(conflicts: EnhancedReconciliationRecord[]) {
  const total = conflicts.length;
  const approved = conflicts.filter((c) => getResolutionStatus(c) === 'approved').length;
  const rejected = conflicts.filter((c) => getResolutionStatus(c) === 'rejected').length;
  const escalated = conflicts.filter((c) => getResolutionStatus(c) === 'escalated').length;
  const pending = conflicts.filter((c) => getResolutionStatus(c) === 'pending').length;

  return {
    total,
    approved,
    rejected,
    escalated,
    pending,
  };
}
