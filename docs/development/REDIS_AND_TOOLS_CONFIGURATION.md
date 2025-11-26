# Redis and Tools Configuration Guide

**Last Updated**: January 2025  
**Status**: ✅ Complete Configuration Guide

---

## 📋 Overview

This guide covers configuring Redis and MCP tools for the Reconciliation Platform. Redis is used for:
- Caching (backend and frontend)
- Agent coordination (multi-agent task management)
- Session storage
- Rate limiting

---

## ✅ Current Status

### Redis Service
- **Status**: ✅ Running
- **Container**: `reconciliation-redis` (healthy)
- **Port**: `6379`
- **Password**: Managed via SSOT (`.env` file)
- **Connection URL**: `redis://:${REDIS_PASSWORD}@localhost:6379`
- **SSOT Management**: Use `scripts/manage-passwords.sh` for password operations

### MCP Servers
- **reconciliation-platform**: ✅ Built and configured
- **agent-coordination**: ✅ Built and configured
- **Total Tools**: 74 (under 80 limit)

---

## 🔧 Configuration Steps

### 1. Redis Configuration

#### Using Docker Compose (Recommended)

Redis is already configured in `docker-compose.yml`. To start it:

```bash
# Start Redis only
docker-compose up -d redis

# Or start all services
docker-compose up -d
```

#### Verify Redis Connection

```bash
# Get password from SSOT
REDIS_PASSWORD=$(scripts/manage-passwords.sh get REDIS_PASSWORD)

# Test connection with password
redis-cli -a "$REDIS_PASSWORD" ping
# Should return: PONG

# Or using Docker
docker exec reconciliation-redis redis-cli -a "$REDIS_PASSWORD" ping

# Or use diagnostic command
scripts/manage-ssot.sh diagnose redis
```

#### Redis Configuration File

Location: `infrastructure/redis/redis.conf`

Key settings:
- **Max Memory**: 512MB (production), 256MB (optimized)
- **Memory Policy**: `allkeys-lru` (evict least recently used)
- **Persistence**: AOF (Append Only File) enabled
- **Authentication**: Set via `--requirepass` flag in docker-compose

---

### 2. Environment Variables (SSOT System)

#### SSOT Password Management

**⚠️ IMPORTANT**: All passwords are managed via the SSOT system using `.env` as the single source of truth.

**Management Script**: `scripts/manage-passwords.sh`

#### Backend Environment

The backend reads `REDIS_URL` from `.env` file via `SecretsService`:

```bash
# Get Redis password from SSOT
REDIS_PASSWORD=$(scripts/manage-passwords.sh get REDIS_PASSWORD)

# REDIS_URL format
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379
```

**Configuration**:
- **Docker**: `redis://:${REDIS_PASSWORD}@redis:6379` (internal Docker network)
- **Local**: `redis://:${REDIS_PASSWORD}@localhost:6379` (host machine)
- **SSOT**: `.env` file (managed via `scripts/manage-passwords.sh`)

#### MCP Server Environment

MCP servers are configured in `.cursor/mcp.json` and automatically synced from `.env`:

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "env": {
        "REDIS_URL": "redis://:${REDIS_PASSWORD}@localhost:6379"
      }
    },
    "agent-coordination": {
      "env": {
        "REDIS_URL": "redis://:${REDIS_PASSWORD}@localhost:6379"
      }
    }
  }
}
```

**Auto-sync**: MCP configuration is automatically updated when passwords change via `scripts/manage-passwords.sh sync`

#### Updating Redis Password (SSOT Method)

**✅ DO**: Use SSOT management script

```bash
# 1. Set new password in .env (SSOT)
scripts/manage-passwords.sh set REDIS_PASSWORD new_secure_password

# 2. Sync to all systems
scripts/manage-passwords.sh sync

# This automatically:
# - Updates docker-compose.yml
# - Updates .cursor/mcp.json
# - Restarts Docker services
# - Verifies connection
```

**❌ DON'T**: Edit files directly

```bash
# Don't edit .env directly
nano .env  # Bypasses SSOT system

# Don't edit docker-compose.yml directly
# Don't edit .cursor/mcp.json directly
```

#### Password Management Commands

```bash
# Show current passwords (masked)
scripts/manage-passwords.sh show

# Get specific password
scripts/manage-passwords.sh get REDIS_PASSWORD

