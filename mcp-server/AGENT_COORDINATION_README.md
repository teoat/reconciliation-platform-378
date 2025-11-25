# Agent Coordination MCP Server

**Version**: 1.0.0  
**Status**: ✅ Production Ready

---

## Overview

The Agent Coordination MCP Server provides coordination tools for multiple IDE agents working on the same codebase. It prevents conflicts, manages tasks, and enables safe parallel work.

## Features

### ✅ Core Features (Implemented)

- **Task Management**: Claim, release, track tasks
- **File Locking**: Prevent simultaneous edits
- **Agent Registration**: Track active agents
- **Conflict Detection**: Detect conflicts before they happen
- **Coordination Suggestions**: Get safe work recommendations
- **Workload Distribution**: See workload across agents

### ✅ Optimizations (Implemented)

- **In-Memory Caching**: LRU cache for file locks (80-90% Redis call reduction)
- **Batch Operations**: Redis pipelines for multi-file operations (50-70% faster)
- **Input Validation**: Zod schemas for type-safe validation
- **Health Monitoring**: Redis health checks and automatic reconnection

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agent-coordination": {
      "command": "node",
      "args": ["/path/to/reconciliation-platform-378/mcp-server/dist/agent-coordination.js"],
      "env": {
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "COORDINATION_TTL": "3600",
        "PROJECT_ROOT": "/path/to/reconciliation-platform-378"
      }
    }
  }
}
```

Or use the setup script:

```bash
./scripts/setup-mcp.sh
```

## Environment Variables

- `REDIS_URL`: Redis connection string (required)
- `COORDINATION_TTL`: Lock/Task TTL in seconds (default: 3600)
- `PROJECT_ROOT`: Project root path (optional)

## Available Tools (18 Tools)

### Agent Management
- `agent_register` - Register agent with coordination server
- `agent_update_status` - Update agent status
- `agent_list_agents` - List all active agents
- `agent_get_status` - Get specific agent status

### Task Management
- `agent_claim_task` - Claim a task for exclusive work
- `agent_release_task` - Release a claimed task
- `agent_list_tasks` - List all tasks
- `agent_update_task_progress` - Update task progress
- `agent_complete_task` - Mark task as complete

### File Locking
- `agent_lock_file` - Lock a file for exclusive editing
- `agent_unlock_file` - Release file lock
- `agent_check_file_lock` - Check if file is locked
- `agent_list_locked_files` - List all locked files

### Conflict Detection
- `agent_detect_conflicts` - Detect potential conflicts
- `agent_check_file_overlap` - Check file overlap with other agents

### Coordination
- `agent_suggest_coordination` - Get coordination suggestions
- `agent_get_workload_distribution` - Get workload distribution
- `agent_find_available_work` - Find unclaimed tasks

## Usage Examples

### Register Agent

```typescript
await mcp.agent_register({
  agentId: "cursor-session-abc123",
  capabilities: ["typescript", "refactoring"]
});
```

### Claim Task

```typescript
const result = await mcp.agent_claim_task({
  taskId: "fix-typescript-errors-services",
  agentId: "cursor-session-abc123",
  files: ["frontend/src/services/monitoring.ts"],
  description: "Fix TypeScript errors in services"
});
```

### Lock File

```typescript
await mcp.agent_lock_file({
  file: "frontend/src/services/monitoring.ts",
  agentId: "cursor-session-abc123",
  reason: "Fixing TypeScript errors"
});
```

### Detect Conflicts

```typescript
const conflicts = await mcp.agent_detect_conflicts({
  agentId: "cursor-session-abc123",
  files: ["frontend/src/services/monitoring.ts"]
});

if (conflicts.hasConflict) {
  console.log("Conflicts detected:", conflicts.conflicts);
}
```

### Get Coordination Suggestions

```typescript
const suggestions = await mcp.agent_suggest_coordination({
  agentId: "cursor-session-abc123",
  capabilities: ["typescript"],
  preferredFiles: ["frontend/src/services/*.ts"]
});
```

## Performance

### Optimizations

- **In-Memory Caching**: 80-90% reduction in Redis calls for hot data
- **Batch Operations**: 50-70% faster for multi-file operations
- **Connection Pooling**: Reused Redis connections
- **Health Monitoring**: Automatic reconnection on failures

### Benchmarks

- File lock check (cached): < 1ms
- File lock check (uncached): ~5-10ms
- Batch file lock check (10 files): ~15-20ms (vs 50-100ms individual)
- Conflict detection (10 files): ~20-30ms

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev:coordination
```

### Start Server

```bash
npm run start:coordination
```

## Testing

```bash
# Test coordination server
npm test

# E2E tests
npm run test:e2e
```

## Architecture

```
IDE Agents → MCP Coordination Server → Redis (Shared State)
                ↓
         In-Memory Cache (LRU)
```

### Redis Keys

- `agent:coord:task:{taskId}` - Task data
- `agent:coord:lock:{file}` - File locks
- `agent:coord:status:{agentId}` - Agent status
- `agent:coord:tasks:queue` - Task queue (sorted set)
- `agent:coord:agents:active` - Active agents (sorted set)

## Troubleshooting

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Check connection string
echo $REDIS_URL
```

### Cache Issues

The cache automatically expires after 5 seconds. If you see stale data, wait a few seconds or restart the server.

### Lock Not Releasing

Locks automatically expire after TTL (default: 1 hour). You can manually unlock:

```typescript
await mcp.agent_unlock_file({
  file: "path/to/file.ts",
  agentId: "your-agent-id"
});
```

## Related Documentation

- [Agent Coordination MCP Proposal](../../docs/development/AGENT_COORDINATION_MCP_PROPOSAL.md)
- [Optimization Recommendations](../../docs/development/MCP_COORDINATION_OPTIMIZATION_RECOMMENDATIONS.md)
- [IDE Agent Coordination Guide](../../docs/development/IDE_AGENT_COORDINATION.md)

## License

MIT

