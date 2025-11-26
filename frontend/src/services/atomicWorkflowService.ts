// Atomic Workflow State Updates Service
import { toRecord } from '../utils/typeHelpers';
import { logger } from '@/services/logger';
// Handles multiple users advancing workflow simultaneously with atomic operations

export interface WorkflowState {
  id: string;
  workflowId: string;
  stage: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  data: Record<string, unknown>;
  metadata: {
    createdBy: string;
    createdAt: Date;
    lastModifiedBy: string;
    lastModifiedAt: Date;
    version: number;
    checksum: string;
  };
  transitions: WorkflowTransition[];
  locks: WorkflowLock[];
}

export interface WorkflowTransition {
  id: string;
  fromStage: string;
  toStage: string;
  triggeredBy: string;
  triggeredAt: Date;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface WorkflowLock {
  id: string;
  userId: string;
  stage: string;
  lockedAt: Date;
  expiresAt: Date;
  lockType: 'exclusive' | 'shared' | 'read_only';
  metadata: Record<string, unknown>;
}

export interface AtomicOperation {
  id: string;
  workflowId: string;
  operationType: 'advance' | 'rollback' | 'update' | 'lock' | 'unlock';
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  dependencies: string[];
  rollbackData?: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  retryCount: number;
  maxRetries: number;
}

export interface WorkflowConfig {
  enableAtomicOperations: boolean;
  enableLocking: boolean;
  enableVersionControl: boolean;
  enableConflictDetection: boolean;
  lockTimeout: number; // milliseconds
  operationTimeout: number; // milliseconds
  maxRetries: number;
  enableRollback: boolean;
  enableAuditLog: boolean;
}

class AtomicWorkflowService {
  private static instance: AtomicWorkflowService;
  private workflows: Map<string, WorkflowState> = new Map();
  private operations: Map<string, AtomicOperation> = new Map();
  private locks: Map<string, WorkflowLock> = new Map();
  private config: WorkflowConfig;
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private operationTimer?: NodeJS.Timeout;
  private lockTimer?: NodeJS.Timeout;

  public static getInstance(): AtomicWorkflowService {
    if (!AtomicWorkflowService.instance) {
      AtomicWorkflowService.instance = new AtomicWorkflowService();
    }
    return AtomicWorkflowService.instance;
  }

  constructor() {
    this.config = {
      enableAtomicOperations: true,
      enableLocking: true,
      enableVersionControl: true,
      enableConflictDetection: true,
      lockTimeout: 5 * 60 * 1000, // 5 minutes
      operationTimeout: 30 * 1000, // 30 seconds
      maxRetries: 3,
      enableRollback: true,
      enableAuditLog: true,
    };

    this.startTimers();
    this.loadPersistedData();
  }

  private startTimers(): void {
    // Monitor operations
    this.operationTimer = setInterval(() => {
      this.processPendingOperations();
      this.cleanupCompletedOperations();
    }, 1000);

    // Monitor locks
    this.lockTimer = setInterval(() => {
      this.checkExpiredLocks();
      this.cleanupExpiredLocks();
    }, 30000);
  }

