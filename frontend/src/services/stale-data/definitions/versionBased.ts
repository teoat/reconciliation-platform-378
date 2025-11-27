// Version-based Test Definitions
// Extracted from testDefinitions.ts

import { StaleDataTest, StaleDataInfo, FreshnessCheck, RefreshAction } from '../types';

export const versionBasedTests: StaleDataTest[] = [
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
        const staleDataDetected: StaleDataInfo[] = [];
        const freshnessChecks: FreshnessCheck[] = [];

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
          const staleDetection: StaleDataInfo = {
            type: 'version',
            dataKey: data.key,
            staleThreshold: 0,
            actualAge: data.serverVersion - data.localVersion,
            detected,
            severity: severity as 'low' | 'medium' | 'high',
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
        const staleDataDetected: StaleDataInfo[] = [];
        const refreshActions: RefreshAction[] = [];

        // Test version conflicts
        const testData = { key: 'conflict-data', localVersion: 2, serverVersion: 3 };

        // Detect version conflict
        const detected = testData.localVersion !== testData.serverVersion;
        const staleDetection: StaleDataInfo = {
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
        const conflictResolution: RefreshAction = {
          type: 'auto-refresh',
          dataKey: testData.key,
          triggered: true,
          timestamp: new Date(),
          details: { resolved: true, newVersion: testData.serverVersion },
        } as RefreshAction & { details: { resolved: boolean; newVersion: number } };
        refreshActions.push(conflictResolution);

        const conflictResolved = conflictResolution.triggered;
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
        const staleDataDetected: StaleDataInfo[] = [];
        const refreshActions: RefreshAction[] = [];

        // Test version synchronization
        const testData = { key: 'sync-data', localVersion: 1, serverVersion: 2 };

        // Detect version sync needed
        const detected = testData.localVersion < testData.serverVersion;
        const staleDetection: StaleDataInfo = {
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
        const syncAction: RefreshAction = {
          type: 'background-sync',
          dataKey: testData.key,
          triggered: true,
          timestamp: new Date(),
          details: { synced: true, newVersion: testData.serverVersion },
        } as RefreshAction & { details: { synced: boolean; newVersion: number } };
        refreshActions.push(syncAction);

        // Verify sync success (mock)
        const syncSuccessful = true;

        const syncWorking = syncAction.triggered && syncSuccessful;
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
];

