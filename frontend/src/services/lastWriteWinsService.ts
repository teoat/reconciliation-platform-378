// Last-Write-Wins with Timestamp Validation Service
import { logger } from '@/services/logger';
// Resolves concurrent record modifications with timestamp-based conflict resolution

export interface TimestampedRecord {
  id: string;
  data: Record<string, unknown>;
  timestamp: Date;
  version: number;
  userId: string;
  checksum: string;
  metadata: {
    lastModified: Date;
    modifiedBy: string;
    modificationType: 'create' | 'update' | 'delete';
    source: string;
  };
}

export interface ConflictResolution {
  id: string;
  recordId: string;
  conflictType: 'timestamp_conflict' | 'version_conflict' | 'checksum_conflict';
  localRecord: TimestampedRecord;
  remoteRecord: TimestampedRecord;
  resolution: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
  resolvedAt?: Date;
  resolvedBy?: string;
  mergeStrategy?: MergeStrategy;
}

export interface MergeStrategy {
  type: 'timestamp_based' | 'field_level' | 'user_preference' | 'custom';
  rules: MergeRule[];
  conflictHandlers: ConflictHandler[];
}

export interface MergeRule {
  field: string;
  strategy: 'latest' | 'local' | 'remote' | 'merge' | 'custom';
  customHandler?: string;
  priority: number;
}

export interface ConflictHandler {
  field: string;
  handler: (
    local: unknown,
    remote: unknown,
    localTimestamp: Date,
    remoteTimestamp: Date
  ) => unknown;
  description: string;
}

export interface TimestampConfig {
  enableTimestampValidation: boolean;
  enableVersionControl: boolean;
  enableChecksumValidation: boolean;
  enableConflictDetection: boolean;
  enableAutoResolution: boolean;
  maxConflictAge: number; // milliseconds
  conflictResolutionTimeout: number; // milliseconds
}

class LastWriteWinsService {
  private static instance: LastWriteWinsService;
  private records: Map<string, TimestampedRecord> = new Map();
  private conflicts: Map<string, ConflictResolution> = new Map();
  private config: TimestampConfig;
  private listeners: Map<string, Function[]> = new Map();
  private conflictTimer?: NodeJS.Timeout;

  public static getInstance(): LastWriteWinsService {
    if (!LastWriteWinsService.instance) {
      LastWriteWinsService.instance = new LastWriteWinsService();
    }
    return LastWriteWinsService.instance;
  }

  constructor() {
    this.config = {
      enableTimestampValidation: true,
      enableVersionControl: true,
      enableChecksumValidation: true,
      enableConflictDetection: true,
      enableAutoResolution: true,
      maxConflictAge: 24 * 60 * 60 * 1000, // 24 hours
      conflictResolutionTimeout: 5 * 60 * 1000, // 5 minutes
    };

    this.startConflictMonitoring();
    this.loadPersistedRecords();
  }

  private startConflictMonitoring(): void {
    this.conflictTimer = setInterval(() => {
      this.checkForConflicts();
      this.cleanupResolvedConflicts();
    }, 30000); // Check every 30 seconds
  }

  private loadPersistedRecords(): void {
    try {
      const stored = localStorage.getItem('timestamped_records');
      if (stored) {
        const data = JSON.parse(stored);
        data.records.forEach((recordData: unknown) => {
          const record: TimestampedRecord = {
            ...recordData,
            timestamp: new Date(recordData.timestamp),
            metadata: {
              ...recordData.metadata,
              lastModified: new Date(recordData.metadata.lastModified),
            },
          };
          this.records.set(record.id, record);
        });
      }
    } catch (error) {
      logger.error('Failed to load persisted records:', error);
    }
  }

