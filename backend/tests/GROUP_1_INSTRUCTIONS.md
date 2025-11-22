# Group 1: Type Mismatches & Function Signatures

**Agent**: Agent 1  
**Status**: 🔄 Ready to start  
**Files**: 5 test files  
**Estimated Errors**: ~120 errors

---

## Work Instructions

### 1. validation_service_tests.rs

**Error**: Line 148-149 - `&str` vs `String` mismatch

**Fix**:
```rust
// Current (line 148):
assert!(validator.validate_password("A1!a".repeat(2)).is_ok() || ...);

// Fix: The issue is that validate_password expects &str, but repeat() returns String
// Solution: Use .as_str() or pass string literals directly
assert!(validator.validate_password("A1!aA1!a").is_ok() || ...);
// OR
let pwd = "A1!a".repeat(2);
assert!(validator.validate_password(&pwd).is_ok() || ...);
```

**Check**: Look at `ValidationService::validate_password` signature to confirm expected type.

---

### 2. realtime_service_tests.rs

**Error**: 
- Line 352: `CursorPosition` type mismatch (expected `CursorPosition`, found `String`)
- Line 356: No field `parent_id` on type `Comment`

**Fix**:
```rust
// Line 352: Check what create_comment expects
// If it expects CursorPosition, create proper struct:
let cursor = CursorPosition { line: 1, column: 0 };
// OR if it expects String, check the actual function signature

// Line 356: Check Comment struct definition
// If parent_id doesn't exist, use correct field name or remove assertion
```

**Action**: Read `backend/src/services/realtime/` to understand Comment and CursorPosition types.

---

### 3. error_logging_service_tests.rs

**Error**: Line 249 - `HashMap<String, Value>` vs `HashMap<String, String>`

**Fix**:
```rust
// Current (line 249):
let metadata = HashMap::new();
// metadata is inferred as HashMap<String, String>

// Fix: Explicitly type as HashMap<String, Value>
let mut metadata: HashMap<String, serde_json::Value> = HashMap::new();
metadata.insert("key".to_string(), serde_json::json!("value"));
```

---

### 4. service_tests.rs

**Errors**: Multiple type mismatches and method calls

**Key Fixes**:
1. Line 32: Fix `&Error` vs `Error` - use `&error` instead of `error`
2. Line 137: Fix `&str` vs `String` - use `.as_str()` or `&*`
3. Line 145: Fix `PathBuf` vs `String` - use `.to_string_lossy()` or `.display().to_string()`
4. Lines 189-195: Fix `ValidationService` method calls - ensure service is unwrapped correctly
5. Line 555, 687, 768: Fix `test_utils` module visibility - use `crate::test_utils` or make module public
6. Line 825: Fix `RealtimeService` import - check correct module path

**Action**: 
- Check each service's actual method signatures
- Fix module imports to use correct paths
- Ensure proper error handling

---

### 5. backup_recovery_service_tests.rs

**Errors**:
- Line 84: `BackupService` vs `BackupConfig` type mismatch
- Line 98: No method `restore_backup` on `DisasterRecoveryService`

**Fix**:
```rust
// Line 84: Check what BackupService::new expects
// If it expects BackupConfig, create config first:
let config = BackupConfig::default(); // or BackupConfig::new(...)
let service = BackupService::new(config);

// Line 98: Check DisasterRecoveryService methods
// Use correct method name or check if method exists in BackupService instead
```

---

## Verification Steps

After fixing each file:

```bash
# Test individual file
cargo test --no-run --test validation_service_tests
cargo test --no-run --test realtime_service_tests
cargo test --no-run --test error_logging_service_tests
cargo test --no-run --test service_tests
cargo test --no-run --test backup_recovery_service_tests

# Check for remaining errors
cargo check --tests 2>&1 | grep -A 5 "validation_service_tests\|realtime_service_tests\|error_logging_service_tests\|service_tests\|backup_recovery_service_tests"
```

---

## Common Patterns

1. **String to &str**: Use `.as_str()` or `&*string_var`
2. **&str to String**: Use `.to_string()` or `.to_owned()`
3. **PathBuf to String**: Use `.to_string_lossy().to_string()` or `.display().to_string()`
4. **Type annotations**: Add explicit types when inference fails
5. **Module paths**: Use `crate::` for crate root, `super::` for parent module

---

## Resources

- Service definitions: `backend/src/services/`
- Model definitions: `backend/src/models/`
- Test utilities: `backend/tests/test_utils.rs`

---

**Status**: Ready for work  
**Last Updated**: January 2025

