// Persistence layer for Atomic Workflow Service

import { logger } from '@/services/logger';
import { toRecord } from '@/utils/typeHelpers';
import type { WorkflowStateManager } from './state';
import type { WorkflowState } from './types';

/**
 * Validates workflow data from storage
 */
export function validateWorkflowData(data: unknown): {
  id?: string;
  workflowId?: string;
  stage?: string;
  status?: WorkflowState['status'];
  progress?: number;
  data?: Record<string, unknown>;
  metadata?: {
    createdBy?: string;
    createdAt?: number | string;
    lastModifiedBy?: string;
    lastModifiedAt?: number | string;
    version?: number;
    checksum?: string;
  };
  transitions?: Array<{ triggeredAt: number | string; [key: string]: unknown }>;
  locks?: Array<{ lockedAt: number | string; expiresAt: number | string; [key: string]: unknown }>;
} | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  return {
    id: typeof obj.id === 'string' ? obj.id : undefined,
    workflowId: typeof obj.workflowId === 'string' ? obj.workflowId : undefined,
    stage: typeof obj.stage === 'string' ? obj.stage : undefined,
    status: typeof obj.status === 'string' ? (obj.status as WorkflowState['status']) : undefined,
    progress: typeof obj.progress === 'number' ? obj.progress : undefined,
    data:
      obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)
        ? (obj.data as Record<string, unknown>)
        : undefined,
    metadata:
      obj.metadata && typeof obj.metadata === 'object' && !Array.isArray(obj.metadata)
        ? {
            createdBy:
              typeof (obj.metadata as Record<string, unknown>).createdBy === 'string'
                ? ((obj.metadata as Record<string, unknown>).createdBy as string)
                : undefined,
            createdAt: (() => {
              const val = (obj.metadata as Record<string, unknown>).createdAt;
              return typeof val === 'string' || typeof val === 'number' ? val : undefined;
            })(),
            lastModifiedBy:
              typeof (obj.metadata as Record<string, unknown>).lastModifiedBy === 'string'
                ? ((obj.metadata as Record<string, unknown>).lastModifiedBy as string)
                : undefined,
            lastModifiedAt: (() => {
              const val = (obj.metadata as Record<string, unknown>).lastModifiedAt;
              return typeof val === 'string' || typeof val === 'number' ? val : undefined;
            })(),
            version:
              typeof (obj.metadata as Record<string, unknown>).version === 'number'
                ? ((obj.metadata as Record<string, unknown>).version as number)
                : undefined,
            checksum:
              typeof (obj.metadata as Record<string, unknown>).checksum === 'string'
                ? ((obj.metadata as Record<string, unknown>).checksum as string)
                : undefined,
          }
        : undefined,
    transitions: Array.isArray(obj.transitions)
      ? obj.transitions.map((t: unknown) => {
          if (t && typeof t === 'object' && !Array.isArray(t)) {
            const trans = t as Record<string, unknown>;
            const triggeredAt = trans.triggeredAt;
            return {
              ...trans,
              triggeredAt:
                typeof triggeredAt === 'string' || typeof triggeredAt === 'number'
                  ? triggeredAt
                  : Date.now(),
            };
          }
          return { triggeredAt: Date.now() };
        })
      : undefined,
    locks: Array.isArray(obj.locks)
      ? obj.locks.map((l: unknown) => {
          if (l && typeof l === 'object' && !Array.isArray(l)) {
            const lock = l as Record<string, unknown>;
            const lockedAt = lock.lockedAt;
            const expiresAt = lock.expiresAt;
            return {
              ...lock,
              lockedAt:
                typeof lockedAt === 'string' || typeof lockedAt === 'number'
                  ? lockedAt
                  : Date.now(),
              expiresAt:
                typeof expiresAt === 'string' || typeof expiresAt === 'number'
                  ? expiresAt
                  : Date.now(),
            };
          }
          return { lockedAt: Date.now(), expiresAt: Date.now() };
        })
      : undefined,
  };
}

/**
 * Loads persisted data from localStorage
 */
export function loadPersistedData(stateManager: WorkflowStateManager): void {
  try {
    // Load workflows
    const workflowsData = localStorage.getItem('atomic_workflows');
    if (workflowsData) {
      const data = JSON.parse(workflowsData) as { workflows: unknown[] };
      const workflows: WorkflowState[] = [];
      data.workflows.forEach((workflowData: unknown) => {
        const wd = validateWorkflowData(workflowData);
        if (!wd || !wd.id || !wd.workflowId) return;

        const workflow: WorkflowState = {
          id: wd.id,
          workflowId: wd.workflowId,
          stage: wd.stage || '',
          status: wd.status || 'pending',
          progress: wd.progress || 0,
          data: wd.data || {},
          metadata: {
            createdBy: wd.metadata?.createdBy || 'system',
            createdAt: new Date(wd.metadata?.createdAt || Date.now()),
            lastModifiedBy: wd.metadata?.lastModifiedBy || 'system',
            lastModifiedAt: new Date(wd.metadata?.lastModifiedAt || Date.now()),
            version: wd.metadata?.version || 1,
            checksum: wd.metadata?.checksum || '',
          },
          transitions: (wd.transitions || []).map((t) => ({
            ...t,
            triggeredAt: new Date(t.triggeredAt),
          })) as WorkflowState['transitions'],
          locks: (wd.locks || []).map((l) => ({
            ...l,
            lockedAt: new Date(l.lockedAt),
            expiresAt: new Date(l.expiresAt),
          })) as WorkflowState['locks'],
        };
        workflows.push(workflow);
      });
      workflows.forEach((w) => stateManager.setWorkflow(w));
    }

    // Load operations
    const operationsData = localStorage.getItem('atomic_operations');
    if (operationsData) {
      const data = JSON.parse(operationsData) as { operations: unknown[] };
      data.operations.forEach((operationData: unknown) => {
        const opData = operationData as Record<string, unknown>;
        const operation = {
          ...opData,
          timestamp: new Date((opData.timestamp as number | string) || Date.now()),
        } as Parameters<typeof stateManager.setOperation>[0];
        stateManager.setOperation(operation);
      });
    }
  } catch (error) {
    logger.error('Failed to load persisted data:', toRecord(error));
  }
}

/**
 * Saves data to localStorage
 */
export function savePersistedData(stateManager: WorkflowStateManager): void {
  try {
    const serialized = stateManager.serialize();

    // Save workflows
    localStorage.setItem('atomic_workflows', JSON.stringify({ workflows: serialized.workflows }));

    // Save operations
    localStorage.setItem('atomic_operations', JSON.stringify({ operations: serialized.operations }));
  } catch (error) {
    logger.error('Failed to save persisted data:', toRecord(error));
  }
}

