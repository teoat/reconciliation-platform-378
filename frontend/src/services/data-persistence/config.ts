// Data Persistence Testing Configuration
// Default configuration and configuration management

import { DataPersistenceConfig } from './types';

export const defaultConfig: DataPersistenceConfig = {
  testTimeout: 45000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableLocalStorageTests: true,
  enableSessionStorageTests: true,
  enableIndexedDBTests: true,
  enableCachePersistenceTests: true,
  maxDataSize: 10 * 1024 * 1024, // 10MB
};

export class DataPersistenceConfigManager {
  private config: DataPersistenceConfig;

  constructor(config: Partial<DataPersistenceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  getConfig(): DataPersistenceConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<DataPersistenceConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isTestEnabled(
    category: keyof Pick<
      DataPersistenceConfig,
      | 'enableLocalStorageTests'
      | 'enableSessionStorageTests'
      | 'enableIndexedDBTests'
      | 'enableCachePersistenceTests'
    >
  ): boolean {
    return this.config[category];
  }

  getTimeout(): number {
    return this.config.testTimeout;
  }

  getRetryConfig(): { attempts: number; delay: number } {
    return {
      attempts: this.config.retryAttempts,
      delay: this.config.retryDelay,
    };
  }

  getMaxDataSize(): number {
    return this.config.maxDataSize;
  }
}
