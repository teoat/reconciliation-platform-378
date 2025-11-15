// Optimistic UI Updates Service - Handles optimistic updates with rollback capability
// Implements comprehensive optimistic UI management with conflict resolution

export interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'assign';
  entityType: 'record' | 'project' | 'user' | 'workflow' | 'file';
  entityId: string;
  originalData: unknown;
  optimisticData: unknown;
  timestamp: Date;
  userId: string;
  projectId?: string;
  component: string;
  status: 'pending' | 'success' | 'failed' | 'rolled_back';
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export interface ConflictResolution {
  id: string;
  updateId: string;
  conflictType: 'concurrent_modification' | 'data_mismatch' | 'version_conflict';
  localData: unknown;
  remoteData: unknown;
  resolution: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
  timestamp: Date;
  resolvedBy?: string;
}

export interface RollbackAction {
  id: string;
  updateId: string;
  action: 'revert_data' | 'restore_state' | 'clear_cache';
  data: unknown;
  timestamp: Date;
  reason: string;
}

class OptimisticUIService {
  private static instance: OptimisticUIService;
  private updates: Map<string, OptimisticUpdate> = new Map();
  private conflicts: Map<string, ConflictResolution> = new Map();
  private rollbacks: Map<string, RollbackAction> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  private retryDelays: number[] = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  public static getInstance(): OptimisticUIService {
    if (!OptimisticUIService.instance) {
      OptimisticUIService.instance = new OptimisticUIService();
    }
    return OptimisticUIService.instance;
  }

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Listen for network status changes
    window.addEventListener('online', () => {
      this.handleReconnection();
    });

