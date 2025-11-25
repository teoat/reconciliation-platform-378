#!/usr/bin/env node
/**
 * Optimized MCP Server for Reconciliation Platform
 * 
 * Provides enhanced AI agent controls with:
 * - Docker container management (optimized)
 * - Redis cache operations (with connection pooling)
 * - Backend service health checks (with caching)
 * - Build and compilation status checks
 * - Diagnostic execution
 * 
 * Performance optimizations:
 * - Redis connection reuse
 * - Health check caching (5s TTL)
 * - Timeout handling for all operations
 * - Proper error handling and retries
 * - Resource cleanup
 * 
 * Note: Database queries use postgres MCP server, file operations use filesystem MCP server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Docker from 'dockerode';
import { createClient, RedisClientType } from 'redis';
import axios, { AxiosInstance } from 'axios';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { execa } from 'execa';
import simpleGit, { SimpleGit } from 'simple-git';
import si from 'systeminformation';
import * as dotenv from 'dotenv';

dotenv.config();

const SERVER_NAME = 'reconciliation-platform-mcp';
const SERVER_VERSION = '2.1.0';

// Configuration
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/Arief/Documents/GitHub/reconciliation-platform-378';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:2000';
const HEALTH_CHECK_CACHE_TTL = 5000; // 5 seconds
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const REDIS_CONNECT_TIMEOUT = 5000; // 5 seconds

// Connection instances (singleton pattern)
let docker: Docker | null = null;
let redisClient: RedisClientType | null = null;
let redisClientPromise: Promise<RedisClientType> | null = null; // Cached connection promise
let httpClient: AxiosInstance | null = null;
let git: SimpleGit | null = null;
let redisHealthCheckTimer: NodeJS.Timeout | null = null;

// Health check cache
interface HealthCheckCache {
  data: unknown;
  timestamp: number;
}

const healthCheckCache = new Map<string, HealthCheckCache>();

// Tool usage monitoring
interface ToolUsageMetrics {
  name: string;
  count: number;
  totalTime: number;
  avgTime: number;
  lastUsed: Date;
  errors: number;
  successRate: number;
}

const toolUsageMetrics = new Map<string, ToolUsageMetrics>();
const toolExecutionTimes: { [key: string]: number[] } = {};

// Track tool usage with Redis persistence
async function trackToolUsage(toolName: string, duration: number, success: boolean): Promise<void> {
  const existing = toolUsageMetrics.get(toolName) || {
    name: toolName,
    count: 0,
    totalTime: 0,
    avgTime: 0,
    lastUsed: new Date(),
    errors: 0,
    successRate: 100,
  };

  existing.count++;
  existing.totalTime += duration;
  existing.avgTime = existing.totalTime / existing.count;
  existing.lastUsed = new Date();
  
  if (!success) {
    existing.errors++;
  }
  
  existing.successRate = ((existing.count - existing.errors) / existing.count) * 100;

  if (!toolExecutionTimes[toolName]) {
    toolExecutionTimes[toolName] = [];
  }
  toolExecutionTimes[toolName].push(duration);
  
  // Keep only last 100 execution times
  if (toolExecutionTimes[toolName].length > 100) {
    toolExecutionTimes[toolName].shift();
  }

  toolUsageMetrics.set(toolName, existing);

  // Persist to Redis (non-blocking)
  try {
    const redis = await initRedis().catch(() => null);
    if (redis?.isOpen) {
      const key = `mcp:tool_usage:${toolName}`;
      const data = {
        name: existing.name,
        count: existing.count,
        totalTime: existing.totalTime,
        avgTime: existing.avgTime,
        lastUsed: existing.lastUsed.toISOString(),
        errors: existing.errors,
        successRate: existing.successRate,
      };
      
      // Store with 24 hour TTL
      await redis.setEx(key, 86400, JSON.stringify(data));
      
      // Also update aggregate stats
      await redis.zIncrBy('mcp:tool_usage:counts', 1, toolName);
      await redis.zIncrBy('mcp:tool_usage:total_time', duration, toolName);
    }
  } catch (error) {
    // Silently fail - Redis persistence is optional
    // Metrics are still tracked in-memory
  }
}

// Initialize Docker connection
function initDocker(): Docker | null {
  if (docker) return docker;
  
try {
  docker = new Docker();
    // Test connection
    docker.ping().catch(() => {
      docker = null;
    });
    return docker;
} catch (error) {
    console.error('Warning: Docker initialization failed:', error);
    return null;
  }
}

// Initialize Redis client with connection pooling and health monitoring
async function initRedis(): Promise<RedisClientType> {
  // Return existing connection if available
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Reuse existing connection promise if available
  if (redisClientPromise) {
    try {
      return await redisClientPromise;
    } catch {
      // Connection failed, reset and try again
      redisClientPromise = null;
    }
  }

  // Try to reconnect existing client
  if (redisClient && !redisClient.isOpen) {
    try {
      await redisClient.connect();
      return redisClient;
    } catch (_error) {
      // Connection failed, create new client
      redisClient = null;
    }
  }

  // Create new connection
  redisClientPromise = (async () => {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://:redis_pass@localhost:6379',
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
        console.error('[MCP Server] Redis client error:', err);
      });

      redisClient.on('connect', () => {
        console.log('[MCP Server] Redis connected');
      });

      redisClient.on('ready', () => {
        console.log('[MCP Server] Redis ready');
      });

      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), REDIS_CONNECT_TIMEOUT)
        ),
      ]);

      // Start health monitoring
      startRedisHealthMonitoring();

      redisClientPromise = null; // Clear promise after successful connection
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
    return; // Already monitoring
  }

  redisHealthCheckTimer = setInterval(async () => {
    if (redisClient?.isOpen) {
      try {
        await redisClient.ping();
      } catch (error) {
        console.warn('[MCP Server] Redis health check failed:', error);
        // Connection might be lost, reset client
        redisClient = null;
        redisClientPromise = null;
      }
    }
  }, 30000); // Check every 30 seconds
}

// Initialize HTTP client
function getHttpClient(): AxiosInstance {
  if (!httpClient) {
    httpClient = axios.create({
      timeout: DEFAULT_TIMEOUT,
      validateStatus: () => true, // Don't throw on any status
    });
  }
  return httpClient;
}

// Initialize Git client
function getGit(): SimpleGit {
  if (!git) {
    git = simpleGit(PROJECT_ROOT);
  }
  return git;
}

// Get cached health check or fetch new
async function getHealthCheck(endpoint: string, useCache = true): Promise<unknown> {
  const cacheKey = endpoint;
  const cached = healthCheckCache.get(cacheKey);

  if (useCache && cached && Date.now() - cached.timestamp < HEALTH_CHECK_CACHE_TTL) {
    return cached.data;
  }

  try {
    const client = getHttpClient();
    const response = await client.get(endpoint);
    
    const result = {
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      data: response.data,
      statusCode: response.status,
      timestamp: new Date().toISOString(),
    };

    if (useCache) {
      healthCheckCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
    }

    return result;
  } catch (error: any) {
    const result = {
      status: 'unhealthy',
      error: error.message,
      statusCode: error.response?.status || 0,
      timestamp: new Date().toISOString(),
    };

    if (useCache) {
      healthCheckCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
    }

    return result;
  }
}

// Execute shell command with timeout
async function execCommand(
  command: string,
  args: string[],
  options: { cwd?: string; timeout?: number } = {}
): Promise<{ success: boolean; output: string; error?: string; exitCode?: number }> {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd || PROJECT_ROOT,
      timeout: options.timeout || DEFAULT_TIMEOUT,
      reject: false,
      all: true, // Capture both stdout and stderr
    });

    return {
      success: result.exitCode === 0,
      output: result.all || result.stdout || '',
      error: result.exitCode !== 0 ? result.stderr : undefined,
      exitCode: result.exitCode,
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message || String(error),
      exitCode: error.exitCode || 1,
    };
  }
}

// Tool definitions - Only essential tools enabled
const tools: Tool[] = [
  {
    name: 'docker_container_status',
    description: 'Get status of Docker containers (running, stopped, all)',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'running', 'stopped'],
          description: 'Filter containers by status',
          default: 'all',
        },
        name: {
          type: 'string',
          description: 'Filter by container name pattern (optional)',
        },
      },
    },
  },
  {
    name: 'docker_container_logs',
    description: 'Get logs from a Docker container',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
        tail: {
          type: 'number',
          description: 'Number of lines to tail',
          default: 100,
        },
      },
      required: ['container'],
    },
  },
  {
    name: 'docker_container_restart',
    description: 'Restart a Docker container',
    inputSchema: {
      type: 'object',
      properties: {
        container: {
          type: 'string',
          description: 'Container name or ID',
        },
      },
      required: ['container'],
    },
  },
  {
    name: 'backend_health_check',
    description: 'Check backend health status with caching (5s TTL)',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'Health endpoint URL',
          default: `${BACKEND_URL}/health`,
        },
        useCache: {
          type: 'boolean',
          description: 'Use cached result if available',
          default: true,
        },
      },
    },
  },
  {
    name: 'redis_get',
    description: 'Get value from Redis cache',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Redis key',
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'redis_keys',
    description: 'List Redis keys matching a pattern (use with caution on large datasets)',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Key pattern (supports * wildcard)',
          default: '*',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of keys to return',
          default: 100,
        },
      },
    },
  },
  {
    name: 'backend_compile_check',
    description: 'Check if backend compiles without errors using cargo check',
    inputSchema: {
      type: 'object',
      properties: {
        verbose: {
          type: 'boolean',
          description: 'Show verbose compilation output',
          default: false,
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 120000, // 2 minutes
        },
      },
    },
  },
  {
    name: 'run_diagnostic',
    description: 'Run comprehensive application diagnostic script',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['full', 'backend', 'frontend', 'database', 'redis', 'containers'],
          description: 'Diagnostic scope',
          default: 'full',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 300000, // 5 minutes
        },
      },
    },
  },
  {
    name: 'frontend_build_status',
    description: 'Check frontend build status and analyze bundle size',
    inputSchema: {
      type: 'object',
      properties: {
        checkSize: {
          type: 'boolean',
          description: 'Calculate total build size',
          default: true,
        },
      },
    },
  },
  // Git Operations (Essential)
  {
    name: 'git_status',
    description: 'Get git status (staged, unstaged, untracked files)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'git_branch_list',
    description: 'List all branches (local and remote)',
    inputSchema: {
      type: 'object',
      properties: {
        all: {
          type: 'boolean',
          description: 'Include remote branches',
          default: true,
        },
      },
    },
  },
  {
    name: 'git_branch_create',
    description: 'Create a new branch',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Branch name',
        },
        checkout: {
          type: 'boolean',
          description: 'Checkout the new branch',
          default: true,
        },
      },
      required: ['branch'],
    },
  },
  {
    name: 'git_commit',
    description: 'Create a commit with message',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message',
        },
        all: {
          type: 'boolean',
          description: 'Stage all changes before commit',
          default: false,
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'git_log',
    description: 'Show commit history',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of commits to show',
          default: 10,
        },
        branch: {
          type: 'string',
          description: 'Branch name (optional)',
        },
      },
    },
  },
  // Test Execution (Essential)
  {
    name: 'run_backend_tests',
    description: 'Run Rust backend tests with optional filter',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Test filter pattern',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 180000, // 3 minutes
        },
      },
    },
  },
  {
    name: 'run_frontend_tests',
    description: 'Run TypeScript/React frontend tests',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Test filter pattern',
        },
        coverage: {
          type: 'boolean',
          description: 'Generate coverage report',
          default: false,
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 120000, // 2 minutes
        },
      },
    },
  },
  {
    name: 'run_e2e_tests',
    description: 'Run Playwright E2E tests',
    inputSchema: {
      type: 'object',
      properties: {
        spec: {
          type: 'string',
          description: 'Specific test file',
        },
        headed: {
          type: 'boolean',
          description: 'Run in headed mode',
          default: false,
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 600000, // 10 minutes
        },
      },
    },
  },
  // Code Quality (Essential)
  {
    name: 'run_linter',
    description: 'Run ESLint on frontend code',
    inputSchema: {
      type: 'object',
      properties: {
        fix: {
          type: 'boolean',
          description: 'Auto-fix issues',
          default: false,
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 60000, // 1 minute
        },
      },
    },
  },
  {
    name: 'run_clippy',
    description: 'Run clippy on Rust backend code',
    inputSchema: {
      type: 'object',
      properties: {
        fix: {
          type: 'boolean',
          description: 'Apply automatic fixes',
          default: false,
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 120000, // 2 minutes
        },
      },
    },
  },
  {
    name: 'check_types',
    description: 'Run TypeScript type checking',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          enum: ['frontend', 'all'],
          description: 'Project to check',
          default: 'all',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 60000, // 1 minute
        },
      },
    },
  },
  // Migration Management (Essential)
  {
    name: 'list_migrations',
    description: 'List all migrations and their status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'run_migration',
    description: 'Run database migrations',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target migration (optional, runs all if not specified)',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 120000, // 2 minutes
        },
      },
    },
  },
  // Tool Usage Monitoring
  {
    name: 'get_tool_usage_stats',
    description: 'Get usage statistics for all tools (monitoring)',
    inputSchema: {
      type: 'object',
      properties: {
        tool: {
          type: 'string',
          description: 'Specific tool name (optional, returns all if not specified)',
        },
      },
    },
  },
  // Security Scanning
  {
    name: 'run_security_audit',
    description: 'Run security audit (npm audit for frontend, cargo audit for backend)',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['frontend', 'backend', 'all'],
          description: 'Scope of security audit',
          default: 'all',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 300000, // 5 minutes
        },
      },
    },
  },
  // Performance Monitoring
  {
    name: 'get_system_metrics',
    description: 'Get system performance metrics (CPU, memory, disk)',
    inputSchema: {
      type: 'object',
      properties: {
        includeProcesses: {
          type: 'boolean',
          description: 'Include process information',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_performance_summary',
    description: 'Get performance summary (tool usage, system health, recommendations)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool implementations with monitoring wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTool(name: string, args: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    const result = await executeTool(name, args);
    const duration = Date.now() - startTime;
    await trackToolUsage(name, duration, true);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await trackToolUsage(name, duration, false);
    throw error;
  }
}

// Actual tool execution (separated for monitoring)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'docker_container_status': {
      const dockerInstance = initDocker();
      if (!dockerInstance) {
        throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
      }

      try {
        const containers = await dockerInstance.listContainers({ all: args.filter === 'all' });
      let filtered = containers;
      
      if (args.name) {
        filtered = containers.filter((c: any) => 
          c.Names.some((n: string) => n.includes(args.name))
        );
      }
      
      if (args.filter === 'running') {
        filtered = filtered.filter((c: any) => c.State === 'running');
      } else if (args.filter === 'stopped') {
        filtered = filtered.filter((c: any) => c.State !== 'running');
      }
      
      return {
        containers: filtered.map((c: any) => ({
            id: c.Id.substring(0, 12),
            name: c.Names[0]?.replace(/^\//, '') || 'unknown',
          image: c.Image,
          status: c.Status,
          state: c.State,
            ports: c.Ports?.map((p: any) => `${p.PublicPort}:${p.PrivatePort}/${p.Type}`) || [],
        })),
        count: filtered.length,
      };
      } catch (error: any) {
        throw new Error(`Docker operation failed: ${error.message}`);
      }
    }

    case 'docker_container_logs': {
      const dockerInstance = initDocker();
      if (!dockerInstance) {
        throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
      }

      try {
        const container = dockerInstance.getContainer(args.container);
      const logs = await container.logs({
        tail: args.tail || 100,
        stdout: true,
        stderr: true,
          timestamps: true,
      });

      return {
        logs: logs.toString('utf-8'),
        container: args.container,
          lines: args.tail || 100,
        };
      } catch (error: any) {
        throw new Error(`Failed to get container logs: ${error.message}`);
      }
    }

    case 'docker_container_restart': {
      const dockerInstance = initDocker();
      if (!dockerInstance) {
        throw new Error('Docker is not available. Please ensure Docker is running and accessible.');
      }

      try {
        const container = dockerInstance.getContainer(args.container);
        await container.restart({ t: 10 }); // 10 second timeout
      const info = await container.inspect();

      return {
        success: true,
        container: args.container,
        status: info.State.Status,
          startedAt: info.State.StartedAt,
      };
      } catch (error: any) {
        throw new Error(`Failed to restart container: ${error.message}`);
      }
    }

    case 'backend_health_check': {
      const endpoint = args.endpoint || `${BACKEND_URL}/health`;
      return await getHealthCheck(endpoint, args.useCache !== false);
    }

    case 'redis_get': {
      try {
      const client = await initRedis();
      const value = await client.get(args.key);
      return {
        key: args.key,
        value: value,
        exists: value !== null,
      };
      } catch (error: any) {
        throw new Error(`Redis operation failed: ${error.message}`);
      }
    }

    case 'redis_keys': {
      try {
      const client = await initRedis();
        const pattern = args.pattern || '*';
        const limit = args.limit || 100;

        // Use SCAN instead of KEYS for better performance on large datasets
        const keys: string[] = [];
        const iterator = client.scanIterator({
          MATCH: pattern,
          COUNT: limit,
        });

        for await (const key of iterator) {
          keys.push(key);
          if (keys.length >= limit) break;
        }

      return {
          keys,
        count: keys.length,
          pattern,
          limited: keys.length >= limit,
      };
      } catch (error: any) {
        throw new Error(`Redis operation failed: ${error.message}`);
      }
    }

    case 'backend_compile_check': {
      const backendDir = join(PROJECT_ROOT, 'backend');
      
      if (!existsSync(backendDir)) {
        throw new Error(`Backend directory not found: ${backendDir}`);
      }

      const timeout = args.timeout || 120000;
      const verbose = args.verbose || false;

      const result = await execCommand(
        'cargo',
        ['check', ...(verbose ? ['--verbose'] : [])],
        {
          cwd: backendDir,
          timeout,
        }
      );

      return {
        success: result.success,
        compiled: result.success,
        output: verbose ? result.output : result.output.split('\n').slice(-20).join('\n'), // Last 20 lines if not verbose
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_diagnostic': {
      const scriptPath = join(PROJECT_ROOT, 'scripts', 'comprehensive-diagnostic.sh');
      
      if (!existsSync(scriptPath)) {
        throw new Error(`Diagnostic script not found: ${scriptPath}`);
      }

      const timeout = args.timeout || 300000;
      const scope = args.scope || 'full';

      // Run diagnostic script
      const result = await execCommand('bash', [scriptPath], {
        cwd: PROJECT_ROOT,
        timeout,
      });

      // Diagnostic script output is returned directly

      return {
        success: result.success,
        scope,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        message: result.success
          ? 'Diagnostic completed successfully'
          : 'Diagnostic encountered errors',
      };
    }

    case 'frontend_build_status': {
      const distPath = join(PROJECT_ROOT, 'frontend', 'dist');
      
      try {
        if (!existsSync(distPath)) {
          return {
            exists: false,
            path: distPath,
            message: 'Frontend build directory does not exist. Run: cd frontend && npm run build',
          };
        }

        const stats = statSync(distPath);
        const files = readdirSync(distPath, { recursive: true });

        let totalSize = 0;
        if (args.checkSize !== false) {
          // Calculate total size (simplified - would need recursive stat for accurate size)
          totalSize = stats.size;
        }

        // Check for common build artifacts
        const hasIndex = files.some((f) => f.toString().includes('index.html'));
        const hasAssets = files.some((f) => f.toString().includes('assets'));
        
        return {
          exists: true,
          path: distPath,
          fileCount: files.length,
          lastModified: stats.mtime.toISOString(),
          totalSize: totalSize > 0 ? `${(totalSize / 1024 / 1024).toFixed(2)} MB` : 'unknown',
          hasIndexHtml: hasIndex,
          hasAssets: hasAssets,
          buildStatus: hasIndex && hasAssets ? 'complete' : 'incomplete',
        };
      } catch (error: any) {
        return {
          exists: false,
          path: distPath,
          error: error.message,
        };
      }
    }

    // Git Operations
    case 'git_status': {
      try {
        const gitInstance = getGit();
        const status = await gitInstance.status();
        // Extract file lists safely
        const staged = status.staged || [];
        const notAdded = status.not_added || [];
        const modified = status.modified || [];
        const conflicted = status.conflicted || [];
        
      return {
          current: status.current,
          branch: status.current,
          ahead: status.ahead,
          behind: status.behind,
          files: {
            staged,
            unstaged: notAdded,
            modified,
            conflicted,
          },
          clean: status.isClean(),
          totalChanges: status.files?.length || 0,
        };
      } catch (error: any) {
        throw new Error(`Git status failed: ${error.message}`);
      }
    }

    case 'git_branch_list': {
      try {
        const gitInstance = getGit();
        const branches = await gitInstance.branchLocal();
        const remoteBranches = args.all !== false ? await gitInstance.branch(['-r']) : null;
        
        return {
          local: branches.all,
          current: branches.current,
          remote: remoteBranches?.all || [],
        };
      } catch (error: any) {
        throw new Error(`Git branch list failed: ${error.message}`);
      }
    }

    case 'git_branch_create': {
      try {
        const gitInstance = getGit();
        await gitInstance.checkoutLocalBranch(args.branch);
        
        if (args.checkout !== false) {
          await gitInstance.checkout(args.branch);
        }

        return {
          success: true,
          branch: args.branch,
          checkedOut: args.checkout !== false,
        };
      } catch (error: any) {
        throw new Error(`Git branch create failed: ${error.message}`);
      }
    }

    case 'git_commit': {
      try {
        const gitInstance = getGit();
        
        if (args.all) {
          await gitInstance.add('.');
        }

        const commit = await gitInstance.commit(args.message);
        
        return {
          success: true,
          commit: commit.commit,
          summary: commit.summary,
        };
      } catch (error: any) {
        throw new Error(`Git commit failed: ${error.message}`);
      }
    }

    case 'git_log': {
      try {
        const gitInstance = getGit();
        const limit = args.limit || 10;
        const logOptions = args.branch ? [args.branch, `-n${limit}`] : [`-n${limit}`];
        
        const log = await gitInstance.log(logOptions);
        
        return {
          commits: log.all.slice(0, limit).map((commit) => ({
            hash: commit.hash,
            date: commit.date,
            message: commit.message,
            author: commit.author_name,
          })),
          total: log.total,
        };
      } catch (error: any) {
        throw new Error(`Git log failed: ${error.message}`);
      }
    }

    // Test Execution
    case 'run_backend_tests': {
      const backendDir = join(PROJECT_ROOT, 'backend');
      
      if (!existsSync(backendDir)) {
        throw new Error(`Backend directory not found: ${backendDir}`);
      }

      const timeout = args.timeout || 180000;
      const testArgs = ['test', '--lib'];
      
      if (args.filter) {
        testArgs.push('--', args.filter);
      }

      const result = await execCommand('cargo', testArgs, {
        cwd: backendDir,
        timeout,
      });

      return {
        success: result.success,
        passed: result.success,
        output: result.output.split('\n').slice(-30).join('\n'), // Last 30 lines
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_frontend_tests': {
      const frontendDir = join(PROJECT_ROOT, 'frontend');
      
      if (!existsSync(frontendDir)) {
        throw new Error(`Frontend directory not found: ${frontendDir}`);
      }

      const timeout = args.timeout || 120000;
      const testArgs = ['test', '--', '--run'];
      
      if (args.filter) {
        testArgs.push('--grep', args.filter);
      }
      
      if (args.coverage) {
        testArgs.push('--coverage');
      }

      const result = await execCommand('npm', testArgs, {
        cwd: frontendDir,
        timeout,
      });

      return {
        success: result.success,
        passed: result.success,
        output: result.output.split('\n').slice(-30).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_e2e_tests': {
      const frontendDir = join(PROJECT_ROOT, 'frontend');
      
      if (!existsSync(frontendDir)) {
        throw new Error(`Frontend directory not found: ${frontendDir}`);
      }

      const timeout = args.timeout || 600000;
      const testArgs = ['run', 'test:e2e'];
      
      if (args.spec) {
        testArgs.push('--', args.spec);
      }
      
      if (args.headed) {
        testArgs.push('--', '--headed');
      }

      const result = await execCommand('npm', testArgs, {
        cwd: frontendDir,
        timeout,
      });

      return {
        success: result.success,
        passed: result.success,
        output: result.output.split('\n').slice(-30).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    // Code Quality
    case 'run_linter': {
      const frontendDir = join(PROJECT_ROOT, 'frontend');
      
      if (!existsSync(frontendDir)) {
        throw new Error(`Frontend directory not found: ${frontendDir}`);
      }

      const timeout = args.timeout || 60000;
      const lintArgs = ['run', 'lint'];
      
      if (args.fix) {
        lintArgs.push('--', '--fix');
      }

      const result = await execCommand('npm', lintArgs, {
        cwd: frontendDir,
        timeout,
      });

      return {
        success: result.success,
        fixed: args.fix && result.success,
        output: result.output.split('\n').slice(-20).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_clippy': {
      const backendDir = join(PROJECT_ROOT, 'backend');
      
      if (!existsSync(backendDir)) {
        throw new Error(`Backend directory not found: ${backendDir}`);
      }

      const timeout = args.timeout || 120000;
      const clippyArgs = ['clippy', '--', '-D', 'warnings'];
      
      if (args.fix) {
        clippyArgs.push('--fix');
      }

      const result = await execCommand('cargo', clippyArgs, {
        cwd: backendDir,
        timeout,
      });

      return {
        success: result.success,
        fixed: args.fix && result.success,
        output: result.output.split('\n').slice(-20).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'check_types': {
      const timeout = args.timeout || 60000;
      const project = args.project || 'all';
      
      if (project === 'frontend' || project === 'all') {
        const frontendDir = join(PROJECT_ROOT, 'frontend');
        
        if (!existsSync(frontendDir)) {
          throw new Error(`Frontend directory not found: ${frontendDir}`);
        }

        const result = await execCommand('npm', ['run', 'type-check'], {
          cwd: frontendDir,
          timeout,
        });

        return {
          success: result.success,
          project: 'frontend',
          output: result.output.split('\n').slice(-20).join('\n'),
          error: result.error,
          exitCode: result.exitCode,
        };
      }

      throw new Error(`Unknown project: ${project}`);
    }

    // Migration Management
    case 'list_migrations': {
      const migrationsDir = join(PROJECT_ROOT, 'backend', 'migrations');
      
      if (!existsSync(migrationsDir)) {
        return {
          migrations: [],
          message: 'Migrations directory not found',
        };
      }

      try {
        const files = readdirSync(migrationsDir);
        const migrations = files
          .filter((f) => f.endsWith('.sql'))
          .map((f) => {
            const stats = statSync(join(migrationsDir, f));
            return {
              name: f,
              size: stats.size,
              modified: stats.mtime.toISOString(),
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        return {
          migrations,
          count: migrations.length,
          path: migrationsDir,
        };
      } catch (error: any) {
        throw new Error(`Failed to list migrations: ${error.message}`);
      }
    }

    case 'run_migration': {
      const backendDir = join(PROJECT_ROOT, 'backend');
      
      if (!existsSync(backendDir)) {
        throw new Error(`Backend directory not found: ${backendDir}`);
      }

      const timeout = args.timeout || 120000;
      const migrateArgs = ['run', '--bin', 'migrate'];
      
      if (args.target) {
        migrateArgs.push('--', '--target', args.target);
      }

      const result = await execCommand('cargo', migrateArgs, {
        cwd: backendDir,
        timeout,
      });

      return {
        success: result.success,
        migrated: result.success,
        output: result.output.split('\n').slice(-20).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    // Tool Usage Monitoring
    case 'get_tool_usage_stats': {
      if (args.tool) {
        const metrics = toolUsageMetrics.get(args.tool);
        if (!metrics) {
          return {
            tool: args.tool,
            message: 'No usage data available for this tool',
          };
        }
        
        const times = toolExecutionTimes[args.tool] || [];
        const sortedTimes = [...times].sort((a, b) => a - b);
        const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
        const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
        const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
        
        return {
          ...metrics,
          percentiles: {
            p50,
            p95,
            p99,
          },
          recentExecutions: times.slice(-10),
        };
      }
      
      // Return all metrics
      const allMetrics = Array.from(toolUsageMetrics.values());
      const totalCalls = allMetrics.reduce((sum, m) => sum + m.count, 0);
      const totalTime = allMetrics.reduce((sum, m) => sum + m.totalTime, 0);
      
      return {
        summary: {
          totalTools: allMetrics.length,
          totalCalls,
          totalTime,
          avgTimePerCall: totalCalls > 0 ? totalTime / totalCalls : 0,
        },
        tools: allMetrics.sort((a, b) => b.count - a.count),
      };
    }

    // Security Scanning
    case 'run_security_audit': {
      const scope = args.scope || 'all';
      const timeout = args.timeout || 300000;
      const results: Record<string, unknown> = {};
      
      if (scope === 'frontend' || scope === 'all') {
        const frontendDir = join(PROJECT_ROOT, 'frontend');
        if (existsSync(frontendDir)) {
          const result = await execCommand('npm', ['audit', '--json'], {
            cwd: frontendDir,
            timeout,
          });
          
          try {
            const auditData = JSON.parse(result.output);
            results.frontend = {
              success: result.success,
              vulnerabilities: auditData.vulnerabilities || {},
              summary: auditData.metadata?.vulnerabilities || {},
              output: result.output.split('\n').slice(-20).join('\n'),
            };
          } catch {
            results.frontend = {
              success: result.success,
              output: result.output,
              error: 'Failed to parse audit output',
            };
          }
        }
      }
      
      if (scope === 'backend' || scope === 'all') {
        const backendDir = join(PROJECT_ROOT, 'backend');
        if (existsSync(backendDir)) {
          // Check if cargo-audit is available
          const checkResult = await execCommand('cargo', ['audit', '--version'], {
            cwd: backendDir,
            timeout: 5000,
          });
          
          if (checkResult.success) {
            const result = await execCommand('cargo', ['audit', '--json'], {
              cwd: backendDir,
              timeout,
            });
            
            try {
              const auditData = JSON.parse(result.output);
              results.backend = {
                success: result.success,
                vulnerabilities: auditData.vulnerabilities || [],
                summary: auditData.summary || {},
                output: result.output.split('\n').slice(-20).join('\n'),
              };
            } catch {
              results.backend = {
                success: result.success,
                output: result.output,
                error: 'Failed to parse audit output',
              };
            }
          } else {
            results.backend = {
              success: false,
              message: 'cargo-audit not installed. Install with: cargo install cargo-audit',
            };
          }
        }
      }
      
      return {
        scope,
        results,
        timestamp: new Date().toISOString(),
      };
    }

    // Performance Monitoring
    case 'get_system_metrics': {
      try {
        const [cpu, mem, fs, processes] = await Promise.all([
          si.currentLoad(),
          si.mem(),
          si.fsSize(),
          args.includeProcesses ? si.processes() : Promise.resolve(null),
        ]);
        
        return {
          cpu: {
            currentLoad: cpu.currentLoad,
            avgLoad: cpu.avgload,
            cores: cpu.cpus?.length || 0,
          },
          memory: {
            total: mem.total,
            used: mem.used,
            free: mem.free,
            usagePercent: ((mem.used / mem.total) * 100).toFixed(2),
          },
          disk: fs.map((f) => ({
            fs: f.fs,
            size: f.size,
            used: f.used,
            available: f.available,
            usagePercent: ((f.used / f.size) * 100).toFixed(2),
          })),
          processes: args.includeProcesses && processes ? {
            total: processes.all?.length || 0,
            running: processes.running || 0,
            sleeping: processes.sleeping || 0,
            topCpu: processes.list?.slice(0, 5).map((p) => ({
              pid: p.pid,
              name: p.name,
              cpu: p.cpu,
            })) || [],
          } : undefined,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        throw new Error(`Failed to get system metrics: ${error.message}`);
      }
    }

    case 'get_performance_summary': {
      try {
        // Get tool usage stats
        const toolStats = Array.from(toolUsageMetrics.values());
        const mostUsed = toolStats.sort((a, b) => b.count - a.count).slice(0, 5);
        const slowest = toolStats.sort((a, b) => b.avgTime - a.avgTime).slice(0, 5);
        const errorProne = toolStats.filter((t) => t.errors > 0).sort((a, b) => b.errors - a.errors).slice(0, 5);
        
        // Get system metrics
        const [cpu, mem] = await Promise.all([
          si.currentLoad(),
          si.mem(),
        ]);
        
        // Get backend health
        const backendHealth = await getHealthCheck(`${BACKEND_URL}/health`, false).catch(() => null);
        
        // Recommendations
        const recommendations: string[] = [];
        
        if (mem.used / mem.total > 0.9) {
          recommendations.push('Memory usage is high (>90%). Consider optimizing or scaling.');
        }
        
        if (cpu.currentLoad > 80) {
          recommendations.push('CPU usage is high (>80%). Consider optimizing processes.');
        }
        
        const slowTools = toolStats.filter((t) => t.avgTime > 5000);
        if (slowTools.length > 0) {
          recommendations.push(`Some tools are slow (avg >5s): ${slowTools.map((t) => t.name).join(', ')}`);
        }
        
        const highErrorRate = toolStats.filter((t) => t.successRate < 90);
        if (highErrorRate.length > 0) {
          recommendations.push(`Some tools have high error rates: ${highErrorRate.map((t) => `${t.name} (${(100 - t.successRate).toFixed(1)}%)`).join(', ')}`);
        }
        
        return {
          toolUsage: {
            totalTools: toolStats.length,
            totalCalls: toolStats.reduce((sum, t) => sum + t.count, 0),
            mostUsed,
            slowest,
            errorProne,
          },
          systemHealth: {
            cpu: {
              load: cpu.currentLoad,
              cores: cpu.cpus?.length || 0,
            },
            memory: {
              usagePercent: ((mem.used / mem.total) * 100).toFixed(2),
              total: mem.total,
              used: mem.used,
            },
          },
          backendHealth: backendHealth ? {
            status: backendHealth.status,
            timestamp: backendHealth.timestamp,
          } : null,
          recommendations,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        throw new Error(`Failed to get performance summary: ${error.message}`);
      }
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
  git = null;
  healthCheckCache.clear();
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
  console.error(`[${SERVER_NAME}] Project root: ${PROJECT_ROOT}`);
  console.error(`[${SERVER_NAME}] Backend URL: ${BACKEND_URL}`);
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