  private savePersistedRecords(): void {
    try {
      const data = {
        records: Array.from(this.records.values()),
      };
      localStorage.setItem('timestamped_records', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save records:', error);
    }
  }

  public createRecord(
    id: string,
    data: Record<string, unknown>,
    userId: string,
    options: {
      version?: number;
      checksum?: string;
      metadata?: Partial<TimestampedRecord['metadata']>;
    } = {}
  ): TimestampedRecord {
    const now = new Date();
    const checksum = options.checksum || this.calculateChecksum(data);

    const record: TimestampedRecord = {
      id,
      data,
      timestamp: now,
      version: options.version || 1,
      userId,
      checksum,
      metadata: {
        lastModified: now,
        modifiedBy: userId,
        modificationType: 'create',
        source: 'local',
        ...options.metadata,
      },
    };

    this.records.set(id, record);
    this.savePersistedRecords();

    this.emit('recordCreated', record);
    return record;
  }

  public updateRecord(
    id: string,
    data: Record<string, unknown>,
    userId: string,
    options: {
      version?: number;
      checksum?: string;
      metadata?: Partial<TimestampedRecord['metadata']>;
      forceUpdate?: boolean;
    } = {}
  ): { success: boolean; conflict?: ConflictResolution; record?: TimestampedRecord } {
    const existingRecord = this.records.get(id);
    if (!existingRecord) {
      return { success: false };
    }

    const now = new Date();
    const newChecksum = options.checksum || this.calculateChecksum(data);

    // Check for conflicts
    if (this.config.enableConflictDetection && !options.forceUpdate) {
      const conflict = this.detectConflict(existingRecord, data, userId, now);
      if (conflict) {
        return { success: false, conflict };
      }
    }

    // Update record
    const updatedRecord: TimestampedRecord = {
      ...existingRecord,
      data,
      timestamp: now,
      version: existingRecord.version + 1,
      userId,
      checksum: newChecksum,
      metadata: {
        ...existingRecord.metadata,
        lastModified: now,
        modifiedBy: userId,
        modificationType: 'update',
        ...options.metadata,
      },
    };

    this.records.set(id, updatedRecord);
    this.savePersistedRecords();

    this.emit('recordUpdated', updatedRecord);
    return { success: true, record: updatedRecord };
  }

  private detectConflict(
    existingRecord: TimestampedRecord,
    newData: Record<string, unknown>,
    userId: string,
    timestamp: Date
  ): ConflictResolution | null {
    // Check if another user has modified the record recently
    const timeDiff = timestamp.getTime() - existingRecord.timestamp.getTime();
    if (timeDiff < 5000 && existingRecord.userId !== userId) {
      // 5 seconds
      const conflict: ConflictResolution = {
        id: this.generateConflictId(),
        recordId: existingRecord.id,
        conflictType: 'timestamp_conflict',
        localRecord: existingRecord,
        remoteRecord: {
          ...existingRecord,
          data: newData,
          timestamp,
          userId,
          version: existingRecord.version + 1,
          checksum: this.calculateChecksum(newData),
        },
        resolution: 'manual',
      };

      this.conflicts.set(conflict.id, conflict);
      this.emit('conflictDetected', conflict);
      return conflict;
    }

    return null;
  }

  public resolveConflict(
    conflictId: string,
    resolution: ConflictResolution['resolution'],
    resolvedBy: string,
    mergeStrategy?: MergeStrategy
  ): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;

    let resolvedRecord: TimestampedRecord;

    switch (resolution) {
      case 'local_wins':
        resolvedRecord = conflict.localRecord;
        break;
      case 'remote_wins':
        resolvedRecord = conflict.remoteRecord;
        break;
      case 'merge':
        if (mergeStrategy) {
          resolvedRecord = this.mergeRecords(
            conflict.localRecord,
            conflict.remoteRecord,
            mergeStrategy
          );
        } else {
          resolvedRecord = this.defaultMerge(conflict.localRecord, conflict.remoteRecord);
        }
        break;
      case 'manual':
        // Manual resolution - record should be updated separately
        conflict.resolution = resolution;
        conflict.resolvedAt = new Date();
        conflict.resolvedBy = resolvedBy;
        this.conflicts.set(conflictId, conflict);
        this.emit('conflictResolved', conflict);
        return true;
      default:
        return false;
    }

    // Update the record with resolved data
    this.records.set(conflict.recordId, resolvedRecord);
    this.savePersistedRecords();

    // Mark conflict as resolved
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = resolvedBy;
    if (mergeStrategy) conflict.mergeStrategy = mergeStrategy;

    this.conflicts.set(conflictId, conflict);
    this.emit('conflictResolved', conflict);

    return true;
  }

  private mergeRecords(
    localRecord: TimestampedRecord,
    remoteRecord: TimestampedRecord,
    mergeStrategy: MergeStrategy
  ): TimestampedRecord {
    const mergedData = { ...localRecord.data };

    // Apply merge rules
    mergeStrategy.rules
      .sort((a, b) => a.priority - b.priority)
      .forEach((rule) => {
        const localValue = this.getNestedValue(localRecord.data, rule.field);
        const remoteValue = this.getNestedValue(remoteRecord.data, rule.field);

        let mergedValue: unknown;

        switch (rule.strategy) {
          case 'latest':
            mergedValue = localRecord.timestamp > remoteRecord.timestamp ? localValue : remoteValue;
            break;
          case 'local':
            mergedValue = localValue;
            break;
          case 'remote':
            mergedValue = remoteValue;
            break;
          case 'merge':
            const handler = mergeStrategy.conflictHandlers.find((h) => h.field === rule.field);
            if (handler) {
              mergedValue = handler.handler(
                localValue,
                remoteValue,
                localRecord.timestamp,
                remoteRecord.timestamp
              );
            } else {
              mergedValue = localValue;
            }
            break;
          case 'custom':
            const customHandler = mergeStrategy.conflictHandlers.find(
              (h) => h.field === rule.field
            );
            if (customHandler) {
              mergedValue = customHandler.handler(
                localValue,
                remoteValue,
                localRecord.timestamp,
                remoteRecord.timestamp
              );
            } else {
              mergedValue = localValue;
            }
            break;
          default:
            mergedValue = localValue;
        }

        this.setNestedValue(mergedData, rule.field, mergedValue);
      });

    return {
      ...localRecord,
      data: mergedData,
      timestamp: new Date(),
      version: Math.max(localRecord.version, remoteRecord.version) + 1,
      checksum: this.calculateChecksum(mergedData),
      metadata: {
        ...localRecord.metadata,
        lastModified: new Date(),
        modificationType: 'update',
        source: 'merge',
      },
    };
  }

