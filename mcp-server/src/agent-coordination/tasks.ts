/**
 * Task management operations for Agent Coordination
 */

import { z } from 'zod';
import { COORDINATION_TTL, TASK_KEY, TASK_QUEUE_KEY, FILE_LOCK_KEY } from './config.js';
import { getRedis } from './redis.js';
import { normalizeFilePath } from './utils.js';

// Input validation schemas
export const ClaimTaskSchema = z.object({
  taskId: z.string().min(1).max(100),
  agentId: z.string().min(1).max(100),
  files: z.array(z.string()).max(1000).default([]),
  description: z.string().max(500).optional(),
});

/**
 * Claim a task
 */
export async function claimTask(taskId: string, agentId: string, files: string[] = [], description = '') {
  const redis = await getRedis();
  
  // Check if task already claimed
  const existingTaskStr = await redis.get(TASK_KEY(taskId));
  if (existingTaskStr) {
    const existingTask = JSON.parse(existingTaskStr);
    if (existingTask.status === 'claimed' && existingTask.agentId !== agentId) {
      throw new Error(`Task ${taskId} is already claimed by agent ${existingTask.agentId}`);
    }
  }

  // Check for file conflicts
  const conflicts: Array<{ file: string; lockedBy: string }> = [];
  for (const file of files) {
    const normalizedFile = normalizeFilePath(file);
    const lockStr = await redis.get(FILE_LOCK_KEY(normalizedFile));
    if (lockStr) {
      const lock = JSON.parse(lockStr);
      if (lock.agentId !== agentId) {
        conflicts.push({ file: normalizedFile, lockedBy: lock.agentId });
      }
    }
  }

  const task = {
    taskId,
    agentId,
    files: files.map(normalizeFilePath),
    description,
    status: 'claimed',
    claimedAt: new Date().toISOString(),
    progress: 0,
  };

  await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL, JSON.stringify(task));
  await redis.zAdd(TASK_QUEUE_KEY, { score: Date.now(), value: taskId });

  return {
    success: true,
    taskId,
    agentId,
    claimedAt: task.claimedAt,
    conflicts: conflicts.length > 0 ? conflicts : [],
  };
}

/**
 * Release a task
 */
export async function releaseTask(taskId: string, agentId: string) {
  const redis = await getRedis();
  const taskStr = await redis.get(TASK_KEY(taskId));
  if (!taskStr) {
    throw new Error(`Task ${taskId} not found`);
  }

  const task = JSON.parse(taskStr);
  if (task.agentId !== agentId) {
    throw new Error(`Task ${taskId} is claimed by different agent: ${task.agentId}`);
  }

  task.status = 'available';
  task.agentId = null;
  task.releasedAt = new Date().toISOString();

  await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL, JSON.stringify(task));

  return {
    success: true,
    taskId,
    releasedAt: task.releasedAt,
  };
}

/**
 * List tasks
 */
export async function listTasks(status = 'all', agentId: string | null = null) {
  const redis = await getRedis();
  const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
  const tasks = await Promise.all(
    taskIds.map(async (taskId) => {
      const taskStr = await redis.get(TASK_KEY(taskId));
      return taskStr ? JSON.parse(taskStr) : null;
    })
  );

  let filtered = tasks.filter((t) => t !== null);
  
  if (status !== 'all') {
    filtered = filtered.filter((t) => t.status === status);
  }
  
  if (agentId) {
    filtered = filtered.filter((t) => t.agentId === agentId);
  }

  return {
    tasks: filtered,
    total: filtered.length,
    byStatus: {
      available: filtered.filter((t) => t.status === 'available').length,
      claimed: filtered.filter((t) => t.status === 'claimed').length,
      completed: filtered.filter((t) => t.status === 'completed').length,
    },
  };
}

/**
 * Update task progress
 */
export async function updateTaskProgress(taskId: string, agentId: string, progress: number, message = '') {
  const redis = await getRedis();
  const taskStr = await redis.get(TASK_KEY(taskId));
  if (!taskStr) {
    throw new Error(`Task ${taskId} not found`);
  }

  const task = JSON.parse(taskStr);
  if (task.agentId !== agentId) {
    throw new Error(`Task ${taskId} is claimed by different agent: ${task.agentId}`);
  }

  task.progress = progress;
  if (message) {
    task.lastMessage = message;
  }
  task.updatedAt = new Date().toISOString();

  await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL, JSON.stringify(task));

  return {
    success: true,
    taskId,
    progress,
    updatedAt: task.updatedAt,
  };
}

/**
 * Complete a task
 */
export async function completeTask(taskId: string, agentId: string) {
  const redis = await getRedis();
  const taskStr = await redis.get(TASK_KEY(taskId));
  if (!taskStr) {
    throw new Error(`Task ${taskId} not found`);
  }

  const task = JSON.parse(taskStr);
  if (task.agentId !== agentId) {
    throw new Error(`Task ${taskId} is claimed by different agent: ${task.agentId}`);
  }

  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.progress = 100;

  await redis.setEx(TASK_KEY(taskId), COORDINATION_TTL * 24, JSON.stringify(task)); // Keep completed tasks longer

  return {
    success: true,
    taskId,
    completedAt: task.completedAt,
  };
}

/**
 * Find available work
 */
export async function findAvailableWork(agentId: string, capabilities: string[] = []) {
  const redis = await getRedis();
  const taskIds = await redis.zRange(TASK_QUEUE_KEY, 0, -1);
  const tasks = await Promise.all(
    taskIds.map(async (taskId) => {
      const taskStr = await redis.get(TASK_KEY(taskId));
      return taskStr ? JSON.parse(taskStr) : null;
    })
  );

  const availableTasks = tasks.filter((t) => t !== null && t.status === 'available');
  
  // Filter by capabilities if provided
  const matchingTasks = capabilities.length > 0
    ? availableTasks.filter((t) => {
        return t.description && capabilities.some((cap: string) => 
          t.description.toLowerCase().includes(cap.toLowerCase())
        );
      })
    : availableTasks;

  return {
    tasks: matchingTasks.slice(0, 10),
    total: matchingTasks.length,
  };
}

