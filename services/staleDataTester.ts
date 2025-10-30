// Stale Data Detection Testing
// Comprehensive testing suite for verifying stale data detection after reconnection

import React from 'react'

export interface StaleDataTest {
  id: string
  name: string
  description: string
  testFunction: () => Promise<StaleDataTestResult>
  category: 'timestamp-based' | 'version-based' | 'checksum-based' | 'hybrid-detection'
  priority: 'high' | 'medium' | 'low'
  requiresNetworkSimulation: boolean
}

export interface StaleDataTestResult {
  success: boolean
  message: string
  details?: any
  timestamp: Date
  duration: number
  errors?: string[]
  staleDataDetected?: StaleDataInfo[]
  freshnessChecks?: FreshnessCheck[]
  refreshActions?: RefreshAction[]
}

export interface StaleDataInfo {
  type: 'timestamp' | 'version' | 'checksum' | 'content'
  dataKey: string
  staleThreshold: number
  actualAge: number
  detected: boolean
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
}

export interface FreshnessCheck {
  dataKey: string
  lastModified: Date
  currentTime: Date
  age: number
  isFresh: boolean
  threshold: number
  timestamp: Date
}

export interface RefreshAction {
  type: 'auto-refresh' | 'user-prompt' | 'background-sync' | 'force-refresh'
  dataKey: string
  success: boolean
  timestamp: Date
  details?: any
}

export interface StaleDataConfig {
  testTimeout: number
  retryAttempts: number
  retryDelay: number
  enableTimestampTests: boolean
  enableVersionTests: boolean
  enableChecksumTests: boolean
  enableHybridTests: boolean
  staleThresholds: {
    low: number
    medium: number
    high: number
  }
}

const defaultConfig: StaleDataConfig = {
  testTimeout: 45000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableTimestampTests: true,
  enableVersionTests: true,
  enableChecksumTests: true,
  enableHybridTests: true,
  staleThresholds: {
    low: 300000, // 5 minutes
    medium: 900000, // 15 minutes
    high: 3600000 // 1 hour
  }
}

export class StaleDataTester {
  private config: StaleDataConfig
  private tests: Map<string, StaleDataTest> = new Map()
  private results: Map<string, StaleDataTestResult[]> = new Map()
  private isRunning: boolean = false
  private dataCache: Map<string, any> = new Map()

  constructor(config: Partial<StaleDataConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.initializeTests()
  }

  private initializeTests(): void {
    // Timestamp-based Tests
    if (this.config.enableTimestampTests) {
      this.addTest({
        id: 'timestamp-stale-detection',
        name: 'Timestamp-based Stale Data Detection',
        description: 'Verify stale data detection based on timestamps',
        category: 'timestamp-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: this.testTimestampStaleDetection.bind(this)
      })

      this.addTest({
        id: 'timestamp-threshold-detection',
        name: 'Timestamp Threshold Detection',
        description: 'Verify different stale thresholds are detected correctly',
        category: 'timestamp-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: this.testTimestampThresholdDetection.bind(this)
      })

      this.addTest({
        id: 'timestamp-refresh-detection',
        name: 'Timestamp Refresh Detection',
        description: 'Verify data refresh updates timestamps correctly',
        category: 'timestamp-based',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: this.testTimestampRefreshDetection.bind(this)
      })
    }

    // Version-based Tests
    if (this.config.enableVersionTests) {
      this.addTest({
        id: 'version-stale-detection',
        name: 'Version-based Stale Data Detection',
        description: 'Verify stale data detection based on version numbers',
        category: 'version-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: this.testVersionStaleDetection.bind(this)
      })

      this.addTest({
        id: 'version-conflict-detection',
        name: 'Version Conflict Detection',
        description: 'Verify version conflicts are detected correctly',
        category: 'version-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: this.testVersionConflictDetection.bind(this)
      })

      this.addTest({
        id: 'version-sync-detection',
        name: 'Version Sync Detection',
        description: 'Verify version synchronization works correctly',
        category: 'version-based',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: this.testVersionSyncDetection.bind(this)
      })
    }

    // Checksum-based Tests
    if (this.config.enableChecksumTests) {
      this.addTest({
        id: 'checksum-stale-detection',
        name: 'Checksum-based Stale Data Detection',
        description: 'Verify stale data detection based on checksums',
        category: 'checksum-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: this.testChecksumStaleDetection.bind(this)
      })

      this.addTest({
        id: 'checksum-integrity-detection',
        name: 'Checksum Integrity Detection',
        description: 'Verify data integrity using checksums',
        category: 'checksum-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: this.testChecksumIntegrityDetection.bind(this)
      })

      this.addTest({
        id: 'checksum-performance-detection',
        name: 'Checksum Performance Detection',
        description: 'Verify checksum calculation performance',
        category: 'checksum-based',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: this.testChecksumPerformanceDetection.bind(this)
      })
    }

    // Hybrid Detection Tests
    if (this.config.enableHybridTests) {
      this.addTest({
        id: 'hybrid-stale-detection',
        name: 'Hybrid Stale Data Detection',
        description: 'Verify hybrid stale data detection using multiple methods',
        category: 'hybrid-detection',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: this.testHybridStaleDetection.bind(this)
      })

      this.addTest({
        id: 'hybrid-priority-detection',
        name: 'Hybrid Priority Detection',
        description: 'Verify hybrid detection prioritizes different methods correctly',
        category: 'hybrid-detection',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: this.testHybridPriorityDetection.bind(this)
      })

      this.addTest({
        id: 'hybrid-fallback-detection',
        name: 'Hybrid Fallback Detection',
        description: 'Verify hybrid detection falls back to alternative methods',
        category: 'hybrid-detection',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: this.testHybridFallbackDetection.bind(this)
      })
    }
  }