# Set password
scripts/manage-passwords.sh set REDIS_PASSWORD new_password

# Generate secure password
scripts/manage-passwords.sh generate REDIS_PASSWORD

# Sync passwords to all systems
scripts/manage-passwords.sh sync

# Check password consistency
scripts/manage-passwords.sh check
```

#### SSOT Integration

The password system integrates with:
- **Agent Coordination**: File locking for `.env` edits
- **Docker Services**: Automatic service restart on password change
- **MCP Servers**: Automatic configuration update
- **Backend**: Configuration reload via `SecretsService`
- **Frontend**: Environment variable updates

See [SSOT Areas and Locking](../architecture/SSOT_AREAS_AND_LOCKING.md) for details.

---

### 3. MCP Tools Configuration

#### Current MCP Servers (7 servers, 74 tools)

| Server | Tools | Redis Required | Status |
|--------|-------|----------------|--------|
| **filesystem** | 8 | ❌ No | ✅ Active |
| **postgres** | 6 | ❌ No | ✅ Active |
| **prometheus** | 8 | ❌ No | ✅ Active |
| **reconciliation-platform** | 27 | ✅ Yes | ✅ Active |
| **agent-coordination** | 18 | ✅ Yes | ✅ Active |
| **sequential-thinking** | 1 | ❌ No | ✅ Active |
| **memory** | 6 | ❌ No | ✅ Active |

#### Build MCP Servers

If servers need to be rebuilt:

```bash
cd mcp-server
npm install
npm run build
```

This builds:
- `dist/index.js` (reconciliation-platform server)
- `dist/agent-coordination.js` (agent-coordination server)

#### Verify MCP Configuration

Check `.cursor/mcp.json` exists and is valid:

```bash
cat .cursor/mcp.json | jq '.'
```

---

### 4. Testing Redis Connection

#### From Backend (Rust)

```rust
use redis::Commands;

let client = redis::Client::open("redis://:redis_pass@localhost:6379")?;
let mut conn = client.get_connection()?;
let _: () = conn.set("test_key", "test_value")?;
let value: String = conn.get("test_key")?;
println!("Redis test: {}", value);
```

#### From MCP Server (TypeScript)

```typescript
import { createClient } from 'redis';

const client = createClient({
  url: 'redis://:redis_pass@localhost:6379'
});

await client.connect();
await client.set('test_key', 'test_value');
const value = await client.get('test_key');
console.log('Redis test:', value);
```

#### From Command Line

```bash
# Set a value
redis-cli -a redis_pass set test_key "test_value"

# Get a value
redis-cli -a redis_pass get test_key

# List all keys (use with caution on large datasets)
redis-cli -a redis_pass keys "*"

# Check Redis info
redis-cli -a redis_pass info
```

---

## 🚀 Quick Start

### 1. Start Redis

```bash
# Using Docker Compose
docker-compose up -d redis

# Verify it's running
docker ps | grep redis
redis-cli -a redis_pass ping
```

### 2. Verify MCP Configuration

```bash
# Check MCP config
cat .cursor/mcp.json | jq '.mcpServers | keys'

