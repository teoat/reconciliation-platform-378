/**
 * Diagnostic operations for MCP Server
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT } from './config.js';
import { execCommand } from './utils.js';

/**
 * Run comprehensive diagnostic script
 */
export async function runDiagnostic(scope: string = 'full', timeout: number = 300000) {
  const scriptPath = join(PROJECT_ROOT, 'scripts', 'comprehensive-diagnostic.sh');
  
  if (!existsSync(scriptPath)) {
    throw new Error(`Diagnostic script not found: ${scriptPath}`);
  }

  // Run diagnostic script
  const result = await execCommand('bash', [scriptPath], {
    cwd: PROJECT_ROOT,
    timeout,
  });

  return {
    success: result.success,
    scope,
    output: result.output,
    error: result.error,
    exitCode: result.exitCode,
    message: result.success
      ? 'Diagnostic completed successfully'
      : 'Diagnostic encountered errors',
  };
}

/**
 * Check frontend build status
 */
export async function checkFrontendBuildStatus(checkSize = true) {
  const distPath = join(PROJECT_ROOT, 'frontend', 'dist');
  
  try {
    if (!existsSync(distPath)) {
      return {
        exists: false,
        path: distPath,
        message: 'Frontend build directory does not exist. Run: cd frontend && npm run build',
      };
    }

    const stats = statSync(distPath);
    const files = readdirSync(distPath, { recursive: true });

    let totalSize = 0;
    if (checkSize) {
      // Calculate total size (simplified - would need recursive stat for accurate size)
      totalSize = stats.size;
    }

    // Check for common build artifacts
    const hasIndex = files.some((f) => f.toString().includes('index.html'));
    const hasAssets = files.some((f) => f.toString().includes('assets'));
    
    return {
      exists: true,
      path: distPath,
      fileCount: files.length,
      lastModified: stats.mtime.toISOString(),
      totalSize: totalSize > 0 ? `${(totalSize / 1024 / 1024).toFixed(2)} MB` : 'unknown',
      hasIndexHtml: hasIndex,
      hasAssets,
      buildStatus: hasIndex && hasAssets ? 'complete' : 'incomplete',
    };
  } catch (error: any) {
    return {
      exists: false,
      path: distPath,
      error: error.message,
    };
  }
}

/**
 * Check backend compilation
 */
export async function checkBackendCompilation(verbose = false, timeout = 120000) {
  const backendDir = join(PROJECT_ROOT, 'backend');
  
  if (!existsSync(backendDir)) {
    throw new Error(`Backend directory not found: ${backendDir}`);
  }

  const result = await execCommand(
    'cargo',
    ['check', ...(verbose ? ['--verbose'] : [])],
    {
      cwd: backendDir,
      timeout,
    }
  );

  return {
    success: result.success,
    compiled: result.success,
    output: verbose ? result.output : result.output.split('\n').slice(-20).join('\n'), // Last 20 lines if not verbose
    error: result.error,
    exitCode: result.exitCode,
  };
}

/**
 * List database migrations
 */
export async function listMigrations() {
  const migrationsDir = join(PROJECT_ROOT, 'backend', 'migrations');
  
  if (!existsSync(migrationsDir)) {
    return {
      migrations: [],
      message: 'Migrations directory not found',
    };
  }

  try {
    const files = readdirSync(migrationsDir);
    const migrations = files
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const stats = statSync(join(migrationsDir, f));
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      migrations,
      count: migrations.length,
      path: migrationsDir,
    };
  } catch (error: any) {
    throw new Error(`Failed to list migrations: ${error.message}`);
  }
}

/**
 * Run database migration
 */
export async function runMigration(target?: string, timeout = 120000) {
  const backendDir = join(PROJECT_ROOT, 'backend');
  
  if (!existsSync(backendDir)) {
    throw new Error(`Backend directory not found: ${backendDir}`);
  }

  const migrateArgs = ['run', '--bin', 'migrate'];
  
  if (target) {
    migrateArgs.push('--', '--target', target);
  }

  const result = await execCommand('cargo', migrateArgs, {
    cwd: backendDir,
    timeout,
  });

  return {
    success: result.success,
    migrated: result.success,
    output: result.output.split('\n').slice(-20).join('\n'),
    error: result.error,
    exitCode: result.exitCode,
  };
}

