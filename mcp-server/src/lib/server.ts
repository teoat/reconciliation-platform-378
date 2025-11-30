/**
 * Server setup and lifecycle management for MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SERVER_NAME, SERVER_VERSION, PROJECT_ROOT, BACKEND_URL } from './config.js';
import { getTools, handleTool } from './tools.js';
import { clearHealthCache } from './health.js';
import { cleanupGit } from './git.js';
import { logger } from './logger.js'; // Import the new logger

/**
 * Setup and start MCP server
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
      logger.error(`Error handling tool '${name}': ${error.message}`, { tool: name, error });
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
  
  logger.info(`Server v${SERVER_VERSION} running on stdio`);
  logger.info(`Project root: ${PROJECT_ROOT}`);
  logger.info(`Backend URL: ${BACKEND_URL}`);
  logger.info(`Tools enabled: ${tools.length}`);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info(`Shutting down...`);
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info(`Shutting down...`);
    await cleanup();
    process.exit(0);
  });
}

/**
 * Cleanup function
 */
async function cleanup(): Promise<void> {
  try {
    clearHealthCache();
    cleanupGit();
  } catch (_error) {
    logger.warn(`Error during cleanup: ${(_error as Error).message}`, { error: _error });
  }
}

