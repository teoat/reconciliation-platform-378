/**
 * Script Execution Tools for MCP Server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT } from './config.js';
import { execCommand } from './utils.js';
import { trackToolUsage } from './metrics.js';

// Whitelisted scripts for execution
const ALLOWED_SCRIPTS = {
    'verify-performance': {
        path: 'scripts/verify-performance.sh',
        description: 'Verify application performance metrics',
    },
    'setup-mcp': {
        path: 'scripts/setup-mcp.sh',
        description: 'Setup MCP server configuration',
    },
    'run-all-tests': {
        path: 'scripts/run-all-tests.sh',
        description: 'Run all project tests',
    },
    'deploy-docker': {
        path: 'scripts/deploy-docker.sh',
        description: 'Deploy application using Docker',
    },
    'analyze-bundle-size': {
        path: 'scripts/analyze-bundle-size.sh',
        description: 'Analyze frontend bundle size',
    },
    'fix-linting-warnings': {
        path: 'scripts/fix-linting-warnings.sh',
        description: 'Auto-fix linting warnings',
    },
    'check-coverage': {
        path: 'scripts/check-coverage.sh',
        description: 'Check test coverage',
    },
    'audit-technical-debt': {
        path: 'scripts/audit-technical-debt.sh',
        description: 'Audit technical debt',
    },
    'validate-dependencies': {
        path: 'scripts/validate-dependencies.sh',
        description: 'Validate project dependencies',
    },
    'monitor-dependencies': {
        path: 'scripts/monitor-dependencies.sh',
        description: 'Monitor dependency health',
    },
    'generate-dependency-report': {
        path: 'scripts/generate-dependency-report.sh',
        description: 'Generate dependency analysis report',
    },
    'setup-monitoring': {
        path: 'scripts/setup-monitoring.sh',
        description: 'Setup production monitoring',
    },
    'verify-deployment': {
        path: 'scripts/verify-deployment.sh',
        description: 'Verify deployment status',
    },
    'verify-health-checks': {
        path: 'scripts/verify-health-checks.sh',
        description: 'Run health checks',
    },
    'verify-security-headers': {
        path: 'scripts/verify-security-headers.sh',
        description: 'Verify security headers',
    },
    'apply-db-indexes': {
        path: 'scripts/apply-db-indexes.sh',
        description: 'Apply database indexes for performance',
    },
    'apply-performance-indexes': {
        path: 'scripts/apply-performance-indexes.sh',
        description: 'Apply additional performance indexes',
    },
    'optimize-console-logs': {
        path: 'scripts/optimize-console-logs.sh',
        description: 'Remove or optimize console logs in production',
    },
};

/**
 * Get script tools definitions
 */
export function getScriptTools(): Tool[] {
    return [
        {
            name: 'list_scripts',
            description: 'List available scripts that can be run via run_script',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'run_script',
            description: 'Run a pre-defined project script',
            inputSchema: {
                type: 'object',
                properties: {
                    script: {
                        type: 'string',
                        enum: Object.keys(ALLOWED_SCRIPTS),
                        description: 'Name of the script to run',
                    },
                    args: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description: 'Optional arguments to pass to the script',
                    },
                    timeout: {
                        type: 'number',
                        description: 'Timeout in milliseconds',
                        default: 300000, // 5 minutes default for scripts
                    },
                },
                required: ['script'],
            },
        },
    ];
}

/**
 * Handle script tool execution
 */
export async function handleScriptTool(name: string, args: any): Promise<any> {
    switch (name) {
        case 'list_scripts':
            return {
                scripts: Object.entries(ALLOWED_SCRIPTS).map(([key, value]) => ({
                    name: key,
                    path: value.path,
                    description: value.description,
                })),
            };

        case 'run_script': {
            const scriptName = args.script as keyof typeof ALLOWED_SCRIPTS;
            const scriptDef = ALLOWED_SCRIPTS[scriptName];

            if (!scriptDef) {
                throw new Error(`Script '${scriptName}' not found or not allowed.`);
            }

            const scriptPath = join(PROJECT_ROOT, scriptDef.path);
            if (!existsSync(scriptPath)) {
                throw new Error(`Script file not found at: ${scriptPath}`);
            }

            // Determine command based on extension
            let command = 'bash';
            if (scriptPath.endsWith('.js') || scriptPath.endsWith('.mjs')) {
                command = 'node';
            } else if (scriptPath.endsWith('.ts')) {
                command = 'npx tsx';
            }

            const scriptArgs = [scriptDef.path, ...(args.args || [])];

            // Use bash explicitly for .sh files to ensure they run even if not executable
            const cmd = scriptPath.endsWith('.sh') ? 'bash' : command;
            const finalArgs = scriptPath.endsWith('.sh') ? scriptArgs : args.args || [];

            // For node/tsx, we need to pass the script path as the first arg
            if (command === 'node' || command.includes('tsx')) {
                // logic handled by execCommand wrapper usually, but let's be explicit
                // actually execCommand takes (command, args)
                // if command is 'node', args should be ['path/to/script', ...args]
            }

            // Let's simplify: always use the relative path from project root
            // execCommand uses PROJECT_ROOT as cwd

            let execCmd = 'bash';
            let execArgs = [scriptDef.path, ...(args.args || [])];

            if (scriptDef.path.endsWith('.js') || scriptDef.path.endsWith('.mjs')) {
                execCmd = 'node';
                execArgs = [scriptDef.path, ...(args.args || [])];
            } else if (scriptDef.path.endsWith('.ts')) {
                execCmd = 'npx';
                execArgs = ['tsx', scriptDef.path, ...(args.args || [])];
            }

            const result = await execCommand(execCmd, execArgs, {
                timeout: args.timeout || 300000,
            });

            return {
                success: result.success,
                script: scriptName,
                command: `${execCmd} ${execArgs.join(' ')}`,
                output: result.output.split('\n').slice(-50).join('\n'), // Last 50 lines
                error: result.error,
                exitCode: result.exitCode,
            };
        }

        default:
            throw new Error(`Unknown script tool: ${name}`);
    }
}
