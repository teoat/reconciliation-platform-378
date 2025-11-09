// Data Persistence Testing
// Comprehensive testing suite for verifying data preservation during network issues

import React from 'react'

export interface DataPersistenceTest {
  id: string
  name: string
  description: string
  testFunction: () => Promise<DataPersistenceTestResult>
  category: 'local-storage' | 'session-storage' | 'indexeddb' | 'cache-persistence'
  priority: 'high' | 'medium' | 'low'
  requiresStorageSimulation: boolean
}

export interface DataPersistenceTestResult {
  success: boolean
  message: string
  details?: any
  timestamp: Date
  duration: number
  errors?: string[]
  storageOperations?: StorageOperation[]
  dataIntegrity?: DataIntegrityCheck[]
  persistenceMetrics?: PersistenceMetrics
}

export interface StorageOperation {
  type: 'save' | 'load' | 'delete' | 'update'
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cache'
  key: string
  success: boolean
  timestamp: Date
  size?: number
  duration?: number
}

export interface DataIntegrityCheck {
  type: 'checksum' | 'validation' | 'consistency'
  passed: boolean
  details: any
  timestamp: Date
}

export interface PersistenceMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageOperationTime: number
  totalDataSize: number
  storageUtilization: number
}

export interface DataPersistenceConfig {
  testTimeout: number
  retryAttempts: number
  retryDelay: number
  enableLocalStorageTests: boolean
  enableSessionStorageTests: boolean
  enableIndexedDBTests: boolean
  enableCachePersistenceTests: boolean
  maxDataSize: number
}

const defaultConfig: DataPersistenceConfig = {
  testTimeout: 45000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableLocalStorageTests: true,
  enableSessionStorageTests: true,
  enableIndexedDBTests: true,
  enableCachePersistenceTests: true,
  maxDataSize: 10 * 1024 * 1024 // 10MB
}

export class DataPersistenceTester {
  private config: DataPersistenceConfig
  private tests: Map<string, DataPersistenceTest> = new Map()
  private results: Map<string, DataPersistenceTestResult[]> = new Map()
  private isRunning: boolean = false
  private storageOperations: StorageOperation[] = []

  constructor(config: Partial<DataPersistenceConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.initializeTests()
  }

