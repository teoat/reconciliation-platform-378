// Optimistic Locking with Conflict Resolution Service
import { logger } from '@/services/logger';
// Prevents concurrent user modifications from causing data overwrites

export interface OptimisticLock {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: Date;
  version: number;
  expiresAt: Date;
  metadata: {
    userAgent: string;
    ipAddress?: string;
    sessionId: string;
  };
}

export interface ConflictResolution {
  id: string;
  lockId: string;
  conflictType: 'concurrent_modification' | 'version_mismatch' | 'lock_expired' | 'user_conflict';
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  resolution: 'local_wins' | 'remote_wins' | 'merge' | 'manual' | 'cancel';
  resolvedBy?: string;
  resolvedAt?: Date;
  mergeStrategy?: MergeStrategy;
}

export interface MergeStrategy {
  type: 'field_level' | 'object_level' | 'custom';
  rules: MergeRule[];
  conflictHandlers: ConflictHandler[];
}

export interface MergeRule {
  field: string;
  strategy: 'local' | 'remote' | 'latest' | 'custom';
  customHandler?: string;
  priority: number;
}

export interface ConflictHandler {
  field: string;
  handler: (local: unknown, remote: unknown) => unknown;
  description: string;
}

export interface LockConfig {
  defaultLockDuration: number; // milliseconds
  maxLockDuration: number; // milliseconds
  lockCheckInterval: number; // milliseconds
  enableAutoRenewal: boolean;
  enableConflictDetection: boolean;
  enableMergeStrategies: boolean;
}

class OptimisticLockingService {
  private static instance: OptimisticLockingService;
  private locks: Map<string, OptimisticLock> = new Map();
  private conflicts: Map<string, ConflictResolution> = new Map();
  private config: LockConfig;
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private lockCheckTimer?: NodeJS.Timeout;

  public static getInstance(): OptimisticLockingService {
    if (!OptimisticLockingService.instance) {
      OptimisticLockingService.instance = new OptimisticLockingService();
    }
    return OptimisticLockingService.instance;
  }

  constructor() {
    this.config = {
      defaultLockDuration: 5 * 60 * 1000, // 5 minutes
      maxLockDuration: 30 * 60 * 1000, // 30 minutes
      lockCheckInterval: 30 * 1000, // 30 seconds
      enableAutoRenewal: true,
      enableConflictDetection: true,
      enableMergeStrategies: true,
    };

    this.startLockMonitoring();
    this.loadPersistedLocks();
  }

  private startLockMonitoring(): void {
    this.lockCheckTimer = setInterval(() => {
      this.checkExpiredLocks();
      this.cleanupResolvedConflicts();
    }, this.config.lockCheckInterval);
  }

