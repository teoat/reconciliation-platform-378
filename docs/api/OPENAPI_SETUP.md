# OpenAPI/Swagger Documentation Setup

**Last Updated**: January 2025  
**Status**: Active

## Overview

The Reconciliation Platform backend uses [utoipa](https://github.com/juhaku/utoipa) for OpenAPI/Swagger documentation. This provides automatic API documentation generation from Rust code annotations.

## Current Status

### ✅ Completed
- OpenAPI YAML specification file (`backend/openapi.yaml`)
- utoipa dependencies in `Cargo.toml`
- Partial utoipa annotations in `auth.rs` and `projects.rs`

### 🟡 In Progress
- Full utoipa integration in `main.rs`
- Complete annotations for all handlers
- Swagger UI endpoint setup

## Integration Steps

### 1. Define OpenAPI Schema

Create an OpenAPI module that defines the API structure:

```rust
// backend/src/api/openapi.rs
use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::auth::login,
        handlers::auth::register,
        handlers::projects::create_project,
        // ... all other endpoints
    ),
    components(schemas(
        handlers::types::ApiResponse,
        handlers::types::ErrorResponse,
        // ... all request/response types
    )),
    tags(
        (name = "Authentication", description = "User authentication endpoints"),
        (name = "Projects", description = "Project management endpoints"),
        // ... other tags
    ),
    info(
        title = "Reconciliation Platform API",
        version = "2.0.0",
        description = "Enterprise-grade reconciliation platform API"
    ),
    servers(
        (url = "http://localhost:2000/api", description = "Local development"),
        (url = "https://api.reconciliation.platform/api", description = "Production")
    )
)]
pub struct ApiDoc;
```

### 2. Add Swagger UI to main.rs

```rust
// In backend/src/main.rs
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

// Add to App::new()
.service(
    SwaggerUi::new("/swagger-ui/{_:.*}")
        .url("/api-docs/openapi.json", ApiDoc::openapi())
)
```

### 3. Annotate All Handlers

Add `#[utoipa::path(...)]` annotations to all handler functions:

```rust
#[utoipa::path(
    post,
    path = "/api/auth/login",
    tag = "Authentication",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = AuthResponse),
        (status = 401, description = "Invalid credentials", body = ErrorResponse)
    )
)]
pub async fn login(...) -> Result<HttpResponse, AppError> {
    // ...
}
```

## Accessing Documentation

Once integrated:
- **Swagger UI**: `http://localhost:2000/swagger-ui/`
- **OpenAPI JSON**: `http://localhost:2000/api-docs/openapi.json`
- **OpenAPI YAML**: `backend/openapi.yaml` (manual specification)

## Benefits

1. **Automatic Documentation**: Documentation generated from code
2. **Type Safety**: Request/response types validated at compile time
3. **Interactive Testing**: Swagger UI allows testing endpoints directly
4. **Client Generation**: Generate client SDKs from OpenAPI spec
5. **API Versioning**: Support for multiple API versions

## Next Steps

1. Complete utoipa integration in `main.rs`
2. Add annotations to all handler functions
3. Define all request/response schemas
4. Test Swagger UI endpoint
5. Update API documentation guide

---

**Related Documentation**:
- [API Reference](./API_REFERENCE.md)
- [API Versioning](./API_VERSIONING.md)

