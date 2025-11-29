/**
 * Configuration constants for MCP Server
 */

export const SERVER_NAME = 'antigravity-mcp';
export const SERVER_VERSION = '2.1.0';

// Configuration
export const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/Arief/Documents/GitHub/reconciliation-platform-378';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:2000';
export const HEALTH_CHECK_CACHE_TTL = 5000; // 5 seconds
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const REDIS_CONNECT_TIMEOUT = 5000; // 5 seconds

export interface HealthCheckResult {
  status: string;
  data: unknown;
  statusCode: number;
  timestamp: string;
}

