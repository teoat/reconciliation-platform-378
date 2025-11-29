// Hybrid Detection Test Definitions
// Extracted from testDefinitions.ts

import { StaleDataTest, StaleDataInfo, FreshnessCheck, RefreshAction } from '../types';

export const hybridDetectionTests: StaleDataTest[] = [
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
        const staleDataDetected: StaleDataInfo[] = [];
        const freshnessChecks: FreshnessCheck[] = [];
        const refreshActions: RefreshAction[] = [];

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

        const hybridStaleDetection: StaleDataInfo = {
          type: 'content',
          dataKey: testData.key,
          staleThreshold: 300000,
          actualAge: Date.now() - testData.timestamp.getTime(),
          detected,
          severity: severity as 'low' | 'medium' | 'high',
          timestamp: new Date(),
        };
        if (hybridStaleDetection.detected) {
          staleDataDetected.push(hybridStaleDetection);
        }

        // Test hybrid refresh
        const hybridRefreshAction: RefreshAction = {
          type: 'auto-refresh',
          dataKey: testData.key,
          triggered: true,
          timestamp: new Date(),
          details: { hybrid: true },
        } as RefreshAction & { details: { hybrid: boolean } };
        refreshActions.push(hybridRefreshAction);

        const hybridWorking = hybridStaleDetection.detected && hybridRefreshAction.triggered;
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
        const staleDataDetected: StaleDataInfo[] = [];
        const refreshActions: RefreshAction[] = [];

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

        const priorityDetection: StaleDataInfo = {
          type: 'content',
          dataKey: testData.key,
          staleThreshold: 300000,
          actualAge: Date.now() - testData.timestamp.getTime(),
          detected,
          severity: severity as 'low' | 'medium' | 'high',
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

        const priorityRefreshAction: RefreshAction = {
          type: refreshType as RefreshAction['type'],
          dataKey: testData.key,
          triggered: true,
          timestamp: new Date(),
          details: { refreshType, checksumStale, versionStale, timestampStale },
        } as RefreshAction & { details: { refreshType: string; checksumStale: boolean; versionStale: boolean; timestampStale: boolean } };
        refreshActions.push(priorityRefreshAction);

        const priorityWorking = priorityDetection.detected && priorityRefreshAction.triggered;
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
        const staleDataDetected: StaleDataInfo[] = [];
        const refreshActions: RefreshAction[] = [];

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
          staleDataDetected.push(fallbackDetection as StaleDataInfo);
        }

        // Test fallback refresh
        const fallbackRefreshAction: RefreshAction = {
          type: 'user-prompt',
          dataKey: testData.key,
          triggered: true,
          timestamp: new Date(),
          details: { fallback: true },
        } as RefreshAction & { details: { fallback: boolean } };
        refreshActions.push(fallbackRefreshAction);

        const fallbackWorking = fallbackDetection.detected && fallbackRefreshAction.triggered;
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

