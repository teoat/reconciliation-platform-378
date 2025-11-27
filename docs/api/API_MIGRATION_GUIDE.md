# API Migration Guide

**Last Updated**: 2025-11-26  
**Status**: Active  
**Version**: 1.0.0

---

## Overview

This guide helps clients migrate from legacy API endpoints (`/api/`) to versioned endpoints (`/api/v1/`). The legacy endpoints are deprecated and will be sunset on **January 1, 2026**.

---

## Migration Timeline

### Phase 1: Deprecation (Current)
- **Start Date**: 2025-11-26
- **Status**: Legacy endpoints return deprecation headers
- **Action Required**: Begin migration to `/api/v1/` endpoints

### Phase 2: Sunset Warning
- **Start Date**: 2025-12-01
- **Status**: Enhanced deprecation warnings
- **Action Required**: Complete migration before sunset date

### Phase 3: Sunset
- **Date**: 2026-01-01
- **Status**: Legacy endpoints return `410 Gone`
- **Action Required**: All clients must use `/api/v1/` endpoints

---

## Deprecation Headers

Legacy endpoints (`/api/*`) now return the following headers:

```
Deprecation: true
Sunset: 2026-01-01T00:00:00Z
Link: </api/v1/{resource}>; rel="alternate"; type="application/json"
API-Version: 1
```

### Header Descriptions

- **`Deprecation: true`**: Indicates the endpoint is deprecated
- **`Sunset: 2026-01-01T00:00:00Z`**: Date when endpoint will be removed
- **`Link`**: Points to the versioned alternative endpoint
- **`API-Version: 1`**: Current API version

---

## Migration Steps

### Step 1: Update Base URLs

**Before:**
```typescript
const API_BASE = 'http://localhost:2000/api';
```

**After:**
```typescript
const API_BASE = 'http://localhost:2000/api/v1';
```

### Step 2: Update Endpoint Paths

**Before:**
```typescript
// Legacy endpoint
GET /api/auth/login
GET /api/users
POST /api/projects
```

**After:**
```typescript
// Versioned endpoint
GET /api/v1/auth/login
GET /api/v1/users
POST /api/v1/projects
```

### Step 3: Update API Client Configuration

**Example: Axios**
```typescript
// Before
const api = axios.create({
  baseURL: 'http://localhost:2000/api',
});

// After
const api = axios.create({
  baseURL: 'http://localhost:2000/api/v1',
});
```

**Example: Fetch**
```typescript
// Before
fetch('http://localhost:2000/api/users')

// After
fetch('http://localhost:2000/api/v1/users')
```

### Step 4: Handle Deprecation Warnings

Monitor for deprecation headers and log warnings:

```typescript
axios.interceptors.response.use(
  (response) => {
    if (response.headers['deprecation'] === 'true') {
      console.warn(
        `Endpoint ${response.config.url} is deprecated. ` +
        `Sunset date: ${response.headers['sunset']}. ` +
        `Use: ${response.headers['link']}`
      );
    }
    return response;
  }
);
```

---

## Endpoint Mapping

### Authentication

| Legacy | Versioned | Status |
|--------|-----------|--------|
| `POST /api/auth/login` | `POST /api/v1/auth/login` | ✅ Available |
| `POST /api/auth/register` | `POST /api/v1/auth/register` | ✅ Available |
| `POST /api/auth/refresh` | `POST /api/v1/auth/refresh` | ✅ Available |

### Users

| Legacy | Versioned | Status |
|--------|-----------|--------|
| `GET /api/users` | `GET /api/v1/users` | ✅ Available |
| `POST /api/users` | `POST /api/v1/users` | ✅ Available |
| `GET /api/users/{id}` | `GET /api/v1/users/{id}` | ✅ Available |
| `PUT /api/users/{id}` | `PUT /api/v1/users/{id}` | ✅ Available |
| `DELETE /api/users/{id}` | `DELETE /api/v1/users/{id}` | ✅ Available |

### Projects

