# Backend Health Check Guide

**Last Updated**: January 2025  
**Status**: ✅ Implementation Complete

## Overview

The backend health check system is fully implemented and provides comprehensive health monitoring endpoints.

## Health Check Endpoints

### 1. Basic Health Check
**Endpoint**: `GET /health` or `GET /api/health`

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-22T10:30:00Z",
    "version": "0.1.0"
  }
}
```

**Usage**:
```bash
curl http://localhost:2000/health
```

### 2. Dependencies Health Check
**Endpoint**: `GET /health/dependencies` or `GET /api/health/dependencies`

**Response**:
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "message": null
    },
    "cache": {
      "status": "healthy",
      "message": null
    }
  }
}
```

**Usage**:
```bash
curl http://localhost:2000/health/dependencies
```

### 3. Resilience Status
**Endpoint**: `GET /health/resilience` or `GET /api/health/resilience`

**Response**: Circuit breaker statistics for database, cache, and API services.

**Usage**:
```bash
curl http://localhost:2000/health/resilience
```

### 4. Metrics Endpoint
**Endpoint**: `GET /health/metrics` or `GET /api/health/metrics`

**Response**: Prometheus-formatted metrics.

**Usage**:
```bash
curl http://localhost:2000/health/metrics
```

## Verification Script

Use the provided script to verify backend health:

```bash
./scripts/verify-backend-health.sh
```

Or with custom backend URL:
```bash
BACKEND_URL=http://localhost:2000 ./scripts/verify-backend-health.sh
```

## Troubleshooting

### Backend Not Reachable

**Symptoms**: Health check returns connection error

**Solutions**:
1. **Check if backend is running:**
   ```bash
   cd backend && cargo run
   ```

2. **Check if port 2000 is in use:**
   ```bash
   lsof -i :2000
   ```

3. **Check backend logs** for startup errors

4. **Verify DATABASE_URL** is set correctly

### Health Check Returns Unhealthy

**Symptoms**: `/health/dependencies` shows unhealthy status

**Solutions**:
1. **Database Issues:**
   - Verify database is running: `pg_isready`
   - Check DATABASE_URL connection string
   - Verify database permissions

2. **Cache Issues:**
   - Verify Redis is running (if using Redis cache)
   - Check cache connection configuration

### Health Check Returns 404

**Symptoms**: Endpoint not found

**Solutions**:
1. Verify backend routes are registered in `backend/src/handlers/mod.rs`
2. Check backend is using latest code
3. Restart backend server

## Implementation Status

✅ **All health check endpoints implemented:**
- Basic health check (`/health`)
- Dependencies check (`/health/dependencies`)
- Resilience status (`/health/resilience`)
- Metrics endpoint (`/health/metrics`)

✅ **Error handling:** Proper error responses for unhealthy dependencies

✅ **Circuit breaker integration:** Health checks include circuit breaker statistics

## Code Location

- **Handlers**: `backend/src/handlers/health.rs`
- **Route Registration**: `backend/src/handlers/mod.rs`
- **Health Checkers**: `backend/src/services/monitoring/health.rs`

## Related Documentation

- [Database Migration Guide](DATABASE_MIGRATION_GUIDE.md)
- [Backend Deployment Guide](../deployment/BACKEND_DEPLOYMENT.md)
- [Playwright Fixes Required](PLAYWRIGHT_FIXES_REQUIRED.md)

## Status Summary

| Component | Status |
|-----------|--------|
| Basic Health Check | ✅ Complete |
| Dependencies Check | ✅ Complete |
| Resilience Status | ✅ Complete |
| Metrics Endpoint | ✅ Complete |
| Verification Script | ✅ Complete |
| Documentation | ✅ Complete |

**Note**: If health checks fail, it's typically an operational issue (backend not running, database not accessible) rather than a code issue. The health check implementation itself is complete and functional.


