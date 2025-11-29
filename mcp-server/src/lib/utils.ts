/**
 * Utility functions for MCP Server
 */

import { execa } from 'execa';
import { PROJECT_ROOT, DEFAULT_TIMEOUT } from './config.js';

/**
 * Execute shell command with timeout
 */
export async function execCommand(
  command: string,
  args: string[],
  options: { cwd?: string; timeout?: number } = {}
): Promise<{ success: boolean; output: string; error?: string; exitCode?: number }> {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd || PROJECT_ROOT,
      timeout: options.timeout || DEFAULT_TIMEOUT,
      reject: false,
      all: true, // Capture both stdout and stderr
    });

    return {
      success: result.exitCode === 0,
      output: result.all || result.stdout || '',
      error: result.exitCode !== 0 ? result.stderr : undefined,
      exitCode: result.exitCode,
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message || String(error),
      exitCode: error.exitCode || 1,
    };
  }
}

