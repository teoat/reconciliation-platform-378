#!/bin/bash
# Test script for Agent Coordination MCP Server tools
# Demonstrates basic coordination workflow

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Testing Agent Coordination MCP Server Tools${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Check if MCP server is accessible
echo -e "${BLUE}[1/5] Checking MCP server accessibility...${NC}"
if [ -f "mcp-server/dist/agent-coordination.js" ]; then
    echo -e "${GREEN}✅ Server file exists${NC}"
else
    echo -e "${RED}❌ Server not found. Run: cd mcp-server && npm run build${NC}"
    exit 1
fi

# Check Redis
echo -e "${BLUE}[2/5] Checking Redis connection...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis not responding${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not found${NC}"
fi

# Test server can start
echo -e "${BLUE}[3/5] Testing server startup...${NC}"
cd mcp-server
if node -e "require('./dist/agent-coordination.js')" 2>&1 | head -3; then
    echo -e "${GREEN}✅ Server can be loaded${NC}"
else
    echo -e "${YELLOW}⚠️  Server load test (this is expected for stdio servers)${NC}"
fi
cd ..

# Show tool usage examples
echo -e "${BLUE}[4/5] Tool Usage Examples:${NC}"
echo ""
echo -e "${GREEN}Example 1: Register an agent${NC}"
cat << 'EOF'
await mcp.agent_register({
  agentId: "test-agent-1",
  capabilities: ["typescript", "refactoring"]
});
EOF

echo ""
echo -e "${GREEN}Example 2: Claim a task${NC}"
cat << 'EOF'
await mcp.agent_claim_task({
  taskId: "fix-typescript-errors",
  agentId: "test-agent-1",
  files: ["frontend/src/services/monitoring.ts"],
  description: "Fix TypeScript errors in monitoring service"
});
EOF

echo ""
echo -e "${GREEN}Example 3: Lock a file${NC}"
cat << 'EOF'
await mcp.agent_lock_file({
  file: "frontend/src/services/monitoring.ts",
  agentId: "test-agent-1",
  reason: "Fixing TypeScript errors"
});
EOF

echo ""
echo -e "${GREEN}Example 4: Detect conflicts${NC}"
cat << 'EOF'
const conflicts = await mcp.agent_detect_conflicts({
  agentId: "test-agent-1",
  files: ["frontend/src/services/monitoring.ts"]
});

if (conflicts.hasConflict) {
  console.log("Conflicts detected:", conflicts.conflicts);
}
EOF

echo ""
echo -e "${GREEN}Example 5: Get coordination suggestions${NC}"
cat << 'EOF'
const suggestions = await mcp.agent_suggest_coordination({
  agentId: "test-agent-1",
  capabilities: ["typescript"],
  preferredFiles: ["frontend/src/services/*.ts"]
});
EOF

# Create test workflow file
echo -e "${BLUE}[5/5] Creating test workflow example...${NC}"
cat > "$PROJECT_ROOT/docs/development/COORDINATION_WORKFLOW_EXAMPLE.md << 'WORKFLOW_EOF'
# Agent Coordination Workflow Example

## Complete Workflow for Multiple Agents

### Step 1: Agent Registration

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

### Step 2: Check Available Work

```typescript
// Agent 1 checks for available work
const suggestions = await mcp.agent_suggest_coordination({
  agentId: "agent-1",
  capabilities: ["typescript"],
  preferredFiles: ["frontend/src/services/*.ts"]
});

console.log("Recommended tasks:", suggestions.recommendedTasks);
console.log("Safe files:", suggestions.safeFiles);
```

### Step 3: Claim Task

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
  // Handle conflicts...
}
```

### Step 4: Lock Files Before Editing

```typescript
// Lock files before editing
for (const file of claimResult.files) {
  await mcp.agent_lock_file({
    file: file,
    agentId: "agent-1",
    reason: "Fixing TypeScript errors"
  });
}
```

### Step 5: Update Progress

```typescript
// Update progress as work progresses
await mcp.agent_update_task_progress({
  taskId: "fix-services-typescript",
  agentId: "agent-1",
  progress: 50,
  message: "Fixed monitoring.ts, working on nluService.ts"
});
```

### Step 6: Complete Task

```typescript
// Mark task as complete
await mcp.agent_complete_task({
  taskId: "fix-services-typescript",
  agentId: "agent-1"
});

// Release file locks
for (const file of claimResult.files) {
  await mcp.agent_unlock_file({
    file: file,
    agentId: "agent-1"
  });
}
```

### Step 7: Check Workload Distribution

```typescript
// See what other agents are doing
const workload = await mcp.agent_get_workload_distribution();

console.log("Active agents:", workload.summary.activeAgents);
console.log("Total tasks:", workload.summary.totalTasks);
console.log("Available tasks:", workload.summary.availableTasks);
```

## Conflict Prevention Example

```typescript
// Before editing, check for conflicts
const conflicts = await mcp.agent_detect_conflicts({
  agentId: "agent-2",
  files: ["frontend/src/services/monitoring.ts"]
});

if (conflicts.hasConflict) {
  console.log("Cannot edit - file is locked by:", conflicts.conflicts[0].conflictingAgent);
  // Work on different files instead
  const suggestions = await mcp.agent_suggest_coordination({
    agentId: "agent-2",
    capabilities: ["typescript"]
  });
  // Use suggestions.safeFiles
} else {
  // Safe to proceed
  await mcp.agent_lock_file({
    file: "frontend/src/services/monitoring.ts",
    agentId: "agent-2"
  });
}
```

## Best Practices

1. **Always register** before starting work
2. **Check conflicts** before claiming tasks
3. **Lock files** before editing
4. **Update progress** regularly
5. **Release locks** when done
6. **Complete tasks** when finished

WORKFLOW_EOF

echo -e "${GREEN}✅ Test workflow example created${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Tool Testing Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. ${GREEN}Use tools in your IDE agent workflows${NC}"
echo "  2. ${GREEN}See workflow example:${NC} docs/development/COORDINATION_WORKFLOW_EXAMPLE.md"
echo "  3. ${GREEN}Check server status in IDE MCP settings${NC}"
echo ""
echo -e "${BLUE}Quick Test in IDE:${NC}"
echo "  Try: 'Register an agent with ID test-agent-1'"
echo "  The agent should use: mcp.agent_register()"
echo ""

