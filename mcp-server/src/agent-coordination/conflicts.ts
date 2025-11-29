/**
 * Conflict detection operations for Agent Coordination
 */

import { z } from 'zod';
import { TASK_KEY, TASK_QUEUE_KEY, FILE_LOCK_KEY, ACTIVE_AGENTS_KEY, AGENT_STATUS_KEY } from './config.js';
import { getRedis } from './redis.js';
import { normalizeFilePath, batchGetFileLocks } from './utils.js';

// Input validation schemas
export const DetectConflictsSchema = z.object({
  agentId: z.string().min(1).max(100),
  files: z.array(z.string()).min(1).max(1000),
});

/**
 * Detect conflicts
 */
export async function detectConflicts(agentId: string, files: string[]) {
  const redis = await getRedis();
  
  // Use batch operation for file lock checks
  const fileLocks = await batchGetFileLocks(files);
  const conflicts: Array<{ file: string; conflictingAgent: string; reason: string; severity: string }> = [];
  const warnings: Array<{ file: string; warning: string; severity: string }> = [];

  // Use batch-loaded locks
  for (const file of files) {
    const normalizedFile = normalizeFilePath(file);
    const lock = fileLocks.get(normalizedFile);
    
    if (lock && lock.agentId !== agentId) {
      conflicts.push({
        file: normalizedFile,
        conflictingAgent: lock.agentId,
        reason: `File is locked by ${lock.agentId}: ${lock.reason}`,
        severity: 'high',
      });
    }

    // Check if file is in any claimed task
    const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
    for (const taskId of taskIds) {
      const taskStr = await redis.get(TASK_KEY(taskId));
      if (taskStr) {
        const task = JSON.parse(taskStr);
        if (task.status === 'claimed' && task.agentId !== agentId && task.files.includes(normalizedFile)) {
          warnings.push({
            file: normalizedFile,
            warning: `File is part of task ${taskId} claimed by ${task.agentId}`,
            severity: 'medium',
          });
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    warnings,
  };
}

/**
 * Check file overlap
 */
export async function checkFileOverlap(agentId: string, files: string[]) {
  const redis = await getRedis();
  const overlaps: Array<{ file: string; overlappingAgent: string; taskId?: string }> = [];

  for (const file of files) {
    const normalizedFile = normalizeFilePath(file);
    
    // Check locks
    const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
    if (lockStr) {
      const lock = JSON.parse(lockStr);
      if (lock.agentId !== agentId) {
        overlaps.push({
          file: normalizedFile,
          overlappingAgent: lock.agentId,
        });
      }
    }

    // Check tasks
    const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
    for (const taskId of taskIds) {
      const taskStr = await redis.get(TASK_KEY(taskId));
      if (taskStr) {
        const task = JSON.parse(taskStr);
        if (task.status === 'claimed' && task.agentId !== agentId && task.files.includes(normalizedFile)) {
          overlaps.push({
            file: normalizedFile,
            overlappingAgent: task.agentId,
            taskId: task.taskId,
          });
        }
      }
    }
  }

  return {
    hasOverlap: overlaps.length > 0,
    overlaps,
  };
}

/**
 * Suggest coordination
 */
export async function suggestCoordination(agentId: string, capabilities: string[] = [], preferredFiles: string[] = []) {
  const redis = await getRedis();
  
  // Get all active agents
  const agentIds = await redis.zRangeByScore(ACTIVE_AGENTS_KEY, Date.now() - 300000, Date.now());
  const agents = await Promise.all(
    agentIds.map(async (id) => {
      const statusStr = await redis.get(AGENT_STATUS_KEY(id));
      return statusStr ? JSON.parse(statusStr) : null;
    })
  );
  const activeAgents = agents.filter((a) => a !== null && a.agentId !== agentId);

  // Get all tasks
  const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
  const tasks = await Promise.all(
    taskIds.map(async (taskId) => {
      const taskStr = await redis.get(TASK_KEY(taskId));
      return taskStr ? JSON.parse(taskStr) : null;
    })
  );
  const availableTasks = tasks.filter((t) => t !== null && t.status === 'available');

  // Get all locked files
  const lockKeys: string[] = [];
  for await (const key of redis.scanIterator({ MATCH: `${KEY_PREFIX}lock:*`, COUNT: 100 })) {
    lockKeys.push(key as string);
  }
  const lockedFiles = await Promise.all(
    lockKeys.map(async (key) => {
      const lockStr = await redis.get(key);
      return lockStr ? JSON.parse(lockStr) : null;
    })
  );
  const lockedFilePaths = lockedFiles.filter((l) => l !== null).map((l) => l.file);

  // Find safe files (not locked, not in claimed tasks)
  const safeFiles: string[] = [];
  if (preferredFiles.length > 0) {
    for (const file of preferredFiles) {
      const normalizedFile = normalizeFilePath(file);
      if (!lockedFilePaths.includes(normalizedFile)) {
        // Check if in any claimed task
        let inClaimedTask = false;
        for (const task of tasks) {
          if (task && task.status === 'claimed' && task.files.includes(normalizedFile)) {
            inClaimedTask = true;
            break;
          }
        }
        if (!inClaimedTask) {
          safeFiles.push(normalizedFile);
        }
      }
    }
  }

  // Generate warnings
  const warnings: string[] = [];
  for (const file of preferredFiles) {
    const normalizedFile = normalizeFilePath(file);
    if (lockedFilePaths.includes(normalizedFile)) {
      const lock = lockedFiles.find((l) => l && l.file === normalizedFile);
      if (lock) {
        warnings.push(`Avoid ${normalizedFile} (locked by ${lock.agentId})`);
      }
    }
  }

  return {
    recommendedTasks: availableTasks.slice(0, 5).map((t) => ({
      taskId: t.taskId,
      files: t.files,
      description: t.description,
      priority: 'medium',
    })),
    safeFiles: safeFiles.slice(0, 10),
    warnings,
    workload: {
      totalAgents: activeAgents.length + 1,
      activeAgents: activeAgents.filter((a) => a.status === 'working').length + 1,
      totalTasks: tasks.length,
      claimedTasks: tasks.filter((t) => t && t.status === 'claimed').length,
    },
  };
}

/**
 * Get workload distribution
 */
export async function getWorkloadDistribution() {
  const redis = await getRedis();
  const agentIds = await redis.zRangeByScore(ACTIVE_AGENTS_KEY, Date.now() - 300000, Date.now());
  const agents = await Promise.all(
    agentIds.map(async (id) => {
      const statusStr = await redis.get(AGENT_STATUS_KEY(id));
      return statusStr ? JSON.parse(statusStr) : null;
    })
  );
  const activeAgents = agents.filter((a) => a !== null);

  const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
  const tasks = await Promise.all(
    taskIds.map(async (taskId) => {
      const taskStr = await redis.get(TASK_KEY(taskId));
      return taskStr ? JSON.parse(taskStr) : null;
    })
  );

  const distribution = activeAgents.map((agent) => {
    const agentTasks = tasks.filter((t) => t && t.agentId === agent.agentId);
    return {
      agentId: agent.agentId,
      status: agent.status,
      currentTask: agent.currentTask,
      progress: agent.progress || 0,
      taskCount: agentTasks.length,
      filesLocked: 0, // Would need to query locks
    };
  });

  return {
    agents: distribution,
    summary: {
      totalAgents: activeAgents.length,
      activeAgents: activeAgents.filter((a) => a.status === 'working').length,
      idleAgents: activeAgents.filter((a) => a.status === 'idle').length,
      totalTasks: tasks.length,
      claimedTasks: tasks.filter((t) => t && t.status === 'claimed').length,
      availableTasks: tasks.filter((t) => t && t.status === 'available').length,
    },
  };
}

