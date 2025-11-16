# Error Handling Standardization Guide

**Date**: 2025-01-XX  
**Status**: ✅ Documentation Complete  
**Task**: ERROR-002 - Standardize error handling

## Overview

This guide documents the standardized error handling patterns for the backend codebase. All error handling should follow these patterns instead of using `unwrap()` or `expect()`.

## Error Handling Utilities

**Location**: `backend/src/utils/error_handling.rs`

### Core Types

```rust
use crate::utils::error_handling::{AppError, AppResult};

// AppError enum with specific error types
pub enum AppError {
    Database(String),
    Validation(String),
    Authentication(String),
    Authorization(String),
    NotFound(String),
    Internal(String),
    Network(String),
    Timeout(String),
    Configuration(String),
}

// Result type alias
pub type AppResult<T> = Result<T, AppError>;
```

### Helper Traits

#### OptionExt - Convert Option to AppResult

```rust
use crate::utils::error_handling::OptionExt;

// Instead of:
let value = option.unwrap();

// Use:
let value = option.ok_or_not_found("Resource not found")?;
// or
let value = option.ok_or_internal("Internal error")?;
```

#### ResultExt - Convert Result to AppResult

```rust
use crate::utils::error_handling::ResultExt;

// Instead of:
let value = result.unwrap();

// Use:
let value = result.map_to_app_error()?;
// or
let value = result.map_to_database_error()?;
// or
let value = result.map_to_validation_error()?;
```

### Helper Macros

#### safe_unwrap! - Safe unwrap with context

```rust
use crate::safe_unwrap;

// Instead of:
let value = result.unwrap();

// Use:
let value = safe_unwrap!(result, "Operation failed");
```

#### db_result! - Database operations

```rust
use crate::db_result;

// Instead of:
let value = db_query.execute().unwrap();

// Use:
let value = db_result!(db_query.execute())?;
```

#### validate! - Validation checks

```rust
use crate::validate;

// Instead of:
if !condition {
    panic!("Invalid condition");
}

// Use:
validate!(condition, "Invalid condition message");
```

## Error Conversion

Standard `From` implementations are available:

```rust
// Diesel errors
let result: AppResult<T> = diesel_query.load().map_err(|e| AppError::from(e));

// JSON errors
let result: AppResult<T> = serde_json::from_str(json).map_err(|e| AppError::from(e));

// IO errors
let result: AppResult<T> = std::fs::read_to_string(path).map_err(|e| AppError::from(e));

// Redis errors
let result: AppResult<T> = redis_conn.get(key).map_err(|e| AppError::from(e));
```

## Migration Patterns

### Pattern 1: Database Operations

**Before**:
```rust
let user = users::table
    .filter(users::id.eq(user_id))
    .first::<User>(&conn)
    .expect("User not found");
```

**After**:
```rust
use crate::db_result;

let user = db_result!(users::table
    .filter(users::id.eq(user_id))
    .first::<User>(&conn)
    .map_err(|e| AppError::Database(format!("Failed to find user: {}", e))))?
    .ok_or_not_found(format!("User with id {} not found", user_id))?;
```

### Pattern 2: Option Unwrapping

**Before**:
```rust
let value = option.unwrap();
```

**After**:
```rust
let value = option.ok_or_not_found("Resource not found")?;
// or for internal errors
let value = option.ok_or_internal("Internal error")?;
```

### Pattern 3: Result Unwrapping

**Before**:
```rust
let value = result.unwrap();
```

**After**:
```rust
let value = result.map_to_app_error()?;
// or more specific
let value = result.map_to_database_error()?;
```

### Pattern 4: Validation

**Before**:
```rust
if !is_valid {
    panic!("Invalid input");
}
```

**After**:
```rust
use crate::validate;

validate!(is_valid, "Input validation failed");
```

## Error Handling in Handlers

All handlers should return `AppResult<T>` and use `?` operator for error propagation:

```rust
pub async fn get_user(
    db: web::Data<Database>,
    user_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let user = db_result!(db.get_user(user_id.into_inner()))?;
    
    Ok(HttpResponse::Ok().json(user))
}
```

## Testing with Error Handling

```rust
#[tokio::test]
async fn test_user_not_found() {
    let result = get_user(db, user_id).await;
    
    assert!(result.is_err());
    match result.unwrap_err() {
        AppError::NotFound(_) => {}, // Expected
        _ => panic!("Wrong error type"),
    }
}
```

## Priority Areas for Migration

1. **Critical Paths** (P0):
   - Authentication handlers
   - Payment processing
   - Data persistence operations

2. **High Priority** (P1):
   - API handlers
   - Database operations
   - File operations

3. **Medium Priority** (P2):
   - Utility functions
   - Helper functions
   - Service layer

4. **Low Priority** (P3):
   - Test code (unwrap acceptable in tests)
   - Development utilities

## Tools for Migration

1. **Search**: Find all `unwrap()` and `expect()` usages
2. **Analyze**: Determine appropriate error type
3. **Replace**: Use appropriate helper or macro
4. **Test**: Ensure error handling works correctly

## Checklist

- [ ] Replace unwrap/expect in authentication handlers
- [ ] Replace unwrap/expect in database operations
- [ ] Replace unwrap/expect in file operations
- [ ] Replace unwrap/expect in API handlers
- [ ] Document error handling patterns
- [ ] Create error handling examples
- [ ] Update code review guidelines

## Conclusion

Standardized error handling utilities are available in `backend/src/utils/error_handling.rs`. Use these utilities to replace all `unwrap()` and `expect()` calls in production code. Error handling follows the Rust `Result` pattern with proper error propagation using the `?` operator.

