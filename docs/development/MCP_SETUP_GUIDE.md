# MCP Setup Guide - Complete Reference

**Date**: January 2025  
**Status**: ✅ Current and Complete  
**Location**: `.cursor/mcp.json`

---

## 📋 Overview

This comprehensive guide covers everything you need to know about setting up and using Model Context Protocol (MCP) servers for the Reconciliation Platform. This guide consolidates installation, implementation, optimization, and configuration information.

---

## 🎯 What is MCP?

Model Context Protocol (MCP) is a protocol that allows AI assistants (like Claude) to interact with your application through standardized tools. The Reconciliation Platform uses MCP to provide:

- **Docker Container Management**: Start, stop, restart, and monitor containers
- **Database Operations**: Read-only SQL queries on PostgreSQL
- **Redis Cache Operations**: Get, list, and delete cache keys
- **Health Monitoring**: Check backend and frontend health
- **File System Access**: Read files and list directories
- **Browser Automation**: E2E testing with Playwright
- **Diagnostic Tools**: Run comprehensive application diagnostics

---

## ✅ Current Configuration

### Active MCP Servers (5 servers)

1. **filesystem** - File system operations
   - **Purpose**: Read/write files, directory operations
   - **Resource Usage**: Minimal

2. **postgres** - PostgreSQL database operations
   - **Purpose**: Database queries, schema inspection
   - **Resource Usage**: Minimal (uses existing connection)

3. **git** - Git repository operations
   - **Purpose**: Version control operations, commit history
   - **Resource Usage**: Minimal

4. **playwright** - Browser automation
   - **Purpose**: E2E testing, browser automation
   - **Resource Usage**: On-demand (only when used)

5. **reconciliation-platform** - Custom platform tools
   - **Purpose**: Docker management, Redis operations, diagnostics
   - **Resource Usage**: Minimal

### Configuration File

Location: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/Arief/Documents/GitHub/reconciliation-platform-378"],
      "env": {}
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
      }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/Users/Arief/Documents/GitHub/reconciliation-platform-378"],
      "env": {}
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": {}
    },
    "reconciliation-platform": {
      "command": "node",
      "args": ["/Users/Arief/Documents/GitHub/reconciliation-platform-378/mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "/Users/Arief/Documents/GitHub/reconciliation-platform-378"
      }
    }
  }
}
```

---

## 🚀 Installation & Setup

### Prerequisites

1. **Node.js 18+** installed
2. **TypeScript** compiler (for custom server)
3. **Docker** running (for container management)
4. **PostgreSQL** and **Redis** accessible (or via Docker)

### Step 1: Install Custom MCP Server

The custom `reconciliation-platform` server needs to be built:

```bash
cd mcp-server
npm install
npm run build
```

### Step 2: Configure Environment

The custom server requires environment variables. These are set in `.cursor/mcp.json`:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `PROJECT_ROOT`: Absolute path to project root

### Step 3: Verify Installation

```bash
# Test Filesystem MCP
npx -y @modelcontextprotocol/server-filesystem --help

# Test PostgreSQL MCP
npx -y @modelcontextprotocol/server-postgres --help

# Test Git MCP
npx -y @modelcontextprotocol/server-git --help

