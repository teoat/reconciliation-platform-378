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
import { SERVER_NAME } from './agent-coordination/config.js';

dotenv.config();

// Main entry point
startServer().catch((error) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  process.exit(1);
});
