# MCP Three-Agent Coordination Setup Guide

**Generated**: November 26, 2025  
**Purpose**: Detailed implementation guide for three-agent coordination using MCP

---

## 🚀 Quick Start

### Prerequisites

1. **Redis Server Running**
   ```bash
   # Check Redis is running
   redis-cli ping
   # Should return: PONG
   ```

2. **MCP Server Configured**
   - Agent-coordination MCP server configured in `.cursor/mcp.json`
   - Redis URL configured in environment

3. **Three Agent Instances**
   - Agent-1: Backend Specialist
   - Agent-2: Security Specialist  
   - Agent-3: Frontend Specialist

---

## 📋 Step-by-Step Setup

### Step 1: Register All Agents

**Agent-1 Registration** (Backend Specialist):
```typescript
// Agent-1: Backend Specialist
await mcp_agent_coordination_agent_register({
  agentId: "backend-specialist-001",
  capabilities: ["rust", "actix-web", "database", "performance", "architecture"],
  currentTask: null
});
```

**Agent-2 Registration** (Security Specialist):
```typescript
// Agent-2: Security Specialist
await mcp_agent_coordination_agent_register({
  agentId: "security-specialist-001",
  capabilities: ["security", "authentication", "encryption", "threat-detection", "zero-trust"],
  currentTask: null
});
```

**Agent-3 Registration** (Frontend Specialist):
```typescript
// Agent-3: Frontend Specialist
await mcp_agent_coordination_agent_register({
  agentId: "frontend-specialist-001",
  capabilities: ["react", "typescript", "frontend-optimization", "linting", "bundle-optimization"],
  currentTask: null
});
```

### Step 2: Create Initial Tasks (Week 1-2)

**Task 1: ARCH-002** (Agent-1):
```typescript
await mcp_agent_coordination_agent_claim_task({
  taskId: "ARCH-002-reduce-service-interdependencies",
  agentId: "backend-specialist-001",
  description: "Reduce service interdependencies by 40% - Map dependencies, extract interfaces, implement DI",
  files: [
    "backend/src/services/mod.rs",
    "backend/src/services/project.rs",
    "backend/src/services/reconciliation.rs",
    "backend/src/services/user/"
  ]
});
```

**Task 2: SEC-001** (Agent-2):
```typescript
await mcp_agent_coordination_agent_claim_task({
  taskId: "SEC-001-advanced-security-monitoring",
  agentId: "security-specialist-001",
  description: "Implement advanced security monitoring with anomaly detection and threat intelligence",
  files: [
    "backend/src/services/security_monitor.rs",
    "backend/src/services/security.rs",
    "backend/src/services/security/threat_detection.rs" // new
  ]
});
```

**Task 3: QUAL-001** (Agent-3):
```typescript
await mcp_agent_coordination_agent_claim_task({
  taskId: "QUAL-001-fix-frontend-linting",
  agentId: "frontend-specialist-001",
  description: "Fix all frontend linting warnings - Remove unused imports, fix unused variables",
  files: [
    "frontend/src/components/",
    "frontend/src/__tests__/",
    "frontend/src/hooks/",
    "frontend/eslint.config.js"
  ]
});
```

### Step 3: Lock Files Before Work

**Agent-1 Example**:
```typescript
// Check for locks
const lockCheck = await mcp_agent_coordination_agent_check_file_lock({
  file: "backend/src/services/mod.rs"
});

if (lockCheck.locked && lockCheck.agentId !== "backend-specialist-001") {
  console.warn("File locked by another agent, waiting...");
  // Wait or choose different approach
}

// Lock files
await mcp_agent_coordination_agent_lock_file({
  file: "backend/src/services/mod.rs",
  agentId: "backend-specialist-001",
  reason: "Refactoring service dependencies for ARCH-002",
  ttl: 3600
});
```

### Step 4: Update Status During Work

```typescript
// Start work
await mcp_agent_coordination_agent_update_status({
  agentId: "backend-specialist-001",
  status: "working",
  currentTask: "ARCH-002-reduce-service-interdependencies",
  progress: 0
});

// Progress update (25%)
await mcp_agent_coordination_agent_update_task_progress({
  taskId: "ARCH-002-reduce-service-interdependencies",
  agentId: "backend-specialist-001",
  progress: 25,
  message: "Completed dependency mapping, identified 12 circular dependencies"
});

// Progress update (50%)
await mcp_agent_coordination_agent_update_task_progress({
  taskId: "ARCH-002-reduce-service-interdependencies",
  agentId: "backend-specialist-001",
  progress: 50,
  message: "Extracted shared interfaces, starting dependency injection implementation"
});
```