# Test Playwright MCP
npx -y @playwright/mcp@latest --help
```

### Step 4: Restart IDE

After configuration changes, restart Cursor/IDE to load new MCP servers.

---

## 📋 Available Tools

### Filesystem MCP Tools
- List directories and files
- Read file contents
- Search files by pattern
- Get file metadata

### PostgreSQL MCP Tools
- Query database schema
- Execute SQL queries (read-only)
- Analyze indexes
- Validate migrations

### Git MCP Tools
- Git operations (commit, push, pull, merge)
- Branch management
- Diff analysis
- History exploration

### Playwright MCP Tools
- Browser navigation
- Element interaction (click, type, select)
- Screenshot capture
- Form filling
- Network monitoring

### Reconciliation Platform MCP Tools
- `docker_container_status` - List containers
- `docker_container_logs` - View logs
- `docker_container_start` - Start container
- `docker_container_stop` - Stop container
- `docker_container_restart` - Restart container
- `backend_health_check` - Check backend health
- `redis_get` - Get cache value
- `redis_keys` - List cache keys
- `redis_delete` - Delete cache key
- `run_diagnostic` - Run diagnostics

---

## 💡 Example Usage

Once configured, you can ask your AI assistant:

- "Check the status of all Docker containers"
- "Show me the backend health status"
- "What Redis keys are currently cached?"
- "Read the backend main.rs file"
- "Run a diagnostic on the application"
- "Start the reconciliation-backend container"
- "Navigate to the login page and take a screenshot"
- "List all TypeScript files in frontend/src"

---

## 🔧 Optimization

### Current Optimization Status

- **MCP Servers**: 5 active servers (optimized from 6)
- **Resource Usage**: ~120-160MB (reduced from ~150-200MB)
- **Startup Time**: ~2-4 seconds (improved from ~3-5 seconds)

### Removed Servers

- **prometheus** - Removed (can access directly via browser at http://localhost:9090)

### When to Re-enable Prometheus MCP

Consider re-enabling if:
1. You frequently query Prometheus metrics via AI
2. You need AI agents to monitor metrics automatically
3. You want AI agents to respond to Prometheus alerts

To re-enable, add to `.cursor/mcp.json`:
```json
{
  "prometheus": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-prometheus"],
    "env": {
      "PROMETHEUS_URL": "http://localhost:9090"
    }
  }
}
```

---

## 🔒 Security Best Practices

1. **Never Commit Secrets**
   - Add `.cursor/mcp.json` to `.gitignore` (if not already)
   - Use environment variables for sensitive values

2. **Use Minimal Permissions**
   - PostgreSQL: Use read-only user when possible
   - Filesystem: Restricted to project directory
   - Docker: Requires Docker socket access

3. **Read-Only Database**
   - Database queries are restricted to SELECT only
   - No write operations allowed

4. **Scoped File Access**
   - File operations are limited to PROJECT_ROOT
   - Cannot access files outside project directory

---

## 🆘 Troubleshooting

### MCP Server Not Starting

1. **Check Node.js version**: `node --version` (should be 18+)
2. **Verify build**: `cd mcp-server && npm run build`
3. **Check permissions**: Ensure the script is executable
4. **Review logs**: Check for error messages in console

### Connection Errors

1. **Database**: Verify `DATABASE_URL` is correct and PostgreSQL is running
2. **Redis**: Verify `REDIS_URL` is correct and Redis is accessible
3. **Docker**: Ensure Docker daemon is running (`docker ps`)

### Reconciliation Platform MCP Failing

```bash
cd mcp-server
npm install
npm run build
```

### Playwright MCP Not Working

- Ensure Playwright browsers are installed: `npm run test:e2e:install`
- Check if browser automation is needed (may not be required for all tasks)

### Tools Not Working

1. **Permissions**: Ensure Docker socket is accessible
2. **Path Issues**: Verify `PROJECT_ROOT` is an absolute path
3. **Environment**: Check all required env vars are set

---

## 📚 Related Documentation

- [Playwright MCP Setup](./PLAYWRIGHT_MCP_SETUP.md) - Detailed Playwright MCP guide
- [Cursor Optimization Guide](./CURSOR_OPTIMIZATION_GUIDE.md) - Cursor IDE optimization
- [Service Optimization Proposal](../deployment/SERVICE_OPTIMIZATION_PROPOSAL.md) - Docker service optimization

---

## 🔄 Maintenance

### Regular Review

- Review tool usage quarterly
- Remove unused servers
- Monitor resource usage

### Adding New Servers

1. Check current server count
2. Verify resource impact
3. Add to `.cursor/mcp.json`
4. Restart Cursor IDE
5. Test functionality

---

**Last Updated**: January 2025  
**Maintained By**: Reconciliation Platform Team

