/**
 * Diagnostic Tools for MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync } from 'fs';
import { join } from 'path';
import si from 'systeminformation';
import { BACKEND_URL, PROJECT_ROOT } from './config.js';
import { checkBackendHealth } from './health.js';
import { trackToolUsage, getToolUsageStats, getAllToolMetrics } from './metrics.js';
import {
  runDiagnostic,
  checkFrontendBuildStatus,
  checkBackendCompilation,
  listMigrations,
  runMigration,
} from './diagnostics.js';
import { execCommand } from './utils.js';

/**
 * Diagnostic and system tool definitions
 */
export function getDiagnosticTools(): Tool[] {
  return [
    {
      name: 'backend_health_check',
      description: 'Check backend health status with caching (5s TTL)',
      inputSchema: {
        type: 'object',
        properties: {
          endpoint: {
            type: 'string',
            description: 'Health endpoint URL',
            default: `${BACKEND_URL}/health`,
          },
          useCache: {
            type: 'boolean',
            description: 'Use cached result if available',
            default: true,
          },
        },
      },
    },
    {
      name: 'backend_compile_check',
      description: 'Check if backend compiles without errors using cargo check',
      inputSchema: {
        type: 'object',
        properties: {
          verbose: {
            type: 'boolean',
            description: 'Show verbose compilation output',
            default: false,
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 120000,
          },
        },
      },
    },
    {
      name: 'run_diagnostic',
      description: 'Run comprehensive application diagnostic script',
      inputSchema: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['full', 'backend', 'frontend', 'database', 'redis', 'containers'],
            description: 'Diagnostic scope',
            default: 'full',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 300000,
          },
        },
      },
    },
    {
      name: 'frontend_build_status',
      description: 'Check frontend build status and analyze bundle size',
      inputSchema: {
        type: 'object',
        properties: {
          checkSize: {
            type: 'boolean',
            description: 'Calculate total build size',
            default: true,
          },
        },
      },
    },
    {
      name: 'run_backend_tests',
      description: 'Run Rust backend tests with optional filter',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Test filter pattern',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 180000,
          },
        },
      },
    },
    {
      name: 'run_frontend_tests',
      description: 'Run TypeScript/React frontend tests',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Test filter pattern',
          },
          coverage: {
            type: 'boolean',
            description: 'Generate coverage report',
            default: false,
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 120000,
          },
        },
      },
    },
    {
      name: 'run_e2e_tests',
      description:
        'Run Playwright E2E tests (DEPRECATED: use the Playwright MCP server tool "run_playwright" for richer controls and artifacts)',
      inputSchema: {
        type: 'object',
        properties: {
          spec: {
            type: 'string',
            description: 'Specific test file',
          },
          headed: {
            type: 'boolean',
            description: 'Run in headed mode',
            default: false,
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 600000,
          },
        },
      },
    },
    {
      name: 'run_linter',
      description: 'Run ESLint on frontend code',
      inputSchema: {
        type: 'object',
        properties: {
          fix: {
            type: 'boolean',
            description: 'Auto-fix issues',
            default: false,
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 60000,
          },
        },
      },
    },
    {
      name: 'run_clippy',
      description: 'Run clippy on Rust backend code',
      inputSchema: {
        type: 'object',
        properties: {
          fix: {
            type: 'boolean',
            description: 'Apply automatic fixes',
            default: false,
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 120000,
          },
        },
      },
    },
    {
      name: 'check_types',
      description: 'Run TypeScript type checking',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            enum: ['frontend', 'all'],
            description: 'Project to check',
            default: 'all',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 60000,
          },
        },
      },
    },
    {
      name: 'list_migrations',
      description: 'List all migrations and their status',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'run_migration',
      description: 'Run database migrations',
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target migration (optional, runs all if not specified)',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 120000,
          },
        },
      },
    },
    {
      name: 'run_security_audit',
      description: 'Run security audit (npm audit for frontend, cargo audit for backend)',
      inputSchema: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['frontend', 'backend', 'all'],
            description: 'Scope of security audit',
            default: 'all',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds',
            default: 300000,
          },
        },
      },
    },
    {
      name: 'get_system_metrics',
      description: 'Get system performance metrics (CPU, memory, disk)',
      inputSchema: {
        type: 'object',
        properties: {
          includeProcesses: {
            type: 'boolean',
            description: 'Include process information',
            default: false,
          },
        },
      },
    },
    {
      name: 'get_performance_summary',
      description: 'Get performance summary (tool usage, system health, recommendations)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_tool_usage_stats',
      description: 'Get usage statistics for all tools (monitoring)',
      inputSchema: {
        type: 'object',
        properties: {
          tool: {
            type: 'string',
            description: 'Specific tool name (optional, returns all if not specified)',
          },
        },
      },
    },
    {
      name: 'run_safe_shell_command',
      description:
        'Execute a safe, whitelisted shell command within the project root. Use with caution.',
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description:
              'The shell command to execute (e.g., "ls -la", "pwd", "echo hello"). Must be a whitelisted command.',
          },
          args: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Arguments for the command (optional).',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds for the command execution.',
            default: 10000,
          },
        },
        required: ['command'],
      },
    },
  ];
}

