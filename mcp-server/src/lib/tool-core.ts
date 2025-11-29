/**
 * Tool Core for MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { trackToolUsage } from './metrics.js';
import { getDockerTools, handleDockerTool } from './docker-tools.js';
import { getRedisTools, handleRedisTool } from './redis-tools.js';
import { getGitTools, handleGitTool } from './git-tools.js';
import { getDiagnosticTools, handleDiagnosticTool } from './diagnostic-tools.js';

/**
 * Tool definitions - combines all tool categories
 */
export function getTools(): Tool[] {
  return [...getDockerTools(), ...getRedisTools(), ...getGitTools(), ...getDiagnosticTools()];
}

/**
 * Execute tool with monitoring wrapper
 */
export async function handleTool(name: string, args: any): Promise<any> {
  const startTime = Date.now();

  try {
    const result = await executeTool(name, args);
    const duration = Date.now() - startTime;
    await trackToolUsage(name, duration, true);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await trackToolUsage(name, duration, false);
    throw error;
  }
}

/**
 * Actual tool execution - routes to appropriate handler
 */
async function executeTool(name: string, args: any): Promise<any> {
  // Docker tools
  if (
    ['docker_container_status', 'docker_container_logs', 'docker_container_restart'].includes(name)
  ) {
    return await handleDockerTool(name, args);
  }

  // Redis tools
  if (['redis_get', 'redis_keys'].includes(name)) {
    return await handleRedisTool(name, args);
  }

  // Git tools
  if (
    ['git_status', 'git_branch_list', 'git_branch_create', 'git_commit', 'git_log'].includes(name)
  ) {
    return await handleGitTool(name, args);
  }

  // Diagnostic tools
  if (
    [
      'backend_health_check',
      'backend_compile_check',
      'run_diagnostic',
      'frontend_build_status',
      'run_backend_tests',
      'run_frontend_tests',
      'run_e2e_tests',
      'run_linter',
      'run_clippy',
      'check_types',
      'list_migrations',
      'run_migration',
      'run_security_audit',
      'get_system_metrics',
      'get_performance_summary',
      'get_tool_usage_stats',
      'run_safe_shell_command',
    ].includes(name)
  ) {
    return await handleDiagnosticTool(name, args);
  }

  throw new Error(`Unknown tool: ${name}`);
}
