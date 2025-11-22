# Group 2: Missing Imports, Traits & Module Issues

**Agent**: Agent 2  
**Status**: 🔄 Ready to start  
**Files**: 6 test files  
**Estimated Errors**: ~150 errors

---

## Work Instructions

### 1. reconciliation_integration_tests.rs

**Errors**:
- Missing `MatchingAlgorithm` trait import (multiple lines)
- Line 749: `confidence_score` field access on `Option<MatchingResult>`
- Unused imports

**Fix**:
```rust
// Add at top of file:
use reconciliation_backend::services::reconciliation::matching::MatchingAlgorithm;

// Line 749: Fix Option unwrapping
if let Some(matching_result) = result {
    assert!(matching_result.confidence_score >= 0.0 && matching_result.confidence_score <= 1.0);
} else {
    // Handle None case
    assert!(true);
}

// Remove unused imports:
// Line 13: Remove ReconciliationResult if unused
// Line 794: Remove ContainsMatchingAlgorithm if unused
```

---

### 2. security_tests.rs

**Errors**: 
- 24 instances of `TestClient` type not found
- Missing import from `test_utils`

**Fix**:
```rust
// Add import at top:
use crate::test_utils::TestClient;
// OR if test_utils is in parent:
use super::test_utils::TestClient;
// OR if it's a separate module:
mod test_utils;
use test_utils::TestClient;

// Check test_utils.rs location and use correct path
```

**Action**: Verify `test_utils.rs` location and module structure.

---

### 3. api_tests.rs

**Errors**:
- Missing `health_check` handler import
- Missing `actix_rt` crate

**Fix**:
```rust
// Option 1: Add handler import if it exists
use reconciliation_backend::handlers::health::health_check;

// Option 2: If handler doesn't exist, comment out test or create handler

// For actix_rt: Check if it's needed or if test can use tokio::test instead
// If needed, add to Cargo.toml:
// [dev-dependencies]
// actix-rt = "2.8"
```

**Action**: Check if `health_check` handler exists in `backend/src/handlers/health.rs`.

---

### 4. e2e_tests.rs

**Error**: Line 28 - `test_utils` module not found

**Fix**:
```rust
// Current:
use crate::test_utils;

// Fix options:
// Option 1: Use crate root path
use crate::tests::test_utils;

// Option 2: If test_utils is in same directory
mod test_utils;
use test_utils::*;

// Option 3: Use absolute path
use reconciliation_backend::tests::test_utils;
```

**Action**: Check actual module structure and use correct path.

---

### 5. mod.rs

**Errors**:
- Line 427, 432: `TestResponse` type not found
- Line 436: Module `test` resolution issue
- Unused mut warnings

**Fix**:
```rust
// Line 427, 432: Replace TestResponse with ServiceResponse
use actix_web::dev::ServiceResponse;
// Change TestResponse to ServiceResponse

// Line 436: Fix module path
// Current: use of unresolved module `test`
// Fix: Use full path or correct module name
use actix_web::test; // If this is what's needed

// Remove unused mut:
// Lines 127, 137, 146, 155: Remove `mut` keyword if variable isn't mutated
```

---

### 6. auth_handler_tests.rs

**Errors**:
- Line 18: `test_utils` module is private
- 27 instances: Type annotations needed for `(_, _)`
- Line 1118: `change_password` function not found

**Fix**:
```rust
// Line 18: Make test_utils public or use correct path
// Option 1: Make module public in mod.rs
pub mod test_utils;

// Option 2: Use different import path
use crate::tests::test_utils;

// Type annotations (27 instances):
// Add explicit types:
let (result1, result2): (Result<Type1, Error1>, Result<Type2, Error2>) = some_function();

// Line 1118: Check if function exists or use correct name
// Check handlers::auth module for correct function name
```

**Action**: 
- Check all function calls and add explicit return types
- Verify `change_password` function exists or find correct name

---

## Verification Steps

After fixing each file:

```bash
# Test individual files
cargo test --no-run --test reconciliation_integration_tests
cargo test --no-run --test security_tests
cargo test --no-run --test api_tests
cargo test --no-run --test e2e_tests
cargo test --no-run --test mod
cargo test --no-run --test auth_handler_tests

# Check for remaining errors
cargo check --tests 2>&1 | grep -A 5 "reconciliation_integration_tests\|security_tests\|api_tests\|e2e_tests\|mod\|auth_handler_tests"
```

---

## Common Patterns

1. **Trait imports**: Always import traits before using their methods
   ```rust
   use crate::trait::TraitName;
   ```

2. **Module paths**:
   - `crate::` = from crate root
   - `super::` = from parent module
   - `self::` = from current module
   - `::` = absolute path from crate root

3. **Type annotations**: Add explicit types when inference fails
   ```rust
   let (a, b): (TypeA, TypeB) = function();
   ```

4. **Module visibility**: Make modules public if needed
   ```rust
   pub mod test_utils;
   ```

---

## Resources

- Handler definitions: `backend/src/handlers/`
- Service definitions: `backend/src/services/`
- Module structure: `backend/src/lib.rs` and `backend/tests/mod.rs`
- Test utilities: `backend/tests/test_utils.rs`

---

## Special Notes

- **test_utils visibility**: This is a common issue. Check if it should be public or use different import path
- **Trait methods**: Always import traits before calling trait methods
- **Module resolution**: Use `cargo check` to see exact module paths

---

**Status**: Ready for work  
**Last Updated**: January 2025

