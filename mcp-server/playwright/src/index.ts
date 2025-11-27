!/usr/bin/env node
/**
 * Playwright MCP Server
 * - run_playwright: run tests with filters and settings
 * - get_last_summary: return latest run summary
 * - get_artifacts: list artifacts for a runId
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { execa } from 'execa';

dotenv.config();

const SERVER_NAME = 'mcp-playwright';
const SERVER_VERSION = '0.1.0';

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const TEST_RESULTS_DIR = resolve(PROJECT_ROOT, process.env.TEST_RESULTS_DIR || 'test-results/playwright');
const DEFAULT_CONFIG = process.env.PLAYWRIGHT_CONFIG || 'playwright.config.ts';
const PLAYWRIGHT_REPORT_DIR = process.env.PLAYWRIGHT_REPORT_DIR || 'playwright-report';

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function newRunId(): string {
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

function updateIndex(runId: string, summaryPath: string, artifactsDir: string) {
  ensureDir(TEST_RESULTS_DIR);
  const indexPath = join(TEST_RESULTS_DIR, 'index.json');
  const entry = { runId, summaryPath, artifactsDir, timestamp: new Date().toISOString() };
  let idx: any[] = [];
  if (existsSync(indexPath)) {
    try { idx = JSON.parse(readFileSync(indexPath, 'utf8')); } catch {}
  }
  idx.push(entry);
  if (idx.length > 100) idx = idx.slice(-100);
  writeFileSync(indexPath, JSON.stringify(idx, null, 2));
}

const tools: Tool[] = [
  {
    name: 'run_playwright',
    description: 'Run Playwright tests with filters and capture artifacts',
    inputSchema: {
      type: 'object',
      properties: {
        testMatch: { type: 'string', description: 'Glob or file to run' },
        grep: { type: 'string', description: 'Grep filter' },
        project: { type: 'string', description: 'Project name from config' },
        configPath: { type: 'string', description: 'Path to playwright config', default: DEFAULT_CONFIG },
        retries: { type: 'number', description: 'Override retries' },
        headless: { type: 'boolean', description: 'Run in headless mode', default: true },
        trace: { type: 'string', enum: ['on', 'off', 'retain-on-failure'], default: 'retain-on-failure' }
      }
    }
  },
  {
    name: 'get_last_summary',
    description: 'Return the latest run summary',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_artifacts',
    description: 'List artifacts for a given runId',
    inputSchema: { type: 'object', properties: { runId: { type: 'string' } }, required: ['runId'] }
  }
];

async function runPlaywright(args: any) {
  const runId = newRunId();
  const artifactsDir = join(TEST_RESULTS_DIR, runId);
  ensureDir(artifactsDir);

  const configPath = args.configPath || DEFAULT_CONFIG;
  const baseArgs: string[] = ['playwright', 'test'];
  if (args.testMatch) baseArgs.push(args.testMatch);
  if (args.grep) baseArgs.push('--grep', args.grep);
  if (args.project) baseArgs.push('--project', args.project);
  baseArgs.push('--config', configPath);
  if (args.retries !== undefined) baseArgs.push('--retries', String(args.retries));
  baseArgs.push('--reporter', 'json');
  // Output dir is handled by Playwright config; we store our own summaries under artifactsDir

  const env = { ...process.env };
  if (args.trace) env.PLAYWRIGHT_TRACE = args.trace;
  if (args.headless === false) env.HEADLESS = '0';

  const startedAt = Date.now();
  const result = await execa('npx', baseArgs, {
    cwd: PROJECT_ROOT,
    reject: false,
    all: true
  });

  let summary: any = {};
  try {
    summary = JSON.parse(result.stdout || result.all || '{}');
  } catch {
    summary = { raw: (result.all || '').split('\n').slice(-100).join('\n') };
  }

  const totals = summary?.stats || summary?.summary || {};
  const exitCode = result.exitCode ?? (totals?.expected && totals?.unexpected ? (totals.unexpected > 0 ? 1 : 0) : 0);

  const summaryPath = join(artifactsDir, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify({
    runId,
    args,
    exitCode,
    totals,
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    rawOutputTail: (result.all || '').split('\n').slice(-50).join('\n')
  }, null, 2));

  updateIndex(runId, summaryPath, artifactsDir);

  return {
    ok: exitCode === 0,
    data: {
      runId,
      totals,
      artifactsDir,
      summaryPath,
      reportDir: join(PROJECT_ROOT, PLAYWRIGHT_REPORT_DIR)
    },
    meta: {
      tool: 'run_playwright',
      server: SERVER_NAME,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      runId,
      artifacts: [artifactsDir]
    }
  };
}

function getLastSummary() {
  ensureDir(TEST_RESULTS_DIR);
  const indexPath = join(TEST_RESULTS_DIR, 'index.json');
  if (!existsSync(indexPath)) {
    return { ok: false, error: { code: 'NO_RUNS', message: 'No runs recorded yet' }, meta: { tool: 'get_last_summary', server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() } };
  }
  const idx = JSON.parse(readFileSync(indexPath, 'utf8')) as Array<any>;
  const last = idx[idx.length - 1];
  const summary = existsSync(last.summaryPath) ? JSON.parse(readFileSync(last.summaryPath, 'utf8')) : null;
  return {
    ok: true,
    data: { indexEntry: last, summary },
    meta: { tool: 'get_last_summary', server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString(), runId: last.runId }
  };
}

function getArtifacts(runId: string) {
  const dir = join(TEST_RESULTS_DIR, runId);
  if (!existsSync(dir)) {
    return { ok: false, error: { code: 'RUN_NOT_FOUND', message: `No artifacts for runId ${runId}` }, meta: { tool: 'get_artifacts', server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString(), runId } };
  }
  const files = readdirSync(dir, { withFileTypes: true }).map(d => d.name);
  return { ok: true, data: { runId, dir, files }, meta: { tool: 'get_artifacts', server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString(), runId } };
}

async function main() {
  const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'run_playwright') {
        const result = await runPlaywright(args || {});
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      if (name === 'get_last_summary') {
        const result = getLastSummary();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      if (name === 'get_artifacts') {
        const result = getArtifacts((args || {}).runId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: { code: 'UNKNOWN_TOOL', message: `Unknown tool ${name}` }, meta: { tool: name, server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() } }, null, 2) }], isError: true } as any;
    } catch (e: any) {
      const err = { ok: false, error: { code: 'UNEXPECTED', message: e?.message || String(e) }, meta: { tool: name, server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() } };
      return { content: [{ type: 'text', text: JSON.stringify(err, null, 2) }], isError: true } as any;
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] v${SERVER_VERSION} running. Results: ${TEST_RESULTS_DIR}`);
}

main().catch((e) => {
  console.error(`[${SERVER_NAME}] Fatal:`, e);
  process.exit(1);
});
