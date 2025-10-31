#!/usr/bin/env node
/**
 * MCP Server for Reconciliation Platform
 * 
 * Provides enhanced AI agent controls for:
 * - Docker container management
 * - Database operations
 * - Redis cache operations
 * - Backend service management
 * - Frontend build/deployment
 * - Health checks and diagnostics
 * - Log aggregation and analysis
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Docker from 'dockerode';
import { Pool } from 'pg';
import { createClient } from 'redis';
import axios from 'axios';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SERVER_NAME = 'reconciliation-platform-mcp';
const SERVER_VERSION = '1.0.0';

// Initialize connections
const docker = new Docker();
let pgPool: Pool | null = null;
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize database pool
async function initDatabase() {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app',
    });
  }
  return pgPool;
}

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
    name: 'backend_metrics',
    description: 'Get backend Prometheus metrics',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'Metrics endpoint URL',
          default: 'http://localhost:2000/api/v1/metrics',
        },
      },
    },
  },
  {
    name: 'database_query',
    description: 'Execute a read-only SQL query on the PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute (SELECT only)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of rows to return',
          default: 100,
        },
      },
      required: ['query'],
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
    name: 'read_file',
    description: 'Read a file from the filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path (relative to project root)',
        },
        lines: {
          type: 'number',
          description: 'Number of lines to read (optional, reads all if not specified)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_directory',
    description: 'List files in a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path (relative to project root)',
          default: '.',
        },
        pattern: {
          type: 'string',
          description: 'File pattern filter (optional)',
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

    case 'backend_metrics': {
      try {
        const response = await axios.get(args.endpoint || 'http://localhost:2000/api/v1/metrics', {
          timeout: 5000,
        });
        return {
          metrics: response.data,
        };
      } catch (error: any) {
        return {
          error: error.message,
          statusCode: error.response?.status,
        };
      }
    }

    case 'database_query': {
      if (!args.query.trim().toUpperCase().startsWith('SELECT')) {
        throw new Error('Only SELECT queries are allowed');
      }
      
      const pool = await initDatabase();
      const limit = args.limit || 100;
      const query = `${args.query} LIMIT ${limit}`;
      
      try {
        const result = await pool.query(query);
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          columns: result.fields.map(f => f.name),
        };
      } catch (error: any) {
        throw new Error(`Database query error: ${error.message}`);
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

    case 'read_file': {
      const projectRoot = process.env.PROJECT_ROOT || '/Users/Arief/Desktop/378';
      const filePath = join(projectRoot, args.path);
      
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        if (args.lines) {
          return {
            path: args.path,
            content: lines.slice(0, args.lines).join('\n'),
            totalLines: lines.length,
            truncated: lines.length > args.lines,
          };
        }
        
        return {
          path: args.path,
          content: content,
          totalLines: lines.length,
        };
      } catch (error: any) {
        throw new Error(`File read error: ${error.message}`);
      }
    }

    case 'list_directory': {
      const projectRoot = process.env.PROJECT_ROOT || '/Users/Arief/Desktop/378';
      const dirPath = join(projectRoot, args.path || '.');
      
      try {
        const entries = readdirSync(dirPath, { withFileTypes: true });
        let files = entries.map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: join(args.path || '.', entry.name),
        }));
        
        if (args.pattern) {
          const regex = new RegExp(args.pattern.replace('*', '.*'));
          files = files.filter(f => regex.test(f.name));
        }
        
        return {
          path: args.path || '.',
          files: files,
          count: files.length,
        };
      } catch (error: any) {
        throw new Error(`Directory read error: ${error.message}`);
      }
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

