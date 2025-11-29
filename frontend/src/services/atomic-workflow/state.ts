// State management for Atomic Workflow Service

import type { WorkflowState, AtomicOperation, WorkflowLock } from './types';

export class WorkflowStateManager {
  private workflows: Map<string, WorkflowState> = new Map();
  private operations: Map<string, AtomicOperation> = new Map();
  private locks: Map<string, WorkflowLock> = new Map();

  // Workflow management
  getWorkflow(id: string): WorkflowState | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): WorkflowState[] {
    return Array.from(this.workflows.values());
  }

  setWorkflow(workflow: WorkflowState): void {
    this.workflows.set(workflow.id, workflow);
  }

  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  findWorkflowById(workflowId: string): WorkflowState | undefined {
    return Array.from(this.workflows.values()).find((w) => w.workflowId === workflowId);
  }

  // Operation management
  getOperation(id: string): AtomicOperation | undefined {
    return this.operations.get(id);
  }

  getAllOperations(): AtomicOperation[] {
    return Array.from(this.operations.values());
  }

  setOperation(operation: AtomicOperation): void {
    this.operations.set(operation.id, operation);
  }

  deleteOperation(id: string): boolean {
    return this.operations.delete(id);
  }

  getPendingOperations(): AtomicOperation[] {
    return Array.from(this.operations.values()).filter((op) => op.status === 'pending');
  }

  getCompletedOperations(): AtomicOperation[] {
    return Array.from(this.operations.values()).filter(
      (op) => op.status === 'completed' || op.status === 'failed' || op.status === 'rolled_back'
    );
  }

  // Lock management
  getLock(id: string): WorkflowLock | undefined {
    return this.locks.get(id);
  }

  getAllLocks(): WorkflowLock[] {
    return Array.from(this.locks.values());
  }

  setLock(lock: WorkflowLock): void {
    this.locks.set(lock.id, lock);
  }

  deleteLock(id: string): boolean {
    return this.locks.delete(id);
  }

  findLockByWorkflowAndStage(workflowId: string, stage: string): WorkflowLock | undefined {
    return Array.from(this.locks.values()).find(
      (l) => l.stage === stage && this.findWorkflowById(workflowId)?.id === l.id
    );
  }

  getExpiredLocks(): WorkflowLock[] {
    const now = new Date();
    return Array.from(this.locks.values()).filter((lock) => lock.expiresAt < now);
  }

  // Serialization for persistence
  serialize(): {
    workflows: WorkflowState[];
    operations: AtomicOperation[];
    locks: WorkflowLock[];
  } {
    return {
      workflows: Array.from(this.workflows.values()),
      operations: Array.from(this.operations.values()),
      locks: Array.from(this.locks.values()),
    };
  }

  deserialize(data: {
    workflows: WorkflowState[];
    operations: AtomicOperation[];
    locks: WorkflowLock[];
  }): void {
    this.workflows.clear();
    this.operations.clear();
    this.locks.clear();

    data.workflows.forEach((w) => {
      this.workflows.set(w.id, {
        ...w,
        metadata: {
          ...w.metadata,
          createdAt: new Date(w.metadata.createdAt),
          lastModifiedAt: new Date(w.metadata.lastModifiedAt),
        },
        transitions: w.transitions.map((t) => ({
          ...t,
          triggeredAt: new Date(t.triggeredAt),
        })),
        locks: w.locks.map((l) => ({
          ...l,
          lockedAt: new Date(l.lockedAt),
          expiresAt: new Date(l.expiresAt),
        })),
      });
    });

    data.operations.forEach((op) => {
      this.operations.set(op.id, {
        ...op,
        timestamp: new Date(op.timestamp),
      });
    });

    data.locks.forEach((lock) => {
      this.locks.set(lock.id, {
        ...lock,
        lockedAt: new Date(lock.lockedAt),
        expiresAt: new Date(lock.expiresAt),
      });
    });
  }
}