### Step 5: Coordinate When Conflicts Detected

**Example: Agent-2 needs to work on auth middleware while Agent-1 is working on it**

```typescript
// Agent-2 checks for conflicts
const conflicts = await mcp_agent_coordination_agent_detect_conflicts({
  agentId: "security-specialist-001",
  files: ["backend/src/middleware/auth.rs"]
});

if (conflicts.hasConflicts) {
  // Get coordination suggestions
  const suggestions = await mcp_agent_coordination_agent_suggest_coordination({
    agentId: "security-specialist-001",
    capabilities: ["security", "authentication"],
    preferredFiles: ["backend/src/middleware/auth.rs"]
  });
  
  // Option 1: Wait for Agent-1 to finish
  await mcp_agent_coordination_agent_update_status({
    agentId: "security-specialist-001",
    status: "blocked",
    currentTask: "SEC-002-zero-trust",
    progress: 0
  });
  
  // Option 2: Work on different files first
  // Agent-2 can work on other security files while waiting
}
```

### Step 6: Complete Task and Release

```typescript
// Mark task as complete
await mcp_agent_coordination_agent_complete_task({
  taskId: "ARCH-002-reduce-service-interdependencies",
  agentId: "backend-specialist-001"
});

// Unlock all files
const files = [
  "backend/src/services/mod.rs",
  "backend/src/services/project.rs",
  "backend/src/services/reconciliation.rs"
];

for (const file of files) {
  await mcp_agent_coordination_agent_unlock_file({
    file: file,
    agentId: "backend-specialist-001"
  });
}

// Release task
await mcp_agent_coordination_agent_release_task({
  taskId: "ARCH-002-reduce-service-interdependencies",
  agentId: "backend-specialist-001"
});

// Update status
await mcp_agent_coordination_agent_update_status({
  agentId: "backend-specialist-001",
  status: "idle",
  currentTask: null,
  progress: 0
});
```

---

## 🔄 Coordination Patterns

### Pattern 1: Parallel Independent Work

**Week 1-2 Tasks** (No conflicts):
- Agent-1: `backend/src/services/` (ARCH-002)
- Agent-2: `backend/src/services/security/` (SEC-001)
- Agent-3: `frontend/src/` (QUAL-001)

**Coordination**: Minimal - all agents work independently

### Pattern 2: Sequential Coordination

**Week 3-4 Tasks** (Need coordination):
- Agent-1: Database optimization (PERF-002)
- Agent-2: Zero-trust (SEC-002) - needs auth middleware

**Coordination Flow**:
1. Agent-1 claims `backend/src/services/query_optimizer.rs`
2. Agent-2 checks conflicts for `backend/src/middleware/auth.rs`
3. Agent-2 waits or works on other files
4. Agent-1 completes and releases
5. Agent-2 can now proceed

### Pattern 3: Shared File Coordination

**Week 5-6 Tasks** (Shared files):
- Agent-1: CQRS implementation (ARCH-001)
- Agent-2: Input validation (SEC-004) - both touch handlers

**Coordination Flow**:
1. Both agents check for conflicts
2. Agent-1 works on query handlers first
3. Agent-2 works on validation middleware
4. Both coordinate on handler integration
5. Integration testing together

---

## 📊 Monitoring and Dashboard

### Check Agent Status

```typescript
// List all agents
const agents = await mcp_agent_coordination_agent_list_agents({
  includeInactive: false
});

// Get specific agent status
const agent1Status = await mcp_agent_coordination_agent_get_status({
  agentId: "backend-specialist-001"
});
```

### Check Workload Distribution

```typescript
const workload = await mcp_agent_coordination_agent_get_workload_distribution();

// Returns:
// {
//   "backend-specialist-001": { tasks: 3, progress: 45 },
//   "security-specialist-001": { tasks: 2, progress: 30 },
//   "frontend-specialist-001": { tasks: 2, progress: 70 }
// }
```

### List All Tasks

```typescript
// List all tasks
const allTasks = await mcp_agent_coordination_agent_list_tasks({
  status: "all"
});

// List available tasks
const availableTasks = await mcp_agent_coordination_agent_list_tasks({
  status: "available"
});

// List tasks for specific agent
const agent1Tasks = await mcp_agent_coordination_agent_list_tasks({
  status: "claimed",
  agentId: "backend-specialist-001"
});
```