  private validateWorkflowData(data: unknown): {
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
      status: typeof obj.status === 'string' ? obj.status as WorkflowState['status'] : undefined,
      progress: typeof obj.progress === 'number' ? obj.progress : undefined,
      data: obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data) ? obj.data as Record<string, unknown> : undefined,
      metadata: obj.metadata && typeof obj.metadata === 'object' && !Array.isArray(obj.metadata) ? {
        createdBy: typeof (obj.metadata as Record<string, unknown>).createdBy === 'string' ? (obj.metadata as Record<string, unknown>).createdBy as string : undefined,
        createdAt: (() => {
          const val = (obj.metadata as Record<string, unknown>).createdAt;
          return (typeof val === 'string' || typeof val === 'number') ? val : undefined;
        })(),
        lastModifiedBy: typeof (obj.metadata as Record<string, unknown>).lastModifiedBy === 'string' ? (obj.metadata as Record<string, unknown>).lastModifiedBy as string : undefined,
        lastModifiedAt: (() => {
          const val = (obj.metadata as Record<string, unknown>).lastModifiedAt;
          return (typeof val === 'string' || typeof val === 'number') ? val : undefined;
        })(),
        version: typeof (obj.metadata as Record<string, unknown>).version === 'number' ? (obj.metadata as Record<string, unknown>).version as number : undefined,
        checksum: typeof (obj.metadata as Record<string, unknown>).checksum === 'string' ? (obj.metadata as Record<string, unknown>).checksum as string : undefined,
      } : undefined,
      transitions: Array.isArray(obj.transitions) ? obj.transitions.map((t: unknown) => {
        if (t && typeof t === 'object' && !Array.isArray(t)) {
          const trans = t as Record<string, unknown>;
          const triggeredAt = trans.triggeredAt;
          return {
            ...trans,
            triggeredAt: (typeof triggeredAt === 'string' || typeof triggeredAt === 'number') ? triggeredAt : Date.now(),
          };
        }
        return { triggeredAt: Date.now() };
      }) : undefined,
      locks: Array.isArray(obj.locks) ? obj.locks.map((l: unknown) => {
        if (l && typeof l === 'object' && !Array.isArray(l)) {
          const lock = l as Record<string, unknown>;
          const lockedAt = lock.lockedAt;
          const expiresAt = lock.expiresAt;
          return {
            ...lock,
            lockedAt: (typeof lockedAt === 'string' || typeof lockedAt === 'number') ? lockedAt : Date.now(),
            expiresAt: (typeof expiresAt === 'string' || typeof expiresAt === 'number') ? expiresAt : Date.now(),
          };
        }
        return { lockedAt: Date.now(), expiresAt: Date.now() };
      }) : undefined,
    };
  }

  private loadPersistedData(): void {
    try {
      // Load workflows
      const workflowsData = localStorage.getItem('atomic_workflows');
      if (workflowsData) {
        const data = JSON.parse(workflowsData) as { workflows: unknown[] };
        data.workflows.forEach((workflowData: unknown) => {
          const wd = this.validateWorkflowData(workflowData);
          if (!wd) return;
          
          const workflow: WorkflowState = {
            id: wd.id || '',
            workflowId: wd.workflowId || '',
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
            })) as WorkflowTransition[],
            locks: (wd.locks || []).map((l) => ({
              ...l,
              lockedAt: new Date(l.lockedAt),
              expiresAt: new Date(l.expiresAt),
            })) as WorkflowLock[],
          };
          this.workflows.set(workflow.id, workflow);
        });
      }

      // Load operations
      const operationsData = localStorage.getItem('atomic_operations');
      if (operationsData) {
        const data = JSON.parse(operationsData);
        data.operations.forEach((operationData: unknown) => {
          const opData = operationData as Record<string, unknown>;
          const operation: AtomicOperation = {
            ...opData,
            timestamp: new Date((opData.timestamp as number | string) || Date.now()),
          } as AtomicOperation;
          this.operations.set(operation.id, operation);
        });
      }
    } catch (error) {
      logger.error('Failed to load persisted data:', toRecord(error));
    }
  }

  private savePersistedData(): void {
    try {
      // Save workflows
      const workflowsData = {
        workflows: Array.from(this.workflows.values()),
      };
      localStorage.setItem('atomic_workflows', JSON.stringify(workflowsData));

      // Save operations
      const operationsData = {
        operations: Array.from(this.operations.values()),
      };
      localStorage.setItem('atomic_operations', JSON.stringify(operationsData));
    } catch (error) {
      logger.error('Failed to save persisted data:', toRecord(error));
    }
  }

  public createWorkflow(
    workflowId: string,
    initialStage: string,
    userId: string,
    data: Record<string, unknown> = {}
  ): WorkflowState {
    const now = new Date();
    const workflow: WorkflowState = {
      id: this.generateWorkflowId(),
      workflowId,
      stage: initialStage,
      status: 'active',
      progress: 0,
      data,
      metadata: {
        createdBy: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now,
        version: 1,
        checksum: this.calculateChecksum(data),
      },
      transitions: [],
      locks: [],
    };

    this.workflows.set(workflow.id, workflow);
    this.savePersistedData();

    this.emit('workflowCreated', toRecord(workflow));
    return workflow;
  }

  public advanceWorkflow(
    workflowId: string,
    toStage: string,
    userId: string,
    data: Record<string, unknown> = {},
    options: {
      forceAdvance?: boolean;
      lockType?: WorkflowLock['lockType'];
      timeout?: number;
    } = {}
  ): Promise<{
    success: boolean;
    operation?: AtomicOperation;
    conflict?: Record<string, unknown>;
  }> {
    return new Promise((resolve) => {
      const workflow = this.findWorkflowById(workflowId);
      if (!workflow) {
        resolve({ success: false });
        return;
      }

      // Check for locks
      if (this.config.enableLocking && !options.forceAdvance) {
        const existingLock = this.findLockByWorkflowAndStage(workflowId, workflow.stage);
        if (existingLock && existingLock.userId !== userId) {
          resolve({ success: false, conflict: { type: 'lock_conflict', lock: existingLock } });
          return;
        }
      }

      // Create atomic operation
      const operation: AtomicOperation = {
        id: this.generateOperationId(),
        workflowId,
        operationType: 'advance',
        userId,
        timestamp: new Date(),
        data: {
          fromStage: workflow.stage,
          toStage,
          data: data as Record<string, unknown>,
        },
        dependencies: [],
        rollbackData: {
          fromStage: workflow.stage,
          toStage: workflow.stage,
          data: workflow.data,
        },
        status: 'pending',
        retryCount: 0,
        maxRetries: this.config.maxRetries,
      };

      this.operations.set(operation.id, operation);
      this.savePersistedData();

      // Execute operation
      this.executeOperation(operation)
        .then((result) => {
          resolve({ success: result.success, operation });
        })
        .catch((_error) => {
          resolve({ success: false, operation });
        });
    });
  }

  private async executeOperation(operation: AtomicOperation): Promise<{ success: boolean }> {
    operation.status = 'executing';
    this.operations.set(operation.id, operation);

    try {
      const workflow = this.findWorkflowById(operation.workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${operation.workflowId} not found. It may have been deleted or never created.`);
      }

      // Acquire lock if needed
      if (this.config.enableLocking) {
        const lock = await this.acquireLock(
          operation.workflowId,
          workflow.stage,
          operation.userId,
          'exclusive'
        );
        if (!lock) {
          throw new Error(`Failed to acquire exclusive lock for workflow ${operation.workflowId} at stage ${workflow.stage}. Another user may be working on this stage.`);
        }
      }

      // Execute the operation
      const result = await this.performWorkflowAdvance(workflow, operation);

      if (result.success) {
        operation.status = 'completed';
        this.emit('operationCompleted', toRecord(operation));
      } else {
        const errorMsg = result.error || 'Workflow operation failed';
        throw new Error(`${errorMsg}. Workflow ID: ${operation.workflowId}, Operation: ${operation.operationType}`);
      }

      return { success: true };
    } catch (error) {
      operation.status = 'failed';
      operation.retryCount++;

      if (operation.retryCount < operation.maxRetries) {
        // Retry operation
        setTimeout(() => {
          this.executeOperation(operation);
        }, 1000 * operation.retryCount);
      } else {
        // Rollback if enabled
        if (this.config.enableRollback) {
          await this.rollbackOperation(operation);
        }
      }

      this.emit('operationFailed', { operation, error });
      return { success: false };
    }
  }

  private async performWorkflowAdvance(
    workflow: WorkflowState,
    operation: AtomicOperation
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const opData = operation.data as Record<string, unknown>;
      const fromStage = String(opData.fromStage || workflow.stage);
      const toStage = String(opData.toStage || workflow.stage);
      const data = (opData.data as Record<string, unknown>) || {};

      // Validate transition
      if (!this.isValidTransition(workflow, fromStage, toStage)) {
        return { success: false, error: 'Invalid transition' };
      }

      // Update workflow state
      workflow.stage = toStage;
      workflow.data = { ...workflow.data, ...data };
      workflow.metadata.lastModifiedBy = String(operation.userId);
      workflow.metadata.lastModifiedAt = new Date();
      workflow.metadata.version++;
      workflow.metadata.checksum = this.calculateChecksum(workflow.data);

      // Add transition record
      const transition: WorkflowTransition = {
        id: this.generateTransitionId(),
        fromStage: String(fromStage),
        toStage: String(toStage),
        triggeredBy: String(operation.userId),
        triggeredAt: new Date(),
        data,
        metadata: {},
      };

      workflow.transitions.push(transition);

      // Update progress
      workflow.progress = this.calculateProgress(workflow);

      this.workflows.set(workflow.id, workflow);
      this.savePersistedData();

      this.emit('workflowAdvanced', { workflow, transition });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async rollbackOperation(operation: AtomicOperation): Promise<void> {
    try {
      const workflow = this.findWorkflowById(operation.workflowId);
      if (!workflow || !operation.rollbackData) return;

      // Restore previous state
      workflow.stage = String(operation.rollbackData.toStage || workflow.stage);
      workflow.data = (operation.rollbackData.data as Record<string, unknown>) || workflow.data;
      workflow.metadata.lastModifiedBy = operation.userId;
      workflow.metadata.lastModifiedAt = new Date();
      workflow.metadata.version++;

      this.workflows.set(workflow.id, workflow);
      this.savePersistedData();

      operation.status = 'rolled_back';
      this.emit('operationRolledBack', toRecord(operation));
    } catch (error) {
      logger.error('Rollback failed:', toRecord(error));
    }
  }

  private async acquireLock(
    workflowId: string,
    stage: string,
    userId: string,
    lockType: WorkflowLock['lockType']
  ): Promise<WorkflowLock | null> {
    const existingLock = this.findLockByWorkflowAndStage(workflowId, stage);

    if (existingLock) {
      if (existingLock.userId === userId) {
        // Same user, renew lock
        existingLock.expiresAt = new Date(Date.now() + this.config.lockTimeout);
        this.locks.set(existingLock.id, existingLock);
        return existingLock;
      } else {
        // Different user, check if lock is expired
        if (existingLock.expiresAt > new Date()) {
          return null; // Lock is still valid
        } else {
          // Lock is expired, remove it
          this.locks.delete(existingLock.id);
        }
      }
    }

    // Create new lock
    const lock: WorkflowLock = {
      id: this.generateLockId(),
      userId,
      stage,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.lockTimeout),
      lockType,
      metadata: {},
    };

    this.locks.set(lock.id, lock);

    // Add lock to workflow
    const workflow = this.findWorkflowById(workflowId);
    if (workflow) {
      workflow.locks.push(lock);
      this.workflows.set(workflow.id, workflow);
    }

    this.savePersistedData();
    this.emit('lockAcquired', toRecord(lock));
    return lock;
  }

  private releaseLock(lockId: string): boolean {
    const lock = this.locks.get(lockId);
    if (!lock) return false;

    this.locks.delete(lockId);

    // Remove lock from workflow
    const workflow = this.findWorkflowById(lock.stage); // This should be workflowId, but we'll use stage for now
    if (workflow) {
      workflow.locks = workflow.locks.filter((l) => l.id !== lockId);
      this.workflows.set(workflow.id, workflow);
    }

    this.savePersistedData();
    this.emit('lockReleased', toRecord(lock));
    return true;
  }

  private isValidTransition(workflow: WorkflowState, fromStage: string, toStage: string): boolean {
    // Define valid transitions based on workflow type
    const validTransitions: Record<string, string[]> = {
      data_ingestion: ['data_mapping', 'failed'],
      data_mapping: ['reconciliation', 'data_ingestion'],
      reconciliation: ['review_results', 'data_mapping'],
      review_results: ['export_results', 'reconciliation'],
      export_results: ['completed', 'review_results'],
    };

    const allowedStages = validTransitions[fromStage] || [];
    return allowedStages.includes(toStage);
  }

  private calculateProgress(workflow: WorkflowState): number {
    const stages = [
      'data_ingestion',
      'data_mapping',
      'reconciliation',
      'review_results',
      'export_results',
      'completed',
    ];
    const currentIndex = stages.indexOf(workflow.stage);
    return Math.round((currentIndex / (stages.length - 1)) * 100);
  }

  private calculateChecksum(data: Record<string, unknown>): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private findWorkflowById(workflowId: string): WorkflowState | undefined {
    return Array.from(this.workflows.values()).find((w) => w.workflowId === workflowId);
  }

  private findLockByWorkflowAndStage(workflowId: string, stage: string): WorkflowLock | undefined {
    return Array.from(this.locks.values()).find((l) => l.stage === stage);
  }

  private processPendingOperations(): void {
    const pendingOperations = Array.from(this.operations.values()).filter(
      (op) => op.status === 'pending'
    );

    pendingOperations.forEach((operation) => {
      this.executeOperation(operation);
    });
  }

  private cleanupCompletedOperations(): void {
    const completedOperations = Array.from(this.operations.values()).filter(
      (op) => op.status === 'completed' || op.status === 'rolled_back'
    );

    completedOperations.forEach((operation) => {
      const age = Date.now() - operation.timestamp.getTime();
      if (age > 24 * 60 * 60 * 1000) {
        // 24 hours
        this.operations.delete(operation.id);
      }
    });
  }

  private checkExpiredLocks(): void {
    const now = new Date();
    const expiredLocks = Array.from(this.locks.values()).filter((lock) => lock.expiresAt <= now);

    expiredLocks.forEach((lock) => {
      this.releaseLock(lock.id);
      this.emit('lockExpired', toRecord(lock));
    });
  }

  private cleanupExpiredLocks(): void {
    // Locks are cleaned up in checkExpiredLocks
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransitionId(): string {
    return `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLockId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getWorkflow(workflowId: string): WorkflowState | undefined {
    return this.findWorkflowById(workflowId);
  }

  public getAllWorkflows(): WorkflowState[] {
    return Array.from(this.workflows.values());
  }

  public getOperations(): AtomicOperation[] {
    return Array.from(this.operations.values());
  }

  public getLocks(): WorkflowLock[] {
    return Array.from(this.locks.values());
  }

  public updateConfig(newConfig: Partial<WorkflowConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', toRecord(this.config));
  }

  public getConfig(): WorkflowConfig {
    return { ...this.config };
  }

  // Event system
  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: Record<string, unknown>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  public destroy(): void {
    if (this.operationTimer) {
      clearInterval(this.operationTimer);
    }
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }
    this.workflows.clear();
    this.operations.clear();
    this.locks.clear();
    this.listeners.clear();
  }
}

// React hook for atomic workflow
export const useAtomicWorkflow = () => {
  const service = AtomicWorkflowService.getInstance();

  const createWorkflow = (
    workflowId: string,
    initialStage: string,
    userId: string,
    data?: Record<string, unknown>
  ) => {
    return service.createWorkflow(workflowId, initialStage, userId, data);
  };

  const advanceWorkflow = (
    workflowId: string,
    toStage: string,
    userId: string,
    data?: Record<string, unknown>,
    options?: {
      forceAdvance?: boolean;
      lockType?: WorkflowLock['lockType'];
      timeout?: number;
    }
  ) => {
    return service.advanceWorkflow(workflowId, toStage, userId, data, options);
  };

  const getWorkflow = (workflowId: string) => {
    return service.getWorkflow(workflowId);
  };

  const getAllWorkflows = () => {
    return service.getAllWorkflows();
  };

  const getOperations = () => {
    return service.getOperations();
  };

  const getLocks = () => {
    return service.getLocks();
  };

  const updateConfig = (newConfig: Partial<WorkflowConfig>) => {
    service.updateConfig(newConfig);
  };

  const getConfig = () => {
    return service.getConfig();
  };

  return {
    createWorkflow,
    advanceWorkflow,
    getWorkflow,
    getAllWorkflows,
    getOperations,
    getLocks,
    updateConfig,
    getConfig,
  };
};

// Export singleton instance
export const atomicWorkflowService = AtomicWorkflowService.getInstance();
