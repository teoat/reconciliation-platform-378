/**
 * Redis connection management for Agent Coordination
 */

import { createClient, RedisClientType } from 'redis';
import { REDIS_URL, REDIS_CONNECT_TIMEOUT } from './config.js';

// Connection instances (singleton pattern)
let redisClient: RedisClientType | null = null;
let redisClientPromise: Promise<RedisClientType> | null = null;
let redisHealthCheckTimer: NodeJS.Timeout | null = null;

/**
 * Initialize Redis client
 */
export async function initRedis(): Promise<RedisClientType> {
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
      let redisConfig: { url?: string; password?: string; socket: any };
      
      if (REDIS_URL.includes('@') && REDIS_URL.includes(':')) {
        const urlMatch = REDIS_URL.match(/^redis:\/\/(?::([^@]+)@)?([^:]+):(\d+)$/);
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
          redisConfig = {
            url: REDIS_URL,
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
        redisConfig = {
          url: REDIS_URL,
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

/**
 * Redis health monitoring
 */
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

/**
 * Get Redis client or throw
 */
export async function getRedis(): Promise<RedisClientType> {
  try {
    return await initRedis();
  } catch (error) {
    throw new Error(`Redis not available: ${error instanceof Error ? error.message : String(error)}`);
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

