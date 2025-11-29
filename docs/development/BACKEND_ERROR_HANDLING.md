# Backend Error Handling Patterns

**Last Updated**: 2025-01-15  
**Status**: Active

## Overview

This document describes the error handling patterns used in the Rust backend of the reconciliation platform.

## Error Types

### AppError Enum

The main error type is `AppError` defined in `backend/src/errors.rs`:

```rust
pub enum AppError {
    Database(diesel::result::Error),
    Connection(diesel::ConnectionError),
    Authentication(String),
    Authorization(String),
    Validation(String),
    File(String),
    Config(String),
    Redis(redis::RedisError),
    Jwt(jsonwebtoken::errors::Error),
    Io(std::io::Error),
    Serialization(serde_json::Error),
    Internal(String),
    InternalServerError(String),
    // ... more variants
}
```

### Error Handling Utilities

Located in `backend/src/utils/error_handling.rs`:

- `AppResult<T>`: Type alias for `Result<T, AppError>`
- Error conversion utilities
- Error translation support

## Patterns

### ✅ DO

1. **Use AppResult**: Always use `AppResult<T>` instead of `Result<T, E>`
2. **Provide Context**: Use `?` operator with `.map_err()` for context
3. **Translate Errors**: Use error translation service for user-friendly messages
4. **Log Errors**: Log errors with appropriate context before returning

### ❌ DON'T

1. **Use unwrap/expect**: Never use `unwrap()` or `expect()` in production code
2. **Expose Internal Errors**: Don't expose internal error details to users
3. **Silent Failures**: Always handle errors explicitly

## Error Translation

The backend includes an error translation service that converts error codes to user-friendly messages:

- Location: `backend/src/services/error_translation/`
- Maps error codes to localized messages
- Provides context-aware error messages

## Frontend-Backend Mapping

Frontend error handling in `frontend/src/services/errorTranslationService.ts` mirrors backend error codes:

- Authentication errors: `UNAUTHORIZED`, `INVALID_TOKEN`, etc.
- Validation errors: `VALIDATION_ERROR`, `EMAIL_INVALID`, etc.
- Network errors: `CONNECTION_ERROR`, `TIMEOUT`, etc.

## Related Documentation

- [Frontend Error Handling](./FRONTEND_ERROR_HANDLING.md)
- [API Error Responses](../api/ERROR_RESPONSES.md)

