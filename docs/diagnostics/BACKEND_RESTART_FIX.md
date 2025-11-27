# Backend Restart Issue - Diagnosis and Fix

**Date**: 2025-11-26  
**Status**: Fixed

## Problem

The backend container was in a continuous restart loop. The binary would start but exit immediately without producing any error output, causing Docker to restart it repeatedly.

## Root Cause

1. **Database Readiness**: The backend was configured to depend on PostgreSQL with `condition: service_started`, which only waits for the container to start, not for PostgreSQL to be ready to accept connections.

2. **Immediate Connection Failure**: The startup validation tried to connect to the database immediately. If PostgreSQL wasn't ready, the connection failed and the process exited with code 1.

3. **Silent Exit**: The binary exited before logging could be initialized, making it difficult to diagnose the issue.

4. **Restart Loop**: Docker's `restart: unless-stopped` policy kept restarting the container, creating an infinite loop.

## Solution

### 1. Docker Compose Changes

Changed the backend's dependency on PostgreSQL from `service_started` to `service_healthy`:

```yaml
depends_on:
  postgres:
    condition: service_healthy  # Changed from service_started
  redis:
    condition: service_healthy
```

This ensures Docker waits for PostgreSQL's health check to pass before starting the backend.

### 2. Entrypoint Script Improvements

Enhanced the entrypoint script (`infrastructure/docker/entrypoint.sh`) to:

- **Wait for Database**: Added a readiness check using `netcat` to verify the database port is open before starting the binary
- **Better Error Messages**: Improved error output to help diagnose issues
- **Unbuffered Output**: Ensured all output is immediately visible in Docker logs
- **Install Dependencies**: Automatically install `netcat-openbsd` if not available

### 3. Database Connection Retry Logic

Improved the startup error handler (`backend/src/startup/error_handler.rs`) to:

- **Retry with Exponential Backoff**: Retry database connections up to 10 times with exponential backoff (2s, 4s, 8s, max 10s)
- **Better Logging**: Log each retry attempt with clear messages
- **Graceful Failure**: Only exit after all retries are exhausted

### 4. Dockerfile Updates

Added `netcat-openbsd` to the runtime dependencies in `infrastructure/docker/Dockerfile.backend` to support the database readiness check.

## Testing

After applying the fix:

1. **Rebuild the backend image**:
   ```bash
   docker-compose build backend
   ```

2. **Restart the backend**:
   ```bash
   docker-compose restart backend
   ```

3. **Monitor logs**:
   ```bash
   docker-compose logs -f backend
   ```

4. **Verify health**:
   ```bash
   curl http://localhost:2000/api/health
   ```

## Expected Behavior

- Backend waits for PostgreSQL to be healthy before starting
- Entrypoint script verifies database port is open
- Startup validation retries database connection with exponential backoff
- Clear error messages if database connection fails
- Backend stays running once database is available

## Prevention

To prevent similar issues in the future:

1. Always use `service_healthy` instead of `service_started` for database dependencies
2. Implement retry logic with exponential backoff for critical connections
3. Add readiness checks in entrypoint scripts for external dependencies
4. Ensure all error output is visible and unbuffered
5. Test startup behavior with slow-starting dependencies

## Related Files

- `docker-compose.yml` - Docker Compose configuration
- `infrastructure/docker/entrypoint.sh` - Backend entrypoint script
- `infrastructure/docker/Dockerfile.backend` - Backend Dockerfile
- `backend/src/startup/error_handler.rs` - Startup error handling with retries
- `backend/src/main.rs` - Main application entry point

