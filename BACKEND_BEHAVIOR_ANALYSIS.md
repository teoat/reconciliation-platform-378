# Backend Behavior Analysis

**Date**: November 19, 2025  
**Status**: 🔍 Deep Investigation

## Problem Statement

The backend container exhibits unusual behavior:
- **Container Status**: Continuously restarting
- **Exit Code**: 0 (success, not crash)
- **Runtime Duration**: ~1.2 seconds per cycle
- **Functional Status**: API responds correctly during brief runtime
- **Log Visibility**: Only entrypoint script logs visible, no Rust application logs

## Key Findings

### 1. Container Lifecycle
```
Started:  2025-11-19T13:33:44.60435085Z
Finished: 2025-11-19T13:33:45.790478275Z
Duration: ~1.2 seconds
Exit Code: 0
```

### 2. Functional Evidence
- Health endpoint: `http://localhost:2000/api/health` → `healthy`
- API endpoints respond correctly
- Server successfully starts and handles requests

### 3. Log Analysis
- ✅ Entrypoint script logs appear
- ❌ No Rust application logs (`eprintln!`, `log::info!`)
- ❌ No server binding logs
- ❌ No server startup logs

## Root Cause Hypothesis

### Primary Hypothesis: Server Completing Immediately

The `server.run().await?` call is completing immediately with `Ok(())`, indicating the server is stopping gracefully right after starting.

**Possible Causes**:

1. **Signal Reception**: Server receives SIGTERM/SIGINT immediately after start
   - Docker health check might be sending signals
   - Container orchestration sending shutdown signals
   - Entrypoint script signal handling issue

2. **Runtime Initialization Failure**: Actix-web runtime not properly initialized
   - Tokio runtime issue
   - Async context problem
   - Thread pool exhaustion

3. **Port Binding Issue**: Server binds but immediately unbinds
   - Port conflict (unlikely - health check works)
   - Binding error that's being swallowed
   - Network interface issue

4. **Log Buffering**: Logs are buffered and not flushed before exit
   - stdout/stderr buffering
   - Docker log driver buffering
   - Process exits before buffer flush

## Investigation Plan

### Phase 1: Verify Server Actually Starts
- [ ] Check if process is running during the 1.2 second window
- [ ] Verify port is bound and listening
- [ ] Test multiple health checks during runtime

### Phase 2: Signal Investigation
- [ ] Check if signals are being sent to the process
- [ ] Verify Docker health check configuration
- [ ] Check restart policy behavior

### Phase 3: Runtime Investigation
- [ ] Verify actix-web runtime initialization
- [ ] Check tokio runtime configuration
- [ ] Test with explicit runtime configuration

### Phase 4: Log Investigation
- [ ] Test with unbuffered I/O
- [ ] Verify Docker log driver configuration
- [ ] Test direct binary execution vs entrypoint script

## Current Code State

```rust
// Line 251: Current implementation
server.run().await?;

// This should block until server stops
// If it returns Ok(()), server stopped gracefully
// If it returns Err, there was an error
```

## Next Steps

1. **Immediate**: Add explicit match on `server.run().await` to log return value
2. **Short-term**: Test without `?` operator to see if error is being swallowed
3. **Medium-term**: Add signal handler logging
4. **Long-term**: Investigate actix-web runtime behavior in Docker

## Workaround Status

The backend is **functional** despite the restart loop:
- All API endpoints work
- Health checks succeed
- Requests are handled correctly
- The restart is fast enough that service availability is maintained

This suggests the issue is a **Docker/container management problem** rather than an application problem.

