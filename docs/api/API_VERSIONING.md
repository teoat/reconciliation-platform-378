# API Versioning Documentation

**Last Updated**: January 2025  
**Status**: Active

## Overview

The Reconciliation Platform uses semantic versioning (SemVer) for API endpoints to ensure backward compatibility and smooth migrations. The API versioning system supports multiple versions simultaneously and provides migration guides for breaking changes.

## Versioning Strategy

### Version Format

API versions follow [Semantic Versioning](https://semver.org/) format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes that require client updates
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes that are backward compatible

### Current Versions

| Version | Status | Release Date | Deprecation Date | Sunset Date |
|---------|--------|--------------|------------------|-------------|
| 2.0.0 | Stable | 2025-01-15 | - | - |
| 1.1.0 | Stable | 2024-12-01 | - | - |
| 1.0.0 | Deprecated | 2024-06-01 | 2025-06-01 | 2026-01-01 |

### Version Status

- **Development**: In active development, may change
- **Beta**: Feature-complete, testing phase
- **Stable**: Production-ready, fully supported
- **Deprecated**: Still supported but will be removed in future
- **Sunset**: No longer supported, will be removed

## Using API Versions

### Specifying Version in Requests

#### Header-Based (Recommended)

```http
GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/json
X-API-Version: 2.0.0
```

#### URL-Based

```http
GET /api/v2/users HTTP/1.1
Host: api.example.com
Accept: application/json
```

#### Query Parameter

```http
GET /api/users?version=2.0.0 HTTP/1.1
Host: api.example.com
Accept: application/json
```

### Default Version

If no version is specified, the API defaults to the latest stable version (currently `2.0.0`).

### Version Resolution Priority

1. `X-API-Version` header (highest priority)
2. URL path (`/api/v2/...`)
3. Query parameter (`?version=2.0.0`)
4. Default version (latest stable)

## Endpoint Version Support

### Users API

| Endpoint | Method | Versions | Default | Deprecated |
|----------|--------|----------|---------|------------|
| `/api/users` | GET | 1.0.0, 1.1.0, 2.0.0 | 2.0.0 | 1.0.0 |
| `/api/users` | POST | 1.1.0, 2.0.0 | 2.0.0 | - |
| `/api/users/{id}` | GET | 1.1.0, 2.0.0 | 2.0.0 | - |
| `/api/users/{id}` | PUT | 2.0.0 | 2.0.0 | - |
| `/api/users/{id}` | DELETE | 2.0.0 | 2.0.0 | - |

### Projects API

| Endpoint | Method | Versions | Default | Deprecated |
|----------|--------|----------|---------|------------|
| `/api/projects` | GET | 1.0.0, 1.1.0, 2.0.0 | 2.0.0 | - |
| `/api/projects` | POST | 1.1.0, 2.0.0 | 2.0.0 | - |
| `/api/projects/{id}` | GET | 2.0.0 | 2.0.0 | - |

### Reconciliation API

| Endpoint | Method | Versions | Default | Deprecated |
|----------|--------|----------|---------|------------|
| `/api/reconciliation` | POST | 1.1.0, 2.0.0 | 2.0.0 | - |
| `/api/reconciliation/{id}` | GET | 2.0.0 | 2.0.0 | - |

## Breaking Changes

### Version 2.0.0 Breaking Changes

#### Users API

**Changed**: User response structure
- **Before (v1.0.0)**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
  ```
- **After (v2.0.0)**:
  ```json
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
  ```

**Migration Steps**:
1. Update client code to use UUID instead of integer IDs
2. Update field names: `name` → `first_name` + `last_name`
3. Handle new timestamp fields

#### Projects API

**Changed**: Project filtering parameters
- **Before (v1.0.0)**: `?status=active`
- **After (v2.0.0)**: `?filter[status]=active`

**Migration Steps**:
1. Update query parameter format
2. Test filtering functionality

## Migration Guides

### Migrating from v1.0.0 to v2.0.0

#### Step 1: Update API Client

```typescript
// Before
const client = new ApiClient({
  baseURL: 'https://api.example.com',
});

// After
const client = new ApiClient({
  baseURL: 'https://api.example.com',
  apiVersion: '2.0.0', // Specify version
});
```

#### Step 2: Update Data Models

```typescript
// Before (v1.0.0)
interface User {
  id: number;
  email: string;
  name: string;
}

// After (v2.0.0)
interface User {
  id: string; // UUID
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}
```

#### Step 3: Update API Calls

```typescript
// Before
const user = await api.get(`/users/${userId}`);

// After
const user = await api.get(`/users/${userId}`, {
  headers: { 'X-API-Version': '2.0.0' }
});
```

#### Step 4: Test Thoroughly

1. Test all API endpoints
2. Verify data transformations
3. Check error handling
4. Validate authentication flows

#### Step 5: Deploy

1. Deploy updated client code
2. Monitor for errors
3. Rollback plan ready if needed

### Rollback Plan

If migration fails:

1. **Immediate**: Revert to v1.0.0 by setting `X-API-Version: 1.0.0`
2. **Client Update**: Revert client code to previous version
3. **Data**: No data migration needed (backward compatible storage)

## Version Compatibility

### Client Compatibility Matrix

| Client Version | API v1.0.0 | API v1.1.0 | API v2.0.0 |
|----------------|------------|------------|------------|
| Client v1.0.0 | ✅ Compatible | ⚠️ Partial | ❌ Incompatible |
| Client v1.1.0 | ✅ Compatible | ✅ Compatible | ⚠️ Partial |
| Client v2.0.0 | ⚠️ Partial | ✅ Compatible | ✅ Compatible |

### Compatibility Checking

The API provides a compatibility check endpoint:

```http
GET /api/version/compatibility?client_version=1.0.0&api_version=2.0.0
```

Response:
```json
{
  "is_compatible": false,
  "compatibility_level": "incompatible",
  "issues": [
    "User ID format changed from integer to UUID",
    "User name field split into first_name and last_name"
  ],
  "migration_required": true,
  "recommended_action": "Upgrade client to v2.0.0"
}
```

## Deprecation Policy

### Deprecation Timeline

1. **Announcement**: 6 months before deprecation
2. **Deprecation Date**: Version marked as deprecated
3. **Support Period**: 6 months of support after deprecation
4. **Sunset Date**: Version removed, no longer accessible

### Deprecation Notices

Deprecated versions return a warning header:

```http
HTTP/1.1 200 OK
X-API-Version: 1.0.0
X-API-Deprecated: true
X-API-Deprecation-Date: 2025-06-01
X-API-Sunset-Date: 2026-01-01
Warning: 299 - "API version 1.0.0 is deprecated. Please migrate to 2.0.0"
```

## Best Practices

### For API Consumers

1. **Always specify version**: Use `X-API-Version` header
2. **Monitor deprecation warnings**: Check response headers
3. **Plan migrations early**: Start migration before deprecation
4. **Test thoroughly**: Test all endpoints after version upgrade
5. **Use latest stable**: Default to latest stable version

### For API Developers

1. **Maintain backward compatibility**: Avoid breaking changes in minor versions
2. **Document breaking changes**: Clearly document all breaking changes
3. **Provide migration guides**: Step-by-step migration instructions
4. **Support multiple versions**: Maintain at least 2 stable versions
5. **Deprecate gracefully**: Give 6+ months notice before removal

## Version Information Endpoint

### Get Version Information

```http
GET /api/version
```

Response:
```json
{
  "current_version": "2.0.0",
  "latest_stable": "2.0.0",
  "supported_versions": ["1.0.0", "1.1.0", "2.0.0"],
  "deprecated_versions": ["1.0.0"],
  "versions": [
    {
      "version": "2.0.0",
      "status": "stable",
      "release_date": "2025-01-15T00:00:00Z",
      "deprecation_date": null,
      "sunset_date": null
    },
    {
      "version": "1.0.0",
      "status": "deprecated",
      "release_date": "2024-06-01T00:00:00Z",
      "deprecation_date": "2025-06-01T00:00:00Z",
      "sunset_date": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Get Endpoint Versions

```http
GET /api/version/endpoints?method=GET&path=/api/users
```

Response:
```json
{
  "endpoint": "/api/users",
  "method": "GET",
  "versions": ["1.0.0", "1.1.0", "2.0.0"],
  "default_version": "2.0.0",
  "deprecated_versions": ["1.0.0"]
}
```

## Migration Strategies

The API versioning service provides migration strategies for common scenarios:

### Automatic Migration

Some changes can be automatically migrated by the API:

```http
POST /api/version/migrate
Content-Type: application/json

{
  "from_version": "1.0.0",
  "to_version": "2.0.0",
  "data": { ... }
}
```

### Manual Migration

For complex changes, follow the migration guide:

1. Review breaking changes
2. Update client code
3. Test in staging
4. Deploy to production
5. Monitor for issues

## Support

### Getting Help

- **Documentation**: See [API Documentation](./API_DOCUMENTATION.md)
- **Migration Issues**: Contact support with version information
- **Feature Requests**: Submit via GitHub Issues

### Version Support Timeline

- **Current Stable**: Full support, bug fixes, security patches
- **Previous Stable**: Security patches only
- **Deprecated**: Security patches only, no new features
- **Sunset**: No support

---

**Last Updated**: January 2025  
**Next Review**: After next major version release
