#!/usr/bin/env node
/**
 * Optimized MCP Server for Reconciliation Platform
 * 
 * Provides enhanced AI agent controls with:
 * - Docker container management (optimized)
 * - Redis cache operations (with connection pooling)
 * - Backend service health checks (with caching)
 * - Build and compilation status checks
 * - Diagnostic execution
 * 
 * Performance optimizations:
 * - Redis connection reuse
 * - Health check caching (5s TTL)
 * - Timeout handling for all operations
 * - Proper error handling and retries
 * - Resource cleanup
 * 
 * Note: Database queries use postgres MCP server, file operations use filesystem MCP server.
 */

import * as dotenv from 'dotenv';
import { startServer } from './lib/server.js';
import { SERVER_NAME } from './lib/config.js';

dotenv.config();

// Main entry point
startServer().catch((error) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  process.exit(1);
});
