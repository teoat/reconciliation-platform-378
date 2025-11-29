/**
 * Redis Tools for MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { redisGet, redisKeys } from './redis.js';

/**
 * Redis-related tool definitions
 */
export function getRedisTools(): Tool[] {
  return [
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
  ];
}

/**
 * Handle Redis tool execution
 */
export async function handleRedisTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'redis_get':
      return await redisGet(args.key);

    case 'redis_keys':
      return await redisKeys(args.pattern, args.limit);

    default:
      throw new Error(`Unknown Redis tool: ${name}`);
  }
}
