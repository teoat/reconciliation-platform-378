# MCP Server Troubleshooting Guide

**Last Updated**: January 2025  
**Status**: Active

---

## ✅ Recent Fixes Applied

### 1. Path Corrections
- ✅ Updated all paths from `/Users/Arief/Desktop/378` to `/Users/Arief/Documents/GitHub/reconciliation-platform-378`
- ✅ Fixed `claude-desktop-config.json` paths
- ✅ Fixed `mcp-server/src/index.ts` default PROJECT_ROOT
- ✅ Updated documentation paths

### 2. TypeScript Configuration
- ✅ Changed `moduleResolution` from `"node"` to `"bundler"` for better ESM support
- ✅ Added `allowSyntheticDefaultImports` for better compatibility

### 3. Error Handling
- ✅ Added graceful error handling for Docker initialization failures
- ✅ Added graceful error handling for Redis connection failures
- ✅ Server now starts even if Docker/Redis are unavailable (with warnings)

### 4. Build Verification
- ✅ Server builds successfully
- ✅ Server starts without errors
- ✅ All dependencies installed correctly

---

## 🔍 Common Issues and Solutions

### Issue 1: "MCP Server Not Found" or "Command Failed"

**Symptoms:**
- Cursor IDE shows MCP server as disconnected
- Error messages about server not starting

**Solutions:**

1. **Verify the server is built:**
   ```bash
   cd mcp-server
   npm run build
   ```

2. **Check the path in Cursor configuration:**
   - Open Cursor IDE settings
   - Navigate to MCP configuration (`.cursor/mcp.json`)
   - Verify the path is: `/Users/Arief/Documents/GitHub/reconciliation-platform-378/mcp-server/dist/index.js`
   - Ensure `command` is `"node"` (not a hardcoded path)

3. **Verify Node.js is in PATH:**
   ```bash
   which node
   node --version  # Should be v18+
   ```

4. **Test server manually:**
   ```bash
   cd mcp-server
   node dist/index.js
   # Should see: "Reconciliation Platform MCP Server running on stdio"
   ```

---

### Issue 2: "Module Not Found" or Import Errors

**Symptoms:**
- TypeScript compilation errors
- Runtime import errors

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   cd mcp-server
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check TypeScript configuration:**
   - Verify `tsconfig.json` has `"moduleResolution": "bundler"`
   - Ensure `"type": "module"` in `package.json`

---

### Issue 3: Docker/Redis Connection Errors

**Symptoms:**
- Warnings about Docker/Redis not available
- Tools fail when trying to use Docker/Redis

**Solutions:**

1. **Docker:**
   ```bash
   # Check if Docker is running
   docker ps
   
   # If not running, start Docker Desktop
   # On macOS: open -a Docker
   ```

2. **Redis:**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # If using Docker:
   docker-compose ps redis
   docker-compose up -d redis
   ```

3. **Note:** The server will start even if Docker/Redis are unavailable, but those tools won't work.

---

### Issue 4: Cursor IDE Not Recognizing MCP Server

**Symptoms:**
- MCP server doesn't appear in Cursor
- No tools available from the server

**Solutions:**

1. **Check Cursor MCP configuration:**
   - Location: `.cursor/mcp.json` (workspace) or `~/.cursor/mcp.json` (global)
   - Verify the configuration matches `claude-desktop-config.json` format

2. **Restart Cursor IDE:**
   - Close Cursor completely
   - Reopen the workspace
   - Check MCP server status in settings

3. **Verify configuration format:**
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

---

## 🧪 Diagnostic Tools

### Run Full Diagnostic
```bash
./scripts/diagnose-mcp-server.sh
```

### Manual Server Test
```bash
cd mcp-server
node dist/index.js
# Press Ctrl+C after seeing "Reconciliation Platform MCP Server running on stdio"
```

### Check Server Logs
- In Cursor IDE: Settings → MCP → View Logs
- Look for error messages or connection issues

---

## 📋 Verification Checklist

- [ ] Server builds successfully (`npm run build`)
- [ ] Server starts without errors (`node dist/index.js`)
- [ ] Node.js version is 18+ (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] Paths in config are correct (check `.cursor/mcp.json`)
- [ ] Cursor IDE restarted after configuration changes
- [ ] Docker running (if using Docker tools)
- [ ] Redis running (if using Redis tools)

---

## 🔧 Configuration Files

### Cursor IDE Configuration
**Location:** `.cursor/mcp.json`

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

### Claude Desktop Configuration
**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Same format as above.

---

## 🆘 Still Having Issues?

1. **Check Cursor IDE logs:**
   - Settings → MCP → View Logs
   - Look for specific error messages

2. **Run diagnostic script:**
   ```bash
   ./scripts/diagnose-mcp-server.sh
   ```

3. **Verify environment:**
   - Check Node.js version
   - Verify all paths are correct
   - Ensure dependencies are installed

4. **Test server independently:**
   ```bash
   cd mcp-server
   npm start
   ```

5. **Check for conflicting configurations:**
   - Ensure only one MCP config is active
   - Check both workspace and global configs

---

## 📚 Related Documentation

- [MCP Setup Guide](./MCP_SETUP_GUIDE.md)
- [Quick Start Guide](../getting-started/QUICK_START.md)
- [MCP Server README](../../mcp-server/README.md)

---

**Last Updated**: January 2025  
**Status**: Active

