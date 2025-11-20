# Backend Restart Loop Diagnosis

**Date**: November 19, 2025  
**Status**: 🔍 Investigating

## Summary

The backend container is in a restart loop, but the API is functional and responding to health checks. This is a contradictory state that requires investigation.

## Current State

- ✅ **Health Endpoint**: Responding successfully at http://localhost:2000/api/health
- ⚠️ **Container Status**: Restarting (exit code 0)
- ⚠️ **Logs**: No Rust application logs visible (only entrypoint script output)
- ✅ **Dependencies**: PostgreSQL and Redis are healthy

## Issues Fixed

1. ✅ **Missing JWT_REFRESH_SECRET**: Added to docker-compose.backend.yml
2. ✅ **Health Check Path**: Updated Dockerfile to use `/api/health`

## Current Issue: Silent Exit

### Symptoms
- Binary executes (entrypoint script confirms)
- No Rust application logs appear (no "🚀 Backend starting..." message)
- Container exits with code 0 (success, not error)
- Health endpoint responds (suggests server starts briefly)
- Docker restarts container due to restart policy

### Possible Causes

1. **HttpServer Exiting Prematurely**
   - `HttpServer::run().await` might be completing immediately
   - Could be an async runtime issue
   - Signal handling might cause early shutdown

2. **Log Buffering**
   - Logs might be buffered and not flushed before exit
   - Output redirection might be losing logs

3. **Binary Build Issue**
   - Binary might be from an older build without recent logging
   - Stripping might have removed debug symbols/logging

4. **Environment Issue**
   - Some environment variable might cause early exit
   - Database/Redis connection might fail silently

## Investigation Steps Taken

1. ✅ Verified binary exists and is executable
2. ✅ Checked all required environment variables are set
3. ✅ Confirmed dependencies (libpq, etc.) are present
4. ✅ Tested health endpoint (functional)
5. ✅ Checked container exit code (0 = success, not crash)
6. ⏳ Need to investigate why HttpServer exits

## Next Steps

1. **Add explicit logging flush** before server start
2. **Check for signal handlers** that might cause shutdown
3. **Test binary locally** outside Docker to isolate issue
4. **Add startup delay** to see if server stays up longer
5. **Check actix-web runtime** configuration
6. **Monitor with strace** to see system calls

## Workaround

The backend is currently functional despite the restart loop:
- Health checks succeed
- API endpoints respond
- The restart happens so quickly that requests are still handled

This suggests the server starts, handles requests, then exits gracefully for some reason.

## Recommendations

1. **Immediate**: Monitor if this affects production (seems functional now)
2. **Short-term**: Add more verbose logging to catch exit reason
3. **Long-term**: Investigate why HttpServer::run().await completes

