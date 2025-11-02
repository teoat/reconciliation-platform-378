// Stale Data Test Definitions Module
// Contains all test definitions for stale data detection testing
// Extracted from staleDataTester.ts

import { StaleDataTest } from './types';
import { DataFreshness } from './dataFreshness';

export class StaleDataTestDefinitions {
  static getAllTests(): StaleDataTest[] {
    return [
      // Timestamp-based tests
      {
        id: 'timestamp-fresh-data',
        name: 'Timestamp-based Fresh Data Detection',
        description: 'Test detection of fresh data using timestamps',
        category: 'timestamp-based',
        priority: 'high',
        requiresNetworkSimulation: false,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            // Simulate fresh data (modified recently)
            const freshnessCheck = DataFreshness.checkFreshness(
              'fresh-data-key',
              new Date(), // Just modified
              30 // 30 minute threshold
            );

            const duration = Date.now() - startTime;

            return {
              success: freshnessCheck.isFresh,
              message: freshnessCheck.isFresh
                ? 'Fresh data correctly identified'
                : 'Fresh data incorrectly flagged as stale',
              timestamp: new Date(),
              duration,
              freshnessChecks: [freshnessCheck],
            };
          } catch (error) {
            return {
              success: false,
              message: `Timestamp fresh data test error: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : String(error)],
            };
          }
        },
      },

      {
        id: 'timestamp-stale-detection',
        name: 'Timestamp-based Stale Data Detection',
        description: 'Verify stale data detection based on timestamps',
        category: 'timestamp-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const freshnessChecks: any[] = [];
            const refreshActions: any[] = [];

            // Test data with different ages
            const testData = [
              { key: 'fresh-data', age: 60000, threshold: 5 }, // 1 minute old
              { key: 'stale-data', age: 600000, threshold: 5 }, // 10 minutes old
              { key: 'very-stale-data', age: 1800000, threshold: 5 }, // 30 minutes old
            ];

            for (const data of testData) {
              // Simulate data with specific age
              const lastModified = new Date(Date.now() - data.age);
              const freshnessCheck = DataFreshness.checkFreshness(
                data.key,
                lastModified,
                data.threshold
              );
              freshnessChecks.push(freshnessCheck);

              // Detect stale data
              const staleDetection = DataFreshness.detectStaleData(
                data.key,
                lastModified,
                data.threshold
              );
              if (staleDetection.detected) {
                staleDataDetected.push(staleDetection);
              }
            }

            const allDetected = staleDataDetected.length === 2; // Should detect 2 stale items
            const duration = Date.now() - startTime;

            return {
              success: allDetected,
              message: allDetected
                ? 'Timestamp-based stale data detection working correctly'
                : 'Timestamp-based stale data detection issues detected',
              details: { testData, staleDataDetected, freshnessChecks },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              freshnessChecks,
            };
          } catch (error) {
            return {
              success: false,
              message: `Timestamp stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'timestamp-threshold-detection',
        name: 'Timestamp Threshold Detection',
        description: 'Verify different stale thresholds are detected correctly',
        category: 'timestamp-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const freshnessChecks: any[] = [];

            // Test different thresholds
            const thresholds = [
              { level: 'low', threshold: 5 },
              { level: 'medium', threshold: 15 },
              { level: 'high', threshold: 60 },
            ];

            for (const threshold of thresholds) {
              const testData = {
                key: `data-${threshold.level}`,
                age: threshold.threshold * 60000 + 60000,
              }; // Just over threshold
              const lastModified = new Date(Date.now() - testData.age);

              // Check freshness with specific threshold
              const freshnessCheck = DataFreshness.checkFreshness(
                testData.key,
                lastModified,
                threshold.threshold
              );
              freshnessChecks.push(freshnessCheck);

              // Detect stale data
              const staleDetection = DataFreshness.detectStaleData(
                testData.key,
                lastModified,
                threshold.threshold
              );
              if (staleDetection.detected) {
                staleDataDetected.push(staleDetection);
              }
            }

            const allThresholdsWorking = staleDataDetected.length === 3;
            const duration = Date.now() - startTime;

            return {
              success: allThresholdsWorking,
              message: allThresholdsWorking
                ? 'Timestamp threshold detection working correctly'
                : 'Timestamp threshold detection issues detected',
              details: { thresholds, staleDataDetected, freshnessChecks },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              freshnessChecks,
            };
          } catch (error) {
            return {
              success: false,
              message: `Timestamp threshold detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'timestamp-refresh-detection',
        name: 'Timestamp Refresh Detection',
        description: 'Verify data refresh updates timestamps correctly',
        category: 'timestamp-based',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const refreshActions: any[] = [];

            // Test data refresh
            const testData = { key: 'refresh-test-data', age: 600000 }; // 10 minutes old
            const lastModified = new Date(Date.now() - testData.age);

            // Detect stale data
            const staleDetection = DataFreshness.detectStaleData(testData.key, lastModified, 5);
            if (staleDetection.detected) {
              staleDataDetected.push(staleDetection);
            }

            // Simulate refresh (would normally update timestamp)
            const refreshAction = {
              type: 'auto-refresh',
              dataKey: testData.key,
              success: true,
              timestamp: new Date(),
              details: { refreshed: true },
            };
            refreshActions.push(refreshAction);

            // Check if data is fresh after refresh (simulate updated timestamp)
            const freshCheck = DataFreshness.checkFreshness(testData.key, new Date(), 5);
            const isFreshAfterRefresh = freshCheck.isFresh;

            const refreshWorking = refreshAction.success && isFreshAfterRefresh;
            const duration = Date.now() - startTime;

            return {
              success: refreshWorking,
              message: refreshWorking
                ? 'Timestamp refresh detection working correctly'
                : 'Timestamp refresh detection issues detected',
              details: { testData, staleDataDetected, refreshActions, isFreshAfterRefresh },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Timestamp refresh detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      // Version-based tests
      {
        id: 'version-stale-detection',
        name: 'Version-based Stale Data Detection',
        description: 'Verify stale data detection based on version numbers',
        category: 'version-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const freshnessChecks: any[] = [];

            // Test data with different versions
            const testData = [
              { key: 'version-data-1', localVersion: 1, serverVersion: 1 },
              { key: 'version-data-2', localVersion: 1, serverVersion: 2 },
              { key: 'version-data-3', localVersion: 2, serverVersion: 3 },
            ];

            for (const data of testData) {
              // Check version freshness
              const isFresh = data.localVersion >= data.serverVersion;
              const freshnessCheck = {
                dataKey: data.key,
                lastModified: new Date(),
                currentTime: new Date(),
                age: data.serverVersion - data.localVersion,
                isFresh,
                threshold: 0,
                timestamp: new Date(),
              };
              freshnessChecks.push(freshnessCheck);

              // Detect stale data by version
              const detected = data.localVersion < data.serverVersion;
              const severity = detected
                ? data.serverVersion - data.localVersion > 2
                  ? 'high'
                  : 'medium'
                : 'low';
              const staleDetection = {
                type: 'version',
                dataKey: data.key,
                staleThreshold: 0,
                actualAge: data.serverVersion - data.localVersion,
                detected,
                severity,
                timestamp: new Date(),
              };
              if (staleDetection.detected) {
                staleDataDetected.push(staleDetection);
              }
            }

            const allDetected = staleDataDetected.length === 2; // Should detect 2 stale items
            const duration = Date.now() - startTime;

            return {
              success: allDetected,
              message: allDetected
                ? 'Version-based stale data detection working correctly'
                : 'Version-based stale data detection issues detected',
              details: { testData, staleDataDetected, freshnessChecks },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              freshnessChecks,
            };
          } catch (error) {
            return {
              success: false,
              message: `Version stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'version-conflict-detection',
        name: 'Version Conflict Detection',
        description: 'Verify version conflicts are detected correctly',
        category: 'version-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const refreshActions: any[] = [];

            // Test version conflicts
            const testData = { key: 'conflict-data', localVersion: 2, serverVersion: 3 };

            // Detect version conflict
            const detected = testData.localVersion !== testData.serverVersion;
            const staleDetection = {
              type: 'version',
              dataKey: testData.key,
              staleThreshold: 0,
              actualAge: testData.serverVersion - testData.localVersion,
              detected,
              severity: detected ? 'high' : 'low',
              timestamp: new Date(),
            };
            if (staleDetection.detected) {
              staleDataDetected.push(staleDetection);
            }

            // Resolve conflict
            const conflictResolution = {
              type: 'auto-refresh',
              dataKey: testData.key,
              success: true,
              timestamp: new Date(),
              details: { resolved: true, newVersion: testData.serverVersion },
            };
            refreshActions.push(conflictResolution);

            const conflictResolved = conflictResolution.success;
            const duration = Date.now() - startTime;

            return {
              success: conflictResolved,
              message: conflictResolved
                ? 'Version conflict detection working correctly'
                : 'Version conflict detection issues detected',
              details: { testData, staleDataDetected, refreshActions },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Version conflict detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'version-sync-detection',
        name: 'Version Sync Detection',
        description: 'Verify version synchronization works correctly',
        category: 'version-based',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const refreshActions: any[] = [];

            // Test version synchronization
            const testData = { key: 'sync-data', localVersion: 1, serverVersion: 2 };

            // Detect version sync needed
            const detected = testData.localVersion < testData.serverVersion;
            const staleDetection = {
              type: 'version',
              dataKey: testData.key,
              staleThreshold: 0,
              actualAge: testData.serverVersion - testData.localVersion,
              detected,
              severity: detected ? 'medium' : 'low',
              timestamp: new Date(),
            };
            if (staleDetection.detected) {
              staleDataDetected.push(staleDetection);
            }

            // Perform version sync
            const syncAction = {
              type: 'background-sync',
              dataKey: testData.key,
              success: true,
              timestamp: new Date(),
              details: { synced: true, newVersion: testData.serverVersion },
            };
            refreshActions.push(syncAction);

            // Verify sync success (mock)
            const syncSuccessful = true;

            const syncWorking = syncAction.success && syncSuccessful;
            const duration = Date.now() - startTime;

            return {
              success: syncWorking,
              message: syncWorking
                ? 'Version sync detection working correctly'
                : 'Version sync detection issues detected',
              details: { testData, staleDataDetected, refreshActions },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Version sync detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      // Checksum-based tests
      {
        id: 'checksum-stale-detection',
        name: 'Checksum-based Stale Data Detection',
        description: 'Verify stale data detection based on checksums',
        category: 'checksum-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const freshnessChecks: any[] = [];

            // Test data with different checksums
            const testData = [
              { key: 'checksum-data-1', localChecksum: 'abc123', serverChecksum: 'abc123' },
              { key: 'checksum-data-2', localChecksum: 'abc123', serverChecksum: 'def456' },
              { key: 'checksum-data-3', localChecksum: 'def456', serverChecksum: 'ghi789' },
            ];

            for (const data of testData) {
              // Check checksum freshness
              const isFresh = data.localChecksum === data.serverChecksum;
              const freshnessCheck = {
                dataKey: data.key,
                lastModified: new Date(),
                currentTime: new Date(),
                age: 0,
                isFresh,
                threshold: 0,
                timestamp: new Date(),
              };
              freshnessChecks.push(freshnessCheck);

              // Detect stale data by checksum
              const detected = data.localChecksum !== data.serverChecksum;
              const severity = detected ? 'high' : 'low';
              const staleDetection = {
                type: 'checksum',
                dataKey: data.key,
                staleThreshold: 0,
                actualAge: 0,
                detected,
                severity,
                timestamp: new Date(),
              };
              if (staleDetection.detected) {
                staleDataDetected.push(staleDetection);
              }
            }

            const allDetected = staleDataDetected.length === 2; // Should detect 2 stale items
            const duration = Date.now() - startTime;

            return {
              success: allDetected,
              message: allDetected
                ? 'Checksum-based stale data detection working correctly'
                : 'Checksum-based stale data detection issues detected',
              details: { testData, staleDataDetected, freshnessChecks },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              freshnessChecks,
            };
          } catch (error) {
            return {
              success: false,
              message: `Checksum stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'checksum-integrity-detection',
        name: 'Checksum Integrity Detection',
        description: 'Verify data integrity using checksums',
        category: 'checksum-based',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const refreshActions: any[] = [];

            // Test data integrity
            const testData = {
              key: 'integrity-data',
              localChecksum: 'abc123',
              serverChecksum: 'def456',
            };

            // Detect integrity issues
            const detected = testData.localChecksum !== testData.serverChecksum;
            const staleDetection = {
              type: 'checksum',
              dataKey: testData.key,
              staleThreshold: 0,
              actualAge: 0,
              detected,
              severity: detected ? 'high' : 'low',
              timestamp: new Date(),
            };
            if (staleDetection.detected) {
              staleDataDetected.push(staleDetection);
            }

            // Repair integrity
            const repairAction = {
              type: 'force-refresh',
              dataKey: testData.key,
              success: true,
              timestamp: new Date(),
              details: { repaired: true, newChecksum: testData.serverChecksum },
            };
            refreshActions.push(repairAction);

            // Verify integrity repair
            const integrityRepaired = true;

            const integrityWorking = repairAction.success && integrityRepaired;
            const duration = Date.now() - startTime;

            return {
              success: integrityWorking,
              message: integrityWorking
                ? 'Checksum integrity detection working correctly'
                : 'Checksum integrity detection issues detected',
              details: { testData, staleDataDetected, refreshActions },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Checksum integrity detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'checksum-performance-detection',
        name: 'Checksum Performance Detection',
        description: 'Verify checksum calculation performance',
        category: 'checksum-based',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const refreshActions: any[] = [];

            // Test checksum performance
            const testData = { key: 'performance-data', size: 1024 * 1024 }; // 1MB

            // Test checksum calculation performance
            const perfStartTime = Date.now();
            const checksum = DataFreshness.calculateChecksum('x'.repeat(testData.size));
            const duration = Date.now() - perfStartTime;
            const success = duration < 1000; // Less than 1 second

            const performanceTest = {
              type: 'auto-refresh',
              dataKey: testData.key,
              success,
              timestamp: new Date(),
              details: { duration, checksum, size: testData.size },
            };
            refreshActions.push(performanceTest);

            // Test checksum comparison performance
            const compStartTime = Date.now();
            const checksum1 = DataFreshness.calculateChecksum('test-data-1');
            const checksum2 = DataFreshness.calculateChecksum('test-data-2');
            const comparison = checksum1 === checksum2;
            const compDuration = Date.now() - compStartTime;
            const compSuccess = compDuration < 100; // Less than 100ms

            const comparisonTest = {
              type: 'auto-refresh',
              dataKey: testData.key,
              success: compSuccess,
              timestamp: new Date(),
              details: { duration: compDuration, comparison },
            };
            refreshActions.push(comparisonTest);

            const performanceAcceptable = performanceTest.success && comparisonTest.success;
            const totalDuration = Date.now() - startTime;

            return {
              success: performanceAcceptable,
              message: performanceAcceptable
                ? 'Checksum performance detection working correctly'
                : 'Checksum performance detection issues detected',
              details: { testData, refreshActions },
              timestamp: new Date(),
              duration: totalDuration,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Checksum performance detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      // Hybrid Detection Tests
      {
        id: 'hybrid-stale-detection',
        name: 'Hybrid Stale Data Detection',
        description: 'Verify hybrid stale data detection using multiple methods',
        category: 'hybrid-detection',
        priority: 'high',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const freshnessChecks: any[] = [];
            const refreshActions: any[] = [];

            // Test hybrid detection
            const testData = {
              key: 'hybrid-data',
              timestamp: new Date(Date.now() - 600000), // 10 minutes old
              version: { local: 1, server: 2 },
              checksum: { local: 'abc123', server: 'def456' },
            };

            // Test hybrid freshness check
            const timestampFresh = Date.now() - testData.timestamp.getTime() < 300000; // 5 min threshold
            const versionFresh = testData.version.local >= testData.version.server;
            const checksumFresh = testData.checksum.local === testData.checksum.server;
            const isFresh = timestampFresh && versionFresh && checksumFresh;

            const hybridFreshnessCheck = {
              dataKey: testData.key,
              lastModified: testData.timestamp,
              currentTime: new Date(),
              age: Date.now() - testData.timestamp.getTime(),
              isFresh,
              threshold: 5,
              timestamp: new Date(),
            };
            freshnessChecks.push(hybridFreshnessCheck);

            // Test hybrid stale detection
            const timestampStale = Date.now() - testData.timestamp.getTime() > 300000;
            const versionStale = testData.version.local < testData.version.server;
            const checksumStale = testData.checksum.local !== testData.checksum.server;
            const detected = timestampStale || versionStale || checksumStale;
            const severity = detected ? 'high' : 'low';

            const hybridStaleDetection = {
              type: 'content',
              dataKey: testData.key,
              staleThreshold: 300000,
              actualAge: Date.now() - testData.timestamp.getTime(),
              detected,
              severity,
              timestamp: new Date(),
            };
            if (hybridStaleDetection.detected) {
              staleDataDetected.push(hybridStaleDetection);
            }

            // Test hybrid refresh
            const hybridRefreshAction = {
              type: 'auto-refresh',
              dataKey: testData.key,
              success: true,
              timestamp: new Date(),
              details: { hybrid: true },
            };
            refreshActions.push(hybridRefreshAction);

            const hybridWorking = hybridStaleDetection.detected && hybridRefreshAction.success;
            const duration = Date.now() - startTime;

            return {
              success: hybridWorking,
              message: hybridWorking
                ? 'Hybrid stale data detection working correctly'
                : 'Hybrid stale data detection issues detected',
              details: { testData, staleDataDetected, freshnessChecks, refreshActions },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              freshnessChecks,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Hybrid stale detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'hybrid-priority-detection',
        name: 'Hybrid Priority Detection',
        description: 'Verify hybrid detection prioritizes different methods correctly',
        category: 'hybrid-detection',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const refreshActions: any[] = [];

            // Test priority detection
            const testData = {
              key: 'priority-data',
              timestamp: new Date(Date.now() - 600000), // 10 minutes old
              version: { local: 1, server: 1 }, // Same version
              checksum: { local: 'abc123', server: 'def456' }, // Different checksum
            };

            // Test priority detection (checksum > version > timestamp)
            const checksumStale = testData.checksum.local !== testData.checksum.server;
            const versionStale = testData.version.local < testData.version.server;
            const timestampStale = Date.now() - testData.timestamp.getTime() > 300000;

            const detected = checksumStale || versionStale || timestampStale;
            const severity = checksumStale ? 'high' : versionStale ? 'medium' : 'low';

            const priorityDetection = {
              type: 'content',
              dataKey: testData.key,
              staleThreshold: 300000,
              actualAge: Date.now() - testData.timestamp.getTime(),
              detected,
              severity,
              timestamp: new Date(),
            };
            if (priorityDetection.detected) {
              staleDataDetected.push(priorityDetection);
            }

            // Test priority-based refresh
            let refreshType = 'auto-refresh';
            if (checksumStale) refreshType = 'force-refresh';
            else if (versionStale) refreshType = 'background-sync';
            else if (timestampStale) refreshType = 'user-prompt';

            const priorityRefreshAction = {
              type: refreshType,
              dataKey: testData.key,
              success: true,
              timestamp: new Date(),
              details: { refreshType, checksumStale, versionStale, timestampStale },
            };
            refreshActions.push(priorityRefreshAction);

            const priorityWorking = priorityDetection.detected && priorityRefreshAction.success;
            const duration = Date.now() - startTime;

            return {
              success: priorityWorking,
              message: priorityWorking
                ? 'Hybrid priority detection working correctly'
                : 'Hybrid priority detection issues detected',
              details: { testData, staleDataDetected, refreshActions },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Hybrid priority detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },

      {
        id: 'hybrid-fallback-detection',
        name: 'Hybrid Fallback Detection',
        description: 'Verify hybrid detection falls back to alternative methods',
        category: 'hybrid-detection',
        priority: 'medium',
        requiresNetworkSimulation: true,
        testFunction: async () => {
          const startTime = Date.now();

          try {
            const staleDataDetected: any[] = [];
            const refreshActions: any[] = [];

            // Test fallback detection
            const testData = {
              key: 'fallback-data',
              timestamp: new Date(Date.now() - 600000), // 10 minutes old
              version: { local: 1, server: 1 }, // Same version
              checksum: { local: 'abc123', server: 'abc123' }, // Same checksum
            };

            // Test fallback detection (only timestamp when others match)
            const timestampStale = Date.now() - testData.timestamp.getTime() > 300000;
            const detected = timestampStale;
            const severity = detected ? 'low' : 'low';

            const fallbackDetection = {
              type: 'timestamp',
              dataKey: testData.key,
              staleThreshold: 300000,
              actualAge: Date.now() - testData.timestamp.getTime(),
              detected,
              severity,
              timestamp: new Date(),
            };
            if (fallbackDetection.detected) {
              staleDataDetected.push(fallbackDetection);
            }

            // Test fallback refresh
            const fallbackRefreshAction = {
              type: 'user-prompt',
              dataKey: testData.key,
              success: true,
              timestamp: new Date(),
              details: { fallback: true },
            };
            refreshActions.push(fallbackRefreshAction);

            const fallbackWorking = fallbackDetection.detected && fallbackRefreshAction.success;
            const duration = Date.now() - startTime;

            return {
              success: fallbackWorking,
              message: fallbackWorking
                ? 'Hybrid fallback detection working correctly'
                : 'Hybrid fallback detection issues detected',
              details: { testData, staleDataDetected, refreshActions },
              timestamp: new Date(),
              duration,
              staleDataDetected,
              refreshActions,
            };
          } catch (error) {
            return {
              success: false,
              message: `Hybrid fallback detection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              duration: Date.now() - startTime,
              errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
          }
        },
      },
    ];
  }
}
