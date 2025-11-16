# Backend Error Handling Migration Guide

**Date**: 2025-10-31  
**Purpose**: Replace unwrap/expect with proper error handling

## ✅ Created Utilities

### Error Handling Module
**File**: `backend/src/utils/error_handling.rs`

**Features**:
- `AppError` enum with standard error types
- `AppResult<T>` type alias
- Helper traits: `OptionExt`, `ResultExt`
- Helper macros: `safe_unwrap!`, `db_result!`, `validate!`
- Automatic conversions from common error types

## 🔄 Migration Pattern

### Before (Unsafe)
```rust
let value = option.unwrap(); // ❌ Will panic
let result = operation().expect("should work"); // ❌ Will panic
```

### After (Safe)
```rust
// Using OptionExt trait
let value = option.ok_or_not_found("Resource not found")?;

// Using ResultExt trait
let result = operation().map_to_app_error()?;

// Using macros
let value = safe_unwrap!(operation(), "Operation failed");
let db_result = db_result!(database_query())?;
```

## 📋 Migration Checklist

### Phase 1: Critical Paths
- [ ] Handler functions (actix handlers)
- [ ] Database operations
- [ ] Authentication flows
- [ ] API endpoints

### Phase 2: Services
- [ ] Service methods
- [ ] Business logic
- [ ] Data validation

### Phase 3: Utilities
- [ ] Utility functions
- [ ] Helper functions
- [ ] Test utilities

## 🎯 Usage Examples

### Example 1: Option Handling
```rust
// Before
let user = users.get(&id).unwrap();

// After
let user = users.get(&id)
    .ok_or_not_found(format!("User {} not found", id))?;
```

### Example 2: Result Handling
```rust
// Before
let data = parse_json(input).expect("Invalid JSON");

// After
let data = parse_json(input)
    .map_to_validation_error()?;
```

### Example 3: Database Operations
```rust
// Before
let rows = sqlx::query("SELECT * FROM users")
    .fetch_all(&pool)
    .await
    .unwrap();

// After
let rows = db_result!(
    sqlx::query("SELECT * FROM users")
        .fetch_all(&pool)
        .await
)?;
```

### Example 4: Validation
```rust
// Before
if !is_valid {
    panic!("Invalid input");
}

// After
validate!(is_valid, "Input validation failed");
```

## 🔧 Integration

1. Add to `backend/src/utils/mod.rs`:
```rust
pub mod error_handling;
pub use error_handling::{AppError, AppResult, OptionExt, ResultExt};
```

2. Update imports in files:
```rust
use crate::utils::error_handling::{AppResult, OptionExt, ResultExt};
```

3. Replace unwrap/expect systematically

## 📊 Progress Tracking

**Total unwrap/expect instances**: 406  
**Migrated**: 0  
**Remaining**: 406

**Target**: <20 instances (only in tests or truly safe contexts)

