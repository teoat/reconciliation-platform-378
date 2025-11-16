# MCP Installation Guide - Reconciliation Platform

This guide will help you set up the Model Context Protocol (MCP) server for enhanced AI agent controls over the Reconciliation Platform.

## What is MCP?

Model Context Protocol (MCP) is a protocol that allows AI assistants (like Claude) to interact with your application through standardized tools. This MCP server provides:

- **Docker Container Management**: Start, stop, restart, and monitor containers
- **Database Operations**: Read-only SQL queries on PostgreSQL
- **Redis Cache Operations**: Get, list, and delete cache keys
- **Health Monitoring**: Check backend and frontend health
- **File System Access**: Read files and list directories
- **Diagnostic Tools**: Run comprehensive application diagnostics

## Prerequisites

1. **Node.js 18+** installed
2. **TypeScript** compiler
3. **Docker** running (for container management)
4. **PostgreSQL** and **Redis** accessible (or via Docker)

## Installation Steps

### 1. Install Dependencies

```bash
cd /Users/Arief/Desktop/378/mcp-server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `PROJECT_ROOT`: Absolute path to project root

### 3. Build TypeScript

```bash
npm run build
```

### 4. Test the Server

```bash
npm start
```

If successful, you should see:
```
Reconciliation Platform MCP Server running on stdio
```

## Configuration for Claude Desktop

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "command": "node",
      "args": ["/Users/Arief/Desktop/378/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "/Users/Arief/Desktop/378"
      }
    }
  }
}
```

### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "command": "node",
      "args": ["C:\\Users\\Arief\\Desktop\\378\\mcp-server\\dist\\index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "C:\\Users\\Arief\\Desktop\\378"
      }
    }
  }
}
```

### Linux

Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "command": "node",
      "args": ["/home/yourusername/Desktop/378/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "/home/yourusername/Desktop/378"
      }
    }
  }
}
```

## Configuration for Cursor IDE

If you're using Cursor IDE, you can configure MCP through settings:

1. Open Cursor Settings
2. Search for "MCP" or "Model Context Protocol"
3. Add server configuration similar to Claude Desktop

## Available Tools

Once configured, you can use these tools through your AI assistant:

### Docker Tools
- `docker_container_status` - List all containers
- `docker_container_logs` - View container logs
- `docker_container_start` - Start a container
- `docker_container_stop` - Stop a container
- `docker_container_restart` - Restart a container

### Monitoring Tools
- `backend_health_check` - Check backend health
- `backend_metrics` - Get Prometheus metrics
- `run_diagnostic` - Run comprehensive diagnostics

### Database Tools
- `database_query` - Execute read-only SQL queries

### Redis Tools
- `redis_get` - Get cache value
- `redis_keys` - List cache keys
- `redis_delete` - Delete cache key

### File System Tools
- `read_file` - Read files from project
- `list_directory` - List directory contents

## Example Usage

Once configured, you can ask your AI assistant:

- "Check the status of all Docker containers"
- "Show me the backend health status"
- "What Redis keys are currently cached?"
- "Read the backend main.rs file"
- "Run a diagnostic on the application"
- "Start the reconciliation-backend container"

## Troubleshooting

### Server Not Starting

1. **Check Node.js version**: `node --version` (should be 18+)
2. **Verify build**: `cd mcp-server && npm run build`
3. **Check permissions**: Ensure the script is executable
4. **Review logs**: Check for error messages in console

### Connection Errors

1. **Database**: Verify `DATABASE_URL` is correct and PostgreSQL is running
2. **Redis**: Verify `REDIS_URL` is correct and Redis is accessible
3. **Docker**: Ensure Docker daemon is running

### Tools Not Working

1. **Permissions**: Ensure Docker socket is accessible
2. **Path Issues**: Verify `PROJECT_ROOT` is an absolute path
3. **Environment**: Check all required env vars are set

## Security Considerations

⚠️ **Important Security Notes**:

1. **Read-Only Database**: Database queries are restricted to SELECT only
2. **Scoped File Access**: File operations are limited to PROJECT_ROOT
3. **Container Control**: Container operations require Docker access
4. **Environment Variables**: Keep `.env` file secure and never commit it

## Development

To modify or extend the MCP server:

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run compiled version
npm start
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment
3. ✅ Build TypeScript
4. ✅ Configure Claude Desktop / Cursor
5. ✅ Test with AI assistant
6. ✅ Start using enhanced controls!

## Support

For issues or questions:
- Check the diagnostic report: `COMPREHENSIVE_DIAGNOSTIC_REPORT.md`
- Run diagnostics: `./scripts/comprehensive-diagnostic.sh`
- Review server logs for errors

---

**MCP Server Version**: 1.0.0  
**Platform Version**: 1.0.0  
**Last Updated**: $(date)

