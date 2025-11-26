import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

export function newRunId() {
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}

export function writeJson(p: string, data: unknown) {
  ensureDir(path.dirname(p));
  writeFileSync(p, JSON.stringify(data, null, 2));
}

export function readJson<T = unknown>(p: string): T | null {
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function appendIndex(indexPath: string, entry: unknown, max = 100) {
  const idx = (readJson<any[]>(indexPath) || []);
  idx.push(entry);
  const pruned = idx.length > max ? idx.slice(-max) : idx;
  writeJson(indexPath, pruned);
}
