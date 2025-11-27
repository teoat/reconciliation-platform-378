import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
export function ensureDir(p) {
    if (!existsSync(p))
        mkdirSync(p, { recursive: true });
}
export function newRunId() {
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const rand = Math.random().toString(36).slice(2, 8);
    return `${ts}-${rand}`;
}
export function writeJson(p, data) {
    ensureDir(path.dirname(p));
    writeFileSync(p, JSON.stringify(data, null, 2));
}
export function readJson(p) {
    try {
        return JSON.parse(readFileSync(p, 'utf8'));
    }
    catch {
        return null;
    }
}
export function appendIndex(indexPath, entry, max = 100) {
    const idx = (readJson(indexPath) || []);
    idx.push(entry);
    const pruned = idx.length > max ? idx.slice(-max) : idx;
    writeJson(indexPath, pruned);
}
//# sourceMappingURL=artifacts.js.map