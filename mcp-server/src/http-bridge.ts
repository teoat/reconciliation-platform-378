#!/usr/bin/env node
/**
 * HTTP Bridge for MCP Server
 * 
 * Provides HTTP REST API wrapper around stdio-based MCP server
 * Enables frontend and other services to call MCP tools via HTTP
 */

// @ts-ignore
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { join } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.MCP_BRIDGE_PORT || 3001;
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/Arief/Documents/GitHub/reconciliation-platform-378';
const MCP_SERVER_PATH = join(PROJECT_ROOT, 'mcp-server', 'dist', 'index.js');
const API_KEY = process.env.MCP_BRIDGE_API_KEY || '';
const ENABLE_AUTH = process.env.MCP_BRIDGE_ENABLE_AUTH === 'true' || !!API_KEY;
const ALLOWED_ORIGINS = (process.env.MCP_BRIDGE_CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');

const app = express();
app.use(express.json());

// CORS configuration
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// API key authentication middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!ENABLE_AUTH) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Valid API key required.',
    });
  }

  next();
};

// Audit logging
interface AuditLog {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  tool?: string;
  success: boolean;
  duration?: number;
}

const auditLogs: AuditLog[] = [];
const MAX_AUDIT_LOGS = 1000;

function logAudit(log: AuditLog): void {
  auditLogs.push(log);
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.shift();
  }
  
  // In production, also write to file or external logging service
  console.log(`[AUDIT] ${log.timestamp} ${log.method} ${log.path} ${log.ip} ${log.success ? 'SUCCESS' : 'FAILED'} ${log.duration ? `${log.duration}ms` : ''}`);
}

// MCP client instance
let mcpClient: Client | null = null;
let transport: StdioClientTransport | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds
let reconnectTimer: NodeJS.Timeout | null = null;

/**
 * Initialize MCP client connection
 */
async function initMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  console.log(`[MCP Bridge] Starting MCP server: ${MCP_SERVER_PATH}`);
  
  try {
    // Create transport (handles spawning the process)
    transport = new StdioClientTransport({
      command: 'node',
      args: [MCP_SERVER_PATH],
      env: {
        ...process.env,
        PROJECT_ROOT,
      },
    });

    // Create client
    mcpClient = new Client(
      {
        name: 'mcp-http-bridge',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect
    await mcpClient.connect(transport);

    console.log('[MCP Bridge] Connected to MCP server');
    return mcpClient;
  } catch (error) {
    console.error('[MCP Bridge] Failed to connect to MCP server:', error);
    mcpClient = null;
    transport = null;
    
    // Schedule reconnection attempt
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`[MCP Bridge] Scheduling reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY}ms`);
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      
      reconnectTimer = setTimeout(async () => {
        try {
          await initMCPClient();
          reconnectAttempts = 0; // Reset on success
        } catch (err) {
          console.error('[MCP Bridge] Reconnection failed:', err);
        }
      }, RECONNECT_DELAY);
    } else {
      console.error('[MCP Bridge] Max reconnection attempts reached. Manual intervention required.');
    }
    
    throw error;
  }
}

/**
 * Health check endpoint (no auth required)
 */
app.get('/health', (req: Request, res: Response) => {
  const startTime = Date.now();
  const result = {
    status: 'ok',
    service: 'mcp-http-bridge',
    mcpConnected: mcpClient !== null,
    timestamp: new Date().toISOString(),
  };
  
  logAudit({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip || 'unknown',
    success: true,
    duration: Date.now() - startTime,
  });
  
  res.json(result);
});

/**
 * List available tools
 */
app.get('/tools', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const client = await initMCPClient();
    const tools = await client.listTools();
    
    logAudit({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip || 'unknown',
      success: true,
      duration: Date.now() - startTime,
    });
    
    res.json({
      success: true,
      tools: tools.tools,
    });
  } catch (error: any) {
    logAudit({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip || 'unknown',
      success: false,
      duration: Date.now() - startTime,
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Call MCP tool
 */
app.post('/tools/:toolName', authenticate, async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { toolName } = req.params;
  
  try {
    const args = req.body.args || {};

    const client = await initMCPClient();
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    let data;
    // @ts-ignore
    if (result.content && (result.content as any[]).length > 0 && result.content[0]?.type === 'text') {
      try {
        data = JSON.parse(result.content[0].text);
      } catch {
        data = result.content[0].text;
      }
    } else {
      data = result.content;
    }

    const success = !result.isError;
    const duration = Date.now() - startTime;
    
    logAudit({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip || 'unknown',
      tool: toolName,
      success,
      duration,
    });

    res.json({
      success,
      data,
      isError: result.isError || false,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logAudit({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip || 'unknown',
      tool: toolName,
      success: false,
      duration,
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      tool: toolName,
    });
  }
});

/**
 * Get audit logs (admin only)
 */
app.get('/audit', authenticate, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = auditLogs.slice(-limit);
  res.json({
    success: true,
    count: logs.length,
    logs,
  });
});

/**
 * Get tool usage statistics
 */
app.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const client = await initMCPClient();
    const result = await client.callTool({
      name: 'get_tool_usage_stats',
      arguments: {},
    });

    let data;
    // @ts-ignore
    if (result.content && (result.content as any[]).length > 0 && result.content[0]?.type === 'text') {
      data = JSON.parse(result.content[0].text);
    } else {
      data = result.content;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get performance summary
 */
app.get('/performance', authenticate, async (req: Request, res: Response) => {
  try {
    const client = await initMCPClient();
    const result = await client.callTool({
      name: 'get_performance_summary',
      arguments: {},
    });

    let data;
    // @ts-ignore
    if (result.content && (result.content as any[]).length > 0 && result.content[0]?.type === 'text') {
      data = JSON.parse(result.content[0].text);
    } else {
      data = result.content;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Run security audit
 */
app.post('/security/audit', authenticate, async (req: Request, res: Response) => {
  try {
    const { scope = 'all' } = req.body;
    const client = await initMCPClient();
    const result = await client.callTool({
      name: 'run_security_audit',
      arguments: { scope },
    });

    let data;
    // @ts-ignore
    if (result.content && (result.content as any[]).length > 0 && result.content[0]?.type === 'text') {
      data = JSON.parse(result.content[0].text);
    } else {
      data = result.content;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[MCP Bridge] HTTP server running on port ${PORT}`);
  console.log(`[MCP Bridge] Project root: ${PROJECT_ROOT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log('[MCP Bridge] Shutting down...');
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  if (mcpClient) {
    try {
      await mcpClient.close();
    } catch (error) {
      console.error('[MCP Bridge] Error closing MCP client:', error);
    }
  }
  
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Health monitoring
setInterval(async () => {
  if (!mcpClient && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    try {
      await initMCPClient();
      reconnectAttempts = 0;
    } catch (error) {
      // Health check failed, will retry on next interval
    }
  }
}, 30000); // Check every 30 seconds

