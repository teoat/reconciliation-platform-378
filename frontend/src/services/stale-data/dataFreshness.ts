// Data Freshness Module
// Handles data freshness checking and staleness detection
// Extracted from staleDataTester.ts

import { StaleDataInfo, FreshnessCheck } from './types';

export class DataFreshness {
  private static calculateAge(lastModified: Date, currentTime: Date = new Date()): number {
    return currentTime.getTime() - lastModified.getTime();
  }

  static checkFreshness(
    dataKey: string,
    lastModified: Date,
    thresholdMinutes: number,
    currentTime: Date = new Date()
  ): FreshnessCheck {
    const age = this.calculateAge(lastModified, currentTime);
    const threshold = thresholdMinutes * 60 * 1000; // Convert to milliseconds
    const isFresh = age <= threshold;

    return {
      dataKey,
      lastModified,
      currentTime,
      age,
      isFresh,
      threshold,
      timestamp: new Date(),
    };
  }

  static detectStaleData(
    dataKey: string,
    lastModified: Date,
    thresholdMinutes: number,
    currentTime: Date = new Date()
  ): StaleDataInfo {
    const age = this.calculateAge(lastModified, currentTime);
    const threshold = thresholdMinutes * 60 * 1000;
    const detected = age > threshold;

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (age > threshold * 2) severity = 'medium';
    if (age > threshold * 3) severity = 'high';

    return {
      type: 'timestamp',
      dataKey,
      staleThreshold: threshold,
      actualAge: age,
      detected,
      severity,
      timestamp: new Date(),
    };
  }

  static calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  static generateTestData(size: number = 1000): {
    id: string;
    name: string;
    data: string;
    timestamp: number;
    version: number;
  } {
    return {
      id: Math.random().toString(36).substring(2, 11),
      name: `Test Data ${Date.now()}`,
      data: 'x'.repeat(Math.max(0, size - 50)),
      timestamp: Date.now(),
      version: 1,
    };
  }

  static simulateTimePassage(hours: number): Date {
    const now = new Date();
    now.setHours(now.getHours() - hours);
    return now;
  }
}
