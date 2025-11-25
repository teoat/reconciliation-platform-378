# IDE Agent Coordination Guide

**Last Updated**: November 2025  
**Status**: Active

---

## Executive Summary

IDE agents (like Cursor's AI assistants) **do NOT have built-in awareness** of other agents' tasks. This can lead to conflicts, duplicate fixes, and overlapping changes. This guide provides strategies to coordinate multiple agents effectively.

---

## Current State: Agent Awareness

### ❌ What Agents DON'T Know

1. **No shared state** - Each agent session is independent
2. **No task visibility** - Agents can't see what other agents are working on
3. **No conflict detection** - Agents don't detect overlapping changes
4. **No coordination protocol** - No built-in communication between agents

### ✅ What Agents CAN See

1. **Git status** - Can see modified files via `git status`
2. **File contents** - Can read current file state
3. **Linter errors** - Can see current error state
4. **Recent changes** - Can infer from git history

---

## Common Conflict Scenarios

### 1. **File-Level Conflicts**

**Problem**: Multiple agents editing the same file simultaneously

```typescript
// Agent A modifies:
export const useApi = () => { /* ... */ }

// Agent B modifies:
export const useApi = () => { /* ... */ }  // Conflict!
```

**Impact**: 
- Git merge conflicts
- Lost changes
- Broken functionality

### 2. **Duplicate Fixes**

**Problem**: Multiple agents fixing the same issue

```typescript
// Agent A fixes:
logger.error('Error:', toRecord(error));

// Agent B fixes:
logger.error('Error:', toRecord(error));  // Duplicate work
```

**Impact**:
- Wasted effort
- Confusion in PR reviews
- Inconsistent implementations

### 3. **Dependency Conflicts**

**Problem**: Agent A adds dependency, Agent B removes it

```json
// Agent A adds:
"web-vitals": "^3.0.0"

// Agent B removes:
// (removes web-vitals)
```

**Impact**:
- Broken imports
- Build failures
- Runtime errors

### 4. **Type Definition Conflicts**

**Problem**: Multiple agents defining the same type

```typescript
// Agent A defines:
interface UserData { id: number; }

// Agent B defines:
interface UserData { id: string; }  // Conflict!
```

**Impact**:
- Type errors
- Compilation failures
- Inconsistent types

---

## Coordination Strategies

### Strategy 1: File Ownership (Recommended)

**Assign specific files/directories to each agent**

```markdown
# Agent Task Assignment

## Agent 1: Infrastructure
- `backend/src/middleware/`
- `backend/src/utils/`
- `scripts/deployment/`

## Agent 2: Frontend Services
- `frontend/src/services/`
- `frontend/src/hooks/`
- `frontend/src/utils/`

## Agent 3: TypeScript Fixes
- `frontend/src/types/`
- `types/index.ts`
- Type error fixes only

## Agent 4: Security
- Security-related files
- Authentication/authorization
- Input validation
```

**Benefits**:
- Clear boundaries
- Minimal conflicts
- Easy to track progress

**Implementation**:
1. Create `docs/development/AGENT_ASSIGNMENTS.md`
2. Update before starting work
3. Check before making changes

---

### Strategy 2: Sequential Workflow

**Work in phases, one agent at a time**

```markdown
# Phase-Based Coordination

## Phase 1: Infrastructure (Agent 1)
- Complete all infrastructure tasks
- Commit and push
- Mark phase complete

## Phase 2: Type Fixes (Agent 3)
- Fix TypeScript errors
- Commit and push
- Mark phase complete

## Phase 3: Security (Agent 2)
- Security improvements
- Commit and push
- Mark phase complete
```

**Benefits**:
- No conflicts
- Clear dependencies
- Easy to track

**Drawbacks**:
- Slower overall progress
- Blocks parallel work

---

### Strategy 3: Checkpoint System

**Use git branches and checkpoints**

```bash
# Agent 1 creates branch
git checkout -b agent1/infrastructure-fixes
# ... make changes ...
git commit -m "feat(infra): Add circuit breaker"
git push origin agent1/infrastructure-fixes

# Agent 2 creates branch
git checkout -b agent2/type-fixes
# ... make changes ...
git commit -m "fix(types): Fix TypeScript errors"
git push origin agent2/type-fixes

# Merge sequentially
git checkout develop
git merge agent1/infrastructure-fixes
git merge agent2/type-fixes
```

**Benefits**:
- Isolated work
- Easy conflict resolution
- Clear history

---

### Strategy 4: Task Queue System

**Use a shared task queue**

```markdown
# Shared Task Queue

## In Progress
- [ ] Agent 1: Fix circuit breaker (File: `middleware/circuit_breaker.rs`)
- [ ] Agent 2: Fix TypeScript errors (Files: `services/*.ts`)

## Completed
- [x] Agent 1: Add correlation IDs
- [x] Agent 3: Fix logger errors

## Blocked
- [ ] Agent 2: Fix types (waiting for Agent 1's infrastructure)
```

**Implementation**:
1. Create `docs/development/AGENT_TASK_QUEUE.md`
2. Update in real-time
3. Check before starting work

---

## Best Practices

### ✅ DO

1. **Check git status first**
   ```bash
   git status
   git diff
   ```

2. **Read coordination files**
   - Check `docs/development/AGENT_ASSIGNMENTS.md`
   - Check `docs/development/AGENT_TASK_QUEUE.md`

3. **Work in small batches**
   - Fix 5-10 files at a time
   - Commit frequently
   - Push regularly

4. **Communicate via documentation**
   - Update task queue
   - Document what you're working on
   - Mark files as "in progress"

5. **Use descriptive commits**
   ```bash
   git commit -m "fix(types): Fix TS2345 errors in services (Agent 3)"
   ```

6. **Pull before starting**
   ```bash
   git pull origin develop
   ```

### ❌ DON'T

1. **Don't work on files others are editing**
   - Check task queue first
   - Check git status

2. **Don't make large refactors without coordination**
   - Break into smaller tasks
   - Coordinate with other agents

3. **Don't ignore git conflicts**
   - Resolve immediately
   - Test after resolution

4. **Don't duplicate fixes**
   - Check if issue already fixed
   - Check recent commits

5. **Don't modify shared dependencies**
   - Coordinate dependency changes
   - Update package.json carefully

---

## Conflict Resolution

### When Conflicts Occur

1. **Stop immediately**
   ```bash
   git stash  # Save your work
   ```

2. **Check what changed**
   ```bash
   git log --oneline -10
   git diff origin/develop
   ```

3. **Coordinate with other agent**
   - Check task queue
   - Identify overlapping work
   - Decide who keeps changes

4. **Resolve conflicts**
   ```bash
   git pull origin develop
   # Resolve conflicts in editor
   git add .
   git commit -m "fix: Resolve merge conflicts"
   ```

5. **Test thoroughly**
   ```bash
   npm run test
   cargo test
   ```

---

## Recommended Workflow

### For Each Agent Session

1. **Pre-flight Check**
   ```bash
   # Pull latest
   git pull origin develop
   
   # Check status
   git status
   
   # Read coordination files
   cat docs/development/AGENT_ASSIGNMENTS.md
   cat docs/development/AGENT_TASK_QUEUE.md
   ```

2. **Claim Your Work**
   ```markdown
   # Update AGENT_TASK_QUEUE.md
   - [ ] Agent X: Fix TypeScript errors (Files: services/*.ts) [IN PROGRESS]
   ```

3. **Do Your Work**
   - Make changes
   - Test locally
   - Commit frequently

4. **Post-flight Check**
   ```bash
   # Verify no conflicts
   git pull origin develop
   
   # Run tests
   npm run test
   
   # Update task queue
   # Mark as complete
   ```

5. **Push and Update**
   ```bash
   git push origin your-branch
   # Update AGENT_TASK_QUEUE.md
   ```

---

## Tools and Automation

### 1. Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check if file is assigned to another agent
# (Simplified example)

ASSIGNED_FILES=$(cat docs/development/AGENT_ASSIGNMENTS.md | grep -A 10 "Agent" | grep "^-" | cut -d' ' -f2)

for file in $(git diff --cached --name-only); do
  if echo "$ASSIGNED_FILES" | grep -q "$file"; then
    echo "Warning: $file may be assigned to another agent"
    echo "Check docs/development/AGENT_ASSIGNMENTS.md"
  fi
done
```

### 2. Coordination Script

Create `scripts/check-agent-coordination.sh`:

```bash
#!/bin/bash
# Check for potential conflicts

echo "Checking agent coordination..."

# Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Uncommitted changes detected"
  git status --short
fi

# Check for recent commits
echo "Recent commits:"
git log --oneline -5

# Check task queue
if [ -f "docs/development/AGENT_TASK_QUEUE.md" ]; then
  echo "Current tasks:"
  grep -E "\[ \]|\[x\]" docs/development/AGENT_TASK_QUEUE.md | head -10
fi
```

### 3. Conflict Detection

Create `scripts/detect-conflicts.sh`:

```bash
#!/bin/bash
# Detect potential file conflicts

MODIFIED_FILES=$(git diff --name-only)

for file in $MODIFIED_FILES; do
  # Check if file is in another agent's assignment
  if grep -r "$file" docs/development/AGENT_ASSIGNMENTS.md | grep -v "$(whoami)"; then
    echo "⚠️  Potential conflict: $file"
  fi
done
```

---

## Monitoring and Metrics

### Track Coordination Success

1. **Conflict Rate**
   - Number of merge conflicts per week
   - Target: < 5 conflicts/week

2. **Duplicate Fixes**
   - Same issue fixed multiple times
   - Target: 0 duplicates

3. **File Overlap**
   - Files edited by multiple agents
   - Target: < 10% overlap

4. **Task Completion Time**
   - Time from assignment to completion
   - Track bottlenecks

---

## Example: Multi-Agent TypeScript Fix

### Scenario: Fix 955 TypeScript errors

**Without Coordination** (❌ Bad):
- Agent 1 fixes `services/monitoring.ts`
- Agent 2 fixes `services/monitoring.ts` (conflict!)
- Agent 3 fixes `services/monitoring.ts` (duplicate!)

**With Coordination** (✅ Good):

```markdown
# AGENT_TASK_QUEUE.md

## Agent 1: Services (510 errors)
- [x] monitoring.ts
- [x] nluService.ts
- [ ] offlineDataService.ts [IN PROGRESS]
- [ ] performanceMonitor.ts

## Agent 2: Utils (182 errors)
- [x] typeHelpers.ts
- [ ] performanceConfig.tsx [IN PROGRESS]
- [ ] routeSplitting.tsx

## Agent 3: Hooks (113 errors)
- [ ] useApiEnhanced.ts
- [ ] useReconciliationStreak.ts
- [ ] useSecurity.ts
```

**Result**: No conflicts, clear progress, parallel work

---

## Recommendations

### Immediate Actions

1. **Create coordination files**
   - `docs/development/AGENT_ASSIGNMENTS.md`
   - `docs/development/AGENT_TASK_QUEUE.md`

2. **Establish workflow**
   - Pre-flight checks
   - Task claiming
   - Regular updates

3. **Set up monitoring**
   - Track conflicts
   - Measure coordination success

### Long-term Improvements

1. **Automated conflict detection**
   - Pre-commit hooks
   - CI/CD checks

2. **Agent communication protocol**
   - Shared state file
   - Real-time updates

3. **Task prioritization**
   - Critical path first
   - Dependency-aware scheduling

---

## MCP Server Solution (Recommended)

**NEW**: A dedicated MCP server for agent coordination is now available! This provides automated coordination that eliminates most conflicts.

See [Agent Coordination MCP Server Proposal](./AGENT_COORDINATION_MCP_PROPOSAL.md) for details.

**Key Benefits:**
- ✅ Automatic conflict detection
- ✅ File-level locking
- ✅ Task management
- ✅ Workload distribution
- ✅ Real-time coordination

**Quick Start:**
1. Review the proposal
2. Implement the MCP server
3. Configure in `.cursor/mcp.json`
4. Use coordination tools in agent workflows

---

## Related Documentation

- [Agent Coordination MCP Server Proposal](./AGENT_COORDINATION_MCP_PROPOSAL.md) - **NEW** Automated coordination via MCP
- [Git Workflow](./git_workflow.mdc) - Git best practices
- [Code Review Guidelines](./code_review.mdc) - Review process
- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md) - Single source of truth

---

**Remember**: Coordination is key to avoiding conflicts and maximizing productivity. Always check before you start, and communicate what you're working on!

**Recommended**: Use the MCP server for automated coordination instead of manual processes.