/**
 * Handle diagnostic tool execution
 */
export async function handleDiagnosticTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'backend_health_check':
      return await checkBackendHealth(args.endpoint, args.useCache !== false);

    case 'backend_compile_check':
      return await checkBackendCompilation(args.verbose, args.timeout);

    case 'run_diagnostic':
      return await runDiagnostic(args.scope, args.timeout);

    case 'frontend_build_status':
      return await checkFrontendBuildStatus(args.checkSize !== false);

    case 'run_backend_tests': {
      const backendDir = join(PROJECT_ROOT, 'backend');
      if (!existsSync(backendDir)) {
        throw new Error(`Backend directory not found: ${backendDir}`);
      }
      const timeout = args.timeout || 180000;
      const testArgs = ['test', '--lib'];
      if (args.filter) {
        testArgs.push('--', args.filter);
      }
      const result = await execCommand('cargo', testArgs, {
        cwd: backendDir,
        timeout,
      });
      return {
        success: result.success,
        passed: result.success,
        output: result.output.split('\n').slice(-30).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_frontend_tests': {
      const frontendDir = join(PROJECT_ROOT, 'frontend');
      if (!existsSync(frontendDir)) {
        throw new Error(`Frontend directory not found: ${frontendDir}`);
      }
      const timeout = args.timeout || 120000;
      const testArgs = ['test', '--', '--run'];
      if (args.filter) {
        testArgs.push('--grep', args.filter);
      }
      if (args.coverage) {
        testArgs.push('--coverage');
      }
      const result = await execCommand('npm', testArgs, {
        cwd: frontendDir,
        timeout,
      });
      return {
        success: result.success,
        passed: result.success,
        output: result.output.split('\n').slice(-30).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_e2e_tests': {
      const frontendDir = join(PROJECT_ROOT, 'frontend');
      if (!existsSync(frontendDir)) {
        throw new Error(`Frontend directory not found: ${frontendDir}`);
      }
      const timeout = args.timeout || 600000;
      const testArgs = ['run', 'test:e2e'];
      if (args.spec) {
        testArgs.push('--', args.spec);
      }
      if (args.headed) {
        testArgs.push('--', '--headed');
      }
      const result = await execCommand('npm', testArgs, {
        cwd: frontendDir,
        timeout,
      });
      return {
        success: result.success,
        passed: result.success,
        output: result.output.split('\n').slice(-30).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_linter': {
      const frontendDir = join(PROJECT_ROOT, 'frontend');
      if (!existsSync(frontendDir)) {
        throw new Error(`Frontend directory not found: ${frontendDir}`);
      }
      const timeout = args.timeout || 60000;
      const lintArgs = ['run', 'lint'];
      if (args.fix) {
        lintArgs.push('--', '--fix');
      }
      const result = await execCommand('npm', lintArgs, {
        cwd: frontendDir,
        timeout,
      });
      return {
        success: result.success,
        fixed: args.fix && result.success,
        output: result.output.split('\n').slice(-20).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'run_clippy': {
      const backendDir = join(PROJECT_ROOT, 'backend');
      if (!existsSync(backendDir)) {
        throw new Error(`Backend directory not found: ${backendDir}`);
      }
      const timeout = args.timeout || 120000;
      const clippyArgs = ['clippy', '--', '-D', 'warnings'];
      if (args.fix) {
        clippyArgs.push('--fix');
      }
      const result = await execCommand('cargo', clippyArgs, {
        cwd: backendDir,
        timeout,
      });
      return {
        success: result.success,
        fixed: args.fix && result.success,
        output: result.output.split('\n').slice(-20).join('\n'),
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    case 'check_types': {
      const timeout = args.timeout || 60000;
      const project = args.project || 'all';
      if (project === 'frontend' || project === 'all') {
        const frontendDir = join(PROJECT_ROOT, 'frontend');
        if (!existsSync(frontendDir)) {
          throw new Error(`Frontend directory not found: ${frontendDir}`);
        }
        const result = await execCommand('npm', ['run', 'type-check'], {
          cwd: frontendDir,
          timeout,
        });
        return {
          success: result.success,
          project: 'frontend',
          output: result.output.split('\n').slice(-20).join('\n'),
          error: result.error,
          exitCode: result.exitCode,
        };
      }
      throw new Error(`Unknown project: ${project}`);
    }

    case 'list_migrations':
      return await listMigrations();

    case 'run_migration':
      return await runMigration(args.target, args.timeout);

    case 'get_tool_usage_stats':
      return getToolUsageStats(args.tool);

    case 'run_security_audit': {
      const scope = args.scope || 'all';
      const timeout = args.timeout || 300000;
      const results: Record<string, unknown> = {};

      if (scope === 'frontend' || scope === 'all') {
        const frontendDir = join(PROJECT_ROOT, 'frontend');
        if (existsSync(frontendDir)) {
          const result = await execCommand('npm', ['audit', '--json'], {
            cwd: frontendDir,
            timeout,
          });
          try {
            const auditData = JSON.parse(result.output);
            results.frontend = {
              success: result.success,
              vulnerabilities: auditData.vulnerabilities || {},
              summary: auditData.metadata?.vulnerabilities || {},
              output: result.output.split('\n').slice(-20).join('\n'),
            };
          } catch {
            results.frontend = {
              success: result.success,
              output: result.output,
              error: 'Failed to parse audit output',
            };
          }
        }
      }

      if (scope === 'backend' || scope === 'all') {
        const backendDir = join(PROJECT_ROOT, 'backend');
        if (existsSync(backendDir)) {
          const checkResult = await execCommand('cargo', ['audit', '--version'], {
            cwd: backendDir,
            timeout: 5000,
          });
          if (checkResult.success) {
            const result = await execCommand('cargo', ['audit', '--json'], {
              cwd: backendDir,
              timeout,
            });
            try {
              const auditData = JSON.parse(result.output);
              results.backend = {
                success: result.success,
                vulnerabilities: auditData.vulnerabilities || [],
                summary: auditData.summary || {},
                output: result.output.split('\n').slice(-20).join('\n'),
              };
            } catch {
              results.backend = {
                success: result.success,
                output: result.output,
                error: 'Failed to parse audit output',
              };
            }
          } else {
            results.backend = {
              success: false,
              message: 'cargo-audit not installed. Install with: cargo install cargo-audit',
            };
          }
        }
      }

      return {
        scope,
        results,
        timestamp: new Date().toISOString(),
      };
    }

    case 'get_system_metrics': {
      try {
        const [cpu, mem, fs, processes] = await Promise.all([
          si.currentLoad(),
          si.mem(),
          si.fsSize(),
          args.includeProcesses ? si.processes() : Promise.resolve(null),
        ]);
        return {
          cpu: {
            currentLoad: cpu.currentLoad,
            avgLoad: cpu.avgLoad,
            cores: cpu.cpus?.length || 0,
          },
          memory: {
            total: mem.total,
            used: mem.used,
            free: mem.free,
            usagePercent: ((mem.used / mem.total) * 100).toFixed(2),
          },
          disk: fs.map((f) => ({
            fs: f.fs,
            size: f.size,
            used: f.used,
            available: f.available,
            usagePercent: ((f.used / f.size) * 100).toFixed(2),
          })),
          processes:
            args.includeProcesses && processes
              ? {
                  total: processes.all || 0,
                  running: processes.running || 0,
                  sleeping: processes.sleeping || 0,
                  topCpu:
                    processes.list?.slice(0, 5).map((p) => ({
                      pid: p.pid,
                      name: p.name,
                      cpu: p.cpu,
                    })) || [],
                }
              : undefined,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        throw new Error(`Failed to get system metrics: ${error.message}`);
      }
    }

    case 'get_performance_summary': {
      try {
        const toolStats = getAllToolMetrics();
        const mostUsed = toolStats.sort((a, b) => b.count - a.count).slice(0, 5);
        const slowest = toolStats.sort((a, b) => b.avgTime - a.avgTime).slice(0, 5);
        const errorProne = toolStats
          .filter((t) => t.errors > 0)
          .sort((a, b) => b.errors - a.errors)
          .slice(0, 5);

        const [cpu, mem] = await Promise.all([si.currentLoad(), si.mem()]);

        const backendHealth: any = await checkBackendHealth(undefined, false).catch(() => null);

        const recommendations: string[] = [];
        if (mem.used / mem.total > 0.9) {
          recommendations.push('Memory usage is high (>90%). Consider optimizing or scaling.');
        }
        if (cpu.currentLoad > 80) {
          recommendations.push('CPU usage is high (>80%). Consider optimizing processes.');
        }
        const slowTools = toolStats.filter((t) => t.avgTime > 5000);
        if (slowTools.length > 0) {
          recommendations.push(
            `Some tools are slow (avg >5s): ${slowTools.map((t) => t.name).join(', ')}`
          );
        }
        const highErrorRate = toolStats.filter((t) => t.successRate < 90);
        if (highErrorRate.length > 0) {
          recommendations.push(
            `Some tools have high error rates: ${highErrorRate.map((t) => `${t.name} (${(100 - t.successRate).toFixed(1)}%)`).join(', ')}`
          );
        }

        return {
          toolUsage: {
            totalTools: toolStats.length,
            totalCalls: toolStats.reduce((sum, t) => sum + t.count, 0),
            mostUsed,
            slowest,
            errorProne,
          },
          systemHealth: {
            cpu: {
              load: cpu.currentLoad,
              cores: cpu.cpus?.length || 0,
            },
            memory: {
              usagePercent: ((mem.used / mem.total) * 100).toFixed(2),
              total: mem.total,
              used: mem.used,
            },
          },
          backendHealth: backendHealth
            ? {
                status: backendHealth.status,
                timestamp: backendHealth.timestamp,
              }
            : null,
          recommendations,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        throw new Error(`Failed to get performance summary: ${error.message}`);
      }
    }

    case 'run_safe_shell_command': {
      const allowedCommands = ['ls', 'pwd', 'echo', 'cat', 'grep', 'find', 'head', 'tail'];
      const command = args.command.split(' ')[0];
      if (!allowedCommands.includes(command)) {
        throw new Error(`Command '${command}' is not whitelisted for 'run_safe_shell_command'.`);
      }
      let fullArgs = args.command.split(' ').slice(1);
      if (args.args && args.args.length > 0) {
        fullArgs = [...fullArgs, ...args.args];
      }
      const result = await execCommand(command, fullArgs, {
        cwd: PROJECT_ROOT,
        timeout: args.timeout || 10000,
      });
      return {
        success: result.success,
        command: args.command,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
      };
    }

    default:
      throw new Error(`Unknown diagnostic tool: ${name}`);
  }
}
