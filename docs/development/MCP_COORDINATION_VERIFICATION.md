# Agent Coordination MCP Server - Verification Guide

**Date**: November 2025  
**Status**: Active

---

## Quick Verification

Run the verification script:

```bash
./scripts/verify-mcp-coordination.sh
```

This will check:
- ✅ Build files exist
- ✅ Dependencies installed
- ✅ Redis connection
- ✅ MCP configuration
- ✅ All 18 tools present
- ✅ Server syntax valid

---

## Manual Verification Steps

### 1. Check Build Files

```bash
ls -la mcp-server/dist/agent-coordination.*
```

Should show:
- `agent-coordination.js` (~44KB)
- `agent-coordination.d.ts`
- Source maps

### 2. Check MCP Configuration

```bash
cat .cursor/mcp.json | grep -A 10 "agent-coordination"
```

Should show:
```json
"agent-coordination": {
  "command": "node",
  "args": ["/path/to/mcp-server/dist/agent-coordination.js"],
  "env": {
    "REDIS_URL": "redis://:redis_pass@localhost:6379",
    "COORDINATION_TTL": "3600"
  }
}
```

### 3. Verify Tools

All 18 tools should be available:

**Agent Management (4)**
- `agent_register`
- `agent_update_status`
- `agent_list_agents`
- `agent_get_status`

**Task Management (5)**
- `agent_claim_task`
- `agent_release_task`
- `agent_list_tasks`
- `agent_update_task_progress`
- `agent_complete_task`

**File Locking (4)**
- `agent_lock_file`
- `agent_unlock_file`
- `agent_check_file_lock`
- `agent_list_locked_files`

**Conflict Detection (2)**
- `agent_detect_conflicts`
- `agent_check_file_overlap`

**Coordination (3)**
- `agent_suggest_coordination`
- `agent_get_workload_distribution`
- `agent_find_available_work`

### 4. Test Server Startup

```bash
cd mcp-server
node dist/agent-coordination.js
```

Should output:
```
[agent-coordination-mcp] Server v1.0.0 running on stdio
[agent-coordination-mcp] Redis URL: redis://...
[agent-coordination-mcp] Coordination TTL: 3600s
[agent-coordination-mcp] Tools enabled: 18
```

Press Ctrl+C to stop.

### 5. Check Redis Connection

```bash
redis-cli ping
```

Should return: `PONG`

---

## IDE Verification

### Cursor IDE

1. **Restart Cursor** to load new MCP servers
2. **Check MCP Status**:
   - Open Settings
   - Search for "MCP" or "Model Context Protocol"
   - Verify `agent-coordination` is listed and connected
3. **Test Tool Access**:
   - Open chat/agent interface
   - Tools should be available in tool list

### Claude Desktop

1. **Restart Claude Desktop**
2. **Check Configuration**:
   - `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Verify `agent-coordination` server is configured
3. **Test Tools**:
   - Tools should appear in available tools list

---

## Troubleshooting

### Server Not Found

**Problem**: IDE can't find the server

**Solution**:
1. Verify path in `.cursor/mcp.json` is absolute
2. Check file exists: `ls -la mcp-server/dist/agent-coordination.js`
3. Rebuild: `cd mcp-server && npm run build`

### Redis Connection Failed

**Problem**: Server can't connect to Redis

**Solution**:
1. Check Redis is running: `redis-cli ping`
2. Verify `REDIS_URL` in config
3. Check Redis password if required

### Tools Not Available

**Problem**: Tools don't appear in IDE

**Solution**:
1. Restart IDE completely
2. Check MCP server is connected in settings
3. Verify server started without errors
4. Check server logs for errors

### Build Errors

**Problem**: `npm run build` fails

**Solution**:
1. Install dependencies: `npm install`
2. Check TypeScript version: `npx tsc --version`
3. Clear and rebuild: `rm -rf dist && npm run build`

---

## Expected Output

### Verification Script Output

```
═══════════════════════════════════════════════════════════
   Agent Coordination MCP Server Verification
═══════════════════════════════════════════════════════════

[1/6] Checking build files...
✅ Server built (44013 bytes)

[2/6] Checking dependencies...
✅ All dependencies installed

[3/6] Checking Redis connection...
✅ Redis is running

[4/6] Checking MCP configuration...
✅ Agent coordination server configured

[5/6] Verifying tools (18 total)...
✅ All 18 tools found

[6/6] Testing server syntax...
✅ Server syntax valid

═══════════════════════════════════════════════════════════
✅ Verification Complete!
═══════════════════════════════════════════════════════════
```

---

## Quick Test

Test a tool manually:

```bash
# Start server in background
cd mcp-server
node dist/agent-coordination.js &
SERVER_PID=$!

# Test tool (using MCP client or curl if HTTP bridge available)
# ... test tool calls ...

# Stop server
kill $SERVER_PID
```

---

## Related Documentation

- [Implementation Complete](./AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md)
- [Server README](../../mcp-server/AGENT_COORDINATION_README.md)
- [Usage Guide](./IDE_AGENT_COORDINATION.md)

---

**Status**: ✅ All checks passing = Ready to use!


