/**
 * Docker Tools for MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getContainerStatus, getContainerLogs, restartContainer } from './docker.js';

/**
 * Docker-related tool definitions
 */
export function getDockerTools(): Tool[] {
  return [
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
  ];
}

/**
 * Handle Docker tool execution
 */
export async function handleDockerTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'docker_container_status':
      return await getContainerStatus(args.filter || 'all', args.name);

    case 'docker_container_logs':
      return await getContainerLogs(args.container, args.tail || 100);

    case 'docker_container_restart':
      return await restartContainer(args.container);

    default:
      throw new Error(`Unknown Docker tool: ${name}`);
  }
}
