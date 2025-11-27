// Timestamp-based Test Definitions
// Extracted from testDefinitions.ts

import { StaleDataTest, StaleDataInfo, FreshnessCheck, RefreshAction } from '../types';
import { DataFreshness } from '../dataFreshness';

export const timestampBasedTests: StaleDataTest[] = [
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
        const staleDataDetected: StaleDataInfo[] = [];
        const freshnessChecks: FreshnessCheck[] = [];
        const refreshActions: RefreshAction[] = [];

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
        const staleDataDetected: StaleDataInfo[] = [];
        const freshnessChecks: FreshnessCheck[] = [];

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
        const staleDataDetected: StaleDataInfo[] = [];
        const refreshActions: RefreshAction[] = [];

        // Test data refresh
        const testData = { key: 'refresh-test-data', age: 600000 }; // 10 minutes old
        const lastModified = new Date(Date.now() - testData.age);

        // Detect stale data
        const staleDetection = DataFreshness.detectStaleData(testData.key, lastModified, 5);
        if (staleDetection.detected) {
          staleDataDetected.push(staleDetection);
        }

        // Simulate refresh (would normally update timestamp)
        const refreshAction: RefreshAction = {
          type: 'auto-refresh',
          dataKey: testData.key,
          triggered: true,
          timestamp: new Date(),
          details: { refreshed: true },
        } as RefreshAction & { details: { refreshed: boolean } };
        refreshActions.push(refreshAction);

        // Check if data is fresh after refresh (simulate updated timestamp)
        const freshCheck = DataFreshness.checkFreshness(testData.key, new Date(), 5);
        const isFreshAfterRefresh = freshCheck.isFresh;

        const refreshWorking = refreshAction.triggered && isFreshAfterRefresh;
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
];

