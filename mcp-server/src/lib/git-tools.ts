/**
 * Git Tools for MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  getGitStatus,
  listGitBranches,
  createGitBranch,
  createGitCommit,
  getGitLog,
} from './git.js';

/**
 * Git-related tool definitions
 */
export function getGitTools(): Tool[] {
  return [
    {
      name: 'git_status',
      description: 'Get git status (staged, unstaged, untracked files)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'git_branch_list',
      description: 'List all branches (local and remote)',
      inputSchema: {
        type: 'object',
        properties: {
          all: {
            type: 'boolean',
            description: 'Include remote branches',
            default: true,
          },
        },
      },
    },
    {
      name: 'git_branch_create',
      description: 'Create a new branch',
      inputSchema: {
        type: 'object',
        properties: {
          branch: {
            type: 'string',
            description: 'Branch name',
          },
          checkout: {
            type: 'boolean',
            description: 'Checkout the new branch',
            default: true,
          },
        },
        required: ['branch'],
      },
    },
    {
      name: 'git_commit',
      description: 'Create a commit with message',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Commit message',
          },
          all: {
            type: 'boolean',
            description: 'Stage all changes before commit',
            default: false,
          },
        },
        required: ['message'],
      },
    },
    {
      name: 'git_log',
      description: 'Show commit history',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of commits to show',
            default: 10,
          },
          branch: {
            type: 'string',
            description: 'Branch name (optional)',
          },
        },
      },
    },
  ];
}

/**
 * Handle Git tool execution
 */
export async function handleGitTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'git_status':
      return await getGitStatus();

    case 'git_branch_list':
      return await listGitBranches(args.all !== false);

    case 'git_branch_create':
      return await createGitBranch(args.branch, args.checkout !== false);

    case 'git_commit':
      return await createGitCommit(args.message, args.all === true);

    case 'git_log':
      return await getGitLog(args.limit || 10, args.branch);

    default:
      throw new Error(`Unknown Git tool: ${name}`);
  }
}
