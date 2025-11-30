#!/usr/bin/env node
/**
 * Agent Coordination MCP Server
 *
 * Provides coordination tools for multiple IDE agents working on the same codebase:
 * - Task management (claim, release, track)
 * - File locking (prevent conflicts)
 * - Agent status tracking
 * - Conflict detection
 * - Coordination suggestions
 *
 * Uses Redis for shared state across all agent instances.
 */

import * as dotenv from 'dotenv';
import { startServer } from './agent-coordination/server.js';
import { logger } from './lib/logger.js';

dotenv.config();

// Main entry point
startServer().catch((error) => {
  logger.error('Fatal error occurred during server startup', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
