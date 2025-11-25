# Agent Coordination Workflow Example

**Date**: November 2025  
**Status**: Active Reference

---

## Complete Workflow for Multiple Agents

This guide shows how to use the Agent Coordination MCP Server tools in your agent workflows.

---

## Step 1: Agent Registration

```typescript
// Agent 1 registers
await mcp.agent_register({
  agentId: "agent-1",
  capabilities: ["typescript", "refactoring"]
});

// Agent 2 registers
await mcp.agent_register({
  agentId: "agent-2",
  capabilities: ["typescript", "testing"]
});
```

---

## Step 2: Check Available Work

```typescript
// Agent 1 checks for available work
const suggestions = await mcp.agent_suggest_coordination({
  agentId: "agent-1",
  capabilities: ["typescript"],
  preferredFiles: ["frontend/src/services/*.ts"]
});

console.log("Recommended tasks:", suggestions.recommendedTasks);
console.log("Safe files:", suggestions.safeFiles);
console.log("Warnings:", suggestions.warnings);
```

---

## Step 3: Claim Task

```typescript
// Agent 1 claims a task
const claimResult = await mcp.agent_claim_task({
  taskId: "fix-services-typescript",
  agentId: "agent-1",
  files: [
    "frontend/src/services/monitoring.ts",
    "frontend/src/services/nluService.ts"
  ],
  description: "Fix TypeScript errors in services"
});

if (claimResult.conflicts.length > 0) {
  console.log("Conflicts detected:", claimResult.conflicts);
  // Handle conflicts or choose different files
} else {
  console.log("Task claimed successfully!");
}
```

---

## Step 4: Lock Files Before Editing

```typescript
// Lock files before editing
for (const file of claimResult.files) {
  try {
    await mcp.agent_lock_file({
      file: file,
      agentId: "agent-1",
      reason: "Fixing TypeScript errors"
    });
    console.log(`Locked: ${file}`);
  } catch (error) {
    console.error(`Failed to lock ${file}:`, error);
    // File might be locked by another agent
  }
}
```

---

## Step 5: Update Progress

```typescript
// Update progress as work progresses
await mcp.agent_update_task_progress({
  taskId: "fix-services-typescript",
  agentId: "agent-1",
  progress: 50,
  message: "Fixed monitoring.ts, working on nluService.ts"
});

// Later...
await mcp.agent_update_task_progress({
  taskId: "fix-services-typescript",
  agentId: "agent-1",
  progress: 100,
  message: "All files fixed"
});
```

---

## Step 6: Complete Task

```typescript
// Mark task as complete
await mcp.agent_complete_task({
  taskId: "fix-services-typescript",
  agentId: "agent-1"
});

// Release file locks
for (const file of claimResult.files) {
  try {
    await mcp.agent_unlock_file({
      file: file,
      agentId: "agent-1"
    });
  } catch (error) {
    console.error(`Failed to unlock ${file}:`, error);
  }
}

// Update agent status
await mcp.agent_update_status({
  agentId: "agent-1",
  status: "idle",
  currentTask: null
});
```

---

## Step 7: Check Workload Distribution

```typescript
// See what other agents are doing
const workload = await mcp.agent_get_workload_distribution();

console.log("Active agents:", workload.summary.activeAgents);
console.log("Total tasks:", workload.summary.totalTasks);
console.log("Available tasks:", workload.summary.availableTasks);
console.log("Claimed tasks:", workload.summary.claimedTasks);

// See individual agent workloads
workload.agents.forEach(agent => {
  console.log(`${agent.agentId}: ${agent.taskCount} tasks, ${agent.progress}% progress`);
});
```

---

## Conflict Prevention Example

### Before Editing - Always Check for Conflicts

```typescript
// Before editing, check for conflicts
const conflicts = await mcp.agent_detect_conflicts({
  agentId: "agent-2",
  files: ["frontend/src/services/monitoring.ts"]
});

if (conflicts.hasConflict) {
  console.log("Cannot edit - file is locked by:", conflicts.conflicts[0].conflictingAgent);
  
  // Get alternative suggestions
  const suggestions = await mcp.agent_suggest_coordination({
    agentId: "agent-2",
    capabilities: ["typescript"]
  });
  
  // Work on safe files instead
  console.log("Safe files to work on:", suggestions.safeFiles);
} else {
  // Safe to proceed
  await mcp.agent_lock_file({
    file: "frontend/src/services/monitoring.ts",
    agentId: "agent-2",
    reason: "Fixing TypeScript errors"
  });
  
  // Proceed with editing...
}
```

