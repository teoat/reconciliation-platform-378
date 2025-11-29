import path from 'node:path';

export const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/Arief/Documents/GitHub/reconciliation-platform-378';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:2000';

// Prefer a fully specified REDIS_URL from the environment. If only REDIS_PASSWORD
// is provided (common in dev when using docker-compose defaults), synthesize a
// redis:// URL that includes the password so MCP tools align with backend/compose.
const DEV_REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_URL =
  process.env.REDIS_URL ||
  (DEV_REDIS_PASSWORD ? `redis://:${DEV_REDIS_PASSWORD}@localhost:6379` : 'redis://localhost:6379');

export const DIRS = {
  TEST_RESULTS: path.resolve(PROJECT_ROOT, 'test-results'),
  PLAYWRIGHT_RESULTS: path.resolve(PROJECT_ROOT, process.env.TEST_RESULTS_DIR || 'test-results/playwright'),
  ACCESSIBILITY_REPORTS: path.resolve(PROJECT_ROOT, 'accessibility-reports'),
  PERFORMANCE_RESULTS: path.resolve(PROJECT_ROOT, 'performance-results'),
  DIAGNOSTIC_RESULTS: path.resolve(PROJECT_ROOT, 'diagnostic-results'),
};

export const FLAGS = {
  ENABLE_DOCKER_TOOLS: process.env.ENABLE_DOCKER_TOOLS !== 'false',
  ENABLE_SECURITY_AUDIT: process.env.ENABLE_SECURITY_AUDIT !== 'false',
  ENABLE_GIT_TOOLS: process.env.ENABLE_GIT_TOOLS !== 'false',
};
