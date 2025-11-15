// Data Persistence Testing Types
// Core type definitions for the data persistence testing suite

export interface DataPersistenceTest {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<DataPersistenceTestResult>;
  category: 'local-storage' | 'session-storage' | 'indexeddb' | 'cache-persistence';
  priority: 'high' | 'medium' | 'low';
  requiresStorageSimulation: boolean;
}

export interface DataPersistenceTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  duration: number;
  errors?: string[];
  storageOperations?: StorageOperation[];
  dataIntegrity?: DataIntegrityCheck[];
  persistenceMetrics?: PersistenceMetrics;
}

export interface StorageOperation {
  type: 'save' | 'load' | 'delete' | 'update';
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cache';
  key: string;
  success: boolean;
  timestamp: Date;
  size?: number;
  duration?: number;
}

export interface DataIntegrityCheck {
  type: 'checksum' | 'validation' | 'consistency' | 'performance';
  passed: boolean;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface PersistenceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageOperationTime: number;
  totalDataSize: number;
  storageUtilization: number;
}

export interface DataPersistenceConfig {
  testTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLocalStorageTests: boolean;
  enableSessionStorageTests: boolean;
  enableIndexedDBTests: boolean;
  enableCachePersistenceTests: boolean;
  maxDataSize: number;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  averageDuration: number;
  totalStorageOperations: number;
  totalDataIntegrityChecks: number;
  averageStorageUtilization: number;
}

export interface StorageQuotaInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: IDBObjectStoreConfig[];
}

export interface IDBObjectStoreConfig {
  name: string;
  keyPath: string | string[];
  autoIncrement?: boolean;
  indexes?: IDBIndexConfig[];
}

export interface IDBIndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}

export interface CachePersistenceConfig {
  strategy: 'memory' | 'localStorage' | 'indexedDB';
  maxAge: number;
  maxEntries: number;
  compressionEnabled: boolean;
}

export interface TransactionResult {
  success: boolean;
  operations: number;
  duration: number;
  rollbackReason?: string;
}
