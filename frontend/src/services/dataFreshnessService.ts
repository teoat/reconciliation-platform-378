// Data Freshness Indicators + Automatic Refresh Service
import { logger } from '@/services/logger';
// Handles stale data display after reconnection with freshness indicators

export interface DataFreshness {
  id: string;
  dataType: 'reconciliation' | 'project' | 'user' | 'file' | 'workflow';
  dataId: string;
  lastUpdated: Date;
  lastChecked: Date;
  freshnessStatus: 'fresh' | 'stale' | 'expired' | 'unknown';
  ttl: number; // time to live in milliseconds
  source: 'local' | 'remote' | 'cache';
  metadata: {
    version: number;
    checksum: string;
    userId: string;
    projectId?: string;
  };
}

export interface RefreshConfig {
  enableAutomaticRefresh: boolean;
  enableFreshnessIndicators: boolean;
  defaultTTL: number; // milliseconds
  staleThreshold: number; // milliseconds
  expiredThreshold: number; // milliseconds
  refreshInterval: number; // milliseconds
  enableBackgroundRefresh: boolean;
  enableUserNotification: boolean;
  enableDataValidation: boolean;
}

export interface RefreshStrategy {
  type: 'immediate' | 'background' | 'on_demand' | 'scheduled';
  priority: 'high' | 'medium' | 'low';
  retryAttempts: number;
  retryDelay: number; // milliseconds
  conditions: RefreshCondition[];
}

export interface RefreshCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: unknown;
}

export interface DataSource {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  ttl: number;
  refreshStrategy: RefreshStrategy;
}

class DataFreshnessService {
  private static instance: DataFreshnessService;
  private freshnessData: Map<string, DataFreshness> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  private config: RefreshConfig;
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private refreshTimer?: NodeJS.Timeout;
  private freshnessTimer?: NodeJS.Timeout;

  public static getInstance(): DataFreshnessService {
    if (!DataFreshnessService.instance) {
      DataFreshnessService.instance = new DataFreshnessService();
    }
    return DataFreshnessService.instance;
  }

  constructor() {
    this.config = {
      enableAutomaticRefresh: true,
      enableFreshnessIndicators: true,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      staleThreshold: 2 * 60 * 1000, // 2 minutes
      expiredThreshold: 10 * 60 * 1000, // 10 minutes
      refreshInterval: 30 * 1000, // 30 seconds
      enableBackgroundRefresh: true,
      enableUserNotification: true,
      enableDataValidation: true,
    };

    this.startTimers();
    this.loadPersistedData();
    this.initializeEventListeners();
  }