  private defaultMerge(
    localRecord: TimestampedRecord,
    remoteRecord: TimestampedRecord
  ): TimestampedRecord {
    // Default merge strategy: use the most recent timestamp
    return localRecord.timestamp > remoteRecord.timestamp ? localRecord : remoteRecord;
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: unknown, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private calculateChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private checkForConflicts(): void {
    // Check for records that might have conflicts
    const records = Array.from(this.records.values());
    const now = new Date();

    records.forEach((record) => {
      const age = now.getTime() - record.timestamp.getTime();
      if (age > this.config.maxConflictAge) {
        // Record is old, check if it needs conflict resolution
        this.checkRecordForConflicts(record);
      }
    });
  }

  private checkRecordForConflicts(record: TimestampedRecord): void {
    // This would typically involve checking with a server or other clients
    // For now, we'll just emit an event for external conflict checking
    this.emit('recordConflictCheck', record);
  }

  private cleanupResolvedConflicts(): void {
    const resolvedConflicts = Array.from(this.conflicts.values())
      .filter((conflict) => conflict.resolvedAt)
      .filter((conflict) => {
        const resolvedAt = conflict.resolvedAt!;
        const cleanupTime = new Date(resolvedAt.getTime() + this.config.maxConflictAge);
        return new Date() > cleanupTime;
      });

    resolvedConflicts.forEach((conflict) => {
      this.conflicts.delete(conflict.id);
    });
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getRecord(id: string): TimestampedRecord | undefined {
    return this.records.get(id);
  }

  public getAllRecords(): TimestampedRecord[] {
    return Array.from(this.records.values());
  }

  public getConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values());
  }

  public getUnresolvedConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values()).filter((conflict) => !conflict.resolvedAt);
  }

  public deleteRecord(id: string, userId: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;

    const deletedRecord: TimestampedRecord = {
      ...record,
      timestamp: new Date(),
      version: record.version + 1,
      userId,
      metadata: {
        ...record.metadata,
        lastModified: new Date(),
        modifiedBy: userId,
        modificationType: 'delete',
      },
    };

    this.records.set(id, deletedRecord);
    this.savePersistedRecords();

    this.emit('recordDeleted', deletedRecord);
    return true;
  }

  public updateConfig(newConfig: Partial<TimestampConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  public getConfig(): TimestampConfig {
    return { ...this.config };
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  public destroy(): void {
    if (this.conflictTimer) {
      clearInterval(this.conflictTimer);
    }
    this.records.clear();
    this.conflicts.clear();
    this.listeners.clear();
  }
}

// React hook for last-write-wins
export const useLastWriteWins = () => {
  const service = LastWriteWinsService.getInstance();

  const createRecord = (
    id: string,
    data: Record<string, unknown>,
    userId: string,
    options?: {
      version?: number;
      checksum?: string;
      metadata?: Partial<TimestampedRecord['metadata']>;
    }
  ) => {
    return service.createRecord(id, data, userId, options);
  };

  const updateRecord = (
    id: string,
    data: Record<string, unknown>,
    userId: string,
    options?: {
      version?: number;
      checksum?: string;
      metadata?: Partial<TimestampedRecord['metadata']>;
      forceUpdate?: boolean;
    }
  ) => {
    return service.updateRecord(id, data, userId, options);
  };

  const resolveConflict = (
    conflictId: string,
    resolution: ConflictResolution['resolution'],
    resolvedBy: string,
    mergeStrategy?: MergeStrategy
  ) => {
    return service.resolveConflict(conflictId, resolution, resolvedBy, mergeStrategy);
  };

  const getRecord = (id: string) => {
    return service.getRecord(id);
  };

  const getAllRecords = () => {
    return service.getAllRecords();
  };

  const getConflicts = () => {
    return service.getConflicts();
  };

  const getUnresolvedConflicts = () => {
    return service.getUnresolvedConflicts();
  };

  const deleteRecord = (id: string, userId: string) => {
    return service.deleteRecord(id, userId);
  };

  const updateConfig = (newConfig: Partial<TimestampConfig>) => {
    service.updateConfig(newConfig);
  };

  const getConfig = () => {
    return service.getConfig();
  };

  return {
    createRecord,
    updateRecord,
    resolveConflict,
    getRecord,
    getAllRecords,
    getConflicts,
    getUnresolvedConflicts,
    deleteRecord,
    updateConfig,
    getConfig,
  };
};

// Export singleton instance
export const lastWriteWinsService = LastWriteWinsService.getInstance();