    window.addEventListener('offline', () => {
      this.handleDisconnection();
    });
  }

  public createOptimisticUpdate(
    type: OptimisticUpdate['type'],
    entityType: OptimisticUpdate['entityType'],
    entityId: string,
    originalData: unknown,
    optimisticData: unknown,
    options: {
      userId: string;
      projectId?: string;
      component: string;
      maxRetries?: number;
    }
  ): OptimisticUpdate {
    const id = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const update: OptimisticUpdate = {
      id,
      type,
      entityType,
      entityId,
      originalData,
      optimisticData,
      timestamp: new Date(),
      userId: options.userId,
      projectId: options.projectId,
      component: options.component,
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      error: undefined,
    };

    this.updates.set(id, update);
    this.emit('updateCreated', update);

    // Apply optimistic update to UI
    this.applyOptimisticUpdate(update);

    // Start the actual API call
    this.executeUpdate(update);

    return update;
  }

  private async executeUpdate(update: OptimisticUpdate): Promise<void> {
    try {
      // Simulate API call - replace with actual API service
      const result = await this.callAPI(update);

      // Mark as successful
      const updated = this.updateStatus(update.id, 'success');
      this.emit('updateSuccess', updated);

      // Clean up after successful update
      setTimeout(() => {
        this.cleanupUpdate(update.id);
      }, 5000); // Keep for 5 seconds for potential rollback
    } catch (error) {
      this.handleUpdateError(update, error);
    }
  }

  private async callAPI(update: OptimisticUpdate): Promise<unknown> {
    // This would integrate with your actual API service
    // For now, we'll simulate different scenarios

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      // 10% failure rate
      throw new Error('Simulated API failure');
    }

    // Simulate conflict detection
    if (Math.random() < 0.05) {
      // 5% conflict rate
      throw new Error('CONFLICT: Data was modified by another user');
    }

    return { success: true, data: update.optimisticData };
  }

  private handleUpdateError(update: OptimisticUpdate, error: unknown): void {
    const errorMessage = error.message || 'Unknown error';

    // Check if it's a conflict
    if (errorMessage.includes('CONFLICT')) {
      this.handleConflict(update, errorMessage);
      return;
    }

    // Check if we should retry
    if (update.retryCount < update.maxRetries) {
      this.retryUpdate(update, errorMessage);
    } else {
      // Max retries exceeded, rollback
      this.rollbackUpdate(update, errorMessage);
    }
  }

  private handleConflict(update: OptimisticUpdate, errorMessage: string): void {
    const conflict: ConflictResolution = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      updateId: update.id,
      conflictType: 'concurrent_modification',
      localData: update.optimisticData,
      remoteData: update.originalData, // This would be the actual remote data
      resolution: 'manual', // Default to manual resolution
      timestamp: new Date(),
    };

    this.conflicts.set(conflict.id, conflict);
    this.updateStatus(update.id, 'failed', errorMessage);

    this.emit('conflictDetected', conflict);
  }

  private retryUpdate(update: OptimisticUpdate, errorMessage: string): void {
    const delay = this.retryDelays[update.retryCount] || 16000;

    setTimeout(() => {
      const updated = this.updateStatus(update.id, 'pending', undefined, update.retryCount + 1);
      this.executeUpdate(updated);
    }, delay);
  }

  private rollbackUpdate(update: OptimisticUpdate, errorMessage: string): void {
    const rollback: RollbackAction = {
      id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      updateId: update.id,
      action: 'revert_data',
      data: update.originalData,
      timestamp: new Date(),
      reason: errorMessage,
    };

    this.rollbacks.set(rollback.id, rollback);
    this.updateStatus(update.id, 'rolled_back', errorMessage);

    // Revert the UI to original state
    this.revertOptimisticUpdate(update);

    this.emit('updateRolledBack', { update, rollback });
  }

  private applyOptimisticUpdate(update: OptimisticUpdate): void {
    // This would integrate with your state management
    // For now, we'll emit events that components can listen to

    this.emit('applyOptimisticUpdate', {
      entityType: update.entityType,
      entityId: update.entityId,
      data: update.optimisticData,
      updateId: update.id,
    });
  }

  private revertOptimisticUpdate(update: OptimisticUpdate): void {
    this.emit('revertOptimisticUpdate', {
      entityType: update.entityType,
      entityId: update.entityId,
      data: update.originalData,
      updateId: update.id,
    });
  }

  private updateStatus(
    updateId: string,
    status: OptimisticUpdate['status'],
    error?: string,
    retryCount?: number
  ): OptimisticUpdate {
    const update = this.updates.get(updateId);
    if (!update) throw new Error(`Update ${updateId} not found`);

    const updated: OptimisticUpdate = {
      ...update,
      status,
      error,
      retryCount: retryCount !== undefined ? retryCount : update.retryCount,
    };

    this.updates.set(updateId, updated);
    this.emit('updateStatusChanged', updated);

    return updated;
  }

  private cleanupUpdate(updateId: string): void {
    this.updates.delete(updateId);
    this.emit('updateCleanedUp', updateId);
  }

  private handleReconnection(): void {
    // Retry all pending updates when reconnected
    const pendingUpdates = Array.from(this.updates.values()).filter(
      (update) => update.status === 'pending'
    );

    pendingUpdates.forEach((update) => {
      this.executeUpdate(update);
    });

    this.emit('reconnected', { pendingUpdates: pendingUpdates.length });
  }

  private handleDisconnection(): void {
    // Mark all pending updates as failed
    const pendingUpdates = Array.from(this.updates.values()).filter(
      (update) => update.status === 'pending'
    );

    pendingUpdates.forEach((update) => {
      this.updateStatus(update.id, 'failed', 'Network disconnected');
    });

    this.emit('disconnected', { failedUpdates: pendingUpdates.length });
  }

  // Public API methods
  public getUpdate(updateId: string): OptimisticUpdate | undefined {
    return this.updates.get(updateId);
  }

  public getAllUpdates(): OptimisticUpdate[] {
    return Array.from(this.updates.values());
  }

  public getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.updates.values()).filter((update) => update.status === 'pending');
  }

  public getFailedUpdates(): OptimisticUpdate[] {
    return Array.from(this.updates.values()).filter((update) => update.status === 'failed');
  }

  public getConflicts(): ConflictResolution[] {
    return Array.from(this.conflicts.values());
  }

  public getRollbacks(): RollbackAction[] {
    return Array.from(this.rollbacks.values());
  }

  public resolveConflict(conflictId: string, resolution: ConflictResolution['resolution']): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    const updatedConflict: ConflictResolution = {
      ...conflict,
      resolution,
      resolvedBy: 'current_user', // This would be the actual user ID
      timestamp: new Date(),
    };

    this.conflicts.set(conflictId, updatedConflict);
    this.emit('conflictResolved', updatedConflict);

    // Handle the resolution
    switch (resolution) {
      case 'local_wins':
        // Keep the optimistic update
        break;
      case 'remote_wins':
        // Rollback the optimistic update
        const update = this.updates.get(conflict.updateId);
        if (update) {
          this.rollbackUpdate(update, 'Conflict resolved in favor of remote data');
        }
        break;
      case 'merge':
        // Implement merge logic
        this.mergeData(conflict);
        break;
    }
  }

  private mergeData(conflict: ConflictResolution): void {
    // Implement intelligent merge logic
    // This would depend on your data structure
    this.emit('dataMerged', conflict);
  }

  public retryFailedUpdate(updateId: string): void {
    const update = this.updates.get(updateId);
    if (!update || update.status !== 'failed') return;

    const updated = this.updateStatus(updateId, 'pending', undefined, 0);
    this.executeUpdate(updated);
  }

  public clearCompletedUpdates(): void {
    const completedUpdates = Array.from(this.updates.values()).filter(
      (update) => update.status === 'success' || update.status === 'rolled_back'
    );

    completedUpdates.forEach((update) => {
      this.cleanupUpdate(update.id);
    });

    this.emit('completedUpdatesCleared', completedUpdates.length);
  }

  public clearConflicts(): void {
    this.conflicts.clear();
    this.emit('conflictsCleared');
  }

  public clearRollbacks(): void {
    this.rollbacks.clear();
    this.emit('rollbacksCleared');
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
    this.updates.clear();
    this.conflicts.clear();
    this.rollbacks.clear();
    this.listeners.clear();
  }
}

