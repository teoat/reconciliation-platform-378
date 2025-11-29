/**
 * Git operations for MCP Server
 */

import simpleGit, { SimpleGit } from 'simple-git';
import { PROJECT_ROOT } from './config.js';

// Connection instance (singleton pattern)
let git: SimpleGit | null = null;

/**
 * Initialize Git client
 */
function getGit(): SimpleGit {
  if (!git) {
    git = simpleGit(PROJECT_ROOT);
  }
  return git;
}

/**
 * Get git status
 */
export async function getGitStatus() {
  try {
    const gitInstance = getGit();
    const status = await gitInstance.status();
    // Extract file lists safely
    const staged = status.staged || [];
    const notAdded = status.not_added || [];
    const modified = status.modified || [];
    const conflicted = status.conflicted || [];
    
    return {
      current: status.current,
      branch: status.current,
      ahead: status.ahead,
      behind: status.behind,
      files: {
        staged,
        unstaged: notAdded,
        modified,
        conflicted,
      },
      clean: status.isClean(),
      totalChanges: status.files?.length || 0,
    };
  } catch (error: any) {
    throw new Error(`Git status failed: ${error.message}`);
  }
}

/**
 * List git branches
 */
export async function listGitBranches(all = true) {
  try {
    const gitInstance = getGit();
    const branches = await gitInstance.branchLocal();
    const remoteBranches = all ? await gitInstance.branch(['-r']) : null;
    
    return {
      local: branches.all,
      current: branches.current,
      remote: remoteBranches?.all || [],
    };
  } catch (error: any) {
    throw new Error(`Git branch list failed: ${error.message}`);
  }
}

/**
 * Create git branch
 */
export async function createGitBranch(branch: string, checkout = true) {
  try {
    const gitInstance = getGit();
    await gitInstance.checkoutLocalBranch(branch);
    
    if (checkout) {
      await gitInstance.checkout(branch);
    }

    return {
      success: true,
      branch,
      checkedOut: checkout,
    };
  } catch (error: any) {
    throw new Error(`Git branch create failed: ${error.message}`);
  }
}

/**
 * Create git commit
 */
export async function createGitCommit(message: string, all = false) {
  try {
    const gitInstance = getGit();
    
    if (all) {
      await gitInstance.add('.');
    }

    const commit = await gitInstance.commit(message);
    
    return {
      success: true,
      commit: commit.commit,
      summary: commit.summary,
    };
  } catch (error: any) {
    throw new Error(`Git commit failed: ${error.message}`);
  }
}

/**
 * Get git log
 */
export async function getGitLog(limit = 10, branch?: string) {
  try {
    const gitInstance = getGit();
    const logOptions = branch ? [branch, `-n${limit}`] : [`-n${limit}`];
    
    const log = await gitInstance.log(logOptions);
    
    return {
      commits: log.all.slice(0, limit).map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: commit.author_name,
      })),
      total: log.total,
    };
  } catch (error: any) {
    throw new Error(`Git log failed: ${error.message}`);
  }
}

/**
 * Cleanup git connection
 */
export function cleanupGit(): void {
  git = null;
}

