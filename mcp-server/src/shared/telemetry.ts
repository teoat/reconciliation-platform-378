type Metric = { name: string; count: number; totalTime: number; errors: number; lastUsed: string; samples: number[] };

const metrics = new Map<string, Metric>();

export function track(tool: string, durationMs: number, success: boolean) {
  const m = metrics.get(tool) || { name: tool, count: 0, totalTime: 0, errors: 0, lastUsed: new Date().toISOString(), samples: [] };
  m.count += 1;
  m.totalTime += durationMs;
  m.lastUsed = new Date().toISOString();
  if (!success) m.errors += 1;
  m.samples.push(durationMs);
  if (m.samples.length > 100) m.samples.shift();
  metrics.set(tool, m);
  return m;
}

export function summarize() {
  const arr = [...metrics.values()];
  const totalCalls = arr.reduce((s, m) => s + m.count, 0);
  const totalTime = arr.reduce((s, m) => s + m.totalTime, 0);
  return {
    totalTools: arr.length,
    totalCalls,
    avgTimePerCall: totalCalls ? totalTime / totalCalls : 0,
    tools: arr.sort((a, b) => b.count - a.count),
  };
}
