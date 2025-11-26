# Redis and Tools Quick Start Guide

**Status**: ✅ Configuration Ready

---

## 🚀 Quick Setup

### 1. Verify Redis is Running

```bash
# Check if Redis container is running
docker ps | grep redis

# Test Redis connection (local Redis, no password)
redis-cli ping
# Should return: PONG

# Or test Docker Redis (may require password)
docker exec reconciliation-redis redis-cli ping
```

### 2. Run Setup Script

```bash
# Run the automated setup script
./scripts/setup-redis-and-tools.sh
```

This script will:
- ✅ Check Redis connection
- ✅ Verify MCP configuration
- ✅ Check if MCP servers are built
- ✅ Offer to build servers if needed
- ✅ Start Redis if not running

### 3. Restart Cursor IDE

**IMPORTANT**: After configuration, restart Cursor IDE to activate MCP tools.

---

## 📋 Current Configuration

### Redis
- **Status**: ✅ Running (Docker container: `reconciliation-redis`)
- **Port**: `6379`
- **Connection**: 
  - Local: `redis://localhost:6379` (no password)
  - Docker: `redis://:redis_pass@localhost:6379` (with password)

### MCP Servers
- **reconciliation-platform**: ✅ Built (`mcp-server/dist/index.js`)
- **agent-coordination**: ✅ Built (`mcp-server/dist/agent-coordination.js`)
- **Configuration**: `.cursor/mcp.json` ✅

### MCP Tools Using Redis
1. **reconciliation-platform** (27 tools)
   - Redis operations: `redis_get`, `redis_keys`
   
2. **agent-coordination** (18 tools)
   - Task management, file locking, agent coordination
   - Requires Redis for shared state

---

## 🔧 Manual Configuration

### If Redis is Not Running

```bash
# Start Redis using Docker Compose
docker-compose up -d redis

# Verify it started
docker ps | grep redis
redis-cli ping
```

### If MCP Servers Need Building

```bash
cd mcp-server
npm install
npm run build
```

### Update Redis URL in MCP Config

Edit `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "env": {
        "REDIS_URL": "redis://localhost:6379"
      }
    },
    "agent-coordination": {
      "env": {
        "REDIS_URL": "redis://localhost:6379"
      }
    }
  }
}
```

**Note**: Use `redis://localhost:6379` if local Redis has no password, or `redis://:password@localhost:6379` if password is required.

---

## ✅ Verification

### Test Redis Connection

```bash
# Local Redis (no password)
redis-cli ping

# Docker Redis (with password)
docker exec reconciliation-redis redis-cli -a redis_pass ping
```

### Test MCP Tools in Cursor

After restarting Cursor IDE:
1. Open Cursor IDE
2. Check MCP server status
3. Try using Redis tools:
   - `redis_get` - Get a cache value
   - `redis_keys` - List cache keys

---

## 📚 Full Documentation

For detailed configuration, see:
- [Redis and Tools Configuration Guide](docs/development/REDIS_AND_TOOLS_CONFIGURATION.md)
- [MCP Setup Complete](docs/development/MCP_SETUP_COMPLETE.md)

---

## 🐛 Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis if needed
docker-compose up -d redis

# Check Redis logs
docker logs reconciliation-redis
```

### MCP Tools Not Available

1. **Restart Cursor IDE** (required after config changes)
2. **Verify MCP config**: `cat .cursor/mcp.json | jq '.'`
3. **Check servers are built**: `ls -la mcp-server/dist/*.js`
4. **Rebuild if needed**: `cd mcp-server && npm run build`

---

**Next Step**: Run `./scripts/setup-redis-and-tools.sh` to verify everything is configured correctly!

