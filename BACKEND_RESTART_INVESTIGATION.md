# Backend Restart Investigation

**Date**: November 19, 2025  
**Status**: 🔍 Investigating

## Problem Summary

The backend container is in a continuous restart loop:
- **Exit Code**: 0 (success, not crash)
- **Runtime**: ~1.2 seconds before exit
- **Status**: Container shows "Restarting" but API is functional
- **Health Endpoint**: Responds correctly (`healthy`)

## Key Observations

1. **Container Lifecycle**:
   - Starts: `2025-11-19T13:33:44.60435085Z`
   - Finishes: `2025-11-19T13:33:45.790478275Z`
   - Duration: ~1.2 seconds
   - Exit Code: 0 (successful completion)

2. **Log Visibility**:
   - Entrypoint script logs appear: `🚀 Starting backend...`, `✅ Binary found...`
   - **No Rust application logs visible** (no `🚀 Backend starting...` from main.rs)
   - Binary executes but produces no output

3. **Functional Status**:
   - Health endpoint responds: `http://localhost:2000/api/health` → `healthy`
   - API is operational during the brief runtime
   - Server starts, handles requests, then exits

## Hypothesis

The server is starting successfully but `server.run().await?` is completing immediately instead of blocking. Possible causes:

1. **Signal Handler Issue**: Server receives shutdown signal immediately
2. **Runtime Issue**: Actix-web runtime not properly initialized
3. **Error Propagation**: `?` operator unwrapping an error that's actually success
4. **Log Buffering**: Logs are buffered and not flushed before exit
5. **Process Replacement**: `exec` in entrypoint might be causing issues

## Code Analysis

### Current Implementation
```rust
server.run().await?;
```

This should block until server stops. If it returns immediately with `Ok(())`, the server is stopping gracefully.

### Comparison with Working Examples
- `main_simple.rs`: Uses `server.run().await` (no `?`)
- `startup_example.rs`: Uses `server.run().await` (no `?`)
- Current code: Uses `server.run().await?` (with `?`)

## Investigation Steps

1. ✅ Checked container exit codes and timing
2. ✅ Verified health endpoint functionality
3. ✅ Checked log visibility
4. ⏳ Need to test without `?` operator
5. ⏳ Need to check if signals are being sent
6. ⏳ Need to verify actix-web runtime initialization

## Next Actions

1. Test `server.run().await` without `?` operator
2. Add signal handler logging
3. Check Docker signal handling
4. Verify actix-web runtime configuration

