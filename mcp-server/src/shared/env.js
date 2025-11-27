import path from 'node:path';
export const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/Arief/Documents/GitHub/reconciliation-platform-378';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:2000';
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
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
//# sourceMappingURL=env.js.map