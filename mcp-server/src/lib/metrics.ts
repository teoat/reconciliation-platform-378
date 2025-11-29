/**
 * Metrics tracking for MCP Server
 */

import { initRedis } from './redis.js';

// Tool usage monitoring
export interface ToolUsageMetrics {
  name: string;
  count: number;
  totalTime: number;
  avgTime: number;
  lastUsed: Date;
  errors: number;
  successRate: number;
}

const toolUsageMetrics = new Map<string, ToolUsageMetrics>();
const toolExecutionTimes: { [key: string]: number[] } = {};

/**
 * Track tool usage with Redis persistence
 */
export async function trackToolUsage(toolName: string, duration: number, success: boolean): Promise<void> {
  const existing = toolUsageMetrics.get(toolName) || {
    name: toolName,
    count: 0,
    totalTime: 0,
    avgTime: 0,
    lastUsed: new Date(),
    errors: 0,
    successRate: 100,
  };

  existing.count++;
  existing.totalTime += duration;
  existing.avgTime = existing.totalTime / existing.count;
  existing.lastUsed = new Date();
  
  if (!success) {
    existing.errors++;
  }
  
  existing.successRate = ((existing.count - existing.errors) / existing.count) * 100;

  if (!toolExecutionTimes[toolName]) {
    toolExecutionTimes[toolName] = [];
  }
  toolExecutionTimes[toolName].push(duration);
  
  // Keep only last 100 execution times
  if (toolExecutionTimes[toolName].length > 100) {
    toolExecutionTimes[toolName].shift();
  }

  toolUsageMetrics.set(toolName, existing);

  // Persist to Redis (non-blocking)
  try {
    const redis = await initRedis().catch(() => null);
    if (redis?.isOpen) {
      const key = `mcp:tool_usage:${toolName}`;
      const data = {
        name: existing.name,
        count: existing.count,
        totalTime: existing.totalTime,
        avgTime: existing.avgTime,
        lastUsed: existing.lastUsed.toISOString(),
        errors: existing.errors,
        successRate: existing.successRate,
      };
      
      // Store with 24 hour TTL
      await redis.setEx(key, 86400, JSON.stringify(data));
      
      // Also update aggregate stats
      await redis.zIncrBy('mcp:tool_usage:counts', 1, toolName);
      await redis.zIncrBy('mcp:tool_usage:total_time', duration, toolName);
    }
  } catch (error) {
    // Silently fail - Redis persistence is optional
    // Metrics are still tracked in-memory
  }
}

/**
 * Get tool usage statistics
 */
export function getToolUsageStats(tool?: string) {
  if (tool) {
    const metrics = toolUsageMetrics.get(tool);
    if (!metrics) {
      return {
        tool,
        message: 'No usage data available for this tool',
      };
    }
    
    const times = toolExecutionTimes[tool] || [];
    const sortedTimes = [...times].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    
    return {
      ...metrics,
      percentiles: {
        p50,
        p95,
        p99,
      },
      recentExecutions: times.slice(-10),
    };
  }
  
  // Return all metrics
  const allMetrics = Array.from(toolUsageMetrics.values());
  const totalCalls = allMetrics.reduce((sum, m) => sum + m.count, 0);
  const totalTime = allMetrics.reduce((sum, m) => sum + m.totalTime, 0);
  
  return {
    summary: {
      totalTools: allMetrics.length,
      totalCalls,
      totalTime,
      avgTimePerCall: totalCalls > 0 ? totalTime / totalCalls : 0,
    },
    tools: allMetrics.sort((a, b) => b.count - a.count),
  };
}

/**
 * Get all tool metrics for performance summary
 */
export function getAllToolMetrics() {
  return Array.from(toolUsageMetrics.values());
}

