#!/usr/bin/env node
/**
 * Agent Coordination MCP Server
 * 
 * Provides coordination tools for multiple IDE agents working on the same codebase:
 * - Task management (claim, release, track)
 * - File locking (prevent conflicts)
 * - Agent status tracking
 * - Conflict detection
 * - Coordination suggestions
 * 
 * Uses Redis for shared state across all agent instances.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { LRUCache } from 'lru-cache';

dotenv.config();

const SERVER_NAME = 'agent-coordination-mcp';
const SERVER_VERSION = '1.0.0';

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://:redis_pass@localhost:6379';
const COORDINATION_TTL = parseInt(process.env.COORDINATION_TTL || '3600', 10); // 1 hour default
const REDIS_CONNECT_TIMEOUT = 5000; // 5 seconds

// Redis client (singleton)
let redisClient: RedisClientType | null = null;
let redisClientPromise: Promise<RedisClientType> | null = null;
let redisHealthCheckTimer: NodeJS.Timeout | null = null;

// In-memory cache for file locks (LRU cache with 5s TTL)
interface LockInfo {
  file: string;
  agentId: string;
  reason: string;
  lockedAt: string;
  expiresAt: string;
}

const fileLockCache = new LRUCache<string, LockInfo | null>({
  max: 1000,
  ttl: 5000, // 5 seconds
  updateAgeOnGet: true,
});

// In-memory cache for agent status
interface AgentStatus {
  agentId: string;
  status: string;
  currentTask: string | null;
  lastSeen: string;
}

const agentStatusCache = new LRUCache<string, AgentStatus>({
  max: 500,
  ttl: 10000, // 10 seconds
  updateAgeOnGet: true,
});

// Redis key prefixes
const KEY_PREFIX = 'agent:coord:';
const TASK_KEY = (taskId: string) => `${KEY_PREFIX}task:${taskId}`;
const FILE_LOCK_KEY = (file: string) => `${KEY_PREFIX}lock:${file}`;
const AGENT_STATUS_KEY = (agentId: string) => `${KEY_PREFIX}status:${agentId}`;
const TASK_QUEUE_KEY = `${KEY_PREFIX}tasks:queue`;
const ACTIVE_AGENTS_KEY = `${KEY_PREFIX}agents:active`;
const CONFLICT_LOG_KEY = (agentId: string) => `${KEY_PREFIX}conflicts:${agentId}`;

// Initialize Redis client
async function initRedis(): Promise<RedisClientType> {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisClientPromise) {
    try {
      return await redisClientPromise;
    } catch {
      redisClientPromise = null;
    }
  }

  if (redisClient && !redisClient.isOpen) {
    try {
      await redisClient.connect();
      return redisClient;
    } catch {
      redisClient = null;
    }
  }

  redisClientPromise = (async () => {
    try {
      redisClient = createClient({
        url: REDIS_URL,
        socket: {
          connectTimeout: REDIS_CONNECT_TIMEOUT,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              return new Error('Redis connection failed after 3 retries');
            }
            return Math.min(retries * 100, 1000);
          },
        },
      });

      redisClient.on('error', (err) => {
        console.error('[Agent Coordination MCP] Redis error:', err);
      });

      redisClient.on('connect', () => {
        console.error('[Agent Coordination MCP] Redis connected');
      });

      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), REDIS_CONNECT_TIMEOUT)
        ),
      ]);

      startRedisHealthMonitoring();
      redisClientPromise = null;
      return redisClient;
    } catch (error) {
      redisClientPromise = null;
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Redis connection failed: ${errorMessage}`);
    }
  })();

  return redisClientPromise;
}

// Redis health monitoring
function startRedisHealthMonitoring(): void {
  if (redisHealthCheckTimer) {
    return;
  }

  redisHealthCheckTimer = setInterval(async () => {
    if (redisClient?.isOpen) {
      try {
        await redisClient.ping();
      } catch (error) {
        console.warn('[Agent Coordination MCP] Redis health check failed:', error);
        redisClient = null;
        redisClientPromise = null;
      }
    }
  }, 30000); // Check every 30 seconds
}

// Helper: Normalize file path
function normalizeFilePath(file: string): string {
  // Remove leading slash, normalize separators
  return file.replace(/^\/+/, '').replace(/\\/g, '/');
}

// Helper: Get Redis client or throw
async function getRedis(): Promise<RedisClientType> {
  try {
    return await initRedis();
  } catch (error) {
    throw new Error(`Redis not available: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Batch operations helper
async function batchGetFileLocks(files: string[]): Promise<Map<string, LockInfo | null>> {
  const redis = await getRedis();
  const normalizedFiles = files.map(normalizeFilePath);
  const results = new Map<string, LockInfo | null>();
  
  // Check cache first
  const uncachedFiles: string[] = [];
  for (const file of normalizedFiles) {
    const cached = fileLockCache.get(file);
    if (cached !== undefined) {
      results.set(file, cached);
    } else {
      uncachedFiles.push(file);
    }
  }
  
  // Batch fetch from Redis
  if (uncachedFiles.length > 0) {
    const pipeline = redis.multi();
    uncachedFiles.forEach(file => {
      pipeline.get(FILE_LOCK_KEY(file));
    });
    
    const redisResults = await pipeline.exec();
    if (redisResults) {
      uncachedFiles.forEach((file, index) => {
        const result = redisResults[index];
        let lockInfo: LockInfo | null = null;
        
        if (result && result[1] && typeof result[1] === 'string') {
          try {
            lockInfo = JSON.parse(result[1]);
          } catch {
            lockInfo = null;
          }
        }
        
        fileLockCache.set(file, lockInfo);
        results.set(file, lockInfo);
      });
    }
  }
  
  return results;
}

// Input validation schemas
const AgentRegisterSchema = z.object({
  agentId: z.string().min(1).max(100),
  capabilities: z.array(z.string()).default([]),
  currentTask: z.string().nullable().optional(),
});

const ClaimTaskSchema = z.object({
  taskId: z.string().min(1).max(100),
  agentId: z.string().min(1).max(100),
  files: z.array(z.string()).max(1000).default([]),
  description: z.string().max(500).optional(),
});

const LockFileSchema = z.object({
  file: z.string().min(1).max(500),
  agentId: z.string().min(1).max(100),
  reason: z.string().max(200).optional(),
  ttl: z.number().int().min(60).max(86400).optional(),
});

const DetectConflictsSchema = z.object({
  agentId: z.string().min(1).max(100),
  files: z.array(z.string()).min(1).max(1000),
});

// Tool definitions
const tools: Tool[] = [
  // Agent Registration
  {
    name: 'agent_register',
    description: 'Register an agent with the coordination server',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Unique agent identifier (e.g., "agent-1", "cursor-session-123")',
        },
        capabilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Agent capabilities (e.g., ["typescript", "refactoring", "testing"])',
          default: [],
        },
        currentTask: {
          type: 'string',
          description: 'Current task ID (optional)',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'agent_update_status',
    description: 'Update agent status (idle, working, blocked)',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        status: {
          type: 'string',
          enum: ['idle', 'working', 'blocked', 'completed'],
          description: 'Agent status',
        },
        currentTask: {
          type: 'string',
          description: 'Current task ID (optional)',
        },
        progress: {
          type: 'number',
          description: 'Task progress percentage (0-100)',
          minimum: 0,
          maximum: 100,
        },
      },
      required: ['agentId', 'status'],
    },
  },
  {
    name: 'agent_list_agents',
    description: 'List all active agents and their status',
    inputSchema: {
      type: 'object',
      properties: {
        includeInactive: {
          type: 'boolean',
          description: 'Include inactive agents (not seen in last 5 minutes)',
          default: false,
        },
      },
    },
  },
  {
    name: 'agent_get_status',
    description: 'Get status of a specific agent',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
      },
      required: ['agentId'],
    },
  },
  // Task Management
  {
    name: 'agent_claim_task',
    description: 'Claim a task for exclusive work by an agent',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Unique task identifier',
        },
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files that will be modified',
          default: [],
        },
        description: {
          type: 'string',
          description: 'Task description',
        },
      },
      required: ['taskId', 'agentId'],
    },
  },
  {
    name: 'agent_release_task',
    description: 'Release a claimed task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task identifier',
        },
        agentId: {
          type: 'string',
          description: 'Agent identifier (must be the one who claimed it)',
        },
      },
      required: ['taskId', 'agentId'],
    },
  },
  {
    name: 'agent_list_tasks',
    description: 'List all tasks (available, claimed, completed)',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'available', 'claimed', 'completed'],
          description: 'Filter by task status',
          default: 'all',
        },
        agentId: {
          type: 'string',
          description: 'Filter tasks by agent (optional)',
        },
      },
    },
  },
  {
    name: 'agent_update_task_progress',
    description: 'Update task progress',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task identifier',
        },
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        progress: {
          type: 'number',
          description: 'Progress percentage (0-100)',
          minimum: 0,
          maximum: 100,
        },
        message: {
          type: 'string',
          description: 'Progress message (optional)',
        },
      },
      required: ['taskId', 'agentId', 'progress'],
    },
  },
  {
    name: 'agent_complete_task',
    description: 'Mark a task as complete',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task identifier',
        },
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
      },
      required: ['taskId', 'agentId'],
    },
  },
  // File Locking
  {
    name: 'agent_lock_file',
    description: 'Lock a file for exclusive editing',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path (relative to project root)',
        },
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        reason: {
          type: 'string',
          description: 'Reason for locking',
        },
        ttl: {
          type: 'number',
          description: 'Lock TTL in seconds (default: 3600)',
          default: COORDINATION_TTL,
        },
      },
      required: ['file', 'agentId'],
    },
  },
  {
    name: 'agent_unlock_file',
    description: 'Release a file lock',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path',
        },
        agentId: {
          type: 'string',
          description: 'Agent identifier (must be the one who locked it)',
        },
      },
      required: ['file', 'agentId'],
    },
  },
  {
    name: 'agent_check_file_lock',
    description: 'Check if a file is locked',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path',
        },
      },
      required: ['file'],
    },
  },
  {
    name: 'agent_list_locked_files',
    description: 'List all currently locked files',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Filter by agent (optional)',
        },
      },
    },
  },
  // Conflict Detection
  {
    name: 'agent_detect_conflicts',
    description: 'Detect potential conflicts with other agents',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files to check for conflicts',
        },
      },
      required: ['agentId', 'files'],
    },
  },
  {
    name: 'agent_check_file_overlap',
    description: 'Check if files overlap with other agents\' work',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files to check',
        },
      },
      required: ['agentId', 'files'],
    },
  },
  // Coordination Tools
  {
    name: 'agent_suggest_coordination',
    description: 'Get coordination suggestions for safe parallel work',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        capabilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Agent capabilities',
          default: [],
        },
        preferredFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Preferred files to work on',
          default: [],
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'agent_get_workload_distribution',
    description: 'Get workload distribution across all agents',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'agent_find_available_work',
    description: 'Find unclaimed tasks that match agent capabilities',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'Agent identifier',
        },
        capabilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Agent capabilities',
          default: [],
        },
      },
      required: ['agentId'],
    },
  },
];

// Tool implementations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTool(name: string, args: any): Promise<any> {
  const redis = await getRedis();

  switch (name) {
    case 'agent_register': {
      const validated = AgentRegisterSchema.parse(args);
      const { agentId, capabilities = [], currentTask = null } = validated;
      const status = {
        agentId,
        capabilities,
        status: 'idle',
        currentTask,
        registeredAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };

      await redis.setEx(AGENT_STATUS_KEY(agentId), COORDINATION_TTL, JSON.stringify(status));
      await redis.zAdd(ACTIVE_AGENTS_KEY, { score: Date.now(), value: agentId });

      return {
        success: true,
        agentId,
        registeredAt: status.registeredAt,
      };
    }

    case 'agent_update_status': {
      const { agentId, status: newStatus, currentTask = null, progress = null } = args;
      
      const existingStatusStr = await redis.get(AGENT_STATUS_KEY(agentId));
      if (!existingStatusStr) {
        throw new Error(`Agent ${agentId} not registered. Call agent_register first.`);
      }

      const existingStatus = JSON.parse(existingStatusStr);
      const updatedStatus = {
        ...existingStatus,
        status: newStatus,
        currentTask,
        progress,
        lastSeen: new Date().toISOString(),
      };

      await redis.setEx(AGENT_STATUS_KEY(agentId), COORDINATION_TTL, JSON.stringify(updatedStatus));
      await redis.zAdd(ACTIVE_AGENTS_KEY, { score: Date.now(), value: agentId });

      return {
        success: true,
        agentId,
        status: newStatus,
        updatedAt: updatedStatus.lastSeen,
      };
    }

    case 'agent_list_agents': {
      const { includeInactive = false } = args;
      const cutoffTime = includeInactive ? 0 : Date.now() - 300000; // 5 minutes

      const agentIds = await redis.zRangeByScore(ACTIVE_AGENTS_KEY, cutoffTime, Date.now());
      const agents = await Promise.all(
        agentIds.map(async (agentId) => {
          const statusStr = await redis.get(AGENT_STATUS_KEY(agentId));
          return statusStr ? JSON.parse(statusStr) : null;
        })
      );

      return {
        agents: agents.filter((a) => a !== null),
        total: agents.filter((a) => a !== null).length,
      };
    }

    case 'agent_get_status': {
      const { agentId } = args;
      const statusStr = await redis.get(AGENT_STATUS_KEY(agentId));
      
      if (!statusStr) {
        return {
          agentId,
          found: false,
          message: 'Agent not registered',
        };
      }

      return {
        found: true,
        ...JSON.parse(statusStr),
      };
    }

    case 'agent_claim_task': {
      const validated = ClaimTaskSchema.parse(args);
      const { taskId, agentId, files = [], description = '' } = validated;
      
      // Check if task already claimed
      const existingTaskStr = await redis.get(TASK_KEY(taskId));
      if (existingTaskStr) {
        const existingTask = JSON.parse(existingTaskStr);
        if (existingTask.status === 'claimed' && existingTask.agentId !== agentId) {
          throw new Error(`Task ${taskId} is already claimed by agent ${existingTask.agentId}`);
        }
      }

      // Check for file conflicts
      const conflicts: Array<{ file: string; lockedBy: string }> = [];
      for (const file of files) {
        const normalizedFile = normalizeFilePath(file);
        const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
        if (lockStr) {
          const lock = JSON.parse(lockStr);
          if (lock.agentId !== agentId) {
            conflicts.push({ file: normalizedFile, lockedBy: lock.agentId });
          }
        }
      }

      const task = {
        taskId,
        agentId,
        files: files.map(normalizeFilePath),
        description,
        status: 'claimed',
        claimedAt: new Date().toISOString(),
        progress: 0,
      };

      await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL, JSON.stringify(task));
      await redis.zAdd(TASK_QUEUE_KEY, { score: Date.now(), value: taskId });

      return {
        success: true,
        taskId,
        agentId,
        claimedAt: task.claimedAt,
        conflicts: conflicts.length > 0 ? conflicts : [],
      };
    }

    case 'agent_release_task': {
      const { taskId, agentId } = args;
      
      const taskStr = await redis.get(TASK_KEY(taskId));
      if (!taskStr) {
        throw new Error(`Task ${taskId} not found`);
      }

      const task = JSON.parse(taskStr);
      if (task.agentId !== agentId) {
        throw new Error(`Task ${taskId} is claimed by different agent: ${task.agentId}`);
      }

      task.status = 'available';
      task.agentId = null;
      task.releasedAt = new Date().toISOString();

      await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL, JSON.stringify(task));

      return {
        success: true,
        taskId,
        releasedAt: task.releasedAt,
      };
    }

    case 'agent_list_tasks': {
      const { status = 'all', agentId = null } = args;
      
      const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
      const tasks = await Promise.all(
        taskIds.map(async (taskId) => {
          const taskStr = await redis.get(TASK_KEY(taskId));
          return taskStr ? JSON.parse(taskStr) : null;
        })
      );

      let filtered = tasks.filter((t) => t !== null);
      
      if (status !== 'all') {
        filtered = filtered.filter((t) => t.status === status);
      }
      
      if (agentId) {
        filtered = filtered.filter((t) => t.agentId === agentId);
      }

      return {
        tasks: filtered,
        total: filtered.length,
        byStatus: {
          available: filtered.filter((t) => t.status === 'available').length,
          claimed: filtered.filter((t) => t.status === 'claimed').length,
          completed: filtered.filter((t) => t.status === 'completed').length,
        },
      };
    }

    case 'agent_update_task_progress': {
      const { taskId, agentId, progress, message = '' } = args;
      
      const taskStr = await redis.get(TASK_KEY(taskId));
      if (!taskStr) {
        throw new Error(`Task ${taskId} not found`);
      }

      const task = JSON.parse(taskStr);
      if (task.agentId !== agentId) {
        throw new Error(`Task ${taskId} is claimed by different agent: ${task.agentId}`);
      }

      task.progress = progress;
      if (message) {
        task.lastMessage = message;
      }
      task.updatedAt = new Date().toISOString();

      await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL, JSON.stringify(task));

      return {
        success: true,
        taskId,
        progress,
        updatedAt: task.updatedAt,
      };
    }

    case 'agent_complete_task': {
      const { taskId, agentId } = args;
      
      const taskStr = await redis.get(TASK_KEY(taskId));
      if (!taskStr) {
        throw new Error(`Task ${taskId} not found`);
      }

      const task = JSON.parse(taskStr);
      if (task.agentId !== agentId) {
        throw new Error(`Task ${taskId} is claimed by different agent: ${task.agentId}`);
      }

      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.progress = 100;

      await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL * 24, JSON.stringify(task)); // Keep completed tasks longer

      return {
        success: true,
        taskId,
        completedAt: task.completedAt,
      };
    }

    case 'agent_lock_file': {
      const validated = LockFileSchema.parse(args);
      const { file, agentId, reason = '', ttl = COORDINATION_TTL } = validated;
      const normalizedFile = normalizeFilePath(file);
      
      // Check if already locked
      const existingLockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
      if (existingLockStr) {
        const existingLock = JSON.parse(existingLockStr);
        if (existingLock.agentId !== agentId) {
          throw new Error(`File ${file} is locked by agent ${existingLock.agentId}`);
        }
      }

      const lock = {
        file: normalizedFile,
        agentId,
        reason,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      };

      await redis.setEx(FILE_LOCK_KEY(normalizedFile), ttl, JSON.stringify(lock));
      
      // Update cache
      fileLockCache.set(normalizedFile, lock);

      return {
        success: true,
        file: normalizedFile,
        agentId,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
      };
    }

    case 'agent_unlock_file': {
      const { file, agentId } = args;
      const normalizedFile = normalizeFilePath(file);
      
      const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
      if (!lockStr) {
        return {
          success: true,
          file: normalizedFile,
          message: 'File was not locked',
        };
      }

      const lock = JSON.parse(lockStr);
      if (lock.agentId !== agentId) {
        throw new Error(`File ${file} is locked by different agent: ${lock.agentId}`);
      }

      await redis.del(FILE_LOCK_KEY(normalizedFile));
      
      // Update cache
      fileLockCache.delete(normalizedFile);

      return {
        success: true,
        file: normalizedFile,
        unlockedAt: new Date().toISOString(),
      };
    }

    case 'agent_check_file_lock': {
      const { file } = args;
      const normalizedFile = normalizeFilePath(file);
      
      // Check cache first
      const cached = fileLockCache.get(normalizedFile);
      if (cached !== undefined) {
        if (!cached) {
          return {
            locked: false,
            file: normalizedFile,
          };
        }
        return {
          locked: true,
          file: normalizedFile,
          agentId: cached.agentId,
          reason: cached.reason,
          lockedAt: cached.lockedAt,
          expiresAt: cached.expiresAt,
        };
      }
      
      // Fallback to Redis
      const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
      
      if (!lockStr) {
        fileLockCache.set(normalizedFile, null);
        return {
          locked: false,
          file: normalizedFile,
        };
      }

      const lock = JSON.parse(lockStr);
      fileLockCache.set(normalizedFile, lock);
      return {
        locked: true,
        file: normalizedFile,
        agentId: lock.agentId,
        reason: lock.reason,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
      };
    }

    case 'agent_list_locked_files': {
      const { agentId = null } = args;
      
      // Get all lock keys (this is a simplified approach - in production, maintain a set)
      const keys = await redis.keys(`${KEY_PREFIX}lock:*`);
      const locks = await Promise.all(
        keys.map(async (key) => {
          const lockStr = await redis.get(key);
          return lockStr ? JSON.parse(lockStr) : null;
        })
      );

      let filtered = locks.filter((l) => l !== null);
      
      if (agentId) {
        filtered = filtered.filter((l) => l.agentId === agentId);
      }

      return {
        files: filtered,
        total: filtered.length,
      };
    }

    case 'agent_detect_conflicts': {
      const validated = DetectConflictsSchema.parse(args);
      const { agentId, files } = validated;
      
      // Use batch operation for file lock checks
      const fileLocks = await batchGetFileLocks(files);
      const conflicts: Array<{ file: string; conflictingAgent: string; reason: string; severity: string }> = [];
      const warnings: Array<{ file: string; warning: string; severity: string }> = [];

      // Use batch-loaded locks
      for (const file of files) {
        const normalizedFile = normalizeFilePath(file);
        const lock = fileLocks.get(normalizedFile);
        
        if (lock && lock.agentId !== agentId) {
          conflicts.push({
            file: normalizedFile,
            conflictingAgent: lock.agentId,
            reason: `File is locked by ${lock.agentId}: ${lock.reason}`,
            severity: 'high',
          });
        }

        // Check if file is in any claimed task
        const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
        for (const taskId of taskIds) {
          const taskStr = await redis.get(TASK_KEY(taskId));
          if (taskStr) {
            const task = JSON.parse(taskStr);
            if (task.status === 'claimed' && task.agentId !== agentId && task.files.includes(normalizedFile)) {
              warnings.push({
                file: normalizedFile,
                warning: `File is part of task ${taskId} claimed by ${task.agentId}`,
                severity: 'medium',
              });
            }
          }
        }
      }

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
        warnings,
      };
    }

    case 'agent_check_file_overlap': {
      const { agentId, files } = args;
      const overlaps: Array<{ file: string; overlappingAgent: string; taskId?: string }> = [];

      for (const file of files) {
        const normalizedFile = normalizeFilePath(file);
        
        // Check locks
        const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
        if (lockStr) {
          const lock = JSON.parse(lockStr);
          if (lock.agentId !== agentId) {
            overlaps.push({
              file: normalizedFile,
              overlappingAgent: lock.agentId,
            });
          }
        }

        // Check tasks
        const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
        for (const taskId of taskIds) {
          const taskStr = await redis.get(TASK_KEY(taskId));
          if (taskStr) {
            const task = JSON.parse(taskStr);
            if (task.status === 'claimed' && task.agentId !== agentId && task.files.includes(normalizedFile)) {
              overlaps.push({
                file: normalizedFile,
                overlappingAgent: task.agentId,
                taskId: task.taskId,
              });
            }
          }
        }
      }

      return {
        hasOverlap: overlaps.length > 0,
        overlaps,
      };
    }

    case 'agent_suggest_coordination': {
      const { agentId, capabilities = [], preferredFiles = [] } = args;
      
      // Get all active agents
      const agentIds = await redis.zRangeByScore(ACTIVE_AGENTS_KEY, Date.now() - 300000, Date.now());
      const agents = await Promise.all(
        agentIds.map(async (id) => {
          const statusStr = await redis.get(AGENT_STATUS_KEY(id));
          return statusStr ? JSON.parse(statusStr) : null;
        })
      );
      const activeAgents = agents.filter((a) => a !== null && a.agentId !== agentId);

      // Get all tasks
      const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
      const tasks = await Promise.all(
        taskIds.map(async (taskId) => {
          const taskStr = await redis.get(TASK_KEY(taskId));
          return taskStr ? JSON.parse(taskStr) : null;
        })
      );
      const availableTasks = tasks.filter((t) => t !== null && t.status === 'available');

      // Get all locked files
      const lockKeys = await redis.keys(`${KEY_PREFIX}lock:*`);
      const lockedFiles = await Promise.all(
        lockKeys.map(async (key) => {
          const lockStr = await redis.get(key);
          return lockStr ? JSON.parse(lockStr) : null;
        })
      );
      const lockedFilePaths = lockedFiles.filter((l) => l !== null).map((l) => l.file);

      // Find safe files (not locked, not in claimed tasks)
      const safeFiles: string[] = [];
      if (preferredFiles.length > 0) {
        for (const file of preferredFiles) {
          const normalizedFile = normalizeFilePath(file);
          if (!lockedFilePaths.includes(normalizedFile)) {
            // Check if in any claimed task
            let inClaimedTask = false;
            for (const task of tasks) {
              if (task && task.status === 'claimed' && task.files.includes(normalizedFile)) {
                inClaimedTask = true;
                break;
              }
            }
            if (!inClaimedTask) {
              safeFiles.push(normalizedFile);
            }
          }
        }
      }

      // Generate warnings
      const warnings: string[] = [];
      for (const file of preferredFiles) {
        const normalizedFile = normalizeFilePath(file);
        if (lockedFilePaths.includes(normalizedFile)) {
          const lock = lockedFiles.find((l) => l && l.file === normalizedFile);
          if (lock) {
            warnings.push(`Avoid ${normalizedFile} (locked by ${lock.agentId})`);
          }
        }
      }

      return {
        recommendedTasks: availableTasks.slice(0, 5).map((t) => ({
          taskId: t.taskId,
          files: t.files,
          description: t.description,
          priority: 'medium',
        })),
        safeFiles: safeFiles.slice(0, 10),
        warnings,
        workload: {
          totalAgents: activeAgents.length + 1,
          activeAgents: activeAgents.filter((a) => a.status === 'working').length + 1,
          totalTasks: tasks.length,
          claimedTasks: tasks.filter((t) => t && t.status === 'claimed').length,
        },
      };
    }

    case 'agent_get_workload_distribution': {
      const agentIds = await redis.zRangeByScore(ACTIVE_AGENTS_KEY, Date.now() - 300000, Date.now());
      const agents = await Promise.all(
        agentIds.map(async (id) => {
          const statusStr = await redis.get(AGENT_STATUS_KEY(id));
          return statusStr ? JSON.parse(statusStr) : null;
        })
      );
      const activeAgents = agents.filter((a) => a !== null);

      const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
      const tasks = await Promise.all(
        taskIds.map(async (taskId) => {
          const taskStr = await redis.get(TASK_KEY(taskId));
          return taskStr ? JSON.parse(taskStr) : null;
        })
      );

      const distribution = activeAgents.map((agent) => {
        const agentTasks = tasks.filter((t) => t && t.agentId === agent.agentId);
        return {
          agentId: agent.agentId,
          status: agent.status,
          currentTask: agent.currentTask,
          progress: agent.progress || 0,
          taskCount: agentTasks.length,
          filesLocked: 0, // Would need to query locks
        };
      });

      return {
        agents: distribution,
        summary: {
          totalAgents: activeAgents.length,
          activeAgents: activeAgents.filter((a) => a.status === 'working').length,
          idleAgents: activeAgents.filter((a) => a.status === 'idle').length,
          totalTasks: tasks.length,
          claimedTasks: tasks.filter((t) => t && t.status === 'claimed').length,
          availableTasks: tasks.filter((t) => t && t.status === 'available').length,
        },
      };
    }

    case 'agent_find_available_work': {
      const { agentId, capabilities = [] } = args;
      
      const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
      const tasks = await Promise.all(
        taskIds.map(async (taskId) => {
          const taskStr = await redis.get(TASK_KEY(taskId));
          return taskStr ? JSON.parse(taskStr) : null;
        })
      );

      const availableTasks = tasks.filter((t) => t !== null && t.status === 'available');
      
      // Filter by capabilities if provided
      const matchingTasks = capabilities.length > 0
        ? availableTasks.filter((t) => {
            // Simple matching - could be enhanced
            return t.description && capabilities.some((cap: string) => 
              t.description.toLowerCase().includes(cap.toLowerCase())
            );
          })
        : availableTasks;

      return {
        tasks: matchingTasks.slice(0, 10),
        total: matchingTasks.length,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Cleanup function
async function cleanup() {
  try {
    if (redisHealthCheckTimer) {
      clearInterval(redisHealthCheckTimer);
      redisHealthCheckTimer = null;
    }
    
    if (redisClient?.isOpen) {
      await redisClient.quit();
    }
  } catch (_error) {
    // Ignore cleanup errors
  }
  redisClient = null;
  redisClientPromise = null;
}

// Main server setup
async function main() {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      const result = await handleTool(name, args || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                tool: name,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error(`[${SERVER_NAME}] Server v${SERVER_VERSION} running on stdio`);
  console.error(`[${SERVER_NAME}] Redis URL: ${REDIS_URL}`);
  console.error(`[${SERVER_NAME}] Coordination TTL: ${COORDINATION_TTL}s`);
  console.error(`[${SERVER_NAME}] Tools enabled: ${tools.length}`);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error(`[${SERVER_NAME}] Shutting down...`);
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error(`[${SERVER_NAME}] Shutting down...`);
    await cleanup();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  cleanup().finally(() => process.exit(1));
});

