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
PROJECT_ROOT=/Users/Arief/Documents/GitHub/reconciliation-platform-378
```

## Usage

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "command": "node",
      "args": ["/Users/Arief/Documents/GitHub/reconciliation-platform-378/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "/Users/Arief/Documents/GitHub/reconciliation-platform-378"
      }
    }
  }
}
```

### With Cursor/Other MCP Clients

Configure your MCP client to use stdio transport and point to the compiled server.

## Available Tools (26 Essential Tools)

### Docker Management (3 tools)
- `docker_container_status` - List containers (running, stopped, all)
- `docker_container_logs` - Get container logs with tail support
- `docker_container_restart` - Restart a container

### Backend Monitoring (1 tool)
- `backend_health_check` - Check backend health with 5s caching

### Build & Compilation (2 tools)
- `backend_compile_check` - Check if backend compiles using cargo check
- `frontend_build_status` - Check frontend build status and analyze bundle

### Diagnostics (1 tool)
- `run_diagnostic` - Run comprehensive application diagnostic script

### Git Operations (5 tools) ⭐ NEW
- `git_status` - Get git status (staged, unstaged, untracked files)
- `git_branch_list` - List all branches (local and remote)
- `git_branch_create` - Create a new branch
- `git_commit` - Create a commit with message
- `git_log` - Show commit history

### Test Execution (3 tools) ⭐ NEW
- `run_backend_tests` - Run Rust backend tests with optional filter
- `run_frontend_tests` - Run TypeScript/React frontend tests
- `run_e2e_tests` - Run Playwright E2E tests

### Code Quality (3 tools) ⭐ NEW
- `run_linter` - Run ESLint on frontend code
- `run_clippy` - Run clippy on Rust backend code
- `check_types` - Run TypeScript type checking

### Migration Management (2 tools) ⭐ NEW
- `list_migrations` - List all migrations and their status
- `run_migration` - Run database migrations

### Tool Usage Monitoring (1 tool) ⭐ NEW
- `get_tool_usage_stats` - Get usage statistics for all tools (monitoring)

### Security Scanning (1 tool) ⭐ NEW
- `run_security_audit` - Run security audit (npm audit, cargo audit)

### Performance Monitoring (2 tools) ⭐ NEW
- `get_system_metrics` - Get system performance metrics (CPU, memory, disk)
- `get_performance_summary` - Get comprehensive performance summary with recommendations

**Total: 26 essential tools** (32% of 80 limit)

## Security Notes

- Database queries are read-only (SELECT only)
- File operations are scoped to PROJECT_ROOT
- Container operations require Docker access
- Redis cache inspection tools were removed from this MCP to avoid conflicts with developer-run Redis instances. Use backend diagnostics or Docker CLI if Redis access is required.

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

