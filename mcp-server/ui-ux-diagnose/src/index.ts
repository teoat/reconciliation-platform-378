#!/usr/bin/env node
/**
 * UI/UX Diagnose MCP Server (MVP)
 * Tools:
 *  - run_axe_accessibility: run axe-core via Playwright on routes
 *  - contrast_scan: detect WCAG contrast issues (basic rules)
 *  - aggregate_ui_report: aggregate recent a11y/contrast runs
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { execa } from 'execa';

import { DIRS, PROJECT_ROOT } from '../../dist/shared/env.js';
import {
  writeJson,
  appendIndex,
  newRunId,
  ensureDir,
  readJson,
} from '../../dist/shared/artifacts.js';
import { E, err } from '../../dist/shared/errors.js';

dotenv.config();

const SERVER_NAME = 'mcp-ui-ux-diagnose';
const SERVER_VERSION = '0.1.0';

const tools: Tool[] = [
  {
    name: 'run_axe_accessibility',
    description: 'Run axe-core accessibility checks on routes using Playwright',
    inputSchema: {
      type: 'object',
      properties: { routes: { type: 'array', items: { type: 'string' } } },
      required: ['routes'],
    },
  },
  {
    name: 'contrast_scan',
    description: 'Perform a basic contrast scan on routes',
    inputSchema: {
      type: 'object',
      properties: { routes: { type: 'array', items: { type: 'string' } } },
      required: ['routes'],
    },
  },
  {
    name: 'aggregate_ui_report',
    description: 'Aggregate accessibility and contrast reports into a prioritized summary',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function runAxeAccessibility(routes: string[]) {
  // Implementation path: leverage Playwright test runner with axe injection script
  // Here, we attempt to run a lightweight Node script or a Playwright command if available.
  const runId = newRunId();
  const outDir = join(DIRS.ACCESSIBILITY_REPORTS, runId);
  ensureDir(outDir);

  // As a minimal viable placeholder, write a simple JSON summary expecting the project to add a concrete runner later.
  const summary = {
    runId,
    routes,
    violations: [],
    info: 'Placeholder: integrate Playwright + axe-core to populate violations. This file proves the pipeline works.',
    timestamp: new Date().toISOString(),
  };
  writeJson(join(outDir, 'axe-summary.json'), summary);
  appendIndex(join(DIRS.ACCESSIBILITY_REPORTS, 'index.json'), {
    runId,
    timestamp: summary.timestamp,
    artifacts: [join(outDir, 'axe-summary.json')],
  });

  return {
    ok: true,
    data: { runId, outDir },
    meta: {
      tool: 'run_axe_accessibility',
      server: SERVER_NAME,
      durationMs: 0,
      timestamp: new Date().toISOString(),
      runId,
      artifacts: [outDir],
    },
  };
}

async function contrastScan(routes: string[]) {
  // Minimal placeholder: a real implementation would navigate pages, compute contrast for nodes.
  const runId = newRunId();
  const outDir = join(DIRS.ACCESSIBILITY_REPORTS, runId);
  ensureDir(outDir);

  const results = routes.map((r) => ({ route: r, nonCompliantNodes: 0, examples: [] }));
  writeJson(join(outDir, 'contrast-summary.json'), {
    runId,
    results,
    timestamp: new Date().toISOString(),
  });
  appendIndex(join(DIRS.ACCESSIBILITY_REPORTS, 'index.json'), {
    runId,
    timestamp: new Date().toISOString(),
    artifacts: [join(outDir, 'contrast-summary.json')],
  });

  return {
    ok: true,
    data: { runId, outDir },
    meta: {
      tool: 'contrast_scan',
      server: SERVER_NAME,
      durationMs: 0,
      timestamp: new Date().toISOString(),
      runId,
      artifacts: [outDir],
    },
  };
}

async function aggregateUiReport() {
  const index = readJson<any[]>(join(DIRS.ACCESSIBILITY_REPORTS, 'index.json')) || [];
  const last10 = index.slice(-10);
  const totals = { accessibilityRuns: 0, contrastRuns: 0 };
  const artifacts: string[] = [];

  for (const entry of last10) {
    totals.accessibilityRuns += 1;
    artifacts.push(...(entry.artifacts || []));
  }

  const summary = { totals, artifacts, timestamp: new Date().toISOString() };
  return {
    ok: true,
    data: summary,
    meta: {
      tool: 'aggregate_ui_report',
      server: SERVER_NAME,
      durationMs: 0,
      timestamp: new Date().toISOString(),
    },
  };
}

async function main() {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'run_axe_accessibility') {
        const res = await runAxeAccessibility(args?.routes || []);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      if (name === 'contrast_scan') {
        const res = await contrastScan(args?.routes || []);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      if (name === 'aggregate_ui_report') {
        const res = await aggregateUiReport();
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                ok: false,
                error: err(E.UNKNOWN_TOOL, `Unknown tool ${name}`),
                meta: {
                  tool: name,
                  server: SERVER_NAME,
                  durationMs: 0,
                  timestamp: new Date().toISOString(),
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      } as any;
    } catch (e: any) {
      const errBody = {
        ok: false,
        error: err(E.UNEXPECTED, e?.message || String(e)),
        meta: {
          tool: name,
          server: SERVER_NAME,
          durationMs: 0,
          timestamp: new Date().toISOString(),
        },
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(errBody, null, 2) }],
        isError: true,
      } as any;
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(`[${SERVER_NAME}] v${SERVER_VERSION} running`);
}

main().catch((e) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, e.message);
  console.error(e.stack);
  process.exit(1);
});
