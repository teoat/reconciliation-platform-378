# Agent Coordination MCP Server Proposal

**Date**: November 2025  
**Status**: Proposal  
**Priority**: HIGH

---

## Executive Summary

Create a dedicated MCP server for coordinating multiple IDE agents working on the same codebase. This server will provide shared state, task management, conflict detection, and coordination tools that IDE agents don't have natively.

---

## Problem Statement

### Current Limitations

1. **No Shared State**: Each IDE agent session is independent
2. **No Task Visibility**: Agents can't see what others are working on
3. **No Conflict Detection**: Agents don't detect overlapping changes
4. **No Coordination Protocol**: No built-in communication between agents

### Impact

- **File Conflicts**: Multiple agents editing same files
- **Duplicate Fixes**: Same issue fixed multiple times
- **Dependency Conflicts**: Conflicting package changes
- **Wasted Effort**: Overlapping work

---

## Solution: Agent Coordination MCP Server

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              IDE Agents (Multiple Instances)              │
│  Agent 1    Agent 2    Agent 3    Agent 4    Agent 5    │
└──────────────┬────────────────────────────────────────────┘
               │
               │ MCP Protocol
               │
┌──────────────▼────────────────────────────────────────────┐
│      Agent Coordination MCP Server                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Task Management      │  Conflict Detection        │  │
│  │  File Locking         │  Agent Status Tracking      │  │
│  │  Progress Reporting   │  Coordination Tools         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────┬────────────────────────────────────────────┘
               │
               │ Redis (Shared State)
               │
┌──────────────▼────────────────────────────────────────────┐
│              Redis Cache (Persistent State)                │
│  - Task Queue                                             │
│  - File Locks                                            │
│  - Agent Status                                           │
│  - Conflict Log                                           │
└───────────────────────────────────────────────────────────┘
```

---

## MCP Server Features

### 1. Task Management

**Tools:**
- `agent_claim_task` - Claim a task for exclusive work
- `agent_release_task` - Release a claimed task
- `agent_list_tasks` - List all available/claimed tasks
- `agent_update_task_progress` - Update task progress
- `agent_complete_task` - Mark task as complete

**Use Case:**
```typescript
// Agent 1 claims task
await mcp.agent_claim_task({
  taskId: "fix-typescript-errors-services",
  agentId: "agent-1",
  files: ["frontend/src/services/monitoring.ts", "frontend/src/services/nluService.ts"]
});

// Agent 2 checks before working
const tasks = await mcp.agent_list_tasks();
// Sees task is claimed, works on different files
```

### 2. File Locking

**Tools:**
- `agent_lock_file` - Lock a file for exclusive editing
- `agent_unlock_file` - Release file lock
- `agent_check_file_lock` - Check if file is locked
- `agent_list_locked_files` - List all locked files

**Use Case:**
```typescript
// Agent 1 locks file
await mcp.agent_lock_file({
  file: "frontend/src/services/monitoring.ts",
  agentId: "agent-1",
  reason: "Fixing TypeScript errors"
});

// Agent 2 checks before editing
const lock = await mcp.agent_check_file_lock({
  file: "frontend/src/services/monitoring.ts"
});
// Returns: { locked: true, agentId: "agent-1", reason: "..." }
// Agent 2 skips this file
```

### 3. Conflict Detection

**Tools:**
- `agent_detect_conflicts` - Detect potential conflicts
- `agent_check_file_overlap` - Check if files overlap with other agents
- `agent_get_conflict_history` - Get conflict history

**Use Case:**
```typescript
// Agent checks for conflicts before starting
const conflicts = await mcp.agent_detect_conflicts({
  agentId: "agent-2",
  files: ["frontend/src/services/monitoring.ts"]
});
// Returns: { hasConflict: true, conflictingAgent: "agent-1", ... }
```

### 4. Agent Status Tracking

**Tools:**
- `agent_register` - Register agent with coordination server
- `agent_update_status` - Update agent status (idle, working, blocked)
- `agent_list_agents` - List all active agents
- `agent_get_status` - Get specific agent status

**Use Case:**
```typescript
// Agent registers on startup
await mcp.agent_register({
  agentId: "agent-1",
  capabilities: ["typescript", "refactoring"],
  currentTask: null
});

// Update status while working
await mcp.agent_update_status({
  agentId: "agent-1",
  status: "working",
  currentTask: "fix-typescript-errors",
  progress: 45
});
```

### 5. Coordination Tools

**Tools:**
- `agent_suggest_coordination` - Get coordination suggestions
- `agent_get_workload_distribution` - See workload across agents
- `agent_find_available_work` - Find unclaimed tasks
- `agent_coordinate_parallel_work` - Get safe parallel work suggestions

**Use Case:**
```typescript
// Agent asks for coordination suggestions
const suggestions = await mcp.agent_suggest_coordination({
  agentId: "agent-2",
  capabilities: ["typescript", "testing"]
});
// Returns: { 
//   recommendedTasks: [...],
//   safeFiles: [...],
//   warnings: [...]
// }
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

