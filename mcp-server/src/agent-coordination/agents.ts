/**
 * Agent management operations for Agent Coordination
 */

import { z } from 'zod';
import { COORDINATION_TTL, AGENT_STATUS_KEY, ACTIVE_AGENTS_KEY, AgentStatus } from './config.js';
import { getRedis } from './redis.js';

// Input validation schemas
export const AgentRegisterSchema = z.object({
  agentId: z.string().min(1).max(100),
  capabilities: z.array(z.string()).default([]),
  currentTask: z.string().nullable().optional(),
});

/**
 * Register an agent
 */
export async function registerAgent(agentId: string, capabilities: string[] = [], currentTask: string | null = null) {
  const redis = await getRedis();
  const status = {
    agentId,
    capabilities,
    status: 'idle',
    currentTask,
    registeredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };

  await redis.setEx(AGENT_STATUS_KEY(agentId), COORDINATION_TTL, JSON.stringify(status));
  await redis.zAdd(ACTIVE_AGENTS_KEY, { score: Date.now(), value: agentId });

  return {
    success: true,
    agentId,
    registeredAt: status.registeredAt,
  };
}

/**
 * Update agent status
 */
export async function updateAgentStatus(
  agentId: string,
  status: string,
  currentTask: string | null = null,
  progress: number | null = null
) {
  const redis = await getRedis();
  const existingStatusStr = await redis.get(AGENT_STATUS_KEY(agentId));
  if (!existingStatusStr) {
    throw new Error(`Agent ${agentId} not registered. Call agent_register first.`);
  }

  const existingStatus = JSON.parse(existingStatusStr);
  const updatedStatus = {
    ...existingStatus,
    status,
    currentTask,
    progress,
    lastSeen: new Date().toISOString(),
  };

  await redis.setEx(AGENT_STATUS_KEY(agentId), COORDINATION_TTL, JSON.stringify(updatedStatus));
  await redis.zAdd(ACTIVE_AGENTS_KEY, { score: Date.now(), value: agentId });

  return {
    success: true,
    agentId,
    status,
    updatedAt: updatedStatus.lastSeen,
  };
}

/**
 * List all agents
 */
export async function listAgents(includeInactive = false) {
  const redis = await getRedis();
  const cutoffTime = includeInactive ? 0 : Date.now() - 300000; // 5 minutes

  const agentIds = await redis.zRangeByScore(ACTIVE_AGENTS_KEY, cutoffTime, Date.now());
  const agents = await Promise.all(
    agentIds.map(async (agentId) => {
      const statusStr = await redis.get(AGENT_STATUS_KEY(agentId));
      return statusStr ? JSON.parse(statusStr) : null;
    })
  );

  return {
    agents: agents.filter((a) => a !== null),
    total: agents.filter((a) => a !== null).length,
  };
}

/**
 * Get agent status
 */
export async function getAgentStatus(agentId: string) {
  const redis = await getRedis();
  const statusStr = await redis.get(AGENT_STATUS_KEY(agentId));
  
  if (!statusStr) {
    return {
      agentId,
      found: false,
      message: 'Agent not registered',
    };
  }

  return {
    found: true,
    ...JSON.parse(statusStr),
  };
}