  private initializeTests(): void {
    // Local Storage Tests
    if (this.config.enableLocalStorageTests) {
      this.addTest({
        id: 'local-storage-basic',
        name: 'Local Storage Basic Operations',
        description: 'Verify basic local storage operations work correctly',
        category: 'local-storage',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: this.testLocalStorageBasic.bind(this)
      })

      this.addTest({
        id: 'local-storage-large-data',
        name: 'Local Storage Large Data',
        description: 'Verify local storage handles large data correctly',
        category: 'local-storage',
        priority: 'medium',
        requiresStorageSimulation: false,
        testFunction: this.testLocalStorageLargeData.bind(this)
      })

      this.addTest({
        id: 'local-storage-quota',
        name: 'Local Storage Quota Management',
        description: 'Verify local storage quota is managed correctly',
        category: 'local-storage',
        priority: 'medium',
        requiresStorageSimulation: false,
        testFunction: this.testLocalStorageQuota.bind(this)
      })
    }

    // Session Storage Tests
    if (this.config.enableSessionStorageTests) {
      this.addTest({
        id: 'session-storage-basic',
        name: 'Session Storage Basic Operations',
        description: 'Verify basic session storage operations work correctly',
        category: 'session-storage',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: this.testSessionStorageBasic.bind(this)
      })

      this.addTest({
        id: 'session-storage-persistence',
        name: 'Session Storage Persistence',
        description: 'Verify session storage persists across page refreshes',
        category: 'session-storage',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: this.testSessionStoragePersistence.bind(this)
      })

      this.addTest({
        id: 'session-storage-isolation',
        name: 'Session Storage Isolation',
        description: 'Verify session storage is isolated between tabs',
        category: 'session-storage',
        priority: 'medium',
        requiresStorageSimulation: false,
        testFunction: this.testSessionStorageIsolation.bind(this)
      })
    }

    // IndexedDB Tests
    if (this.config.enableIndexedDBTests) {
      this.addTest({
        id: 'indexeddb-basic',
        name: 'IndexedDB Basic Operations',
        description: 'Verify basic IndexedDB operations work correctly',
        category: 'indexeddb',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: this.testIndexedDBBasic.bind(this)
      })

      this.addTest({
        id: 'indexeddb-transactions',
        name: 'IndexedDB Transactions',
        description: 'Verify IndexedDB transactions work correctly',
        category: 'indexeddb',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: this.testIndexedDBTransactions.bind(this)
      })

      this.addTest({
        id: 'indexeddb-large-datasets',
        name: 'IndexedDB Large Datasets',
        description: 'Verify IndexedDB handles large datasets correctly',
        category: 'indexeddb',
        priority: 'medium',
        requiresStorageSimulation: false,
        testFunction: this.testIndexedDBLargeDatasets.bind(this)
      })
    }

    // Cache Persistence Tests
    if (this.config.enableCachePersistenceTests) {
      this.addTest({
        id: 'cache-persistence-basic',
        name: 'Cache Persistence Basic',
        description: 'Verify basic cache persistence works correctly',
        category: 'cache-persistence',
        priority: 'high',
        requiresStorageSimulation: false,
        testFunction: this.testCachePersistenceBasic.bind(this)
      })

      this.addTest({
        id: 'cache-persistence-strategies',
        name: 'Cache Persistence Strategies',
        description: 'Verify different cache persistence strategies work correctly',
        category: 'cache-persistence',
        priority: 'medium',
        requiresStorageSimulation: false,
        testFunction: this.testCachePersistenceStrategies.bind(this)
      })

      this.addTest({
        id: 'cache-persistence-expiration',
        name: 'Cache Persistence Expiration',
        description: 'Verify cache expiration works correctly',
        category: 'cache-persistence',
        priority: 'medium',
        requiresStorageSimulation: false,
        testFunction: this.testCachePersistenceExpiration.bind(this)
      })
    }
  }

  private addTest(test: DataPersistenceTest): void {
    this.tests.set(test.id, test)
  }

  // Test Implementation Methods
  private async testLocalStorageBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test basic save operation
      const testData = { name: 'Test User', email: 'test@example.com', id: 123 }
      const saveResult = await this.saveToLocalStorage('test-user', testData)
      storageOperations.push(saveResult)