### Check File Locks

```typescript
// Check if file is locked
const lockStatus = await mcp_agent_coordination_agent_check_file_lock({
  file: "backend/src/services/mod.rs"
});

// List all locked files
const lockedFiles = await mcp_agent_coordination_agent_list_locked_files({
  agentId: "backend-specialist-001"
});
```

---

## 🎯 Task Execution Template

### For Each Agent

```typescript
// 1. Register
await mcp_agent_coordination_agent_register({
  agentId: "agent-id",
  capabilities: ["capability1", "capability2"],
  currentTask: null
});

// 2. Find available work
const availableWork = await mcp_agent_coordination_agent_find_available_work({
  agentId: "agent-id",
  capabilities: ["capability1", "capability2"]
});

// 3. Check for conflicts
const conflicts = await mcp_agent_coordination_agent_detect_conflicts({
  agentId: "agent-id",
  files: ["file1.rs", "file2.rs"]
});

// 4. Claim task
await mcp_agent_coordination_agent_claim_task({
  taskId: "task-id",
  agentId: "agent-id",
  description: "Task description",
  files: ["file1.rs", "file2.rs"]
});

// 5. Lock files
for (const file of files) {
  await mcp_agent_coordination_agent_lock_file({
    file: file,
    agentId: "agent-id",
    reason: "Working on task-id",
    ttl: 3600
  });
}

// 6. Update status
await mcp_agent_coordination_agent_update_status({
  agentId: "agent-id",
  status: "working",
  currentTask: "task-id",
  progress: 0
});

// 7. Do work (make code changes)
// ... actual code changes ...

// 8. Update progress
await mcp_agent_coordination_agent_update_task_progress({
  taskId: "task-id",
  agentId: "agent-id",
  progress: 50,
  message: "Halfway done"
});

// 9. Complete task
await mcp_agent_coordination_agent_complete_task({
  taskId: "task-id",
  agentId: "agent-id"
});

// 10. Unlock files
for (const file of files) {
  await mcp_agent_coordination_agent_unlock_file({
    file: file,
    agentId: "agent-id"
  });
}

// 11. Release task
await mcp_agent_coordination_agent_release_task({
  taskId: "task-id",
  agentId: "agent-id"
});

// 12. Update status
await mcp_agent_coordination_agent_update_status({
  agentId: "agent-id",
  status: "idle",
  currentTask: null,
  progress: 0
});
```

---

## 🚨 Error Handling

### Handle Coordination Errors

```typescript
try {
  await mcp_agent_coordination_agent_lock_file({
    file: "backend/src/services/mod.rs",
    agentId: "backend-specialist-001",
    reason: "Working on task",
    ttl: 3600
  });
} catch (error) {
  if (error.code === 'COORDINATION_UNAVAILABLE') {
    console.warn('Coordination server unavailable, proceeding with caution');
    // Check git status manually, proceed carefully
  } else if (error.message.includes('locked')) {
    console.warn('File is locked by another agent');
    // Wait or choose different file
  } else {
    throw error;
  }
}
```

---

## 📈 Success Metrics

### Coordination Metrics

- **Zero Conflicts**: No file conflicts during parallel work
- **Task Completion**: All tasks completed within estimated time
- **Progress Updates**: Regular progress updates (every 25% or daily)
- **Status Accuracy**: Agent status always reflects current work

### Quality Metrics

- **Code Quality**: All changes reviewed and tested
- **No Regressions**: All existing tests passing
- **Documentation**: All changes documented
- **Performance**: Performance improvements verified

---

## 🔧 Troubleshooting

### Issue: Redis Connection Failed

**Solution**:
```bash
# Check Redis is running
redis-cli ping

# Check Redis URL in environment
echo $REDIS_URL

# Restart Redis if needed
redis-server --daemonize yes
```

### Issue: File Locked by Another Agent

**Solution**:
1. Check who has the lock: `agent_check_file_lock`
2. Check agent status: `agent_get_status`
3. Wait for agent to release or negotiate
4. Use `agent_suggest_coordination` for alternatives

### Issue: Task Already Claimed

**Solution**:
1. Check task status: `agent_list_tasks`
2. If task is claimed, wait or find alternative work
3. Use `agent_find_available_work` to find unclaimed tasks

---

**Setup Status**: Ready  
**Coordination Method**: MCP Agent Coordination Server  
**Expected Timeline**: 6-8 weeks  
**Success Probability**: High with proper coordination

