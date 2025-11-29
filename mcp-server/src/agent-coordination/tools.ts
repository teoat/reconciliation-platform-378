/**
 * Tool definitions and handlers for Agent Coordination MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { COORDINATION_TTL } from './config.js';
import { AgentRegisterSchema } from './agents.js';
import { ClaimTaskSchema } from './tasks.js';
import { LockFileSchema, LockFilesSchema, UnlockFilesSchema } from './locks.js';
import { DetectConflictsSchema } from './conflicts.js';
import {
  registerAgent,
  updateAgentStatus,
  listAgents,
  getAgentStatus,
} from './agents.js';
import {
  claimTask,
  releaseTask,
  listTasks,
  updateTaskProgress,
  completeTask,
  findAvailableWork,
} from './tasks.js';
import {
  lockFile,
  unlockFile,
  lockFiles,
  unlockFiles,
  checkFileLock,
  listLockedFiles,
} from './locks.js';
import {
  detectConflicts,
  checkFileOverlap,
  suggestCoordination,
  getWorkloadDistribution,
} from './conflicts.js';

/**
 * Tool definitions
 */
export function getTools(): Tool[] {
  return [
    // Agent Registration
    {
      name: 'agent_register',
      description: 'Register an agent with the coordination server',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Unique agent identifier (e.g., "agent-1", "cursor-session-123")',
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Agent capabilities (e.g., ["typescript", "refactoring", "testing"])',
            default: [],
          },
          currentTask: {
            type: 'string',
            description: 'Current task ID (optional)',
          },
        },
        required: ['agentId'],
      },
    },
    {
      name: 'agent_update_status',
      description: 'Update agent status (idle, working, blocked)',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          status: {
            type: 'string',
            enum: ['idle', 'working', 'blocked', 'completed'],
            description: 'Agent status',
          },
          currentTask: {
            type: 'string',
            description: 'Current task ID (optional)',
          },
          progress: {
            type: 'number',
            description: 'Task progress percentage (0-100)',
            minimum: 0,
            maximum: 100,
          },
        },
        required: ['agentId', 'status'],
      },
    },
    {
      name: 'agent_list_agents',
      description: 'List all active agents and their status',
      inputSchema: {
        type: 'object',
        properties: {
          includeInactive: {
            type: 'boolean',
            description: 'Include inactive agents (not seen in last 5 minutes)',
            default: false,
          },
        },
      },
    },
    {
      name: 'agent_get_status',
      description: 'Get status of a specific agent',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
        },
        required: ['agentId'],
      },
    },
    // Task Management
    {
      name: 'agent_claim_task',
      description: 'Claim a task for exclusive work by an agent',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Unique task identifier',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files that will be modified',
            default: [],
          },
          description: {
            type: 'string',
            description: 'Task description',
          },
        },
        required: ['taskId', 'agentId'],
      },
    },
    {
      name: 'agent_release_task',
      description: 'Release a claimed task',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier (must be the one who claimed it)',
          },
        },
        required: ['taskId', 'agentId'],
      },
    },
    {
      name: 'agent_list_tasks',
      description: 'List all tasks (available, claimed, completed)',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['all', 'available', 'claimed', 'completed'],
            description: 'Filter by task status',
            default: 'all',
          },
          agentId: {
            type: 'string',
            description: 'Filter tasks by agent (optional)',
          },
        },
      },
    },
    {
      name: 'agent_update_task_progress',
      description: 'Update task progress',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          progress: {
            type: 'number',
            description: 'Progress percentage (0-100)',
            minimum: 0,
            maximum: 100,
          },
          message: {
            type: 'string',
            description: 'Progress message (optional)',
          },
        },
        required: ['taskId', 'agentId', 'progress'],
      },
    },
    {
      name: 'agent_complete_task',
      description: 'Mark a task as complete',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
        },
        required: ['taskId', 'agentId'],
      },
    },
    // File Locking
    {
      name: 'agent_lock_file',
      description: 'Lock a file for exclusive editing',
      inputSchema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            description: 'File path (relative to project root)',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          reason: {
            type: 'string',
            description: 'Reason for locking',
          },
          ttl: {
            type: 'number',
            description: 'Lock TTL in seconds (default: 3600)',
            default: COORDINATION_TTL,
          },
        },
        required: ['file', 'agentId'],
      },
    },
    {
      name: 'agent_unlock_file',
      description: 'Release a file lock',
      inputSchema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            description: 'File path',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier (must be the one who locked it)',
          },
        },
        required: ['file', 'agentId'],
      },
    },
    {
      name: 'agent_lock_files',
      description: 'Lock multiple files for exclusive editing (batch)',
      inputSchema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'File paths (relative to project root)',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          reason: {
            type: 'string',
            description: 'Reason for locking',
          },
          ttl: {
            type: 'number',
            description: 'Lock TTL in seconds (default: 3600)',
            default: COORDINATION_TTL,
          },
        },
        required: ['files', 'agentId'],
      },
    },
    {
      name: 'agent_unlock_files',
      description: 'Release multiple file locks (batch)',
      inputSchema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'File paths',
          },
          agentId: {
            type: 'string',
            description: 'Agent identifier (must be the one who locked them)',
          },
        },
        required: ['files', 'agentId'],
      },
    },
    {
      name: 'agent_check_file_lock',
      description: 'Check if a file is locked',
      inputSchema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            description: 'File path',
          },
        },
        required: ['file'],
      },
    },
    {
      name: 'agent_list_locked_files',
      description: 'List all currently locked files',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Filter by agent (optional)',
          },
        },
      },
    },
    // Conflict Detection
    {
      name: 'agent_detect_conflicts',
      description: 'Detect potential conflicts with other agents',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files to check for conflicts',
          },
        },
        required: ['agentId', 'files'],
      },
    },
    {
      name: 'agent_check_file_overlap',
      description: 'Check if files overlap with other agents\' work',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'Files to check',
          },
        },
        required: ['agentId', 'files'],
      },
    },
    // Coordination Tools
    {
      name: 'agent_suggest_coordination',
      description: 'Get coordination suggestions for safe parallel work',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Agent capabilities',
            default: [],
          },
          preferredFiles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Preferred files to work on',
            default: [],
          },
        },
        required: ['agentId'],
      },
    },
    {
      name: 'agent_get_workload_distribution',
      description: 'Get workload distribution across all agents',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'agent_find_available_work',
      description: 'Find unclaimed tasks that match agent capabilities',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent identifier',
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Agent capabilities',
            default: [],
          },
        },
        required: ['agentId'],
      },
    },
  ];
}

