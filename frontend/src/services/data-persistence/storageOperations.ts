// Storage Operations Module
// Handles all storage-related operations for data persistence testing
// Extracted from dataPersistenceTester.ts

import { StorageOperation } from './types';

export class StorageOperations {
  private static measureOperationTime<T>(operation: () => T): { result: T; duration: number } {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    return { result, duration };
  }

  static async saveToLocalStorage(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();

    try {
      const serialized = JSON.stringify(data);
      const { duration } = this.measureOperationTime(() => {
        localStorage.setItem(key, serialized);
      });

      return {
        type: 'save',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serialized.length,
        duration,
      };
    } catch (error) {
      return {
        type: 'save',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  static async loadFromLocalStorage(key: string): Promise<StorageOperation> {
    const startTime = Date.now();

    try {
      const { result: data, duration } = this.measureOperationTime(() => {
        return localStorage.getItem(key);
      });

      if (data) {
        JSON.parse(data); // Validate JSON
      }

      return {
        type: 'load',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: data?.length || 0,
        duration,
      };
    } catch (error) {
      return {
        type: 'load',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  static async saveToSessionStorage(key: string, data: unknown): Promise<StorageOperation> {
    const startTime = Date.now();

    try {
      const serialized = JSON.stringify(data);
      const { duration } = this.measureOperationTime(() => {
        sessionStorage.setItem(key, serialized);
      });

      return {
        type: 'save',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: serialized.length,
        duration,
      };
    } catch (error) {
      return {
        type: 'save',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  static async loadFromSessionStorage(key: string): Promise<StorageOperation> {
    const startTime = Date.now();

    try {
      const { result: data, duration } = this.measureOperationTime(() => {
        return sessionStorage.getItem(key);
      });

      if (data) {
        JSON.parse(data); // Validate JSON
      }

      return {
        type: 'load',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: data?.length || 0,
        duration,
      };
    } catch (error) {
      return {
        type: 'load',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  static async clearStorage(storage: 'localStorage' | 'sessionStorage'): Promise<StorageOperation> {
    const startTime = Date.now();

    try {
      const { duration } = this.measureOperationTime(() => {
        if (storage === 'localStorage') {
          localStorage.clear();
        } else {
          sessionStorage.clear();
        }
      });

      return {
        type: 'delete',
        storage,
        key: '*',
        success: true,
        timestamp: new Date(),
        duration,
      };
    } catch (error) {
      return {
        type: 'delete',
        storage,
        key: '*',
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
    }
  }

  static getStorageQuota(storage: 'localStorage' | 'sessionStorage'): {
    used: number;
    available: number;
  } {
    try {
      let used = 0;
      const store = storage === 'localStorage' ? localStorage : sessionStorage;

      for (let key in store) {
        if (store.hasOwnProperty(key)) {
          used += store[key].length + key.length;
        }
      }

      // Estimate available space (rough approximation)
      const available = 5 * 1024 * 1024 - used; // Assume 5MB limit

      return { used, available: Math.max(0, available) };
    } catch (error) {
      return { used: 0, available: 0 };
    }
  }
}