# Verify servers are built
ls -la mcp-server/dist/*.js
```

### 3. Restart Cursor IDE

**IMPORTANT**: After any configuration changes, restart Cursor IDE to apply changes.

1. Close Cursor IDE completely
2. Reopen Cursor IDE
3. MCP servers will automatically start

### 4. Test Tools

After restarting Cursor, test Redis tools:

- **Redis Get**: Get a cache value
- **Redis Keys**: List cache keys (with pattern matching)

---

## 🔍 Troubleshooting

### Redis Connection Issues

#### Error: Connection Refused

**Solution**:
```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis if not running
docker-compose up -d redis

# Check Redis logs
docker logs reconciliation-redis
```

#### Error: Authentication Failed

**Solution**:
1. Verify password in `docker-compose.yml`
2. Check `REDIS_URL` format: `redis://:password@host:port`
3. Test connection: `redis-cli -a redis_pass ping`

#### Error: Connection Timeout

**Solution**:
1. Check Redis is accessible: `redis-cli -a redis_pass ping`
2. Verify firewall/network settings
3. Check Redis is listening on correct port: `netstat -an | grep 6379`

### MCP Server Issues

#### Error: MCP Server Not Starting

**Solution**:
1. **Check Configuration**:
   ```bash
   cat .cursor/mcp.json | jq '.'
   ```

2. **Rebuild Servers**:
   ```bash
   cd mcp-server
   npm install
   npm run build
   ```

3. **Check Environment Variables**:
   ```bash
   # Verify REDIS_URL is set correctly
   echo $REDIS_URL
   ```

4. **Check Logs**:
   - Cursor IDE logs (usually in status bar or settings)
   - MCP server logs (if running standalone)

#### Error: Redis Tools Not Available

**Solution**:
1. Verify `agent-coordination` server is in `.cursor/mcp.json`
2. Check `REDIS_URL` is set in server environment
3. Restart Cursor IDE
4. Verify Redis is accessible

### Agent Coordination Issues

#### Error: Redis Connection Failed (Agent Coordination)

**Solution**:
1. Verify Redis is running: `redis-cli -a redis_pass ping`
2. Check `REDIS_URL` in `.cursor/mcp.json`:
   ```json
   "agent-coordination": {
     "env": {
       "REDIS_URL": "redis://:redis_pass@localhost:6379"
     }
   }
   ```
3. Check Redis connection from MCP server:
   ```bash
   cd mcp-server
   node -e "import('redis').then(r => r.createClient({url: 'redis://:redis_pass@localhost:6379'}).connect().then(c => c.ping()).then(console.log))"
   ```

---

## 📊 Redis Usage

### Memory Management

Redis is configured with:
- **Max Memory**: 512MB (production), 256MB (optimized)
- **Eviction Policy**: `allkeys-lru` (Least Recently Used)
- **Persistence**: AOF (Append Only File) enabled

### Key Patterns

The platform uses these Redis key patterns:

- **Cache**: `cache:*` - Application cache
- **Sessions**: `session:*` - User sessions
- **Rate Limiting**: `ratelimit:*` - Rate limit counters
- **Agent Coordination**: `agent:*`, `task:*`, `lock:*` - Agent coordination data

### Monitoring

Check Redis memory usage:

```bash
redis-cli -a redis_pass info memory
```

Check connected clients:

```bash
redis-cli -a redis_pass info clients
```

---

## 🔐 Security Best Practices

### Production Configuration

1. **Change Default Password**:
   ```yaml
   # docker-compose.yml
   REDIS_PASSWORD: ${REDIS_PASSWORD:-strong_random_password}
   ```

2. **Use Environment Variables**:
   - Never hardcode passwords
   - Use secrets management in production
   - Rotate passwords regularly

3. **Network Security**:
   - Bind Redis to `127.0.0.1` in production (not `0.0.0.0`)
   - Use firewall rules to restrict access
   - Use TLS/SSL for remote connections (`rediss://`)

4. **Redis Configuration**:
   - Enable `requirepass` (already enabled)
   - Disable dangerous commands: `CONFIG`, `FLUSHDB`, `FLUSHALL`
   - Set appropriate `maxmemory` limits

---

## 📚 Related Documentation

- [MCP Setup Complete](./MCP_SETUP_COMPLETE.md) - Complete MCP setup guide
- [Agent Coordination Implementation](../development/AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md) - Agent coordination details
- [Docker Compose Configuration](../deployment/DOCKER_COMPOSE_GUIDE.md) - Docker setup
- [Backend Configuration](../development/BACKEND_SETUP.md) - Backend Redis usage

---

## ✅ Verification Checklist

- [x] Redis service running and accessible
- [x] Redis password configured correctly
- [x] MCP servers built (`dist/index.js`, `dist/agent-coordination.js`)
- [x] `.cursor/mcp.json` configured with Redis URLs
- [x] Environment variables set correctly
- [ ] **Cursor IDE restarted** (User action required)
- [ ] **Redis tools tested in Cursor** (User action required)

---

## 🎯 Next Steps

1. **Verify Redis Connection**:
   ```bash
   redis-cli -a redis_pass ping
   ```

2. **Test MCP Tools**:
   - Restart Cursor IDE
   - Test Redis get/set operations
   - Test agent coordination tools

3. **Monitor Redis Usage**:
   ```bash
   redis-cli -a redis_pass info memory
   ```

---

**Status**: ✅ **Configuration Complete**

All Redis and MCP tools are configured and ready to use. Restart Cursor IDE to activate.

