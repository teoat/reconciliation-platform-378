# Agent Coordination - Quick Start Guide

**Date**: November 2025  
**Status**: Active

---

## 🚀 Quick Start (5 Minutes)

### 1. Verify Setup

```bash
./scripts/verify-mcp-coordination.sh
```

Should show: ✅ All checks passing

### 2. Restart IDE

Restart Cursor/IDE to load the coordination server.

### 3. Use in Your Agent

```typescript
// Register your agent
await mcp.agent_register({
  agentId: "my-agent-id",
  capabilities: ["typescript", "refactoring"]
});

// Before editing files, check for conflicts
const conflicts = await mcp.agent_detect_conflicts({
  agentId: "my-agent-id",
  files: ["path/to/file.ts"]
});

if (!conflicts.hasConflict) {
  // Lock file
  await mcp.agent_lock_file({
    file: "path/to/file.ts",
    agentId: "my-agent-id",
    reason: "Fixing errors"
  });
  
  // Edit file...
  
  // Unlock when done
  await mcp.agent_unlock_file({
    file: "path/to/file.ts",
    agentId: "my-agent-id"
  });
}
```

---

## 📋 Common Patterns

### Pattern 1: Safe File Editing

```typescript
async function safeEditFile(agentId: string, file: string) {
  // Check for conflicts
  const conflicts = await mcp.agent_detect_conflicts({
    agentId,
    files: [file]
  });
  
  if (conflicts.hasConflict) {
    throw new Error(`File ${file} is locked by ${conflicts.conflicts[0].conflictingAgent}`);
  }
  
  // Lock file
  await mcp.agent_lock_file({ file, agentId, reason: "Editing" });
  
  try {
    // Edit file...
  } finally {
    // Always unlock
    await mcp.agent_unlock_file({ file, agentId });
  }
}
```

### Pattern 2: Task-Based Work

```typescript
async function workOnTask(agentId: string, taskId: string, files: string[]) {
  // Claim task
  const task = await mcp.agent_claim_task({
    taskId,
    agentId,
    files,
    description: "Fixing errors"
  });
  
  // Lock all files
  for (const file of files) {
    await mcp.agent_lock_file({ file, agentId, reason: task.description });
  }
  
  try {
    // Work on files...
    let progress = 0;
    for (const file of files) {
      // Process file...
      progress += 100 / files.length;
      await mcp.agent_update_task_progress({
        taskId,
        agentId,
        progress: Math.round(progress)
      });
    }
    
    // Complete task
    await mcp.agent_complete_task({ taskId, agentId });
  } finally {
    // Unlock all files
    for (const file of files) {
      await mcp.agent_unlock_file({ file, agentId });
    }
  }
}
```

### Pattern 3: Find Safe Work

```typescript
async function findSafeWork(agentId: string, capabilities: string[]) {
  // Get suggestions
  const suggestions = await mcp.agent_suggest_coordination({
    agentId,
    capabilities
  });
  
  if (suggestions.safeFiles.length > 0) {
    // Work on safe files
    return suggestions.safeFiles;
  } else if (suggestions.recommendedTasks.length > 0) {
    // Claim recommended task
    const task = suggestions.recommendedTasks[0];
    await mcp.agent_claim_task({
      taskId: task.taskId,
      agentId,
      files: task.files
    });
    return task.files;
  } else {
    // No work available
    return [];
  }
}
```

---

## 🛠️ Available Tools

### Quick Reference

| Tool | Purpose | Use When |
|------|---------|----------|
| `agent_register` | Register agent | Starting work |
| `agent_detect_conflicts` | Check conflicts | Before editing |
| `agent_lock_file` | Lock file | Before editing |
| `agent_unlock_file` | Unlock file | After editing |
| `agent_claim_task` | Claim task | Starting a task |
| `agent_complete_task` | Complete task | Finishing work |
| `agent_suggest_coordination` | Get suggestions | Finding work |
| `agent_get_workload_distribution` | View workload | Monitoring |

---

## ✅ Checklist

Before starting work:
- [ ] Agent registered
- [ ] Conflicts checked
- [ ] Files locked

While working:
- [ ] Progress updated regularly
- [ ] Status updated

After finishing:
- [ ] Files unlocked
- [ ] Task completed
- [ ] Status set to "idle"

---

## 📚 Full Documentation

- [Complete Workflow Example](./COORDINATION_WORKFLOW_EXAMPLE.md) - Detailed examples
- [Implementation Guide](./AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md) - Technical details
- [Server README](../../mcp-server/AGENT_COORDINATION_README.md) - Server documentation

---

**Ready to coordinate!** Start with the quick start pattern above.

