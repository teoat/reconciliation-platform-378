/**
 * Configuration for Agent Coordination MCP Server
 */

export const SERVER_NAME = 'antigravity-coordination-mcp';
export const SERVER_VERSION = '1.0.0';

// Configuration
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const COORDINATION_TTL = parseInt(process.env.COORDINATION_TTL || '3600', 10); // 1 hour default
export const REDIS_CONNECT_TIMEOUT = 5000; // 5 seconds

// Redis key prefixes
export const KEY_PREFIX = 'agent:coord:';
export const TASK_KEY = (taskId: string) => `${KEY_PREFIX}task:${taskId}`;
export const FILE_LOCK_KEY = (file: string) => `${KEY_PREFIX}lock:${file}`;
export const AGENT_STATUS_KEY = (agentId: string) => `${KEY_PREFIX}status:${agentId}`;
export const TASK_QUEUE_KEY = `${KEY_PREFIX}tasks:queue`;
export const ACTIVE_AGENTS_KEY = `${KEY_PREFIX}agents:active`;
export const CONFLICT_LOG_KEY = (agentId: string) => `${KEY_PREFIX}conflicts:${agentId}`;

// Interfaces
export interface LockInfo {
  file: string;
  agentId: string;
  reason: string;
  lockedAt: string;
  expiresAt: string;
}

export interface AgentStatus {
  agentId: string;
  status: string;
  currentTask: string | null;
  lastSeen: string;
  capabilities?: string[];
  registeredAt?: string;
  progress?: number;
}

