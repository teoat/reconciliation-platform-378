#!/usr/bin/env node
/**
 * Frontend Diagnostics MCP Server (MVP)
 * Tools:
 *  - build_analyze: analyze Next.js/webpack stats (if present)
 *  - detect_broken_links: bounded crawler to report broken links
 *  - lighthouse_audit: run Lighthouse (if installed) and store reports
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { join, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { execa } from 'execa';
import axios from 'axios';

import { DIRS, PROJECT_ROOT } from '../../dist/shared/env.js';
import { writeJson, appendIndex, newRunId, ensureDir } from '../../dist/shared/artifacts.js';
import { E, err } from '../../dist/shared/errors.js';
import { types } from 'util';

dotenv.config();

const SERVER_NAME = 'antigravity-frontend-diagnostics';
const SERVER_VERSION = '0.1.0';

const tools: Tool[] = [
  {
    name: 'build_analyze',
    description: 'Analyze Next.js/webpack build stats (if stats.json is available)',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'detect_broken_links',
    description: 'Crawl a site starting at startUrl and report broken links (bounded by host and depth)',
    inputSchema: {
      type: 'object',
      properties: {
        startUrl: { type: 'string' },
        maxDepth: { type: 'number', default: 2 }
      },
      required: ['startUrl']
    }
  },
  {
    name: 'lighthouse_audit',
    description: 'Run Lighthouse against a URL (if lighthouse is installed)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' }, default: ['performance', 'accessibility', 'best-practices', 'seo'] }
      },
      required: ['url']
    }
  }
];

function findStats(): { path: string; json: any } | null {
  const candidates = [
    resolve(PROJECT_ROOT, '.next', 'stats.json'),
    resolve(PROJECT_ROOT, 'frontend', 'dist', 'stats.json'),
    resolve(PROJECT_ROOT, 'dist', 'stats.json')
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try { return { path: p, json: JSON.parse(readFileSync(p, 'utf8')) }; } catch { }
    }
  }
  return null;
}

async function buildAnalyze() {
  const stats = findStats();
  if (!stats) {
    return { ok: false, error: err(E.UNEXPECTED, 'No stats.json found in common locations'), meta: { tool: 'build_analyze', server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() } };
  }

  const json = stats.json;
  // Simplified: extract top assets by size if present
  const assets: Array<{ name: string; size: number }> = json.assets || [];
  const top = assets.sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, 10).map(a => ({ name: a.name, sizeKB: ((a.size || 0) / 1024).toFixed(2) }));
  const totalKB = ((assets.reduce((s, a) => s + (a.size || 0), 0)) / 1024).toFixed(2);

  return {
    ok: true,
    data: { totalKB, topAssets: top, statsPath: stats.path },
    meta: { tool: 'build_analyze', server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() }
  };
}

async function detectBrokenLinks(startUrl: string, maxDepth = 2) {
  const urlObj = new URL(startUrl);
  const host = urlObj.host;
  const visited = new Set<string>();
  const broken: Array<{ url: string; status: number; referer?: string }> = [];

  async function crawl(url: string, depth: number, referer?: string): Promise<void> {
    if (depth > maxDepth || visited.has(url)) return;
    visited.add(url);

    try {
      const res = await axios.get(url, { validateStatus: () => true, timeout: 15000 });
      if (res.status >= 400) broken.push({ url, status: res.status, referer });
      if (depth === maxDepth) return;

      const html = typeof res.data === 'string' ? res.data : '';
      const links = [...html.matchAll(/href\s*=\s*"([^"]+)"/g)].map(m => m[1]).filter(Boolean);
      for (const l of links) {
        let next: string | null = null;
        try {
          const u = new URL(l, url);
          if (u.host === host) next = u.toString();
        } catch { /* ignore invalid URLs */ }
        if (next) await crawl(next, depth + 1, url);
      }
    } catch {
      broken.push({ url, status: 0, referer });
    }
  }

  await crawl(startUrl, 0);

  return {
    ok: true,
    data: { startUrl, maxDepth, brokenCount: broken.length, broken },
    meta: { tool: 'detect_broken_links', server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() }
  };
}

async function lighthouseAudit(url: string, categories: string[] = ['performance', 'accessibility', 'best-practices', 'seo']) {
  const runId = newRunId();
  const outDir = join(DIRS.PERFORMANCE_RESULTS, runId);
  ensureDir(outDir);

  // Try to run lighthouse
  const args = [url, '--quiet', '--chrome-flags=--headless=new', `--output=json`, `--output=html`, `--output-path=${join(outDir, 'report')}`];
  for (const c of categories) args.push(`--only-categories=${c}`);

  const started = Date.now();
  try {
    const result = await execa('lighthouse', args, { cwd: PROJECT_ROOT, reject: false, all: true, timeout: 300000 });
    const success = result.exitCode === 0;
    const jsonPath = join(outDir, 'report.report.json');
    const htmlPath = join(outDir, 'report.report.html');

    appendIndex(join(DIRS.PERFORMANCE_RESULTS, 'index.json'), {
      runId,
      url,
      categories,
      durationMs: Date.now() - started,
      artifacts: [jsonPath, htmlPath],
      timestamp: new Date().toISOString()
    });

    if (!success) {
      return { ok: false, error: err(E.UNEXPECTED, 'Lighthouse run failed', { exitCode: result.exitCode, tail: (result.all || '').split('\n').slice(-20).join('\n') }), meta: { tool: 'lighthouse_audit', server: SERVER_NAME, durationMs: Date.now() - started, timestamp: new Date().toISOString(), runId, artifacts: [outDir] } };
    }

    return { ok: true, data: { runId, jsonPath, htmlPath }, meta: { tool: 'lighthouse_audit', server: SERVER_NAME, durationMs: Date.now() - started, timestamp: new Date().toISOString(), runId, artifacts: [outDir] } };
  } catch (e: any) {
    return { ok: false, error: err(E.EXTERNAL_TOOL_MISSING, 'Lighthouse CLI not found. Install globally or add to project devDependencies.', { message: e?.message }), meta: { tool: 'lighthouse_audit', server: SERVER_NAME, durationMs: Date.now() - started, timestamp: new Date().toISOString(), runId } };
  }
}

async function main() {
  const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args as any) || {};
    try {
      if (name === 'build_analyze') {
        const res = await buildAnalyze();
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      if (name === 'detect_broken_links') {
        const res = await detectBrokenLinks(a.startUrl as string, (a.maxDepth as number) ?? 2);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      if (name === 'lighthouse_audit') {
        const res = await lighthouseAudit(a.url as string, a.categories as string[]);
        return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: err(E.UNKNOWN_TOOL, `Unknown tool ${name}`), meta: { tool: name, server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() } }, null, 2) }], isError: true } as any;
    } catch (e: any) {
      const errBody = { ok: false, error: err(E.UNEXPECTED, e?.message || String(e)), meta: { tool: name, server: SERVER_NAME, durationMs: 0, timestamp: new Date().toISOString() } };
      return { content: [{ type: 'text', text: JSON.stringify(errBody, null, 2) }], isError: true } as any;
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] v${SERVER_VERSION} running`);
}

main().catch((e) => {
  console.error(`[${SERVER_NAME}] Fatal:`, e);
  process.exit(1);
});