---

## Real-World Example: Fixing TypeScript Errors

```typescript
// Complete workflow for fixing TypeScript errors

// 1. Register
await mcp.agent_register({
  agentId: "ts-fix-agent",
  capabilities: ["typescript", "refactoring"]
});

// 2. Get suggestions
const suggestions = await mcp.agent_suggest_coordination({
  agentId: "ts-fix-agent",
  capabilities: ["typescript"],
  preferredFiles: ["frontend/src/services/*.ts"]
});

// 3. Claim task for first batch of files
const task = await mcp.agent_claim_task({
  taskId: "fix-ts-errors-batch-1",
  agentId: "ts-fix-agent",
  files: suggestions.safeFiles.slice(0, 10), // First 10 safe files
  description: "Fix TypeScript errors in services"
});

// 4. Lock all files
for (const file of task.files) {
  await mcp.agent_lock_file({
    file: file,
    agentId: "ts-fix-agent",
    reason: "Fixing TypeScript errors"
  });
}

// 5. Fix files one by one
let progress = 0;
for (const file of task.files) {
  // Fix TypeScript errors in file...
  // ... your fixing logic ...
  
  progress += Math.floor(100 / task.files.length);
  await mcp.agent_update_task_progress({
    taskId: task.taskId,
    agentId: "ts-fix-agent",
    progress: progress,
    message: `Fixed ${file}`
  });
}

// 6. Complete and unlock
await mcp.agent_complete_task({
  taskId: task.taskId,
  agentId: "ts-fix-agent"
});

for (const file of task.files) {
  await mcp.agent_unlock_file({
    file: file,
    agentId: "ts-fix-agent"
  });
}
```

---

## Best Practices

### ✅ DO

1. **Always register** before starting work
2. **Check conflicts** before claiming tasks
3. **Lock files** before editing
4. **Update progress** regularly (every 10-20% or after each file)
5. **Release locks** when done
6. **Complete tasks** when finished
7. **Update status** to "idle" when not working

### ❌ DON'T

1. **Don't edit files** without locking first
2. **Don't ignore conflicts** - handle them properly
3. **Don't forget to unlock** files when done
4. **Don't claim tasks** without checking availability
5. **Don't work on locked files** - find alternatives

---

## Error Handling

```typescript
try {
  await mcp.agent_claim_task({
    taskId: "my-task",
    agentId: "my-agent",
    files: ["file.ts"]
  });
} catch (error) {
  if (error.message.includes("already claimed")) {
    // Task is claimed by another agent
    console.log("Task unavailable, finding alternatives...");
    const suggestions = await mcp.agent_suggest_coordination({
      agentId: "my-agent",
      capabilities: ["typescript"]
    });
    // Use suggestions.recommendedTasks
  } else {
    throw error;
  }
}
```

---

## Monitoring Your Work

```typescript
// Check your agent status
const status = await mcp.agent_get_status({
  agentId: "my-agent"
});

console.log("Status:", status.status);
console.log("Current task:", status.currentTask);
console.log("Progress:", status.progress);

// List your tasks
const myTasks = await mcp.agent_list_tasks({
  agentId: "my-agent"
});

console.log("My tasks:", myTasks.tasks);

// List your locked files
const myLocks = await mcp.agent_list_locked_files({
  agentId: "my-agent"
});

console.log("My locked files:", myLocks.files);
```

---

## Related Documentation

- [Agent Coordination Implementation Complete](./AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md)
- [IDE Agent Coordination Guide](./IDE_AGENT_COORDINATION.md)
- [Server README](../../mcp-server/AGENT_COORDINATION_README.md)
- [Verification Guide](./MCP_COORDINATION_VERIFICATION.md)

---

**Ready to use!** Start with Step 1 and follow the workflow for safe, coordinated multi-agent work.

