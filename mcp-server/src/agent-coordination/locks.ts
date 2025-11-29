/**
 * File locking operations for Agent Coordination
 */

import { z } from 'zod';
import { COORDINATION_TTL, FILE_LOCK_KEY, KEY_PREFIX, LockInfo } from './config.js';
import { getRedis } from './redis.js';
import { normalizeFilePath, fileLockCache } from './utils.js';

// Input validation schemas
export const LockFileSchema = z.object({
  file: z.string().min(1).max(500),
  agentId: z.string().min(1).max(100),
  reason: z.string().max(200).optional(),
  ttl: z.number().int().min(60).max(86400).optional(),
});

export const LockFilesSchema = z.object({
  files: z.array(z.string()).min(1).max(100),
  agentId: z.string().min(1).max(100),
  reason: z.string().max(200).optional(),
  ttl: z.number().int().min(60).max(86400).optional(),
});

export const UnlockFilesSchema = z.object({
  files: z.array(z.string()).min(1).max(100),
  agentId: z.string().min(1).max(100),
});

/**
 * Lock a file
 */
export async function lockFile(file: string, agentId: string, reason = '', ttl = COORDINATION_TTL) {
  const redis = await getRedis();
  const normalizedFile = normalizeFilePath(file);
  
  // Check if already locked
  const existingLockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
  if (existingLockStr) {
    const existingLock = JSON.parse(existingLockStr);
    if (existingLock.agentId !== agentId) {
      throw new Error(`File ${file} is locked by agent ${existingLock.agentId}`);
    }
  }

  const lock: LockInfo = {
    file: normalizedFile,
    agentId,
    reason,
    lockedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
  };

  await redis.setEx(FILE_LOCK_KEY(normalizedFile), ttl, JSON.stringify(lock));
  fileLockCache.set(normalizedFile, lock);

  return {
    success: true,
    file: normalizedFile,
    agentId,
    lockedAt: lock.lockedAt,
    expiresAt: lock.expiresAt,
  };
}

/**
 * Unlock a file
 */
export async function unlockFile(file: string, agentId: string) {
  const redis = await getRedis();
  const normalizedFile = normalizeFilePath(file);
  
  const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
  if (!lockStr) {
    return {
      success: true,
      file: normalizedFile,
      message: 'File was not locked',
    };
  }

  const lock = JSON.parse(lockStr);
  if (lock.agentId !== agentId) {
    throw new Error(`File ${file} is locked by different agent: ${lock.agentId}`);
  }

  await redis.del(FILE_LOCK_KEY(normalizedFile));
  fileLockCache.delete(normalizedFile);

  return {
    success: true,
    file: normalizedFile,
    unlockedAt: new Date().toISOString(),
  };
}

/**
 * Lock multiple files (batch)
 */
export async function lockFiles(files: string[], agentId: string, reason = '', ttl = COORDINATION_TTL) {
  const redis = await getRedis();
  const results: { locked: string[]; skipped: Array<{ file: string; by: string }>; errors: Array<{ file: string; error: string }> } = {
    locked: [],
    skipped: [],
    errors: [],
  };

  for (const file of files) {
    const normalizedFile = normalizeFilePath(file);
    try {
      const existingLockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
      if (existingLockStr) {
        const existingLock = JSON.parse(existingLockStr);
        if (existingLock.agentId !== agentId) {
          results.skipped.push({ file: normalizedFile, by: existingLock.agentId });
          continue;
        }
      }

      const lock: LockInfo = {
        file: normalizedFile,
        agentId,
        reason,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      };

      await redis.setEx(FILE_LOCK_KEY(normalizedFile), ttl, JSON.stringify(lock));
      fileLockCache.set(normalizedFile, lock);
      results.locked.push(normalizedFile);
    } catch (e: any) {
      results.errors.push({ file: normalizedFile, error: e?.message || String(e) });
    }
  }

  return {
    success: true,
    ...results,
  };
}

/**
 * Unlock multiple files (batch)
 */
export async function unlockFiles(files: string[], agentId: string) {
  const redis = await getRedis();
  const results: { unlocked: string[]; skipped: Array<{ file: string; by?: string }>; errors: Array<{ file: string; error: string }> } = {
    unlocked: [],
    skipped: [],
    errors: [],
  };

  for (const file of files) {
    const normalizedFile = normalizeFilePath(file);
    try {
      const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
      if (!lockStr) {
        results.skipped.push({ file: normalizedFile });
        continue;
      }
      const lock = JSON.parse(lockStr);
      if (lock.agentId !== agentId) {
        results.skipped.push({ file: normalizedFile, by: lock.agentId });
        continue;
      }

      await redis.del(FILE_LOCK_KEY(normalizedFile));
      fileLockCache.delete(normalizedFile);
      results.unlocked.push(normalizedFile);
    } catch (e: any) {
      results.errors.push({ file: normalizedFile, error: e?.message || String(e) });
    }
  }

  return {
    success: true,
    ...results,
  };
}

/**
 * Check file lock
 */
export async function checkFileLock(file: string) {
  const redis = await getRedis();
  const normalizedFile = normalizeFilePath(file);
  
  // Check cache first
  const cached = fileLockCache.get(normalizedFile);
  if (cached !== undefined) {
    if (!cached) {
      return {
        locked: false,
        file: normalizedFile,
      };
    }
    return {
      locked: true,
      file: normalizedFile,
      agentId: cached.agentId,
      reason: cached.reason,
      lockedAt: cached.lockedAt,
      expiresAt: cached.expiresAt,
    };
  }
  
  // Fallback to Redis
  const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
  
  if (!lockStr) {
    fileLockCache.set(normalizedFile, null);
    return {
      locked: false,
      file: normalizedFile,
    };
  }

  const lock = JSON.parse(lockStr);
  fileLockCache.set(normalizedFile, lock);
  return {
    locked: true,
    file: normalizedFile,
    agentId: lock.agentId,
    reason: lock.reason,
    lockedAt: lock.lockedAt,
    expiresAt: lock.expiresAt,
  };
}

/**
 * List locked files
 */
export async function listLockedFiles(agentId: string | null = null) {
  const redis = await getRedis();
  
  // Use SCAN iterator to avoid blocking on large keyspaces
  const keys: string[] = [];
  for await (const key of redis.scanIterator({ MATCH: `${KEY_PREFIX}lock:*`, COUNT: 100 })) {
    keys.push(key as string);
  }

  const locks = await Promise.all(
    keys.map(async (key) => {
      const lockStr = await redis.get(key);
      return lockStr ? JSON.parse(lockStr) : null;
    })
  );

  let filtered = locks.filter((l) => l !== null);
  
  if (agentId) {
    filtered = filtered.filter((l) => l.agentId === agentId);
  }

  return {
    files: filtered,
    total: filtered.length,
  };
}