1. **Create MCP Server**
   - Location: `mcp-server/src/agent-coordination.ts`
   - Redis connection for shared state
   - Basic task management

2. **Redis Schema**
   ```typescript
   // Task Queue
   agent:task:{taskId} = { taskId, agentId, status, files, createdAt, updatedAt }
   agent:tasks:queue = [taskId1, taskId2, ...] // Sorted set
   
   // File Locks
   agent:lock:{file} = { agentId, reason, lockedAt, expiresAt }
   agent:locks:all = { file1: agentId1, file2: agentId2, ... }
   
   // Agent Status
   agent:status:{agentId} = { agentId, status, currentTask, progress, lastSeen }
   agent:agents:active = [agentId1, agentId2, ...] // Sorted set
   
   // Conflict Log
   agent:conflicts:{agentId} = [{ conflictId, type, files, resolved, timestamp }]
   ```

3. **Basic Tools**
   - Task claiming/releasing
   - File locking/unlocking
   - Agent registration

### Phase 2: Conflict Detection (Week 1-2)

1. **Conflict Detection Logic**
   - File overlap detection
   - Dependency conflict detection
   - Git conflict prediction

2. **Tools**
   - `agent_detect_conflicts`
   - `agent_check_file_overlap`
   - `agent_get_conflict_history`

### Phase 3: Coordination Intelligence (Week 2)

1. **Coordination Algorithms**
   - Workload balancing
   - Task prioritization
   - Safe parallel work detection

2. **Tools**
   - `agent_suggest_coordination`
   - `agent_get_workload_distribution`
   - `agent_find_available_work`

### Phase 4: Integration & Testing (Week 2-3)

1. **Integration**
   - Add to `.cursor/mcp.json`
   - Update coordination guide
   - Create usage examples

2. **Testing**
   - Unit tests for coordination logic
   - Integration tests with multiple agents
   - Conflict scenario testing

---

## MCP Server Configuration

### Add to `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "agent-coordination": {
      "command": "node",
      "args": ["/path/to/reconciliation-platform-378/mcp-server/dist/agent-coordination.js"],
      "env": {
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "/Users/Arief/Documents/GitHub/reconciliation-platform-378",
        "COORDINATION_TTL": "3600"
      }
    }
  }
}
```

---

## Tool Specifications

### `agent_claim_task`

**Description**: Claim a task for exclusive work by an agent

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "taskId": {
      "type": "string",
      "description": "Unique task identifier"
    },
    "agentId": {
      "type": "string",
      "description": "Agent identifier (e.g., 'agent-1', 'cursor-session-123')"
    },
    "files": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Files that will be modified"
    },
    "description": {
      "type": "string",
      "description": "Task description"
    }
  },
  "required": ["taskId", "agentId"]
}
```

**Output**:
```json
{
  "success": true,
  "taskId": "fix-typescript-errors-services",
  "agentId": "agent-1",
  "claimedAt": "2025-11-25T10:00:00Z",
  "conflicts": []
}
```

### `agent_lock_file`

**Description**: Lock a file for exclusive editing

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "file": {
      "type": "string",
      "description": "File path (relative to project root)"
    },
    "agentId": {
      "type": "string",
      "description": "Agent identifier"
    },
    "reason": {
      "type": "string",
      "description": "Reason for locking"
    },
    "ttl": {
      "type": "number",
      "description": "Lock TTL in seconds (default: 3600)"
    }
  },
  "required": ["file", "agentId"]
}
```

**Output**:
```json
{
  "success": true,
  "file": "frontend/src/services/monitoring.ts",
  "agentId": "agent-1",
  "lockedAt": "2025-11-25T10:00:00Z",
  "expiresAt": "2025-11-25T11:00:00Z"
}
```

### `agent_detect_conflicts`

**Description**: Detect potential conflicts with other agents

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Agent identifier"
    },
    "files": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Files to check for conflicts"
    }
  },
  "required": ["agentId", "files"]
}
```

**Output**:
```json
{
  "hasConflict": true,
  "conflicts": [
    {
      "file": "frontend/src/services/monitoring.ts",
      "conflictingAgent": "agent-2",
      "reason": "File is locked",
      "severity": "high"
    }
  ],
  "warnings": [
    {
      "file": "frontend/src/services/nluService.ts",
      "warning": "File was recently modified by agent-3",
      "severity": "medium"
    }
  ]
}
```

### `agent_suggest_coordination`

