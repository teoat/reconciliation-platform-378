# Reconciliation Platform MCP Server

Model Context Protocol (MCP) server for enhanced AI agent controls over the Reconciliation Platform.

## Overview

This MCP server provides AI agents with powerful tools to:

- Coordinate agent tasks and file locks
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
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@localhost:5432/reconciliation_app
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379
PROJECT_ROOT=/Users/Arief/Documents/GitHub/reconciliation-platform-378
COORDINATION_TTL=3600
```

## Usage

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "agent-coordination-mcp": {
      "command": "node",
      "args": ["/Users/Arief/Documents/GitHub/reconciliation-platform-378/mcp-server/dist/agent-coordination.js"],
      "env": {
        "REDIS_URL": "redis://:${REDIS_PASSWORD}@localhost:6379",
        "COORDINATION_TTL": "3600",
        "PROJECT_ROOT": "/Users/Arief/Documents/GitHub/reconciliation-platform-378"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/Arief/Documents/GitHub/reconciliation-platform-378"
      ],
      "env": {}
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:${DB_PASSWORD}@localhost:5432/reconciliation_app"
      ],
      "env": {}
    },
    "redis": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-redis",
        "redis://:${REDIS_PASSWORD}@localhost:6379"
      ],
      "env": {}
    },
    "prometheus": {
      "command": "npx",
      "args": [
        "-y",
        "prometheus-mcp"
      ],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090",
        "PROMETHEUS_TIMEOUT": "10000",
        "PROMETHEUS_RETRIES": "3"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ],
      "env": {}
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ],
      "env": {}
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {}
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ],
      "env": {}
    }
  }
}
```

### With Cursor/Other MCP Clients

Configure your MCP client to use stdio transport and point to the compiled server.

## Available Tools (Simplified Set)

This MCP server primarily facilitates agent coordination. Other functionalities like file operations, database queries, and browser interactions are handled by dedicated standard MCPs.

### Agent Coordination (Provided by `agent-coordination-mcp`)

-   `agent_register` - Register an agent with the coordination server.
-   `agent_update_status` - Update an agent's status.
-   `agent_list_tasks` - List active tasks.
-   `agent_claim_task` - Claim a task.
-   `agent_release_task` - Release a task.
-   `agent_update_task_progress` - Update task progress.
-   `agent_check_file_lock` - Check if a file is locked.
-   `agent_lock_file` - Lock a file.
-   `agent_unlock_file` - Unlock a file.
-   `agent_detect_conflicts` - Detect conflicts between agent operations.
-   `agent_check_file_overlap` - Check for file overlap.
-   `agent_suggest_coordination` - Get coordination suggestions.
-   `agent_list_agents` - List active agents.
-   `agent_get_workload_distribution` - Get workload distribution.
-   `agent_find_available_work` - Find available work.

## Security Notes

- Database queries are read-only (SELECT only) for agent coordination.
- File operations are scoped to PROJECT_ROOT (via filesystem MCP).
- Redis cache inspection tools are handled by the standard Redis MCP.

## Development

```bash
npm run dev  # Watch mode with tsx
npm run build  # Compile TypeScript
npm start  # Run compiled server
```

## Troubleshooting

1.  **Connection errors**: Verify DATABASE_URL and REDIS_URL are correct.
2.  **File access errors**: Check PROJECT_ROOT path and permissions.
3.  **Coordination issues**: Ensure Redis server is running and accessible.