// React hook for optimistic UI updates
export const useOptimisticUI = () => {
  const service = OptimisticUIService.getInstance();

  const createUpdate = (
    type: OptimisticUpdate['type'],
    entityType: OptimisticUpdate['entityType'],
    entityId: string,
    originalData: unknown,
    optimisticData: unknown,
    options: {
      userId: string;
      projectId?: string;
      component: string;
      maxRetries?: number;
    }
  ) => {
    return service.createOptimisticUpdate(
      type,
      entityType,
      entityId,
      originalData,
      optimisticData,
      options
    );
  };

  const getUpdate = (updateId: string) => {
    return service.getUpdate(updateId);
  };

  const getAllUpdates = () => {
    return service.getAllUpdates();
  };

  const getPendingUpdates = () => {
    return service.getPendingUpdates();
  };

  const getFailedUpdates = () => {
    return service.getFailedUpdates();
  };

  const getConflicts = () => {
    return service.getConflicts();
  };

  const resolveConflict = (conflictId: string, resolution: ConflictResolution['resolution']) => {
    service.resolveConflict(conflictId, resolution);
  };

  const retryFailedUpdate = (updateId: string) => {
    service.retryFailedUpdate(updateId);
  };

  const clearCompletedUpdates = () => {
    service.clearCompletedUpdates();
  };

  return {
    createUpdate,
    getUpdate,
    getAllUpdates,
    getPendingUpdates,
    getFailedUpdates,
    getConflicts,
    resolveConflict,
    retryFailedUpdate,
    clearCompletedUpdates,
  };
};

// Export singleton instance
export const optimisticUIService = OptimisticUIService.getInstance();
