# MCP Server Production Deployment Guide

**Date:** 2025-01-25  
**Status:** ✅ Production Ready  
**Version:** 2.1.0

---

## Overview

This guide covers production deployment of the optimized MCP server with 28 essential tools, monitoring, security scanning, and Frenly AI integration.

---

## Prerequisites

### System Requirements
- Node.js 18+ 
- TypeScript 5.3+
- Docker (for container operations)
- PostgreSQL (for database operations via Postgres MCP)
- Redis (for cache operations)
- Git (for version control operations)

### Dependencies
```bash
cd mcp-server
npm install
```

---

## Build Process

### 1. Build MCP Server

```bash
cd mcp-server
npm run build
```

**Expected Output:**
- `dist/index.js` - Compiled server
- `dist/index.d.ts` - Type definitions
- `dist/index.js.map` - Source maps

### 2. Verify Build

```bash
node dist/index.js
# Should output: [reconciliation-platform-mcp] Server v2.1.0 running on stdio
```

---

## Configuration

### Environment Variables

Create `.env` file in `mcp-server/` directory:

```env
# Project Configuration
PROJECT_ROOT=/path/to/reconciliation-platform-378
BACKEND_URL=http://localhost:2000

# Redis Configuration
REDIS_URL=redis://:password@localhost:6379

# Optional: MCP Server URL (if HTTP bridge added)
MCP_SERVER_URL=http://localhost:3001
```

### Cursor/Claude Desktop Configuration

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "command": "node",
      "args": ["/path/to/reconciliation-platform-378/mcp-server/dist/index.js"],
      "env": {
        "PROJECT_ROOT": "/path/to/reconciliation-platform-378",
        "BACKEND_URL": "http://localhost:2000",
        "REDIS_URL": "redis://:password@localhost:6379"
      }
    }
  }
}
```

---

## Deployment Options

### Option 1: Direct stdio (Recommended for Development)

**Pros:**
- Simple setup
- Direct communication
- Low latency

**Cons:**
- Requires MCP client support
- No HTTP access

**Usage:**
```bash
node mcp-server/dist/index.js
```

### Option 2: HTTP Bridge (Future Enhancement)

**Pros:**
- HTTP API access
- Easier integration
- Can be load balanced

**Cons:**
- Additional complexity
- Requires HTTP server implementation

**Implementation:** (Future)
```typescript
// mcp-server/src/http-bridge.ts
import express from 'express';
// Bridge stdio MCP to HTTP
```

---

## Production Checklist

### Pre-Deployment

- [ ] All dependencies installed
- [ ] Build completed successfully
- [ ] Environment variables configured
- [ ] Redis connection tested
- [ ] Docker access verified
- [ ] Git repository accessible
- [ ] Backend URL accessible
- [ ] All 28 tools tested

### Security

- [ ] Environment variables secured
- [ ] Redis password set
- [ ] File permissions correct
- [ ] No secrets in code
- [ ] Security audit run
- [ ] Access controls configured

### Monitoring

- [ ] Tool usage tracking enabled
- [ ] Performance monitoring active
- [ ] Error logging configured
- [ ] Health checks implemented
- [ ] Metrics collection working

### Testing

- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Integration tests passing
- [ ] All tools verified
- [ ] Frenly AI integration tested

---

## Verification Steps

### 1. Verify Server Starts

```bash
cd mcp-server
node dist/index.js
```

**Expected:** Server starts without errors

### 2. Verify Tools Available

Use MCP client to list tools:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Expected:** 28 tools listed

### 3. Test Key Tools

```bash
# Test git status
# Test backend health check
# Test tool usage stats
# Test performance summary
```

### 4. Verify Frenly Integration

```typescript
import { mcpIntegrationService } from '@/services/mcpIntegrationService';

const summary = await mcpIntegrationService.getPerformanceSummary();
console.log(summary);
```

---

## Monitoring & Maintenance

### Tool Usage Monitoring

Monitor tool usage patterns:

```typescript
const stats = await mcpIntegrationService.getToolUsageStats();
// Analyze most used, slowest, error-prone tools
```

### Performance Monitoring

Regular performance checks:

```typescript
const summary = await mcpIntegrationService.getPerformanceSummary();
// Check recommendations
// Monitor system health
```

### Security Audits

Schedule regular security audits:

```typescript
const audit = await mcpIntegrationService.runSecurityAudit('all');
// Review vulnerabilities
// Apply fixes
```

---

## Troubleshooting

### Server Won't Start

**Symptoms:** Server exits immediately

**Solutions:**
1. Check Node.js version: `node --version` (should be 18+)
2. Verify build: `npm run build`
3. Check dependencies: `npm install`
4. Review error logs

### Redis Connection Failed

**Symptoms:** Redis operations fail

**Solutions:**
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL format
3. Verify password/authentication
4. Check network connectivity

### Docker Operations Fail

**Symptoms:** Docker tools return errors

**Solutions:**
1. Verify Docker is running: `docker ps`
2. Check Docker socket permissions
3. Verify user has Docker access
4. Check Docker daemon status

### Tools Not Available

**Symptoms:** Some tools missing from list

**Solutions:**
1. Verify build completed: `ls dist/`
2. Check for compilation errors
3. Review tool definitions in `src/index.ts`
4. Restart server

---

## Performance Tuning

### Connection Pooling

Redis connection pooling is automatic. Adjust if needed:

```typescript
// In mcp-server/src/index.ts
redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 5000, // Adjust as needed
  },
});
```

### Caching

Health check cache TTL: 5 seconds (configurable)

```typescript
const HEALTH_CHECK_CACHE_TTL = 5000; // Adjust as needed
```

### Timeouts

Default timeouts (configurable per tool):

- Default operations: 30s
- Backend compilation: 2min
- Tests: 2-10min
- Security audits: 5min

---

## Rollback Procedure

If deployment fails:

1. **Stop MCP Server**
   ```bash
   # Kill process or stop service
   ```

2. **Revert to Previous Version**
   ```bash
   git checkout <previous-version>
   cd mcp-server
   npm install
   npm run build
   ```

3. **Restart Server**
   ```bash
   node dist/index.js
   ```

---

## Post-Deployment

### Immediate (First 24 Hours)

- [ ] Monitor error logs
- [ ] Check tool usage patterns
- [ ] Verify Frenly AI integration
- [ ] Test all critical tools
- [ ] Monitor system resources

### Short-term (First Week)

- [ ] Review performance metrics
- [ ] Analyze tool usage statistics
- [ ] Optimize slow tools
- [ ] Address any security issues
- [ ] Collect user feedback

### Long-term (Ongoing)

- [ ] Regular security audits
- [ ] Performance optimization
- [ ] Tool usage analysis
- [ ] Feature enhancements
- [ ] Documentation updates

---

## Support

### Logs

MCP server logs to stderr (stdio transport):

```bash
node dist/index.js 2> mcp-server.log
```

### Health Checks

Monitor server health:

```typescript
// Via MCP client
const health = await callTool('backend_health_check', {});
```

### Metrics

Access performance metrics:

```typescript
const summary = await mcpIntegrationService.getPerformanceSummary();
```

---

## Conclusion

The MCP server is production-ready with:
- ✅ 28 essential tools
- ✅ Tool usage monitoring
- ✅ Security scanning
- ✅ Performance monitoring
- ✅ Frenly AI integration
- ✅ Comprehensive error handling
- ✅ Resource cleanup

**Status:** ✅ **Ready for Production**

---

**Last Updated:** 2025-01-25  
**Maintained By:** Development Team