  private addTest(test: StaleDataTest): void {
    this.tests.set(test.id, test)
  }

  // Test Implementation Methods
  private async testTimestampStaleDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const freshnessChecks: FreshnessCheck[] = []
      const refreshActions: RefreshAction[] = []

      // Test data with different ages
      const testData = [
        { key: 'fresh-data', age: 60000, threshold: this.config.staleThresholds.low }, // 1 minute old
        { key: 'stale-data', age: 600000, threshold: this.config.staleThresholds.low }, // 10 minutes old
        { key: 'very-stale-data', age: 1800000, threshold: this.config.staleThresholds.low } // 30 minutes old
      ]

      for (const data of testData) {
        // Simulate data with specific age
        const lastModified = new Date(Date.now() - data.age)
        await this.simulateDataWithTimestamp(data.key, lastModified)

        // Check freshness
        const freshnessCheck = await this.checkDataFreshness(data.key, data.threshold)
        freshnessChecks.push(freshnessCheck)

        // Detect stale data
        const staleDetection = await this.detectStaleDataByTimestamp(data.key, data.threshold)
        if (staleDetection.detected) {
          staleDataDetected.push(staleDetection)
        }

        // Perform refresh action if stale
        if (staleDetection.detected) {
          const refreshAction = await this.performRefreshAction(data.key, 'auto-refresh')
          refreshActions.push(refreshAction)
        }
      }

      const allDetected = staleDataDetected.length === 2 // Should detect 2 stale items
      const duration = Date.now() - startTime

