// Types for Atomic Workflow Service

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