  private loadPersistedLocks(): void {
    try {
      const stored = localStorage.getItem('optimistic_locks');
      if (stored) {
        const data = JSON.parse(stored);
        data.locks.forEach((lockData: unknown) => {
          const lock: OptimisticLock = {
            ...lockData,
            timestamp: new Date(lockData.timestamp),
            expiresAt: new Date(lockData.expiresAt),
          };
          this.locks.set(lock.id, lock);
        });
      }
    } catch (error) {
      logger.error('Failed to load persisted locks:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private savePersistedLocks(): void {
    try {
      const data = {
        locks: Array.from(this.locks.values()),
      };
      localStorage.setItem('optimistic_locks', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save locks:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  public async acquireLock(
    entityType: string,
    entityId: string,
    userId: string,
    options: {
      duration?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<OptimisticLock | null> {
    const lockKey = `${entityType}:${entityId}`;
    const existingLock = this.findLockByKey(lockKey);

    // Check for existing lock
    if (existingLock) {
      if (existingLock.userId === userId) {
        // Same user, renew lock
        return this.renewLock(existingLock.id, options.duration);
      } else if (existingLock.expiresAt > new Date()) {
        // Different user, lock conflict
        const conflict = await this.createConflict(
          existingLock,
          entityType,
          entityId,
          userId,
          'user_conflict'
        );
        this.emit('lockConflict', conflict);
        return null;
      } else {
        // Expired lock, remove it
        this.releaseLock(existingLock.id);
      }
    }

    // Create new lock
    const lock: OptimisticLock = {
      id: this.generateLockId(),
      entityType,
      entityId,
      userId,
      timestamp: new Date(),
      version: 1,
      expiresAt: new Date(Date.now() + (options.duration || this.config.defaultLockDuration)),
      metadata: {
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
        ...options.metadata,
      },
    };

    this.locks.set(lock.id, lock);
    this.savePersistedLocks();

    this.emit('lockAcquired', lock);
    return lock;
  }

  public releaseLock(lockId: string): boolean {
    const lock = this.locks.get(lockId);
    if (!lock) return false;

    this.locks.delete(lockId);
    this.savePersistedLocks();

    this.emit('lockReleased', lock);
    return true;
  }

  public renewLock(lockId: string, duration?: number): OptimisticLock | null {
    const lock = this.locks.get(lockId);
    if (!lock) return null;

    const newDuration = duration || this.config.defaultLockDuration;
    const newExpiresAt = new Date(Date.now() + newDuration);

    // Check if renewal would exceed max duration
    if (newExpiresAt.getTime() - lock.timestamp.getTime() > this.config.maxLockDuration) {
      return null;
    }

    lock.expiresAt = newExpiresAt;
    lock.version++;

    this.locks.set(lockId, lock);
    this.savePersistedLocks();

    this.emit('lockRenewed', lock);
    return lock;
  }

  public async updateEntity(
    entityType: string,
    entityId: string,
    userId: string,
    data: Record<string, unknown>,
    options: {
      version?: number;
      mergeStrategy?: MergeStrategy;
      forceUpdate?: boolean;
    } = {}
  ): Promise<{ success: boolean; conflict?: ConflictResolution; data?: Record<string, unknown> }> {
    const lockKey = `${entityType}:${entityId}`;
    const existingLock = this.findLockByKey(lockKey);

    // Check if user has lock
    if (!existingLock || existingLock.userId !== userId) {
      const conflict = await this.createConflict(
        existingLock,
        entityType,
        entityId,
        userId,
        'concurrent_modification'
      );
      return { success: false, conflict };
    }

    // Check version if provided
    if (options.version && existingLock.version !== options.version) {
      const conflict = await this.createConflict(
        existingLock,
        entityType,
        entityId,
        userId,
        'version_mismatch',
        { localVersion: options.version, remoteVersion: existingLock.version }
      );
      return { success: false, conflict };
    }

    // Update successful
    existingLock.version++;
    this.locks.set(existingLock.id, existingLock);
    this.savePersistedLocks();

    this.emit('entityUpdated', { entityType, entityId, data, lock: existingLock });
    return { success: true, data };
  }

  private async createConflict(
    existingLock: OptimisticLock | undefined,
    entityType: string,
    entityId: string,
    userId: string,
    conflictType: ConflictResolution['conflictType'],
    additionalData?: Record<string, unknown>
  ): Promise<ConflictResolution> {
    const conflict: ConflictResolution = {
      id: this.generateConflictId(),
      lockId: existingLock?.id || '',
      conflictType,
      localData: additionalData,
      remoteData: existingLock
        ? { userId: existingLock.userId, version: existingLock.version }
        : null,
      resolution: 'manual',
      resolvedBy: undefined,
      resolvedAt: undefined,
    };

    this.conflicts.set(conflict.id, conflict);
    this.emit('conflictCreated', conflict);

    return conflict;
  }

  public resolveConflict(
    conflictId: string,
    resolution: ConflictResolution['resolution'],
    resolvedBy: string,
    mergeStrategy?: MergeStrategy
  ): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;

    conflict.resolution = resolution;
    conflict.resolvedBy = resolvedBy;
    conflict.resolvedAt = new Date();
    if (mergeStrategy) conflict.mergeStrategy = mergeStrategy;

    this.conflicts.set(conflictId, conflict);
    this.emit('conflictResolved', conflict);

    return true;
  }

  public async mergeData(
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
    mergeStrategy: MergeStrategy
  ): Promise<Record<string, unknown>> {
    if (!this.config.enableMergeStrategies) {
      throw new Error('Merge strategies are disabled');
    }

    const mergedData = { ...localData };

    // Apply merge rules
    mergeStrategy.rules
      .sort((a, b) => a.priority - b.priority)
      .forEach((rule) => {
        const localValue = this.getNestedValue(localData, rule.field);
        const remoteValue = this.getNestedValue(remoteData, rule.field);

        let mergedValue: unknown;

        switch (rule.strategy) {
          case 'local':
            mergedValue = localValue;
            break;
          case 'remote':
            mergedValue = remoteValue;
            break;
          case 'latest':
            mergedValue = localValue.timestamp > remoteValue.timestamp ? localValue : remoteValue;
            break;
          case 'custom': {
            const handler = mergeStrategy.conflictHandlers.find((h) => h.field === rule.field);                                                                           
            if (handler) {
              mergedValue = handler.handler(localValue, remoteValue);
            } else {
              mergedValue = localValue;
            }
            break;
          }
          default:
            mergedValue = localValue;
        }

        this.setNestedValue(mergedData, rule.field, mergedValue);
      });

    return mergedData;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path
      .split('.')
      .reduce((current, key) => (current as Record<string, unknown>)?.[key], obj);
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private findLockByKey(lockKey: string): OptimisticLock | undefined {
    return Array.from(this.locks.values()).find(
      (lock) => `${lock.entityType}:${lock.entityId}` === lockKey
    );
  }

  private checkExpiredLocks(): void {
    const now = new Date();
    const expiredLocks: OptimisticLock[] = [];

    this.locks.forEach((lock) => {
      if (lock.expiresAt <= now) {
        expiredLocks.push(lock);
      }
    });

    expiredLocks.forEach((lock) => {
      this.releaseLock(lock.id);
      this.emit('lockExpired', lock);
    });
  }

  private cleanupResolvedConflicts(): void {
    const resolvedConflicts = Array.from(this.conflicts.values())
      .filter((conflict) => conflict.resolvedAt)
      .filter((conflict) => {
        const resolvedAt = conflict.resolvedAt!;
        const cleanupTime = new Date(resolvedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        return new Date() > cleanupTime;
      });

    resolvedConflicts.forEach((conflict) => {
      this.conflicts.delete(conflict.id);
    });
  }

  private generateLockId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('optimistic_lock_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('optimistic_lock_session_id', sessionId);
    }
    return sessionId;
  }

  // Public API methods
  public getLock(entityType: string, entityId: string): OptimisticLock | undefined {
    const lockKey = `${entityType}:${entityId}`;
    return this.findLockByKey(lockKey);
  }

  public getAllLocks(): OptimisticLock[] {
    return Array.from(this.locks.values());
  }

  public getLocksByUser(userId: string): OptimisticLock[] {
    return Array.from(this.locks.values()).filter((lock) => lock.userId === userId);
  }

  public getConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values());
  }

  public getUnresolvedConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values()).filter((conflict) => !conflict.resolvedAt);
  }

  public updateConfig(newConfig: Partial<LockConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  public getConfig(): LockConfig {
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
    if (this.lockCheckTimer) {
      clearInterval(this.lockCheckTimer);
    }
    this.locks.clear();
    this.conflicts.clear();
    this.listeners.clear();
  }
}

// React hook for optimistic locking
export const useOptimisticLocking = () => {
  const service = OptimisticLockingService.getInstance();

  const acquireLock = (
    entityType: string,
    entityId: string,
    userId: string,
    options?: Record<string, unknown>
  ) => {
    return service.acquireLock(entityType, entityId, userId, options);
  };

  const releaseLock = (lockId: string) => {
    return service.releaseLock(lockId);
  };

  const renewLock = (lockId: string, duration?: number) => {
    return service.renewLock(lockId, duration);
  };

  const updateEntity = (
    entityType: string,
    entityId: string,
    userId: string,
    data: Record<string, unknown>,
    options?: { version?: number; mergeStrategy?: MergeStrategy; forceUpdate?: boolean }
  ) => {
    return service.updateEntity(entityType, entityId, userId, data, options);
  };

  const resolveConflict = (
    conflictId: string,
    resolution: ConflictResolution['resolution'],
    resolvedBy: string,
    mergeStrategy?: MergeStrategy
  ) => {
    return service.resolveConflict(conflictId, resolution, resolvedBy, mergeStrategy);
  };

  const mergeData = (
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
    mergeStrategy: MergeStrategy
  ) => {
    return service.mergeData(localData, remoteData, mergeStrategy);
  };

  const getLock = (entityType: string, entityId: string) => {
    return service.getLock(entityType, entityId);
  };

  const getAllLocks = () => {
    return service.getAllLocks();
  };

  const getConflicts = () => {
    return service.getConflicts();
  };

  const getUnresolvedConflicts = () => {
    return service.getUnresolvedConflicts();
  };

  return {
    acquireLock,
    releaseLock,
    renewLock,
    updateEntity,
    resolveConflict,
    mergeData,
    getLock,
    getAllLocks,
    getConflicts,
    getUnresolvedConflicts,
  };
};

// Export singleton instance
export const optimisticLockingService = OptimisticLockingService.getInstance();