/**
 * Handle tool execution
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'agent_register': {
      const validated = AgentRegisterSchema.parse(args);
      return await registerAgent(validated.agentId, validated.capabilities, validated.currentTask || null);
    }
    
    case 'agent_update_status': {
      return await updateAgentStatus(args.agentId, args.status, args.currentTask || null, args.progress || null);
    }
    
    case 'agent_list_agents': {
      return await listAgents(args.includeInactive || false);
    }
    
    case 'agent_get_status': {
      return await getAgentStatus(args.agentId);
    }
    
    case 'agent_claim_task': {
      const validated = ClaimTaskSchema.parse(args);
      return await claimTask(validated.taskId, validated.agentId, validated.files, validated.description || '');
    }
    
    case 'agent_release_task': {
      return await releaseTask(args.taskId, args.agentId);
    }
    
    case 'agent_list_tasks': {
      return await listTasks(args.status || 'all', args.agentId || null);
    }
    
    case 'agent_update_task_progress': {
      return await updateTaskProgress(args.taskId, args.agentId, args.progress, args.message || '');
    }
    
    case 'agent_complete_task': {
      return await completeTask(args.taskId, args.agentId);
    }
    
    case 'agent_lock_file': {
      const validated = LockFileSchema.parse(args);
      return await lockFile(validated.file, validated.agentId, validated.reason || '', validated.ttl || COORDINATION_TTL);
    }
    
    case 'agent_unlock_file': {
      return await unlockFile(args.file, args.agentId);
    }
    
    case 'agent_lock_files': {
      const validated = LockFilesSchema.parse(args);
      return await lockFiles(validated.files, validated.agentId, validated.reason || '', validated.ttl || COORDINATION_TTL);
    }
    
    case 'agent_unlock_files': {
      const validated = UnlockFilesSchema.parse(args);
      return await unlockFiles(validated.files, validated.agentId);
    }
    
    case 'agent_check_file_lock': {
      return await checkFileLock(args.file);
    }
    
    case 'agent_list_locked_files': {
      return await listLockedFiles(args.agentId || null);
    }
    
    case 'agent_detect_conflicts': {
      const validated = DetectConflictsSchema.parse(args);
      return await detectConflicts(validated.agentId, validated.files);
    }
    
    case 'agent_check_file_overlap': {
      return await checkFileOverlap(args.agentId, args.files);
    }
    
    case 'agent_suggest_coordination': {
      return await suggestCoordination(args.agentId, args.capabilities || [], args.preferredFiles || []);
    }
    
    case 'agent_get_workload_distribution': {
      return await getWorkloadDistribution();
    }
    
    case 'agent_find_available_work': {
      return await findAvailableWork(args.agentId, args.capabilities || []);
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