  private startTimers(): void {
    // Refresh timer
    this.refreshTimer = setInterval(() => {
      this.performScheduledRefreshes();
    }, this.config.refreshInterval);

    // Freshness check timer
    this.freshnessTimer = setInterval(() => {
      this.updateFreshnessStatus();
    }, 10000); // Check every 10 seconds
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('data_freshness');
      if (stored) {
        const data = JSON.parse(stored);
        data.freshnessData.forEach((item: Record<string, unknown>) => {
          const freshness: DataFreshness = {
            ...item,
            lastUpdated: new Date(item.lastUpdated),
            lastChecked: new Date(item.lastChecked),
          };
          this.freshnessData.set(freshness.id, freshness);
        });
      }
    } catch (error) {
      logger.error('Failed to load persisted freshness data:', error);
    }
  }

  private savePersistedData(): void {
    try {
      const data = {
        freshnessData: Array.from(this.freshnessData.values()),
      };
      localStorage.setItem('data_freshness', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save freshness data:', error);
    }
  }

  private initializeEventListeners(): void {
    // Handle online/offline events
    window.addEventListener('online', () => {
      this.handleReconnection();
    });

    window.addEventListener('offline', () => {
      this.handleDisconnection();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.handleVisibilityChange();
      }
    });
  }

  public registerData(
    dataType: DataFreshness['dataType'],
    dataId: string,
    data: Record<string, unknown>,
    options: {
      ttl?: number;
      source?: DataFreshness['source'];
      userId?: string;
      projectId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): DataFreshness {
    const freshnessId = this.generateFreshnessId(dataType, dataId);
    const now = new Date();

    const freshness: DataFreshness = {
      id: freshnessId,
      dataType,
      dataId,
      lastUpdated: now,
      lastChecked: now,
      freshnessStatus: 'fresh',
      ttl: options.ttl || this.config.defaultTTL,
      source: options.source || 'local',
      metadata: {
        version: 1,
        checksum: this.calculateChecksum(data),
        userId: options.userId || 'anonymous',
        projectId: options.projectId,
        ...options.metadata,
      },
    };

    this.freshnessData.set(freshnessId, freshness);
    this.savePersistedData();

    this.emit('dataRegistered', freshness);
    return freshness;
  }

  public updateData(
    dataType: DataFreshness['dataType'],
    dataId: string,
    data: Record<string, unknown>,
    options: {
      source?: DataFreshness['source'];
      userId?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): DataFreshness | null {
    const freshnessId = this.generateFreshnessId(dataType, dataId);
    const existingFreshness = this.freshnessData.get(freshnessId);

    if (!existingFreshness) {
      return this.registerData(dataType, dataId, data, options);
    }

    const now = new Date();
    existingFreshness.lastUpdated = now;
    existingFreshness.lastChecked = now;
    existingFreshness.freshnessStatus = 'fresh';
    existingFreshness.source = options.source || existingFreshness.source;
    existingFreshness.metadata.version++;
    existingFreshness.metadata.checksum = this.calculateChecksum(data);
    existingFreshness.metadata.userId = options.userId || existingFreshness.metadata.userId;

    if (options.metadata) {
      Object.assign(existingFreshness.metadata, options.metadata);
    }

    this.freshnessData.set(freshnessId, existingFreshness);
    this.savePersistedData();

    this.emit('dataUpdated', existingFreshness);
    return existingFreshness;
  }

  public getFreshnessStatus(
    dataType: DataFreshness['dataType'],
    dataId: string
  ): DataFreshness | null {
    const freshnessId = this.generateFreshnessId(dataType, dataId);
    return this.freshnessData.get(freshnessId) || null;
  }

  public isDataFresh(dataType: DataFreshness['dataType'], dataId: string): boolean {
    const freshness = this.getFreshnessStatus(dataType, dataId);
    if (!freshness) return false;

    const age = Date.now() - freshness.lastUpdated.getTime();
    return age < freshness.ttl;
  }

  public isDataStale(dataType: DataFreshness['dataType'], dataId: string): boolean {
    const freshness = this.getFreshnessStatus(dataType, dataId);
    if (!freshness) return true;

    const age = Date.now() - freshness.lastUpdated.getTime();
    return age >= this.config.staleThreshold && age < this.config.expiredThreshold;
  }

  public isDataExpired(dataType: DataFreshness['dataType'], dataId: string): boolean {
    const freshness = this.getFreshnessStatus(dataType, dataId);
    if (!freshness) return true;

    const age = Date.now() - freshness.lastUpdated.getTime();
    return age >= this.config.expiredThreshold;
  }

  public async refreshData(
    dataType: DataFreshness['dataType'],
    dataId: string,
    options: {
      force?: boolean;
      strategy?: RefreshStrategy;
      userId?: string;
    } = {}
  ): Promise<{ success: boolean; data?: Record<string, unknown>; freshness?: DataFreshness }> {
    const freshness = this.getFreshnessStatus(dataType, dataId);
    if (!freshness) {
      return { success: false };
    }

    // Check if refresh is needed
    if (!options.force && this.isDataFresh(dataType, dataId)) {
      return { success: true, freshness };
    }

    try {
      // Find data source
      const dataSource = this.findDataSource(dataType, dataId);
      if (!dataSource) {
        return { success: false };
      }

      // Perform refresh based on strategy
      const strategy = options.strategy || dataSource.refreshStrategy;
      const data = await this.performRefresh(dataSource, strategy);

      if (data) {
        // Update freshness
        const updatedFreshness = this.updateData(dataType, dataId, data, {
          source: 'remote',
          userId: options.userId,
        });

        this.emit('dataRefreshed', { freshness: updatedFreshness, data });
        return { success: true, data, freshness: updatedFreshness || undefined };
      }

      return { success: false };
    } catch (error) {
      this.emit('refreshFailed', { dataType, dataId, error });
      return { success: false };
    }
  }

  private async performRefresh(
    dataSource: DataSource,
    strategy: RefreshStrategy
  ): Promise<Record<string, unknown>> {
    const { endpoint, method, headers, params } = dataSource;

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (method === 'POST' || method === 'PUT') {
        requestOptions.body = JSON.stringify(params);
      }

      const response = await fetch(endpoint, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Retry logic based on strategy
      if (strategy.retryAttempts > 0) {
        await this.delay(strategy.retryDelay);
        return this.performRefresh(dataSource, {
          ...strategy,
          retryAttempts: strategy.retryAttempts - 1,
        });
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private findDataSource(dataType: DataFreshness['dataType'], dataId: string): DataSource | null {
    // Find data source by type and ID
    return (
      Array.from(this.dataSources.values()).find(
        (source) => source.name.includes(dataType) && source.name.includes(dataId)
      ) || null
    );
  }

  private performScheduledRefreshes(): void {
    if (!this.config.enableAutomaticRefresh) return;

    this.freshnessData.forEach((freshness) => {
      if (this.isDataStale(freshness.dataType, freshness.dataId)) {
        this.refreshData(freshness.dataType, freshness.dataId, {
          strategy: {
            type: 'background',
            priority: 'low',
            retryAttempts: 1,
            retryDelay: 1000,
            conditions: [],
          },
        });
      }
    });
  }

  private updateFreshnessStatus(): void {
    this.freshnessData.forEach((freshness) => {
      const age = Date.now() - freshness.lastUpdated.getTime();
      let newStatus: DataFreshness['freshnessStatus'];

      if (age < this.config.staleThreshold) {
        newStatus = 'fresh';
      } else if (age < this.config.expiredThreshold) {
        newStatus = 'stale';
      } else {
        newStatus = 'expired';
      }

      if (freshness.freshnessStatus !== newStatus) {
        freshness.freshnessStatus = newStatus;
        freshness.lastChecked = new Date();
        this.freshnessData.set(freshness.id, freshness);
        this.emit('freshnessStatusChanged', freshness);
      }
    });

    this.savePersistedData();
  }

  private handleReconnection(): void {
    // Refresh all expired data
    this.freshnessData.forEach((freshness) => {
      if (freshness.freshnessStatus === 'expired') {
        this.refreshData(freshness.dataType, freshness.dataId, { force: true });
      }
    });

    this.emit('reconnectionDetected');
  }

  private handleDisconnection(): void {
    // Mark all remote data as potentially stale
    this.freshnessData.forEach((freshness) => {
      if (freshness.source === 'remote') {
        freshness.freshnessStatus = 'unknown';
        freshness.lastChecked = new Date();
        this.freshnessData.set(freshness.id, freshness);
      }
    });

    this.savePersistedData();
    this.emit('disconnectionDetected');
  }

  private handleVisibilityChange(): void {
    // Refresh stale data when page becomes visible
    this.freshnessData.forEach((freshness) => {
      if (freshness.freshnessStatus === 'stale' || freshness.freshnessStatus === 'expired') {
        this.refreshData(freshness.dataType, freshness.dataId);
      }
    });
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

  private generateFreshnessId(dataType: DataFreshness['dataType'], dataId: string): string {
    return `${dataType}_${dataId}`;
  }

  // Public API methods
  public registerDataSource(dataSource: DataSource): void {
    this.dataSources.set(dataSource.id, dataSource);
    this.emit('dataSourceRegistered', dataSource);
  }

  public getAllFreshnessData(): DataFreshness[] {
    return Array.from(this.freshnessData.values());
  }

  public getStaleData(): DataFreshness[] {
    return Array.from(this.freshnessData.values()).filter((f) => f.freshnessStatus === 'stale');
  }

  public getExpiredData(): DataFreshness[] {
    return Array.from(this.freshnessData.values()).filter((f) => f.freshnessStatus === 'expired');
  }

  public clearFreshnessData(dataType?: DataFreshness['dataType']): void {
    if (dataType) {
      const toDelete = Array.from(this.freshnessData.keys()).filter((id) =>
        id.startsWith(dataType)
      );
      toDelete.forEach((id) => this.freshnessData.delete(id));
    } else {
      this.freshnessData.clear();
    }
    this.savePersistedData();
    this.emit('freshnessDataCleared', dataType);
  }

  public updateConfig(newConfig: Partial<RefreshConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  public getConfig(): RefreshConfig {
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

  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.freshnessTimer) {
      clearInterval(this.freshnessTimer);
    }
    this.freshnessData.clear();
    this.dataSources.clear();
    this.listeners.clear();
  }
}

// React hook for data freshness
export const useDataFreshness = () => {
  const service = DataFreshnessService.getInstance();

  const registerData = (
    dataType: DataFreshness['dataType'],
    dataId: string,
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => {
    return service.registerData(dataType, dataId, data, options);
  };

  const updateData = (
    dataType: DataFreshness['dataType'],
    dataId: string,
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => {
    return service.updateData(dataType, dataId, data, options);
  };

  const getFreshnessStatus = (dataType: DataFreshness['dataType'], dataId: string) => {
    return service.getFreshnessStatus(dataType, dataId);
  };

  const isDataFresh = (dataType: DataFreshness['dataType'], dataId: string) => {
    return service.isDataFresh(dataType, dataId);
  };

  const isDataStale = (dataType: DataFreshness['dataType'], dataId: string) => {
    return service.isDataStale(dataType, dataId);
  };

  const isDataExpired = (dataType: DataFreshness['dataType'], dataId: string) => {
    return service.isDataExpired(dataType, dataId);
  };

  const refreshData = (
    dataType: DataFreshness['dataType'],
    dataId: string,
    options?: Record<string, unknown>
  ) => {
    return service.refreshData(dataType, dataId, options);
  };

  const registerDataSource = (dataSource: DataSource) => {
    service.registerDataSource(dataSource);
  };

  const getAllFreshnessData = () => {
    return service.getAllFreshnessData();
  };

  const getStaleData = () => {
    return service.getStaleData();
  };

  const getExpiredData = () => {
    return service.getExpiredData();
  };

  const clearFreshnessData = (dataType?: DataFreshness['dataType']) => {
    service.clearFreshnessData(dataType);
  };

  const updateConfig = (newConfig: Partial<RefreshConfig>) => {
    service.updateConfig(newConfig);
  };

  const getConfig = () => {
    return service.getConfig();
  };

  return {
    registerData,
    updateData,
    getFreshnessStatus,
    isDataFresh,
    isDataStale,
    isDataExpired,
    refreshData,
    registerDataSource,
    getAllFreshnessData,
    getStaleData,
    getExpiredData,
    clearFreshnessData,
    updateConfig,
    getConfig,
  };
};

// Export singleton instance
export const dataFreshnessService = DataFreshnessService.getInstance();