      return {
        success: allDetected,
        message: allDetected
          ? 'Timestamp-based stale data detection working correctly'
          : 'Timestamp-based stale data detection issues detected',
        details: {
          testData,
          staleDataDetected,
          freshnessChecks,
          refreshActions
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        freshnessChecks,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Timestamp stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testTimestampThresholdDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const freshnessChecks: FreshnessCheck[] = []

      // Test different thresholds
      const thresholds = [
        { level: 'low', threshold: this.config.staleThresholds.low },
        { level: 'medium', threshold: this.config.staleThresholds.medium },
        { level: 'high', threshold: this.config.staleThresholds.high }
      ]

      for (const threshold of thresholds) {
        const testData = { key: `data-${threshold.level}`, age: threshold.threshold + 60000 } // Just over threshold
        const lastModified = new Date(Date.now() - testData.age)
        
        await this.simulateDataWithTimestamp(testData.key, lastModified)

        // Check freshness with specific threshold
        const freshnessCheck = await this.checkDataFreshness(testData.key, threshold.threshold)
        freshnessChecks.push(freshnessCheck)

        // Detect stale data
        const staleDetection = await this.detectStaleDataByTimestamp(testData.key, threshold.threshold)
        if (staleDetection.detected) {
          staleDataDetected.push(staleDetection)
        }
      }

      const allThresholdsWorking = staleDataDetected.length === 3
      const duration = Date.now() - startTime

      return {
        success: allThresholdsWorking,
        message: allThresholdsWorking
          ? 'Timestamp threshold detection working correctly'
          : 'Timestamp threshold detection issues detected',
        details: {
          thresholds,
          staleDataDetected,
          freshnessChecks
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        freshnessChecks
      }
    } catch (error) {
      return {
        success: false,
        message: `Timestamp threshold detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testTimestampRefreshDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const refreshActions: RefreshAction[] = []

      // Test data refresh
      const testData = { key: 'refresh-test-data', age: 600000 } // 10 minutes old
      const lastModified = new Date(Date.now() - testData.age)
      
      await this.simulateDataWithTimestamp(testData.key, lastModified)

      // Detect stale data
      const staleDetection = await this.detectStaleDataByTimestamp(testData.key, this.config.staleThresholds.low)
      if (staleDetection.detected) {
        staleDataDetected.push(staleDetection)
      }

      // Perform refresh
      const refreshAction = await this.performRefreshAction(testData.key, 'auto-refresh')
      refreshActions.push(refreshAction)

      // Check if data is fresh after refresh
      const freshCheck = await this.checkDataFreshness(testData.key, this.config.staleThresholds.low)
      const isFreshAfterRefresh = freshCheck.isFresh

      const refreshWorking = refreshAction.success && isFreshAfterRefresh
      const duration = Date.now() - startTime

      return {
        success: refreshWorking,
        message: refreshWorking
          ? 'Timestamp refresh detection working correctly'
          : 'Timestamp refresh detection issues detected',
        details: {
          testData,
          staleDataDetected,
          refreshActions,
          isFreshAfterRefresh
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Timestamp refresh detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testVersionStaleDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const freshnessChecks: FreshnessCheck[] = []

      // Test data with different versions
      const testData = [
        { key: 'version-data-1', localVersion: 1, serverVersion: 1 },
        { key: 'version-data-2', localVersion: 1, serverVersion: 2 },
        { key: 'version-data-3', localVersion: 2, serverVersion: 3 }
      ]

      for (const data of testData) {
        // Simulate data with specific versions
        await this.simulateDataWithVersion(data.key, data.localVersion, data.serverVersion)

        // Check version freshness
        const freshnessCheck = await this.checkVersionFreshness(data.key, data.localVersion, data.serverVersion)
        freshnessChecks.push(freshnessCheck)

        // Detect stale data by version
        const staleDetection = await this.detectStaleDataByVersion(data.key, data.localVersion, data.serverVersion)
        if (staleDetection.detected) {
          staleDataDetected.push(staleDetection)
        }
      }

      const allDetected = staleDataDetected.length === 2 // Should detect 2 stale items
      const duration = Date.now() - startTime

      return {
        success: allDetected,
        message: allDetected
          ? 'Version-based stale data detection working correctly'
          : 'Version-based stale data detection issues detected',
        details: {
          testData,
          staleDataDetected,
          freshnessChecks
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        freshnessChecks
      }
    } catch (error) {
      return {
        success: false,
        message: `Version stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testVersionConflictDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const refreshActions: RefreshAction[] = []

      // Test version conflicts
      const testData = { key: 'conflict-data', localVersion: 2, serverVersion: 3 }
      
      await this.simulateDataWithVersion(testData.key, testData.localVersion, testData.serverVersion)

      // Detect version conflict
      const conflictDetection = await this.detectVersionConflict(testData.key, testData.localVersion, testData.serverVersion)
      if (conflictDetection.detected) {
        staleDataDetected.push(conflictDetection)
      }

      // Resolve conflict
      const conflictResolution = await this.resolveVersionConflict(testData.key, testData.localVersion, testData.serverVersion)
      refreshActions.push(conflictResolution)

      const conflictResolved = conflictResolution.success
      const duration = Date.now() - startTime

      return {
        success: conflictResolved,
        message: conflictResolved
          ? 'Version conflict detection working correctly'
          : 'Version conflict detection issues detected',
        details: {
          testData,
          staleDataDetected,
          refreshActions
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Version conflict detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testVersionSyncDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const refreshActions: RefreshAction[] = []

      // Test version synchronization
      const testData = { key: 'sync-data', localVersion: 1, serverVersion: 2 }
      
      await this.simulateDataWithVersion(testData.key, testData.localVersion, testData.serverVersion)

      // Detect version sync needed
      const syncDetection = await this.detectVersionSyncNeeded(testData.key, testData.localVersion, testData.serverVersion)
      if (syncDetection.detected) {
        staleDataDetected.push(syncDetection)
      }

      // Perform version sync
      const syncAction = await this.performVersionSync(testData.key, testData.localVersion, testData.serverVersion)
      refreshActions.push(syncAction)

      // Verify sync success
      const syncVerification = await this.verifyVersionSync(testData.key, testData.serverVersion)
      const syncSuccessful = syncVerification.success

      const syncWorking = syncAction.success && syncSuccessful
      const duration = Date.now() - startTime

      return {
        success: syncWorking,
        message: syncWorking
          ? 'Version sync detection working correctly'
          : 'Version sync detection issues detected',
        details: {
          testData,
          staleDataDetected,
          refreshActions,
          syncVerification
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Version sync detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testChecksumStaleDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const freshnessChecks: FreshnessCheck[] = []

      // Test data with different checksums
      const testData = [
        { key: 'checksum-data-1', localChecksum: 'abc123', serverChecksum: 'abc123' },
        { key: 'checksum-data-2', localChecksum: 'abc123', serverChecksum: 'def456' },
        { key: 'checksum-data-3', localChecksum: 'def456', serverChecksum: 'ghi789' }
      ]

      for (const data of testData) {
        // Simulate data with specific checksums
        await this.simulateDataWithChecksum(data.key, data.localChecksum, data.serverChecksum)

        // Check checksum freshness
        const freshnessCheck = await this.checkChecksumFreshness(data.key, data.localChecksum, data.serverChecksum)
        freshnessChecks.push(freshnessCheck)

        // Detect stale data by checksum
        const staleDetection = await this.detectStaleDataByChecksum(data.key, data.localChecksum, data.serverChecksum)
        if (staleDetection.detected) {
          staleDataDetected.push(staleDetection)
        }
      }

      const allDetected = staleDataDetected.length === 2 // Should detect 2 stale items
      const duration = Date.now() - startTime

      return {
        success: allDetected,
        message: allDetected
          ? 'Checksum-based stale data detection working correctly'
          : 'Checksum-based stale data detection issues detected',
        details: {
          testData,
          staleDataDetected,
          freshnessChecks
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        freshnessChecks
      }
    } catch (error) {
      return {
        success: false,
        message: `Checksum stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testChecksumIntegrityDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const refreshActions: RefreshAction[] = []

      // Test data integrity
      const testData = { key: 'integrity-data', localChecksum: 'abc123', serverChecksum: 'def456' }
      
      await this.simulateDataWithChecksum(testData.key, testData.localChecksum, testData.serverChecksum)

      // Detect integrity issues
      const integrityDetection = await this.detectDataIntegrityIssues(testData.key, testData.localChecksum, testData.serverChecksum)
      if (integrityDetection.detected) {
        staleDataDetected.push(integrityDetection)
      }

      // Repair integrity
      const repairAction = await this.repairDataIntegrity(testData.key, testData.localChecksum, testData.serverChecksum)
      refreshActions.push(repairAction)

      // Verify integrity repair
      const integrityVerification = await this.verifyDataIntegrity(testData.key, testData.serverChecksum)
      const integrityRepaired = integrityVerification.success

      const integrityWorking = repairAction.success && integrityRepaired
      const duration = Date.now() - startTime

      return {
        success: integrityWorking,
        message: integrityWorking
          ? 'Checksum integrity detection working correctly'
          : 'Checksum integrity detection issues detected',
        details: {
          testData,
          staleDataDetected,
          refreshActions,
          integrityVerification
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Checksum integrity detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testChecksumPerformanceDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const refreshActions: RefreshAction[] = []

      // Test checksum performance
      const testData = { key: 'performance-data', size: 1024 * 1024 } // 1MB
      
      await this.simulateLargeDataWithChecksum(testData.key, testData.size)

      // Test checksum calculation performance
      const performanceTest = await this.testChecksumCalculationPerformance(testData.key, testData.size)
      refreshActions.push(performanceTest)

      // Test checksum comparison performance
      const comparisonTest = await this.testChecksumComparisonPerformance(testData.key)
      refreshActions.push(comparisonTest)

      const performanceAcceptable = performanceTest.success && comparisonTest.success
      const duration = Date.now() - startTime

      return {
        success: performanceAcceptable,
        message: performanceAcceptable
          ? 'Checksum performance detection working correctly'
          : 'Checksum performance detection issues detected',
        details: {
          testData,
          staleDataDetected,
          refreshActions
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Checksum performance detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testHybridStaleDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const freshnessChecks: FreshnessCheck[] = []
      const refreshActions: RefreshAction[] = []

      // Test hybrid detection
      const testData = { 
        key: 'hybrid-data', 
        timestamp: new Date(Date.now() - 600000), // 10 minutes old
        version: { local: 1, server: 2 },
        checksum: { local: 'abc123', server: 'def456' }
      }
      
      await this.simulateDataWithHybridMetadata(testData.key, testData.timestamp, testData.version, testData.checksum)

      // Test hybrid freshness check
      const hybridFreshnessCheck = await this.checkHybridDataFreshness(testData.key, testData.timestamp, testData.version, testData.checksum)
      freshnessChecks.push(hybridFreshnessCheck)

      // Test hybrid stale detection
      const hybridStaleDetection = await this.detectStaleDataByHybrid(testData.key, testData.timestamp, testData.version, testData.checksum)
      if (hybridStaleDetection.detected) {
        staleDataDetected.push(hybridStaleDetection)
      }

      // Test hybrid refresh
      const hybridRefreshAction = await this.performHybridRefresh(testData.key, testData.timestamp, testData.version, testData.checksum)
      refreshActions.push(hybridRefreshAction)

      const hybridWorking = hybridStaleDetection.detected && hybridRefreshAction.success
      const duration = Date.now() - startTime

      return {
        success: hybridWorking,
        message: hybridWorking
          ? 'Hybrid stale data detection working correctly'
          : 'Hybrid stale data detection issues detected',
        details: {
          testData,
          staleDataDetected,
          freshnessChecks,
          refreshActions
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        freshnessChecks,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Hybrid stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testHybridPriorityDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const refreshActions: RefreshAction[] = []

      // Test priority detection
      const testData = { 
        key: 'priority-data', 
        timestamp: new Date(Date.now() - 600000), // 10 minutes old
        version: { local: 1, server: 1 }, // Same version
        checksum: { local: 'abc123', server: 'def456' } // Different checksum
      }
      
      await this.simulateDataWithHybridMetadata(testData.key, testData.timestamp, testData.version, testData.checksum)

      // Test priority detection
      const priorityDetection = await this.detectStaleDataByPriority(testData.key, testData.timestamp, testData.version, testData.checksum)
      if (priorityDetection.detected) {
        staleDataDetected.push(priorityDetection)
      }

      // Test priority-based refresh
      const priorityRefreshAction = await this.performPriorityBasedRefresh(testData.key, testData.timestamp, testData.version, testData.checksum)
      refreshActions.push(priorityRefreshAction)

      const priorityWorking = priorityDetection.detected && priorityRefreshAction.success
      const duration = Date.now() - startTime

      return {
        success: priorityWorking,
        message: priorityWorking
          ? 'Hybrid priority detection working correctly'
          : 'Hybrid priority detection issues detected',
        details: {
          testData,
          staleDataDetected,
          refreshActions
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Hybrid priority detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testHybridFallbackDetection(): Promise<StaleDataTestResult> {
    const startTime = Date.now()
    
    try {
      const staleDataDetected: StaleDataInfo[] = []
      const refreshActions: RefreshAction[] = []

      // Test fallback detection
      const testData = { 
        key: 'fallback-data', 
        timestamp: new Date(Date.now() - 600000), // 10 minutes old
        version: { local: 1, server: 1 }, // Same version
        checksum: { local: 'abc123', server: 'abc123' } // Same checksum
      }
      
      await this.simulateDataWithHybridMetadata(testData.key, testData.timestamp, testData.version, testData.checksum)

      // Test fallback detection
      const fallbackDetection = await this.detectStaleDataByFallback(testData.key, testData.timestamp, testData.version, testData.checksum)
      if (fallbackDetection.detected) {
        staleDataDetected.push(fallbackDetection)
      }

      // Test fallback refresh
      const fallbackRefreshAction = await this.performFallbackRefresh(testData.key, testData.timestamp, testData.version, testData.checksum)
      refreshActions.push(fallbackRefreshAction)

      const fallbackWorking = fallbackDetection.detected && fallbackRefreshAction.success
      const duration = Date.now() - startTime

      return {
        success: fallbackWorking,
        message: fallbackWorking
          ? 'Hybrid fallback detection working correctly'
          : 'Hybrid fallback detection issues detected',
        details: {
          testData,
          staleDataDetected,
          refreshActions
        },
        timestamp: new Date(),
        duration,
        staleDataDetected,
        refreshActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Hybrid fallback detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  // Helper Methods (Mock implementations - replace with actual API calls)
  private async simulateDataWithTimestamp(key: string, timestamp: Date): Promise<void> {
    // Mock implementation
    this.dataCache.set(key, { timestamp, data: `data-for-${key}` })
    console.log(`Simulated data ${key} with timestamp ${timestamp.toISOString()}`)
  }

  private async simulateDataWithVersion(key: string, localVersion: number, serverVersion: number): Promise<void> {
    // Mock implementation
    this.dataCache.set(key, { localVersion, serverVersion, data: `data-for-${key}` })
    console.log(`Simulated data ${key} with versions local:${localVersion}, server:${serverVersion}`)
  }

  private async simulateDataWithChecksum(key: string, localChecksum: string, serverChecksum: string): Promise<void> {
    // Mock implementation
    this.dataCache.set(key, { localChecksum, serverChecksum, data: `data-for-${key}` })
    console.log(`Simulated data ${key} with checksums local:${localChecksum}, server:${serverChecksum}`)
  }

  private async simulateDataWithHybridMetadata(key: string, timestamp: Date, version: any, checksum: any): Promise<void> {
    // Mock implementation
    this.dataCache.set(key, { timestamp, version, checksum, data: `data-for-${key}` })
    console.log(`Simulated data ${key} with hybrid metadata`)
  }

  private async simulateLargeDataWithChecksum(key: string, size: number): Promise<void> {
    // Mock implementation
    const data = 'x'.repeat(size)
    const checksum = this.calculateChecksum(data)
    this.dataCache.set(key, { checksum, data, size })
    console.log(`Simulated large data ${key} with size ${size} and checksum ${checksum}`)
  }

  private async checkDataFreshness(key: string, threshold: number): Promise<FreshnessCheck> {
    // Mock implementation
    const data = this.dataCache.get(key)
    const lastModified = data?.timestamp || new Date()
    const currentTime = new Date()
    const age = currentTime.getTime() - lastModified.getTime()
    const isFresh = age < threshold

    return {
      dataKey: key,
      lastModified,
      currentTime,
      age,
      isFresh,
      threshold,
      timestamp: new Date()
    }
  }

  private async detectStaleDataByTimestamp(key: string, threshold: number): Promise<StaleDataInfo> {
    // Mock implementation
    const data = this.dataCache.get(key)
    const lastModified = data?.timestamp || new Date()
    const currentTime = new Date()
    const actualAge = currentTime.getTime() - lastModified.getTime()
    const detected = actualAge > threshold
    const severity = detected ? (actualAge > this.config.staleThresholds.high ? 'high' : actualAge > this.config.staleThresholds.medium ? 'medium' : 'low') : 'low'

    return {
      type: 'timestamp',
      dataKey: key,
      staleThreshold: threshold,
      actualAge,
      detected,
      severity,
      timestamp: new Date()
    }
  }

  private async detectStaleDataByVersion(key: string, localVersion: number, serverVersion: number): Promise<StaleDataInfo> {
    // Mock implementation
    const detected = localVersion < serverVersion
    const severity = detected ? (serverVersion - localVersion > 2 ? 'high' : 'medium') : 'low'

    return {
      type: 'version',
      dataKey: key,
      staleThreshold: 0,
      actualAge: serverVersion - localVersion,
      detected,
      severity,
      timestamp: new Date()
    }
  }

  private async detectStaleDataByChecksum(key: string, localChecksum: string, serverChecksum: string): Promise<StaleDataInfo> {
    // Mock implementation
    const detected = localChecksum !== serverChecksum
    const severity = detected ? 'high' : 'low'

    return {
      type: 'checksum',
      dataKey: key,
      staleThreshold: 0,
      actualAge: 0,
      detected,
      severity,
      timestamp: new Date()
    }
  }

  private async detectStaleDataByHybrid(key: string, timestamp: Date, version: any, checksum: any): Promise<StaleDataInfo> {
    // Mock implementation
    const timestampStale = (Date.now() - timestamp.getTime()) > this.config.staleThresholds.low
    const versionStale = version.local < version.server
    const checksumStale = checksum.local !== checksum.server
    const detected = timestampStale || versionStale || checksumStale
    const severity = detected ? 'high' : 'low'

    return {
      type: 'content',
      dataKey: key,
      staleThreshold: this.config.staleThresholds.low,
      actualAge: Date.now() - timestamp.getTime(),
      detected,
      severity,
      timestamp: new Date()
    }
  }

  private async performRefreshAction(key: string, type: string): Promise<RefreshAction> {
    // Mock implementation
    console.log(`Performing refresh action ${type} for ${key}`)
    return {
      type: type as any,
      dataKey: key,
      success: true,
      timestamp: new Date(),
      details: { refreshed: true }
    }
  }

  private async checkVersionFreshness(key: string, localVersion: number, serverVersion: number): Promise<FreshnessCheck> {
    // Mock implementation
    const isFresh = localVersion >= serverVersion
    return {
      dataKey: key,
      lastModified: new Date(),
      currentTime: new Date(),
      age: serverVersion - localVersion,
      isFresh,
      threshold: 0,
      timestamp: new Date()
    }
  }

  private async checkChecksumFreshness(key: string, localChecksum: string, serverChecksum: string): Promise<FreshnessCheck> {
    // Mock implementation
    const isFresh = localChecksum === serverChecksum
    return {
      dataKey: key,
      lastModified: new Date(),
      currentTime: new Date(),
      age: 0,
      isFresh,
      threshold: 0,
      timestamp: new Date()
    }
  }

  private async checkHybridDataFreshness(key: string, timestamp: Date, version: any, checksum: any): Promise<FreshnessCheck> {
    // Mock implementation
    const timestampFresh = (Date.now() - timestamp.getTime()) < this.config.staleThresholds.low
    const versionFresh = version.local >= version.server
    const checksumFresh = checksum.local === checksum.server
    const isFresh = timestampFresh && versionFresh && checksumFresh

    return {
      dataKey: key,
      lastModified: timestamp,
      currentTime: new Date(),
      age: Date.now() - timestamp.getTime(),
      isFresh,
      threshold: this.config.staleThresholds.low,
      timestamp: new Date()
    }
  }

  private async detectVersionConflict(key: string, localVersion: number, serverVersion: number): Promise<StaleDataInfo> {
    // Mock implementation
    const detected = localVersion !== serverVersion
    return {
      type: 'version',
      dataKey: key,
      staleThreshold: 0,
      actualAge: serverVersion - localVersion,
      detected,
      severity: detected ? 'high' : 'low',
      timestamp: new Date()
    }
  }

  private async resolveVersionConflict(key: string, localVersion: number, serverVersion: number): Promise<RefreshAction> {
    // Mock implementation
    console.log(`Resolving version conflict for ${key}: local=${localVersion}, server=${serverVersion}`)
    return {
      type: 'auto-refresh',
      dataKey: key,
      success: true,
      timestamp: new Date(),
      details: { resolved: true, newVersion: serverVersion }
    }
  }

  private async detectVersionSyncNeeded(key: string, localVersion: number, serverVersion: number): Promise<StaleDataInfo> {
    // Mock implementation
    const detected = localVersion < serverVersion
    return {
      type: 'version',
      dataKey: key,
      staleThreshold: 0,
      actualAge: serverVersion - localVersion,
      detected,
      severity: detected ? 'medium' : 'low',
      timestamp: new Date()
    }
  }

  private async performVersionSync(key: string, localVersion: number, serverVersion: number): Promise<RefreshAction> {
    // Mock implementation
    console.log(`Performing version sync for ${key}: ${localVersion} -> ${serverVersion}`)
    return {
      type: 'background-sync',
      dataKey: key,
      success: true,
      timestamp: new Date(),
      details: { synced: true, newVersion: serverVersion }
    }
  }

  private async verifyVersionSync(key: string, expectedVersion: number): Promise<{ success: boolean }> {
    // Mock implementation
    return { success: true }
  }

  private async detectDataIntegrityIssues(key: string, localChecksum: string, serverChecksum: string): Promise<StaleDataInfo> {
    // Mock implementation
    const detected = localChecksum !== serverChecksum
    return {
      type: 'checksum',
      dataKey: key,
      staleThreshold: 0,
      actualAge: 0,
      detected,
      severity: detected ? 'high' : 'low',
      timestamp: new Date()
    }
  }

  private async repairDataIntegrity(key: string, localChecksum: string, serverChecksum: string): Promise<RefreshAction> {
    // Mock implementation
    console.log(`Repairing data integrity for ${key}: ${localChecksum} -> ${serverChecksum}`)
    return {
      type: 'force-refresh',
      dataKey: key,
      success: true,
      timestamp: new Date(),
      details: { repaired: true, newChecksum: serverChecksum }
    }
  }

  private async verifyDataIntegrity(key: string, expectedChecksum: string): Promise<{ success: boolean }> {
    // Mock implementation
    return { success: true }
  }

  private async testChecksumCalculationPerformance(key: string, size: number): Promise<RefreshAction> {
    // Mock implementation
    const startTime = Date.now()
    const checksum = this.calculateChecksum('x'.repeat(size))
    const duration = Date.now() - startTime
    const success = duration < 1000 // Less than 1 second

    return {
      type: 'auto-refresh',
      dataKey: key,
      success,
      timestamp: new Date(),
      details: { duration, checksum, size }
    }
  }

  private async testChecksumComparisonPerformance(key: string): Promise<RefreshAction> {
    // Mock implementation
    const startTime = Date.now()
    const checksum1 = this.calculateChecksum('test-data-1')
    const checksum2 = this.calculateChecksum('test-data-2')
    const comparison = checksum1 === checksum2
    const duration = Date.now() - startTime
    const success = duration < 100 // Less than 100ms

    return {
      type: 'auto-refresh',
      dataKey: key,
      success,
      timestamp: new Date(),
      details: { duration, comparison }
    }
  }

  private async detectStaleDataByPriority(key: string, timestamp: Date, version: any, checksum: any): Promise<StaleDataInfo> {
    // Mock implementation - prioritize checksum over version over timestamp
    const checksumStale = checksum.local !== checksum.server
    const versionStale = version.local < version.server
    const timestampStale = (Date.now() - timestamp.getTime()) > this.config.staleThresholds.low
    
    const detected = checksumStale || versionStale || timestampStale
    const severity = checksumStale ? 'high' : versionStale ? 'medium' : 'low'

    return {
      type: 'content',
      dataKey: key,
      staleThreshold: this.config.staleThresholds.low,
      actualAge: Date.now() - timestamp.getTime(),
      detected,
      severity,
      timestamp: new Date()
    }
  }

  private async performPriorityBasedRefresh(key: string, timestamp: Date, version: any, checksum: any): Promise<RefreshAction> {
    // Mock implementation
    const checksumStale = checksum.local !== checksum.server
    const versionStale = version.local < version.server
    const timestampStale = (Date.now() - timestamp.getTime()) > this.config.staleThresholds.low
    
    let refreshType = 'auto-refresh'
    if (checksumStale) refreshType = 'force-refresh'
    else if (versionStale) refreshType = 'background-sync'
    else if (timestampStale) refreshType = 'user-prompt'

    console.log(`Performing priority-based refresh for ${key}: ${refreshType}`)
    return {
      type: refreshType as any,
      dataKey: key,
      success: true,
      timestamp: new Date(),
      details: { refreshType, checksumStale, versionStale, timestampStale }
    }
  }

  private async detectStaleDataByFallback(key: string, timestamp: Date, version: any, checksum: any): Promise<StaleDataInfo> {
    // Mock implementation - fallback to timestamp when version and checksum are same
    const timestampStale = (Date.now() - timestamp.getTime()) > this.config.staleThresholds.low
    const detected = timestampStale
    const severity = detected ? 'low' : 'low'

    return {
      type: 'timestamp',
      dataKey: key,
      staleThreshold: this.config.staleThresholds.low,
      actualAge: Date.now() - timestamp.getTime(),
      detected,
      severity,
      timestamp: new Date()
    }
  }

  private async performFallbackRefresh(key: string, timestamp: Date, version: any, checksum: any): Promise<RefreshAction> {
    // Mock implementation
    console.log(`Performing fallback refresh for ${key}`)
    return {
      type: 'user-prompt',
      dataKey: key,
      success: true,
      timestamp: new Date(),
      details: { fallback: true }
    }
  }

  private async performHybridRefresh(key: string, timestamp: Date, version: any, checksum: any): Promise<RefreshAction> {
    // Mock implementation
    console.log(`Performing hybrid refresh for ${key}`)
    return {
      type: 'auto-refresh',
      dataKey: key,
      success: true,
      timestamp: new Date(),
      details: { hybrid: true }
    }
  }

  private calculateChecksum(data: string): string {
    // Mock checksum calculation
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  // Public Methods
  public async runTest(testId: string): Promise<StaleDataTestResult> {
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

  public async runAllTests(): Promise<Map<string, StaleDataTestResult>> {
    if (this.isRunning) {
      throw new Error('Tests are already running')
    }

    this.isRunning = true
    const results = new Map<string, StaleDataTestResult>()

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

  public async runTestsByCategory(category: StaleDataTest['category']): Promise<Map<string, StaleDataTestResult>> {
    const categoryTests = Array.from(this.tests.entries()).filter(([, test]) => test.category === category)
    const results = new Map<string, StaleDataTestResult>()

    for (const [testId, test] of categoryTests) {
      const result = await this.executeTestWithRetry(test)
      results.set(testId, result)
    }

    return results
  }

  private async executeTestWithRetry(test: StaleDataTest): Promise<StaleDataTestResult> {
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

  public getTestResults(testId?: string): StaleDataTestResult[] | Map<string, StaleDataTestResult[]> {
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
    totalStaleDataDetected: number
    totalFreshnessChecks: number
    totalRefreshActions: number
  } {
    const allResults = Array.from(this.results.values()).flat()
    
    if (allResults.length === 0) {
      return { total: 0, passed: 0, failed: 0, successRate: 0, averageDuration: 0, totalStaleDataDetected: 0, totalFreshnessChecks: 0, totalRefreshActions: 0 }
    }

    const passed = allResults.filter(r => r.success).length
    const failed = allResults.length - passed
    const successRate = (passed / allResults.length) * 100
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
    
    const totalStaleDataDetected = allResults.reduce((sum, r) => sum + (r.staleDataDetected?.length || 0), 0)
    const totalFreshnessChecks = allResults.reduce((sum, r) => sum + (r.freshnessChecks?.length || 0), 0)
    const totalRefreshActions = allResults.reduce((sum, r) => sum + (r.refreshActions?.length || 0), 0)

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalStaleDataDetected,
      totalFreshnessChecks,
      totalRefreshActions
    }
  }

  public clearResults(): void {
    this.results.clear()
  }

  public getAvailableTests(): StaleDataTest[] {
    return Array.from(this.tests.values())
  }
}

// Export the tester class
export default StaleDataTester