| Legacy | Versioned | Status |
|--------|-----------|--------|
| `GET /api/projects` | `GET /api/v1/projects` | ✅ Available |
| `POST /api/projects` | `POST /api/v1/projects` | ✅ Available |

### Reconciliation

| Legacy | Versioned | Status |
|--------|-----------|--------|
| `GET /api/reconciliation/jobs` | `GET /api/v1/reconciliation/jobs` | ✅ Available |
| `POST /api/reconciliation/jobs` | `POST /api/v1/reconciliation/jobs` | ✅ Available |
| `GET /api/reconciliation/jobs/{id}` | `GET /api/v1/reconciliation/jobs/{id}` | ✅ Available |

### Files

| Legacy | Versioned | Status |
|--------|-----------|--------|
| `GET /api/files/{id}` | `GET /api/v1/files/{id}` | ✅ Available |
| `DELETE /api/files/{id}` | `DELETE /api/v1/files/{id}` | ✅ Available |

### Health & Monitoring

| Legacy | Versioned | Status |
|--------|-----------|--------|
| `GET /api/health` | `GET /api/v1/health` | ✅ Available |
| `GET /api/monitoring/health` | `GET /api/v1/monitoring/health` | ✅ Available |
| `GET /api/metrics` | `GET /api/v1/metrics` | ✅ Available |

---

## Breaking Changes

### None in v1

The migration from `/api/` to `/api/v1/` is **non-breaking**. All request/response formats remain identical. Only the URL path changes.

### Future Versions

When v2 is released, breaking changes will be documented in:
- [API Changelog](./CHANGELOG.md)
- [API Versioning Strategy](../development/API_VERSIONING_STRATEGY.md)

---

## Testing Migration

### 1. Update Test Configuration

```typescript
// test-config.ts
export const API_BASE = process.env.API_BASE || 'http://localhost:2000/api/v1';
```

### 2. Run Integration Tests

```bash
npm test -- --grep "API"
```

### 3. Verify Deprecation Headers

```bash
curl -I http://localhost:2000/api/users
# Should return: Deprecation: true
```

### 4. Verify Versioned Endpoints

```bash
curl -I http://localhost:2000/api/v1/users
# Should return: API-Version: 1
# Should NOT return: Deprecation: true
```

---

## Client SDK Updates

### Generated Clients

If using generated API clients, regenerate with the new base URL:

```bash
openapi-generator generate \
  -i http://localhost:2000/api-docs/openapi.json \
  -g typescript-axios \
  -o ./generated-client \
  --additional-properties=basePath=/api/v1
```

### Manual Clients

Update base URL configuration:

```typescript
// Before
const client = new ApiClient({
  basePath: 'http://localhost:2000/api',
});

// After
const client = new ApiClient({
  basePath: 'http://localhost:2000/api/v1',
});
```

---

## Monitoring & Alerts

### Recommended Monitoring

1. **Deprecation Header Detection**
   - Alert when clients use deprecated endpoints
   - Track migration progress

2. **Sunset Date Reminder**
   - Alert 30 days before sunset
   - Alert 7 days before sunset

3. **Version Header Verification**
   - Ensure all responses include `API-Version` header
   - Verify version consistency

---

## Support

### Questions?

- **Documentation**: [API Reference](./API_REFERENCE.md)
- **Versioning Strategy**: [API Versioning Strategy](../development/API_VERSIONING_STRATEGY.md)
- **Issues**: Contact API support team

### Reporting Issues

If you encounter issues during migration:
1. Check this guide for common solutions
2. Review [API Changelog](./CHANGELOG.md)
3. Contact support with:
   - Endpoint URL
   - Request/response examples
   - Error messages

---

## Related Documentation

- [API Versioning Strategy](../development/API_VERSIONING_STRATEGY.md)
- [API Reference](./API_REFERENCE.md)
- [API Client SDK Generation](../development/API_CLIENT_SDK_GENERATION.md)
- [RESTful API Conventions](../../.cursor/rules/api-conventions.mdc)

---

**Migration Deadline**: January 1, 2026  
**Status**: ✅ Legacy endpoints deprecated, migration in progress

