# Redis MCP Connection Fix

**Date**: November 26, 2025  
**Status**: ✅ Fixed  
**Issue**: Redis MCP connection failing with "Redis connection failed after 3 retries"

---

## Problem

The agent-coordination MCP server was failing to connect to Redis with the error:
```
Redis connection failed: Redis connection failed after 3 retries
```

## Root Cause

1. **Incorrect Redis URL Format**: The default URL `redis://:redis_pass@localhost:6379` uses a format that the Redis client library doesn't properly parse for password authentication.

2. **Password Handling**: The Redis client expects password to be passed as a separate `password` option, not embedded in the URL.

3. **No Password Support**: The actual Redis container (`reconciliation-redis-dev`) doesn't require a password, but the code was trying to authenticate with one.

## Solution

### Changes Made

1. **Updated `mcp-server/src/agent-coordination.ts`**:
   - Changed default `REDIS_URL` from `redis://:redis_pass@localhost:6379` to `redis://localhost:6379`
   - Added URL parsing logic to extract password from URL if present
   - Pass password as separate option to `createClient()` instead of embedding in URL

2. **Updated `mcp-server/src/index.ts`**:
   - Applied same URL parsing and password handling logic
   - Changed default URL to `redis://localhost:6379`

### Code Changes

**Before:**
```typescript
redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://:redis_pass@localhost:6379',
  socket: { ... }
});
```

**After:**
```typescript
// Parse REDIS_URL to handle both password and no-password cases
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisConfig: { url: string; password?: string; socket: any };

if (redisUrl.includes('@') && redisUrl.includes(':')) {
  // Parse URL format: redis://:password@host:port
  const urlMatch = redisUrl.match(/^redis:\/\/(?::([^@]+)@)?([^:]+):(\d+)$/);
  if (urlMatch) {
    const [, password, host, port] = urlMatch;
    redisConfig = {
      url: `redis://${host}:${port}`,
      password: password || undefined,
      socket: { ... }
    };
  }
}
redisClient = createClient(redisConfig);
```

## Testing

✅ **Connection Test**: Successfully connects to Redis without password
```bash
✅ Redis connection successful (no password)
✅ Redis ping: PONG
```

## Next Steps

1. **Restart MCP Server**: The MCP server needs to be restarted for changes to take effect
   - If using Cursor, restart the IDE or reload MCP servers
   - If using Claude Desktop, restart the application

2. **Verify Connection**: Test agent coordination tools:
   ```bash
   # Should now work without errors
   mcp_agent-coordination_agent_list_agents
   ```

3. **Update Environment Variables** (if needed):
   - If Redis requires password, set `REDIS_URL=redis://:password@localhost:6379`
   - If no password, set `REDIS_URL=redis://localhost:6379` or leave default

## Related Files

- `mcp-server/src/agent-coordination.ts` - Agent coordination MCP server
- `mcp-server/src/index.ts` - Main reconciliation platform MCP server
- `docker-compose.yml` - Redis container configuration

---

**Status**: ✅ Code fixed and built successfully  
**Action Required**: Restart MCP server to apply changes

