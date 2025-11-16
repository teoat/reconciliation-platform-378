#!/usr/bin/env node
/**
 * MCP Server for Reconciliation Platform
 * 
 * Provides enhanced AI agent controls for:
 * - Docker container management
 * - Redis cache operations
 * - Backend service management
 * - Frontend build/deployment
 * - Health checks and diagnostics
 * 
 * Note: Database queries use postgres MCP server, file operations use filesystem MCP server,
 * and metrics use prometheus MCP server to avoid redundancy.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Docker from 'dockerode';
import { createClient } from 'redis';
import axios from 'axios';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SERVER_NAME = 'reconciliation-platform-mcp';
const SERVER_VERSION = '1.0.0';

// Initialize connections
const docker = new Docker();
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client
async function initRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://:redis_pass@localhost:6379',
    });
    await redisClient.connect();
  }
  return redisClient;
}

// Tool definitions
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
    name: 'docker_container_start',
    description: 'Start a Docker container',
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
    name: 'docker_container_stop',
    description: 'Stop a Docker container',
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
    description: 'Check backend health status and get detailed metrics',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'Health endpoint URL',
          default: 'http://localhost:2000/health',
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
    description: 'List Redis keys matching a pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Key pattern (supports * wildcard)',
          default: '*',
        },
      },
    },
  },
  {
    name: 'redis_delete',
    description: 'Delete a key from Redis',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Redis key to delete',
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'run_diagnostic',
    description: 'Run comprehensive application diagnostic',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['full', 'backend', 'frontend', 'database', 'redis', 'containers'],
          description: 'Diagnostic scope',
          default: 'full',
        },
      },
    },
  },
  {
    name: 'frontend_build_status',
    description: 'Check frontend build status and analyze bundle',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'backend_compile_check',
    description: 'Check if backend compiles without errors',
    inputSchema: {
      type: 'object',
      properties: {
        verbose: {
          type: 'boolean',
          description: 'Show verbose compilation output',
          default: false,
        },
      },
    },
  },
];

// Tool implementations
async function handleTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'docker_container_status': {
      const containers = await docker.listContainers({ all: args.filter === 'all' });
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
          id: c.Id,
          name: c.Names[0],
          image: c.Image,
          status: c.Status,
          state: c.State,
          ports: c.Ports,
        })),
        count: filtered.length,
      };
    }

    case 'docker_container_logs': {
      const container = docker.getContainer(args.container);
      const logs = await container.logs({
        tail: args.tail || 100,
        stdout: true,
        stderr: true,
      });
      return {
        logs: logs.toString('utf-8'),
        container: args.container,
      };
    }

    case 'docker_container_start': {
      const container = docker.getContainer(args.container);
      await container.start();
      const info = await container.inspect();
      return {
        success: true,
        container: args.container,
        status: info.State.Status,
      };
    }

    case 'docker_container_stop': {
      const container = docker.getContainer(args.container);
      await container.stop();
      const info = await container.inspect();
      return {
        success: true,
        container: args.container,
        status: info.State.Status,
      };
    }

    case 'docker_container_restart': {
      const container = docker.getContainer(args.container);
      await container.restart();
      const info = await container.inspect();
      return {
        success: true,
        container: args.container,
        status: info.State.Status,
      };
    }

    case 'backend_health_check': {
      try {
        const response = await axios.get(args.endpoint || 'http://localhost:2000/health', {
          timeout: 5000,
        });
        return {
          status: 'healthy',
          data: response.data,
          statusCode: response.status,
        };
      } catch (error: any) {
        return {
          status: 'unhealthy',
          error: error.message,
          statusCode: error.response?.status,
        };
      }
    }

    case 'redis_get': {
      const client = await initRedis();
      const value = await client.get(args.key);
      return {
        key: args.key,
        value: value,
        exists: value !== null,
      };
    }

    case 'redis_keys': {
      const client = await initRedis();
      const keys = await client.keys(args.pattern || '*');
      return {
        keys: keys,
        count: keys.length,
      };
    }

    case 'redis_delete': {
      const client = await initRedis();
      const deleted = await client.del(args.key);
      return {
        key: args.key,
        deleted: deleted > 0,
      };
    }

    case 'run_diagnostic': {
      // This would call the diagnostic script
      // For now, return a placeholder
      return {
        scope: args.scope || 'full',
        status: 'pending',
        message: 'Run ./scripts/comprehensive-diagnostic.sh for full diagnostic',
      };
    }

    case 'frontend_build_status': {
      const projectRoot = process.env.PROJECT_ROOT || '/Users/Arief/Desktop/378';
      const distPath = join(projectRoot, 'frontend', 'dist');
      
      try {
        const stats = statSync(distPath);
        const files = readdirSync(distPath, { recursive: true });
        
        return {
          exists: true,
          path: distPath,
          fileCount: files.length,
          lastModified: stats.mtime.toISOString(),
        };
      } catch (error: any) {
        return {
          exists: false,
          path: distPath,
          error: error.message,
        };
      }
    }

    case 'backend_compile_check': {
      // This would run cargo check
      return {
        status: 'pending',
        message: 'Use backend_compile_check tool or run cargo check in backend directory',
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
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
            text: JSON.stringify({
              error: error.message,
              stack: error.stack,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Reconciliation Platform MCP Server running on stdio');
}

main().catch(console.error);

