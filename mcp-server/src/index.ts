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
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execa } from 'execa';
import simpleGit, { SimpleGit } from 'simple-git';
import * as dotenv from 'dotenv';

dotenv.config();

const SERVER_NAME = 'reconciliation-platform-mcp';
const SERVER_VERSION = '2.0.0';

// Configuration
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/Arief/Documents/GitHub/reconciliation-platform-378';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:2000';
const HEALTH_CHECK_CACHE_TTL = 5000; // 5 seconds
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const REDIS_CONNECT_TIMEOUT = 5000; // 5 seconds

// Connection instances (singleton pattern)
let docker: Docker | null = null;
let redisClient: RedisClientType | null = null;
let httpClient: AxiosInstance | null = null;
let git: SimpleGit | null = null;

// Health check cache
interface HealthCheckCache {
  data: any;
  timestamp: number;
}

const healthCheckCache = new Map<string, HealthCheckCache>();

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

// Initialize Redis client with connection pooling
async function initRedis(): Promise<RedisClientType> {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisClient && !redisClient.isOpen) {
    try {
      await redisClient.connect();
      return redisClient;
    } catch (error) {
      // Connection failed, create new client
      redisClient = null;
    }
  }

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
      console.error('Redis client error:', err);
    });

    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), REDIS_CONNECT_TIMEOUT)
      ),
    ]);

    return redisClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Redis connection failed: ${errorMessage}`);
  }
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
async function getHealthCheck(endpoint: string, useCache = true): Promise<any> {
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
];

// Tool implementations
async function handleTool(name: string, args: any): Promise<any> {
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

      // Try to parse JSON result if available
      let diagnosticData = null;
      try {
        const resultFile = `/tmp/reconciliation_diagnostic_*.json`;
        // Note: In production, you'd want to track the actual file name
        // For now, return the script output
      } catch (e) {
        // Ignore JSON parsing errors
      }

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
      const buildPath = join(PROJECT_ROOT, 'frontend', 'dist');

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

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Cleanup function
async function cleanup() {
  try {
    if (redisClient?.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    // Ignore cleanup errors
  }
  redisClient = null;
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
