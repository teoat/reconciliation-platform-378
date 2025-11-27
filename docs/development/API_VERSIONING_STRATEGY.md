# API Versioning Strategy

**Last Updated**: 2025-11-26  
**Status**: ✅ Active  
**Version**: 1.0.0

---

## Overview

This document defines the API versioning strategy for the Reconciliation Platform backend API. The strategy ensures backward compatibility while allowing for breaking changes when necessary.

---

## Versioning Approach

### URL-Based Versioning

All API endpoints use URL-based versioning with the `/api/v{version}/` prefix:

- **Current Version**: `v1` (default)
- **Future Versions**: `v2`, `v3`, etc.

### Version Format

```
/api/v1/{resource}/{action}
```

**Examples**:
- `/api/v1/auth/login`
- `/api/v1/projects`
- `/api/v1/users/{user_id}`
- `/api/v1/reconciliation/jobs`

---

## Implementation Status

### ✅ Phase 1: Foundation (Completed)

1. **OpenAPI Documentation**
   - All utoipa annotations use `/api/v1/` paths
   - OpenAPI schema version: `2.0.0`
   - Swagger UI available at `/swagger-ui/`

2. **Handler Annotations**
   - Authentication endpoints: ✅ Annotated with `/api/v1/`
   - Project endpoints: ✅ Annotated with `/api/v1/`
   - Logging endpoints: ✅ Annotated with `/api/` (to be migrated)

### 🔄 Phase 2: Migration (In Progress)

1. **Route Configuration**
   - Current routes use `/api/{resource}` (no version)
   - Migration plan: Add version-aware routing
   - Backward compatibility: Support both `/api/` and `/api/v1/` during transition

2. **Handler Updates**
   - Update all handler route configurations
   - Ensure utoipa paths match actual routes
   - Add version parameter to route configuration

---

## Migration Plan

### Step 1: Add Version-Aware Routing

```rust
// In handlers/mod.rs
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    // Version 1 routes (current)
    cfg.service(
        web::scope("/api/v1")
            .service(web::scope("/auth").configure(auth::configure_routes))
            .service(web::scope("/users").configure(users::configure_routes))
            // ... other routes
    );
    
    // Legacy routes (backward compatibility)
    cfg.service(
        web::scope("/api")
            .service(web::scope("/auth").configure(auth::configure_routes))
            // ... other routes
    );
}
```

### Step 2: Update Handler Annotations

All utoipa annotations should use `/api/v1/` paths:

```rust
#[utoipa::path(
    post,
    path = "/api/v1/auth/login",  // Versioned path
    // ...
)]
```

### Step 3: Deprecation Notice

Add deprecation headers to legacy routes:

```rust
// In middleware or handler
response.headers_mut().insert(
    HeaderName::from_static("deprecation"),
    HeaderValue::from_static("true")
);
response.headers_mut().insert(
    HeaderName::from_static("sunset"),
    HeaderValue::from_static("2026-01-01")  // Sunset date
);
```

---

## Version Lifecycle

### Version Support Policy

- **Current Version**: Fully supported, actively developed
- **Previous Version**: Supported for 12 months after new version release
- **Deprecated Version**: Supported for 6 months with deprecation warnings
- **Sunset Version**: No longer supported, returns 410 Gone

### Breaking Changes

Breaking changes require a new major version:

- **v1 → v2**: Breaking changes allowed
- **v2 → v3**: Breaking changes allowed
- **v1.0 → v1.1**: Non-breaking changes only (additive)

### Non-Breaking Changes (Same Version)

- Adding new endpoints
- Adding optional request/response fields
- Adding new query parameters
- Improving error messages
- Performance optimizations

---

## Version Headers

### Request Headers

Clients can specify API version preference:

```
Accept: application/vnd.reconciliation.v1+json
API-Version: 1
```

### Response Headers

Server includes version information:

```
API-Version: 1
Deprecation: true (if deprecated)
Sunset: 2026-01-01 (if scheduled for sunset)
```

---

## Documentation

### OpenAPI/Swagger

- Each version has its own OpenAPI schema
- Swagger UI shows current version by default
- Version selector available in Swagger UI

### Changelog

Maintain version changelog in:
- `docs/api/CHANGELOG.md`
- OpenAPI schema `info.version`
- Release notes

---

## Implementation Checklist

### Phase 2 Tasks (Agent 2)

- [x] Document versioning strategy
- [ ] Add version-aware routing
- [ ] Update all handler annotations to use `/api/v1/`
- [ ] Add deprecation headers to legacy routes
- [ ] Update OpenAPI schema with version info
- [ ] Add version headers to responses
- [ ] Create migration guide for clients
- [ ] Update API documentation

### Future Enhancements

- [ ] Version negotiation middleware
- [ ] Automatic version detection
- [ ] Version-specific feature flags
- [ ] Version migration tooling

---

## Related Documentation

- [API Reference](../api/API_REFERENCE.md)
- [OpenAPI Schema](../../backend/openapi.yaml)
- [RESTful API Conventions](../../.cursor/rules/api-conventions.mdc)

---

**Next Steps**: Implement version-aware routing and update all handlers to use `/api/v1/` paths.

