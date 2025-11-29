/**
 * Health check operations for MCP Server
 */

import axios, { AxiosInstance } from 'axios';
import { BACKEND_URL, HEALTH_CHECK_CACHE_TTL, DEFAULT_TIMEOUT, HealthCheckResult } from './config.js';

// Connection instance (singleton pattern)
let httpClient: AxiosInstance | null = null;

// Health check cache
interface HealthCheckCache {
  data: unknown;
  timestamp: number;
}

const healthCheckCache = new Map<string, HealthCheckCache>();

/**
 * Initialize HTTP client
 */
function getHttpClient(): AxiosInstance {
  if (!httpClient) {
    httpClient = axios.create({
      timeout: DEFAULT_TIMEOUT,
      validateStatus: () => true, // Don't throw on any status
    });
  }
  return httpClient;
}

/**
 * Get cached health check or fetch new
 */
export async function getHealthCheck(endpoint: string, useCache = true): Promise<unknown> {
  const cacheKey = endpoint;
  const cached = healthCheckCache.get(cacheKey);

  if (useCache && cached && Date.now() - cached.timestamp < HEALTH_CHECK_CACHE_TTL) {
    return cached.data;
  }

  try {
    const client = getHttpClient();
    const response = await client.get(endpoint);
    
    const result: HealthCheckResult = {
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
    const result: HealthCheckResult = {
      status: 'unhealthy',
      data: { error: error.message },
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

/**
 * Check backend health
 */
export async function checkBackendHealth(endpoint?: string, useCache = true) {
  const healthEndpoint = endpoint || `${BACKEND_URL}/health`;
  return await getHealthCheck(healthEndpoint, useCache);
}

/**
 * Clear health check cache
 */
export function clearHealthCache(): void {
  healthCheckCache.clear();
}