**Description**: Get coordination suggestions for safe parallel work

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Agent identifier"
    },
    "capabilities": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Agent capabilities (e.g., ['typescript', 'refactoring'])"
    },
    "preferredFiles": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Preferred files to work on"
    }
  },
  "required": ["agentId"]
}
```

**Output**:
```json
{
  "recommendedTasks": [
    {
      "taskId": "fix-typescript-errors-utils",
      "files": ["frontend/src/utils/typeHelpers.ts"],
      "priority": "high",
      "estimatedTime": "30min"
    }
  ],
  "safeFiles": [
    "frontend/src/utils/performanceConfig.tsx",
    "frontend/src/utils/routeSplitting.tsx"
  ],
  "warnings": [
    "Avoid frontend/src/services/monitoring.ts (locked by agent-1)"
  ],
  "workload": {
    "totalAgents": 3,
    "activeAgents": 2,
    "totalTasks": 10,
    "claimedTasks": 5
  }
}
```

---

## Usage Examples

### Example 1: Agent Starting Work

```typescript
// 1. Register agent
await mcp.agent_register({
  agentId: "cursor-session-abc123",
  capabilities: ["typescript", "refactoring"]
});

// 2. Check for available work
const suggestions = await mcp.agent_suggest_coordination({
  agentId: "cursor-session-abc123",
  capabilities: ["typescript"]
});

// 3. Claim task
await mcp.agent_claim_task({
  taskId: "fix-typescript-errors-services",
  agentId: "cursor-session-abc123",
  files: suggestions.recommendedTasks[0].files
});

// 4. Lock files
for (const file of files) {
  await mcp.agent_lock_file({
    file,
    agentId: "cursor-session-abc123",
    reason: "Fixing TypeScript errors"
  });
}

// 5. Work on files...
// 6. Release locks and complete task
```

### Example 2: Conflict Prevention

```typescript
// Before editing a file, check for conflicts
const conflicts = await mcp.agent_detect_conflicts({
  agentId: "cursor-session-xyz789",
  files: ["frontend/src/services/monitoring.ts"]
});

if (conflicts.hasConflict) {
  console.log("Conflict detected:", conflicts.conflicts);
  // Skip this file or wait
  return;
}

// Safe to proceed
await mcp.agent_lock_file({
  file: "frontend/src/services/monitoring.ts",
  agentId: "cursor-session-xyz789"
});
```

### Example 3: Multi-Agent Coordination

```typescript
// Agent 1: Working on services
await mcp.agent_claim_task({
  taskId: "fix-services",
  agentId: "agent-1",
  files: ["frontend/src/services/*.ts"]
});

// Agent 2: Checks coordination
const workload = await mcp.agent_get_workload_distribution();
// Sees agent-1 is working on services

// Agent 2: Works on different area
await mcp.agent_claim_task({
  taskId: "fix-utils",
  agentId: "agent-2",
  files: ["frontend/src/utils/*.ts"]
});

// No conflicts!
```

---

## Benefits

### 1. **Eliminates Conflicts**
- File-level locking prevents simultaneous edits
- Conflict detection before work starts
- Automatic conflict resolution suggestions

### 2. **Improves Efficiency**
- No duplicate fixes
- Better workload distribution
- Clear task ownership

### 3. **Enables Parallel Work**
- Safe parallel work detection
- Coordination suggestions
- Workload balancing

### 4. **Provides Visibility**
- See what other agents are working on
- Track progress across agents
- Monitor conflicts and resolutions

---

## Technical Considerations

### Redis Storage

- **TTL**: All locks and tasks have TTL (default: 1 hour)
- **Cleanup**: Automatic cleanup of expired locks
- **Persistence**: Optional persistence for task history

### Agent Identification

- **Session-based**: Use Cursor session ID
- **User-based**: Use user identifier
- **Custom**: Allow custom agent IDs

### Conflict Resolution

- **Automatic**: Suggest alternative files
- **Manual**: Report conflicts for human review
- **Priority**: Higher priority agents can preempt

### Performance

- **Caching**: Cache agent status and locks
- **Batching**: Batch operations when possible
- **Async**: All operations are async

---

## Migration Path

### Step 1: Install MCP Server
```bash
cd mcp-server
npm install
npm run build
```

### Step 2: Configure
Add to `.cursor/mcp.json` (see configuration above)

### Step 3: Update Agent Workflows
Update agents to use coordination tools:
- Check conflicts before editing
- Claim tasks before starting
- Lock files before modifying

### Step 4: Monitor
- Track conflict rate
- Monitor task completion
- Measure coordination effectiveness

---

## Success Metrics

1. **Conflict Rate**: < 5 conflicts/week (down from ~20)
2. **Duplicate Fixes**: 0 duplicates (down from ~10/week)
3. **File Overlap**: < 10% overlap (down from ~30%)
4. **Task Completion Time**: 20% faster with coordination

---

## Related Documentation

- [IDE Agent Coordination Guide](./IDE_AGENT_COORDINATION.md) - Manual coordination
- [MCP Setup Guide](./MCP_SETUP_GUIDE.md) - MCP server setup
- [Agent Coordination MCP Server](../mcp-server/README.md) - Implementation details

---

**Next Steps**: 
1. Review and approve proposal
2. Implement Phase 1 (Core Infrastructure)
3. Test with 2-3 agents
4. Iterate based on feedback

