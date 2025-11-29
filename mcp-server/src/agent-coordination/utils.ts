/**
 * Utility functions for Agent Coordination
 */

import { LockInfo } from './config.js';
import { FILE_LOCK_KEY } from './config.js';
import { getRedis } from './redis.js';
import { LRUCache } from 'lru-cache';

// In-memory cache for file locks (LRU cache with 5s TTL)
export const fileLockCache = new LRUCache<string, LockInfo | null>({
  max: 1000,
  ttl: 5000, // 5 seconds
  updateAgeOnGet: true,
});

// In-memory cache for agent status
export interface AgentStatus {
  agentId: string;
  status: string;
  currentTask: string | null;
  lastSeen: string;
}

export const agentStatusCache = new LRUCache<string, AgentStatus>({
  max: 500,
  ttl: 10000, // 10 seconds
  updateAgeOnGet: true,
});

/**
 * Normalize file path
 */
export function normalizeFilePath(file: string): string {
  // Remove leading slash, normalize separators
  return file.replace(/^\/+/, '').replace(/\\/g, '/');
}

/**
 * Batch operations helper - get file locks
 */
export async function batchGetFileLocks(files: string[]): Promise<Map<string, LockInfo | null>> {
  const redis = await getRedis();
  const normalizedFiles = files.map(normalizeFilePath);
  const results = new Map<string, LockInfo | null>();
  
  // Check cache first
  const uncachedFiles: string[] = [];
  for (const file of normalizedFiles) {
    const cached = fileLockCache.get(file);
    if (cached !== undefined) {
      results.set(file, cached);
    } else {
      uncachedFiles.push(file);
    }
  }
  
  // Batch fetch from Redis
  if (uncachedFiles.length > 0) {
    const pipeline = redis.multi();
    uncachedFiles.forEach(file => {
      pipeline.get(FILE_LOCK_KEY(file));
    });
    
    const redisResults = await pipeline.exec();
    if (redisResults) {
      uncachedFiles.forEach((file, index) => {
        const result = redisResults[index];
        let lockInfo: LockInfo | null = null;
        
        if (result && result[1] && typeof result[1] === 'string') {
          try {
            lockInfo = JSON.parse(result[1]);
          } catch {
            lockInfo = null;
          }
        }
        
        fileLockCache.set(file, lockInfo);
        results.set(file, lockInfo);
      });
    }
  }
  
  return results;
}

