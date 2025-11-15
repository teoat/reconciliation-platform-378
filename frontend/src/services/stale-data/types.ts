// Stale Data Detection Types and Interfaces
// Extracted from staleDataTester.ts for better organization

export interface StaleDataTest {
  id: string;
  name: string;
  description: string;
  testFunction: () => Promise<StaleDataTestResult>;
  category: 'timestamp-based' | 'version-based' | 'checksum-based' | 'hybrid-detection';
  priority: 'high' | 'medium' | 'low';
  requiresNetworkSimulation: boolean;
}

export interface StaleDataTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
  duration: number;
  errors?: string[];
  staleDataDetected?: StaleDataInfo[];
  freshnessChecks?: FreshnessCheck[];
  refreshActions?: RefreshAction[];
}

export interface StaleDataInfo {
  type: 'timestamp' | 'version' | 'checksum' | 'content';
  dataKey: string;
  staleThreshold: number;
  actualAge: number;
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface FreshnessCheck {
  dataKey: string;
  lastModified: Date;
  currentTime: Date;
  age: number;
  isFresh: boolean;
  threshold: number;
  timestamp: Date;
}

export interface RefreshAction {
  type: 'auto-refresh' | 'user-prompt' | 'background-sync' | 'force-refresh';
  dataKey: string;
  triggered: boolean;
  timestamp: Date;
  reason?: string;
}

export interface StaleDataConfig {
  testTimeout: number;
  staleThresholdMinutes: number;
  enableTimestampChecks: boolean;
  enableVersionChecks: boolean;
  enableChecksumChecks: boolean;
  enableHybridDetection: boolean;
  autoRefreshEnabled: boolean;
  maxTestDataSize: number;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  averageDuration: number;
  totalStaleDataDetected: number;
  totalFreshnessChecks: number;
  totalRefreshActions: number;
}
