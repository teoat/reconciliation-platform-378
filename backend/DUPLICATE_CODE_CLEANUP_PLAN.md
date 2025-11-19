# Duplicate Code Cleanup Plan

## 🔍 Duplications Found

### 1. Password Hashing - THREE Implementations

#### ✅ ACTIVE: `services/auth/password.rs`
- **Algorithm**: bcrypt
- **Status**: ✅ **KEEP** - Used by `AuthService`
- **Usage**: All password hashing in the app

#### ❌ UNUSED: `utils/crypto.rs` (Argon2)
- **Functions**: `hash_password()`, `verify_password()`
- **Status**: ❌ **REMOVE** - Not used anywhere
- **Action**: Remove password functions, keep other utilities

#### ❌ UNUSED: `services/security.rs` (bcrypt)
- **Functions**: `hash_password()`, `verify_password()` (async)
- **Status**: ❌ **REMOVE or ARCHIVE** - Not used
- **Action**: Remove password methods if SecurityService not needed

### 2. Password Validation - TWO Implementations

#### ✅ ACTIVE: `services/auth/password.rs`
- **Function**: `PasswordManager::validate_password_strength()`
- **Used by**: `AuthService` → `UserService::create_user()`
- **Status**: ✅ **KEEP** - Active for user registration

#### ✅ ALSO USED: `services/validation/password.rs`
- **Struct**: `PasswordValidator`
- **Used by**: `ValidationServiceDelegate` (used in validation service)
- **Status**: ✅ **KEEP** - Different validation context
- **Note**: Both validators are used but in different contexts

### 3. Redundant Files

#### ❌ UNUSED: `services/password_manager_db.rs`
- **Status**: ❌ **REMOVE**
- **Reasons**:
  - Not exported in `mod.rs`
  - Not referenced anywhere
  - Has placeholder code
  - Uses SQLx (but main code uses Diesel)

## 📋 Cleanup Actions

### Priority 1: Remove Unused Password Hashing

**File**: `backend/src/utils/crypto.rs`
- Remove `hash_password()` (Argon2)
- Remove `verify_password()` (Argon2)
- Keep other utility functions (generate_random_string, sha256_hash, etc.)

**File**: `backend/src/services/security.rs`
- Check if `SecurityService` is used
- If unused, remove password methods
- If used, keep but document it's for different purpose

### Priority 2: Remove Redundant File

**File**: `backend/src/services/password_manager_db.rs`
- **Action**: Delete or move to archive
- **Reason**: Not exported, not used, placeholder code

### Priority 3: Document Validation Duplication

**Files**: 
- `services/auth/password.rs::PasswordManager::validate_password_strength()`
- `services/validation/password.rs::PasswordValidator`

**Action**: Document that both are used but in different contexts:
- `PasswordManager::validate_password_strength()` - Used for user authentication/registration
- `PasswordValidator` - Used in general validation service

## 🎯 Current State

**Active Password Hashing (bcrypt):**
- ✅ `services/auth/password.rs::PasswordManager::hash_password()`
- ✅ Used via `AuthService::hash_password()`

**Active Password Verification (bcrypt):**
- ✅ `services/auth/password.rs::PasswordManager::verify_password()`
- ✅ Used via `AuthService::verify_password()`

**Active Password Validation:**
- ✅ `services/auth/password.rs::PasswordManager::validate_password_strength()` - For auth
- ✅ `services/validation/password.rs::PasswordValidator` - For general validation

## ⚠️ Important Notes

1. **Algorithm Consistency**: Codebase uses **bcrypt** (not Argon2)
2. **SSOT**: `services/auth/password.rs` is the Single Source of Truth for password hashing
3. **Validation**: Two validators exist but serve different purposes (both should be kept)

