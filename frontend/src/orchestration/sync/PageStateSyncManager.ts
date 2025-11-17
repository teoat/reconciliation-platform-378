/**
 * Page State Sync Manager - Manages cross-page state synchronization
 */

import { logger } from '@/services/logger';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import type { PageOrchestrationInterface, SyncTask, PageContext } from '../types';

export class PageStateSyncManager {
  private syncQueue: SyncTask[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly syncIntervalMs = 5000; // Sync every 5 seconds

  constructor() {
    this.startPeriodicSync();
  }

  /**
   * Sync page state
   */
  async syncPageState(page: PageOrchestrationInterface): Promise<void> {
    const syncTask: SyncTask = {
      pageId: page.getPageId(),
      state: page.getPageContext(),
      timestamp: Date.now(),
      priority: 'medium',
    };

    this.syncQueue.push(syncTask);
    await this.processSyncQueue();
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // Sort by priority and timestamp
      this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      while (this.syncQueue.length > 0) {
        const task = this.syncQueue.shift()!;
        await this.syncToFrenly(task);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync to Frenly AI
   */
  private async syncToFrenly(task: SyncTask): Promise<void> {
    try {
      await frenlyAgentService.syncPageState({
        pageId: task.pageId,
        state: task.state,
        timestamp: task.timestamp,
      });
    } catch (error) {
      logger.error('Error syncing to Frenly', { error, task });
      // Re-queue with lower priority
      if (task.priority !== 'low') {
        this.syncQueue.push({
          ...task,
          priority: task.priority === 'high' ? 'medium' : 'low',
        });
      }
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      this.processSyncQueue().catch((error) => {
        logger.error('Error in periodic sync', { error });
      });
    }, this.syncIntervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Clear sync queue
   */
  clearQueue(): void {
    this.syncQueue = [];
  }
}

// Singleton instance
let syncManagerInstance: PageStateSyncManager | null = null;

export function getPageStateSyncManager(): PageStateSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new PageStateSyncManager();
  }
  return syncManagerInstance;
}