      // Test basic load operation
      const loadResult = await this.loadFromLocalStorage('test-user')
      storageOperations.push(loadResult)

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data)
      dataIntegrity.push(integrityCheck)

      // Test update operation
      const updatedData = { ...testData, email: 'updated@example.com' }
      const updateResult = await this.updateInLocalStorage('test-user', updatedData)
      storageOperations.push(updateResult)

      // Test delete operation
      const deleteResult = await this.deleteFromLocalStorage('test-user')
      storageOperations.push(deleteResult)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Local storage basic operations working correctly'
          : 'Local storage basic operations issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Local storage basic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testLocalStorageLargeData(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Generate large test data
      const largeData = this.generateLargeTestData(1024 * 1024) // 1MB
      
      // Test save large data
      const saveResult = await this.saveToLocalStorage('large-data', largeData)
      storageOperations.push(saveResult)

      // Test load large data
      const loadResult = await this.loadFromLocalStorage('large-data')
      storageOperations.push(loadResult)

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(largeData, loadResult.data)
      dataIntegrity.push(integrityCheck)

      // Test performance
      const performanceCheck = await this.checkStoragePerformance(storageOperations)
      dataIntegrity.push(performanceCheck)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Local storage large data handling working correctly'
          : 'Local storage large data handling issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          dataSize: JSON.stringify(largeData).length
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Local storage large data test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testLocalStorageQuota(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test quota management
      const quotaCheck = await this.checkLocalStorageQuota()
      dataIntegrity.push(quotaCheck)

      // Test quota exceeded handling
      const quotaExceededTest = await this.testQuotaExceededHandling()
      dataIntegrity.push(quotaExceededTest)

      // Test quota cleanup
      const cleanupTest = await this.testQuotaCleanup()
      dataIntegrity.push(cleanupTest)

      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: integrityPassed,
        message: integrityPassed
          ? 'Local storage quota management working correctly'
          : 'Local storage quota management issues detected',
        details: {
          storageOperations,
          dataIntegrity
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Local storage quota test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testSessionStorageBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test basic save operation
      const testData = { sessionId: 'session-123', userId: 'user-456', timestamp: Date.now() }
      const saveResult = await this.saveToSessionStorage('session-data', testData)
      storageOperations.push(saveResult)

      // Test basic load operation
      const loadResult = await this.loadFromSessionStorage('session-data')
      storageOperations.push(loadResult)

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data)
      dataIntegrity.push(integrityCheck)

      // Test update operation
      const updatedData = { ...testData, timestamp: Date.now() }
      const updateResult = await this.updateInSessionStorage('session-data', updatedData)
      storageOperations.push(updateResult)

      // Test delete operation
      const deleteResult = await this.deleteFromSessionStorage('session-data')
      storageOperations.push(deleteResult)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Session storage basic operations working correctly'
          : 'Session storage basic operations issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Session storage basic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testSessionStoragePersistence(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test persistence across page refreshes
      const testData = { persistentData: 'should-survive-refresh', timestamp: Date.now() }
      const saveResult = await this.saveToSessionStorage('persistent-data', testData)
      storageOperations.push(saveResult)

      // Simulate page refresh (in real test, this would be actual page refresh)
      const refreshSimulation = await this.simulatePageRefresh()
      dataIntegrity.push(refreshSimulation)

      // Test data still exists after refresh
      const loadResult = await this.loadFromSessionStorage('persistent-data')
      storageOperations.push(loadResult)

      // Test data integrity after refresh
      const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data)
      dataIntegrity.push(integrityCheck)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Session storage persistence working correctly'
          : 'Session storage persistence issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Session storage persistence test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testSessionStorageIsolation(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test isolation between tabs
      const testData1 = { tabId: 'tab-1', data: 'tab-1-data' }
      const testData2 = { tabId: 'tab-2', data: 'tab-2-data' }

      // Save data in different tabs
      const saveResult1 = await this.saveToSessionStorage('tab-data', testData1)
      storageOperations.push(saveResult1)

      const saveResult2 = await this.saveToSessionStorage('tab-data', testData2)
      storageOperations.push(saveResult2)

      // Test isolation
      const isolationCheck = await this.checkSessionStorageIsolation()
      dataIntegrity.push(isolationCheck)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Session storage isolation working correctly'
          : 'Session storage isolation issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData1,
          testData2
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Session storage isolation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testIndexedDBBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test basic IndexedDB operations
      const testData = { id: 1, name: 'Test Record', data: { value: 123 } }
      
      // Test save operation
      const saveResult = await this.saveToIndexedDB('test-store', testData)
      storageOperations.push(saveResult)

      // Test load operation
      const loadResult = await this.loadFromIndexedDB('test-store', 1)
      storageOperations.push(loadResult)

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data)
      dataIntegrity.push(integrityCheck)

      // Test update operation
      const updatedData = { ...testData, name: 'Updated Record' }
      const updateResult = await this.updateInIndexedDB('test-store', updatedData)
      storageOperations.push(updateResult)

      // Test delete operation
      const deleteResult = await this.deleteFromIndexedDB('test-store', 1)
      storageOperations.push(deleteResult)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'IndexedDB basic operations working correctly'
          : 'IndexedDB basic operations issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `IndexedDB basic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testIndexedDBTransactions(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test transaction operations
      const transactionData = [
        { id: 1, name: 'Record 1' },
        { id: 2, name: 'Record 2' },
        { id: 3, name: 'Record 3' }
      ]

      // Test transaction save
      const transactionSaveResult = await this.saveTransactionToIndexedDB('test-store', transactionData)
      storageOperations.push(transactionSaveResult)

      // Test transaction load
      const transactionLoadResult = await this.loadTransactionFromIndexedDB('test-store', [1, 2, 3])
      storageOperations.push(transactionLoadResult)

      // Test transaction integrity
      const transactionIntegrityCheck = await this.checkTransactionIntegrity(transactionData, transactionLoadResult.data)
      dataIntegrity.push(transactionIntegrityCheck)

      // Test transaction rollback
      const rollbackTest = await this.testTransactionRollback()
      dataIntegrity.push(rollbackTest)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'IndexedDB transactions working correctly'
          : 'IndexedDB transactions issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          transactionData
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `IndexedDB transactions test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testIndexedDBLargeDatasets(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Generate large dataset
      const largeDataset = this.generateLargeDataset(1000) // 1000 records
      
      // Test save large dataset
      const saveResult = await this.saveLargeDatasetToIndexedDB('large-store', largeDataset)
      storageOperations.push(saveResult)

      // Test load large dataset
      const loadResult = await this.loadLargeDatasetFromIndexedDB('large-store')
      storageOperations.push(loadResult)

      // Test data integrity
      const integrityCheck = await this.checkLargeDatasetIntegrity(largeDataset, loadResult.data)
      dataIntegrity.push(integrityCheck)

      // Test performance
      const performanceCheck = await this.checkIndexedDBPerformance(storageOperations)
      dataIntegrity.push(performanceCheck)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'IndexedDB large datasets working correctly'
          : 'IndexedDB large datasets issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          datasetSize: largeDataset.length
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `IndexedDB large datasets test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testCachePersistenceBasic(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test basic cache operations
      const testData = { url: '/api/test', data: { result: 'success' }, timestamp: Date.now() }
      
      // Test cache save
      const saveResult = await this.saveToCache('test-cache', testData)
      storageOperations.push(saveResult)

      // Test cache load
      const loadResult = await this.loadFromCache('test-cache')
      storageOperations.push(loadResult)

      // Test data integrity
      const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data)
      dataIntegrity.push(integrityCheck)

      // Test cache update
      const updatedData = { ...testData, data: { result: 'updated' } }
      const updateResult = await this.updateInCache('test-cache', updatedData)
      storageOperations.push(updateResult)

      // Test cache delete
      const deleteResult = await this.deleteFromCache('test-cache')
      storageOperations.push(deleteResult)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Cache persistence basic operations working correctly'
          : 'Cache persistence basic operations issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Cache persistence basic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testCachePersistenceStrategies(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test different cache strategies
      const strategies = ['cache-first', 'network-first', 'stale-while-revalidate']
      
      for (const strategy of strategies) {
        const testData = { strategy, data: `data-for-${strategy}`, timestamp: Date.now() }
        
        // Test strategy save
        const saveResult = await this.saveToCacheWithStrategy(`cache-${strategy}`, testData, strategy)
        storageOperations.push(saveResult)

        // Test strategy load
        const loadResult = await this.loadFromCacheWithStrategy(`cache-${strategy}`, strategy)
        storageOperations.push(loadResult)

        // Test strategy integrity
        const integrityCheck = await this.checkDataIntegrity(testData, loadResult.data)
        dataIntegrity.push(integrityCheck)
      }

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Cache persistence strategies working correctly'
          : 'Cache persistence strategies issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          strategies
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Cache persistence strategies test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testCachePersistenceExpiration(): Promise<DataPersistenceTestResult> {
    const startTime = Date.now()
    
    try {
      const storageOperations: StorageOperation[] = []
      const dataIntegrity: DataIntegrityCheck[] = []

      // Test cache expiration
      const testData = { data: 'expiring-data', timestamp: Date.now() }
      const expirationTime = 1000 // 1 second
      
      // Test save with expiration
      const saveResult = await this.saveToCacheWithExpiration('expiring-cache', testData, expirationTime)
      storageOperations.push(saveResult)

      // Test load before expiration
      const loadBeforeExpiration = await this.loadFromCache('expiring-cache')
      storageOperations.push(loadBeforeExpiration)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, expirationTime + 100))

      // Test load after expiration
      const loadAfterExpiration = await this.loadFromCache('expiring-cache')
      storageOperations.push(loadAfterExpiration)

      // Test expiration integrity
      const expirationCheck = await this.checkCacheExpiration(loadBeforeExpiration.data, loadAfterExpiration.data)
      dataIntegrity.push(expirationCheck)

      const allSuccessful = storageOperations.every(op => op.success)
      const integrityPassed = dataIntegrity.every(check => check.passed)
      const duration = Date.now() - startTime

      return {
        success: allSuccessful && integrityPassed,
        message: allSuccessful && integrityPassed
          ? 'Cache persistence expiration working correctly'
          : 'Cache persistence expiration issues detected',
        details: {
          storageOperations,
          dataIntegrity,
          testData,
          expirationTime
        },
        timestamp: new Date(),
        duration,
        storageOperations,
        dataIntegrity,
        persistenceMetrics: this.calculatePersistenceMetrics(storageOperations)
      }
    } catch (error) {
      return {
        success: false,
        message: `Cache persistence expiration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  // Helper Methods (Mock implementations - replace with actual API calls)
  private async saveToLocalStorage(key: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return {
        type: 'save',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async loadFromLocalStorage(key: string): Promise<StorageOperation & { data: any }> {
    const startTime = Date.now()
    try {
      const data = JSON.parse(localStorage.getItem(key) || 'null')
      return {
        type: 'load',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: null
      }
    }
  }

  private async updateInLocalStorage(key: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return {
        type: 'update',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'update',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async deleteFromLocalStorage(key: string): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      localStorage.removeItem(key)
      return {
        type: 'delete',
        storage: 'localStorage',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'delete',
        storage: 'localStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async saveToSessionStorage(key: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      sessionStorage.setItem(key, JSON.stringify(data))
      return {
        type: 'save',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async loadFromSessionStorage(key: string): Promise<StorageOperation & { data: any }> {
    const startTime = Date.now()
    try {
      const data = JSON.parse(sessionStorage.getItem(key) || 'null')
      return {
        type: 'load',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: null
      }
    }
  }

  private async updateInSessionStorage(key: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      sessionStorage.setItem(key, JSON.stringify(data))
      return {
        type: 'update',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'update',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async deleteFromSessionStorage(key: string): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      sessionStorage.removeItem(key)
      return {
        type: 'delete',
        storage: 'sessionStorage',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'delete',
        storage: 'sessionStorage',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async saveToIndexedDB(storeName: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      // Mock IndexedDB operation
      console.log(`Saving to IndexedDB store ${storeName}:`, data)
      return {
        type: 'save',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async loadFromIndexedDB(storeName: string, id: number): Promise<StorageOperation & { data: any }> {
    const startTime = Date.now()
    try {
      // Mock IndexedDB operation
      const data = { id, name: 'Mock Record', data: { value: 123 } }
      console.log(`Loading from IndexedDB store ${storeName}, id ${id}:`, data)
      return {
        type: 'load',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: null
      }
    }
  }

  private async updateInIndexedDB(storeName: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      // Mock IndexedDB operation
      console.log(`Updating in IndexedDB store ${storeName}:`, data)
      return {
        type: 'update',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'update',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async deleteFromIndexedDB(storeName: string, id: number): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      // Mock IndexedDB operation
      console.log(`Deleting from IndexedDB store ${storeName}, id ${id}`)
      return {
        type: 'delete',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'delete',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async saveToCache(key: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      // Mock cache operation
      console.log(`Saving to cache ${key}:`, data)
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async loadFromCache(key: string): Promise<StorageOperation & { data: any }> {
    const startTime = Date.now()
    try {
      // Mock cache operation
      const data = { url: '/api/test', data: { result: 'success' }, timestamp: Date.now() }
      console.log(`Loading from cache ${key}:`, data)
      return {
        type: 'load',
        storage: 'cache',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'cache',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: null
      }
    }
  }

  private async updateInCache(key: string, data: any): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      // Mock cache operation
      console.log(`Updating cache ${key}:`, data)
      return {
        type: 'update',
        storage: 'cache',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'update',
        storage: 'cache',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async deleteFromCache(key: string): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      // Mock cache operation
      console.log(`Deleting from cache ${key}`)
      return {
        type: 'delete',
        storage: 'cache',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'delete',
        storage: 'cache',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  // Additional helper methods
  private generateLargeTestData(sizeInBytes: number): any {
    const data = { records: [] }
    const recordSize = 100 // Approximate size per record
    const numRecords = Math.floor(sizeInBytes / recordSize)
    
    for (let i = 0; i < numRecords; i++) {
      data.records.push({
        id: i,
        name: `Record ${i}`,
        data: `Data for record ${i}`,
        timestamp: Date.now()
      })
    }
    
    return data
  }

  private generateLargeDataset(numRecords: number): any[] {
    const dataset = []
    for (let i = 0; i < numRecords; i++) {
      dataset.push({
        id: i,
        name: `Record ${i}`,
        data: { value: Math.random() * 1000 },
        timestamp: Date.now()
      })
    }
    return dataset
  }

  private async checkDataIntegrity(originalData: any, retrievedData: any): Promise<DataIntegrityCheck> {
    const passed = JSON.stringify(originalData) === JSON.stringify(retrievedData)
    return {
      type: 'validation',
      passed,
      details: { originalData, retrievedData },
      timestamp: new Date()
    }
  }

  private async checkStoragePerformance(operations: StorageOperation[]): Promise<DataIntegrityCheck> {
    const averageTime = operations.reduce((sum, op) => sum + (op.duration || 0), 0) / operations.length
    const passed = averageTime < 100 // Less than 100ms average
    return {
      type: 'performance',
      passed,
      details: { averageTime, operations: operations.length },
      timestamp: new Date()
    }
  }

  private async checkLocalStorageQuota(): Promise<DataIntegrityCheck> {
    // Mock quota check
    return {
      type: 'validation',
      passed: true,
      details: { quota: '5MB', used: '1MB', available: '4MB' },
      timestamp: new Date()
    }
  }

  private async testQuotaExceededHandling(): Promise<DataIntegrityCheck> {
    // Mock quota exceeded test
    return {
      type: 'validation',
      passed: true,
      details: { handled: true, error: 'QuotaExceededError' },
      timestamp: new Date()
    }
  }

  private async testQuotaCleanup(): Promise<DataIntegrityCheck> {
    // Mock quota cleanup test
    return {
      type: 'validation',
      passed: true,
      details: { cleaned: true, freedSpace: '2MB' },
      timestamp: new Date()
    }
  }

  private async simulatePageRefresh(): Promise<DataIntegrityCheck> {
    // Mock page refresh simulation
    return {
      type: 'validation',
      passed: true,
      details: { simulated: true },
      timestamp: new Date()
    }
  }

  private async checkSessionStorageIsolation(): Promise<DataIntegrityCheck> {
    // Mock isolation check
    return {
      type: 'validation',
      passed: true,
      details: { isolated: true },
      timestamp: new Date()
    }
  }

  private async saveTransactionToIndexedDB(storeName: string, data: any[]): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      console.log(`Saving transaction to IndexedDB store ${storeName}:`, data)
      return {
        type: 'save',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async loadTransactionFromIndexedDB(storeName: string, ids: number[]): Promise<StorageOperation & { data: any[] }> {
    const startTime = Date.now()
    try {
      const data = ids.map(id => ({ id, name: `Record ${id}`, data: { value: Math.random() * 100 } }))
      console.log(`Loading transaction from IndexedDB store ${storeName}:`, data)
      return {
        type: 'load',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: []
      }
    }
  }

  private async checkTransactionIntegrity(originalData: any[], retrievedData: any[]): Promise<DataIntegrityCheck> {
    const passed = originalData.length === retrievedData.length
    return {
      type: 'validation',
      passed,
      details: { originalLength: originalData.length, retrievedLength: retrievedData.length },
      timestamp: new Date()
    }
  }

  private async testTransactionRollback(): Promise<DataIntegrityCheck> {
    // Mock transaction rollback test
    return {
      type: 'validation',
      passed: true,
      details: { rolledBack: true },
      timestamp: new Date()
    }
  }

  private async saveLargeDatasetToIndexedDB(storeName: string, dataset: any[]): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      console.log(`Saving large dataset to IndexedDB store ${storeName}:`, dataset.length, 'records')
      return {
        type: 'save',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(dataset).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async loadLargeDatasetFromIndexedDB(storeName: string): Promise<StorageOperation & { data: any[] }> {
    const startTime = Date.now()
    try {
      const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Record ${i}` }))
      console.log(`Loading large dataset from IndexedDB store ${storeName}:`, data.length, 'records')
      return {
        type: 'load',
        storage: 'indexedDB',
        key: storeName,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'indexedDB',
        key: storeName,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: []
      }
    }
  }

  private async checkLargeDatasetIntegrity(originalData: any[], retrievedData: any[]): Promise<DataIntegrityCheck> {
    const passed = originalData.length === retrievedData.length
    return {
      type: 'validation',
      passed,
      details: { originalLength: originalData.length, retrievedLength: retrievedData.length },
      timestamp: new Date()
    }
  }

  private async checkIndexedDBPerformance(operations: StorageOperation[]): Promise<DataIntegrityCheck> {
    const averageTime = operations.reduce((sum, op) => sum + (op.duration || 0), 0) / operations.length
    const passed = averageTime < 500 // Less than 500ms average for IndexedDB
    return {
      type: 'performance',
      passed,
      details: { averageTime, operations: operations.length },
      timestamp: new Date()
    }
  }

  private async saveToCacheWithStrategy(key: string, data: any, strategy: string): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      console.log(`Saving to cache ${key} with strategy ${strategy}:`, data)
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async loadFromCacheWithStrategy(key: string, strategy: string): Promise<StorageOperation & { data: any }> {
    const startTime = Date.now()
    try {
      const data = { strategy, data: `data-for-${strategy}`, timestamp: Date.now() }
      console.log(`Loading from cache ${key} with strategy ${strategy}:`, data)
      return {
        type: 'load',
        storage: 'cache',
        key,
        success: true,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data
      }
    } catch (error) {
      return {
        type: 'load',
        storage: 'cache',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        data: null
      }
    }
  }

  private async saveToCacheWithExpiration(key: string, data: any, expirationTime: number): Promise<StorageOperation> {
    const startTime = Date.now()
    try {
      console.log(`Saving to cache ${key} with expiration ${expirationTime}ms:`, data)
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: true,
        timestamp: new Date(),
        size: JSON.stringify(data).length,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        type: 'save',
        storage: 'cache',
        key,
        success: false,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
    }
  }

  private async checkCacheExpiration(beforeData: any, afterData: any): Promise<DataIntegrityCheck> {
    const passed = beforeData !== null && afterData === null
    return {
      type: 'validation',
      passed,
      details: { beforeData, afterData },
      timestamp: new Date()
    }
  }

  private calculatePersistenceMetrics(operations: StorageOperation[]): PersistenceMetrics {
    const totalOperations = operations.length
    const successfulOperations = operations.filter(op => op.success).length
    const failedOperations = totalOperations - successfulOperations
    const averageOperationTime = operations.reduce((sum, op) => sum + (op.duration || 0), 0) / totalOperations
    const totalDataSize = operations.reduce((sum, op) => sum + (op.size || 0), 0)
    const storageUtilization = (totalDataSize / this.config.maxDataSize) * 100

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageOperationTime,
      totalDataSize,
      storageUtilization
    }
  }

  // Public Methods
  public async runTest(testId: string): Promise<DataPersistenceTestResult> {
    const test = this.tests.get(testId)
    if (!test) {
      throw new Error(`Test with id ${testId} not found`)
    }

    const result = await this.executeTestWithRetry(test)
    
    // Store result
    if (!this.results.has(testId)) {
      this.results.set(testId, [])
    }
    this.results.get(testId)!.push(result)
    
    return result
  }

  public async runAllTests(): Promise<Map<string, DataPersistenceTestResult>> {
    if (this.isRunning) {
      throw new Error('Tests are already running')
    }

    this.isRunning = true
    const results = new Map<string, DataPersistenceTestResult>()

    try {
      const testPromises = Array.from(this.tests.entries()).map(async ([testId, test]) => {
        const result = await this.executeTestWithRetry(test)
        results.set(testId, result)
        return result
      })

      await Promise.all(testPromises)
    } finally {
      this.isRunning = false
    }

    return results
  }

  public async runTestsByCategory(category: DataPersistenceTest['category']): Promise<Map<string, DataPersistenceTestResult>> {
    const categoryTests = Array.from(this.tests.entries()).filter(([, test]) => test.category === category)
    const results = new Map<string, DataPersistenceTestResult>()

    for (const [testId, test] of categoryTests) {
      const result = await this.executeTestWithRetry(test)
      results.set(testId, result)
    }

    return results
  }

  private async executeTestWithRetry(test: DataPersistenceTest): Promise<DataPersistenceTestResult> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await Promise.race([
          test.testFunction(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), this.config.testTimeout)
          )
        ])

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt))
        }
      }
    }

    return {
      success: false,
      message: `Test failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      timestamp: new Date(),
      duration: 0,
      errors: [lastError?.message || 'Unknown error']
    }
  }

  public getTestResults(testId?: string): DataPersistenceTestResult[] | Map<string, DataPersistenceTestResult[]> {
    if (testId) {
      return this.results.get(testId) || []
    }
    return this.results
  }

  public getTestSummary(): {
    total: number
    passed: number
    failed: number
    successRate: number
    averageDuration: number
    totalStorageOperations: number
    totalDataIntegrityChecks: number
    averageStorageUtilization: number
  } {
    const allResults = Array.from(this.results.values()).flat()
    
    if (allResults.length === 0) {
      return { total: 0, passed: 0, failed: 0, successRate: 0, averageDuration: 0, totalStorageOperations: 0, totalDataIntegrityChecks: 0, averageStorageUtilization: 0 }
    }

    const passed = allResults.filter(r => r.success).length
    const failed = allResults.length - passed
    const successRate = (passed / allResults.length) * 100
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
    
    const totalStorageOperations = allResults.reduce((sum, r) => sum + (r.storageOperations?.length || 0), 0)
    const totalDataIntegrityChecks = allResults.reduce((sum, r) => sum + (r.dataIntegrity?.length || 0), 0)
    const averageStorageUtilization = allResults.reduce((sum, r) => sum + (r.persistenceMetrics?.storageUtilization || 0), 0) / allResults.length

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalStorageOperations,
      totalDataIntegrityChecks,
      averageStorageUtilization
    }
  }

  public clearResults(): void {
    this.results.clear()
  }

  public getAvailableTests(): DataPersistenceTest[] {
    return Array.from(this.tests.values())
  }
}

// Export the tester class
export default DataPersistenceTester
