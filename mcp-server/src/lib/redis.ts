/**
 * Redis operations for MCP Server
 */

import { createClient, RedisClientType } from 'redis';
import { REDIS_CONNECT_TIMEOUT } from './config.js';

// Connection instances (singleton pattern)
let redisClient: RedisClientType | null = null;
let redisClientPromise: Promise<RedisClientType> | null = null;
let redisHealthCheckTimer: NodeJS.Timeout | null = null;

/**
 * Initialize Redis client with connection pooling and health monitoring
 */
export async function initRedis(): Promise<RedisClientType> {
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
      // Parse REDIS_URL to handle both password and no-password cases
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      let redisConfig: { url: string; password?: string; socket: any };
      
      if (redisUrl.includes('@') && redisUrl.includes(':')) {
        // Parse URL format: redis://:password@host:port or redis://host:port
        const urlMatch = redisUrl.match(/^redis:\/\/(?::([^@]+)@)?([^:]+):(\d+)$/);
        if (urlMatch) {
          const [, password, host, port] = urlMatch;
          redisConfig = {
            url: `redis://${host}:${port}`,
            password: password || undefined,
            socket: {
              connectTimeout: REDIS_CONNECT_TIMEOUT,
              reconnectStrategy: (retries: number) => {
                if (retries > 3) {
                  return new Error('Redis connection failed after 3 retries');
                }
                return Math.min(retries * 100, 1000);
              },
            },
          };
        } else {
          // Fallback to original URL
          redisConfig = {
            url: redisUrl,
            socket: {
              connectTimeout: REDIS_CONNECT_TIMEOUT,
              reconnectStrategy: (retries: number) => {
                if (retries > 3) {
                  return new Error('Redis connection failed after 3 retries');
                }
                return Math.min(retries * 100, 1000);
              },
            },
          };
        }
      } else {
        // Simple URL format
        redisConfig = {
          url: redisUrl,
          socket: {
            connectTimeout: REDIS_CONNECT_TIMEOUT,
            reconnectStrategy: (retries: number) => {
              if (retries > 3) {
                return new Error('Redis connection failed after 3 retries');
              }
              return Math.min(retries * 100, 1000);
            },
          },
        };
      }
      
      redisClient = createClient(redisConfig);

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

/**
 * Redis health monitoring
 */
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

/**
 * Get value from Redis
 */
export async function redisGet(key: string) {
  try {
    const client = await initRedis();
    const value = await client.get(key);
    return {
      key,
      value,
      exists: value !== null,
    };
  } catch (error: any) {
    throw new Error(`Redis operation failed: ${error.message}`);
  }
}

/**
 * List Redis keys matching a pattern
 */
export async function redisKeys(pattern: string = '*', limit: number = 100) {
  try {
    const client = await initRedis();
    
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

/**
 * Cleanup Redis connection
 */
export async function cleanupRedis(): Promise<void> {
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

