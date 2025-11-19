# Password Validation Documentation

## Overview

This codebase uses **two password validators** that serve different purposes. Both are actively used and should be maintained.

## Validators

### 1. `PasswordManager::validate_password_strength()`
**Location**: `services/auth/password.rs`

**Purpose**: Authentication and user registration context
- Used during user registration
- Used for password changes
- Used in authentication flows

**Usage**:
```rust
// Via AuthService
auth_service.validate_password_strength(password)?;

// Direct usage
PasswordManager::validate_password_strength(password)?;
```

**Used by**:
- `AuthService::validate_password_strength()`
- `UserService::create_user()`
- `UserAccountService::change_password()`

**Validation Rules**:
- Minimum 8 characters
- Maximum 128 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- Checks for banned passwords
- Checks for sequential characters

### 2. `PasswordValidator`
**Location**: `services/validation/password.rs`

**Purpose**: General validation service context
- Used in `ValidationServiceDelegate`
- Used for general input validation
- Used in validation middleware

**Usage**:
```rust
// Via ValidationServiceDelegate
validation_service.validate_password(password)?;

// Direct usage
let validator = PasswordValidator::new()?;
validator.validate(password)?;
```

**Used by**:
- `ValidationServiceDelegate::validate_password()`
- `ValidationService` (general validation)

**Validation Rules**:
- Minimum 8 characters
- Maximum 128 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain digit
- Must contain special character (@$!%*?&)
- Uses regex for character validation

## Differences

| Feature | PasswordManager | PasswordValidator |
|---------|----------------|-------------------|
| **Context** | Authentication | General validation |
| **Special Chars** | `!@#$%^&*()_+-=[]{}|;:,.<>?` | `@$!%*?&` |
| **Banned Passwords** | ✅ Yes | ❌ No |
| **Sequential Check** | ✅ Yes | ❌ No |
| **Regex Validation** | ❌ No | ✅ Yes |

## When to Use Which

### Use `PasswordManager::validate_password_strength()` when:
- Registering new users
- Changing passwords
- Authentication-related validation
- Need banned password checking
- Need sequential character detection

### Use `PasswordValidator` when:
- General form validation
- Using `ValidationServiceDelegate`
- Need regex-based character validation
- Validation middleware context

## Maintenance

Both validators should be kept as they serve different purposes:
- **PasswordManager**: Auth-specific, more strict
- **PasswordValidator**: General purpose, regex-based

If validation rules need to be updated, consider:
1. Updating both if the change is universal (e.g., minimum length)
2. Updating only the relevant one if context-specific

## Related Files

- `services/auth/password.rs` - PasswordManager implementation
- `services/validation/password.rs` - PasswordValidator implementation
- `services/validation/mod.rs` - ValidationServiceDelegate
- `services/auth/mod.rs` - AuthService (uses PasswordManager)

