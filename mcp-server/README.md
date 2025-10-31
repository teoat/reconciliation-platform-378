# Reconciliation Platform MCP Server

Model Context Protocol (MCP) server for enhanced AI agent controls over the Reconciliation Platform.

## Overview

This MCP server provides AI agents with powerful tools to:
- Manage Docker containers
- Query databases
- Interact with Redis cache
- Monitor backend/frontend health
- Read files and directories
- Run diagnostics
- Control deployments

## Installation

### Prerequisites

- Node.js 18+ 
- TypeScript
- Docker (for container management)
- Access to PostgreSQL and Redis

### Setup

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Create a `.env` file in the `mcp-server` directory:

```env
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
REDIS_URL=redis://:redis_pass@localhost:6379
PROJECT_ROOT=/Users/Arief/Desktop/378
```

## Usage

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

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

### With Cursor/Other MCP Clients

Configure your MCP client to use stdio transport and point to the compiled server.

## Available Tools

### Docker Management
- `docker_container_status` - List containers
- `docker_container_logs` - Get container logs
- `docker_container_start` - Start a container
- `docker_container_stop` - Stop a container
- `docker_container_restart` - Restart a container

### Backend Monitoring
- `backend_health_check` - Check backend health
- `backend_metrics` - Get Prometheus metrics

### Database Operations
- `database_query` - Execute read-only SQL queries

### Redis Operations
- `redis_get` - Get a cache value
- `redis_keys` - List cache keys
- `redis_delete` - Delete a cache key

### File Operations
- `read_file` - Read files from filesystem
- `list_directory` - List directory contents

### Diagnostics
- `run_diagnostic` - Run comprehensive diagnostics
- `frontend_build_status` - Check frontend build
- `backend_compile_check` - Check backend compilation

## Security Notes

- Database queries are read-only (SELECT only)
- File operations are scoped to PROJECT_ROOT
- Container operations require Docker access
- Redis operations require authentication

## Development

```bash
npm run dev  # Watch mode with tsx
npm run build  # Compile TypeScript
npm start  # Run compiled server
```

## Troubleshooting

1. **Connection errors**: Verify DATABASE_URL and REDIS_URL are correct
2. **Docker errors**: Ensure Docker daemon is running
3. **File access errors**: Check PROJECT_ROOT path and permissions

