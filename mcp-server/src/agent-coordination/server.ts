/**
 * Server setup and lifecycle management for Agent Coordination MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SERVER_NAME, SERVER_VERSION, REDIS_URL, COORDINATION_TTL } from './config.js';
import { getTools, handleTool } from './tools.js';
import { cleanupRedis } from './redis.js';

/**
 * Setup and start Agent Coordination MCP server
 */
export async function startServer(): Promise<void> {
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

  const tools = getTools();

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

