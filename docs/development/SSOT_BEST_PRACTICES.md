# SSOT Best Practices Guide

**Last Updated**: 2025-11-26  
**Status**: Active  
**Version**: 1.0.0

## Overview

This guide provides best practices for maintaining Single Source of Truth (SSOT) principles in the codebase. Following these practices ensures code quality, reduces duplication, and improves maintainability.

---

## Core SSOT Principles

### 1. One Implementation Per Feature
- ✅ **DO**: Create one authoritative implementation
- ❌ **DON'T**: Create duplicate implementations
- **Example**: Use `@/utils/common/validation` instead of creating new validation functions

### 2. One Location Per Concept
- ✅ **DO**: Keep related functionality in one location
- ❌ **DON'T**: Scatter related code across multiple files
- **Example**: All error handling in `@/utils/common/errorHandling`

### 3. One Responsibility Per File
- ✅ **DO**: Keep files focused on a single responsibility
- ❌ **DON'T**: Mix unrelated functionality
- **Example**: Separate validation, sanitization, and error handling

### 4. One Way to Do Things
- ✅ **DO**: Use consistent patterns across the codebase
- ❌ **DON'T**: Use different approaches for the same task
- **Example**: Always use `@/utils/common/validation` for validation

---

## SSOT Import Patterns

### ✅ Correct Import Patterns

```typescript
// ✅ DO: Use SSOT paths
import { validateEmail, passwordSchema } from '@/utils/common/validation';
import { getErrorMessage, extractErrorCode } from '@/utils/common/errorHandling';
import { sanitizeInput, escapeHtml } from '@/utils/common/sanitization';

// ✅ DO: Use absolute imports with @/ alias
import { apiClient } from '@/services/apiClient';
import { User } from '@/types/user';

// ✅ DO: Use re-export wrappers when appropriate
import { validateEmail } from '@/utils/inputValidation'; // Re-export wrapper
```

### ❌ Incorrect Import Patterns

```typescript
// ❌ DON'T: Use deprecated paths
import { validateEmail } from '@/utils/passwordValidation'; // Deprecated
import { getErrorMessage } from '@/utils/errorExtraction'; // Deprecated
import { sanitize } from '@/utils/sanitize'; // Deprecated

// ❌ DON'T: Create duplicate implementations
function validateEmail(email: string): boolean {
  // ❌ DON'T: Duplicate validation logic
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ DON'T: Use relative imports for utilities
import { validateEmail } from '../../../utils/inputValidation'; // Use @/ alias
```

---

## SSOT File Organization

### Frontend Structure

```
frontend/src/
├── utils/
│   ├── common/              # SSOT for common utilities
│   │   ├── validation.ts    # ✅ SSOT: All validation
│   │   ├── errorHandling.ts  # ✅ SSOT: All error handling
│   │   └── sanitization.ts   # ✅ SSOT: All sanitization
│   ├── inputValidation.ts    # ✅ Re-export wrapper (convenience)
│   └── fileValidation.ts     # ✅ Domain-specific (CSV validation)
├── services/
│   ├── apiClient/            # ✅ SSOT: API client
│   │   ├── index.ts
│   │   ├── interceptors.ts
│   │   └── types.ts
│   └── ...
├── config/
│   └── AppConfig.ts          # ✅ SSOT: Frontend configuration
└── ...
```

### Backend Structure

```
backend/src/
├── services/
│   ├── auth/
│   │   └── password.rs        # ✅ SSOT: Password operations
│   └── ...
└── ...
```

---

## Creating New SSOT Modules

### Step 1: Check SSOT_LOCK.yml

**Before creating any new utility or service**, check `SSOT_LOCK.yml`:

```bash
# Check if similar functionality exists
grep -i "validation\|error\|sanitize" SSOT_LOCK.yml
```

### Step 2: Verify No Duplicates

```bash
# Search for existing implementations
grep -r "function validateEmail" frontend/src
grep -r "fn hash_password" backend/src
```

### Step 3: Create SSOT Module

```typescript
// ✅ DO: Create in SSOT location
// frontend/src/utils/common/newUtility.ts

/**
 * SSOT: New utility functionality
 * 
 * @example
 * ```typescript
 * import { newUtility } from '@/utils/common/newUtility';
 * ```
 */
export function newUtility(): void {
  // Implementation
}
```

### Step 4: Update SSOT_LOCK.yml

```yaml
new_utility:
  description: "New utility functionality"
  path: "frontend/src/utils/common/newUtility.ts"
  exports:
    - "newUtility"
  deprecated_paths: []
  removal_version: null
```

---

## Migrating to SSOT

### Migration Checklist

1. **Identify Duplicates**
   ```bash
   # Find all usages
   grep -r "oldFunction" frontend/src
   ```

2. **Verify SSOT Location**
   ```bash
   # Check SSOT_LOCK.yml
   cat SSOT_LOCK.yml | grep -A 10 "domain_name"
   ```

3. **Update Imports**
   ```typescript
   // Before
   import { oldFunction } from '@/utils/oldFile';
   
   // After
   import { oldFunction } from '@/utils/common/newLocation';
   ```

4. **Test Changes**
   ```bash
   # Run validation
   ./scripts/validate-ssot.sh
   
   # Run tests
   npm run test
   ```

5. **Update SSOT_LOCK.yml**
   ```yaml
   domain_name:
     deprecated_paths:
       - "frontend/src/utils/oldFile.ts"  # Add to deprecated
   ```

6. **Remove Deprecated File**
   ```bash
   # After all migrations complete
   rm frontend/src/utils/oldFile.ts
   ```

---

## Validation & Compliance

### Pre-Commit Validation

```bash
# Run SSOT validation before committing
./scripts/validate-ssot.sh

# Expected output:
# ✅ SSOT Compliance: PASSED
```

### Common Violations

1. **Deprecated Import**
   ```typescript
   // ❌ Violation
   import { validateEmail } from '@/utils/passwordValidation';
   
   // ✅ Fix
   import { validateEmail } from '@/utils/common/validation';
   ```

2. **Root-Level Directory**
   ```typescript
   // ❌ Violation: Root-level utils/
   import { something } from '../../utils/helper';
   
   // ✅ Fix: Use frontend/src/utils/
   import { something } from '@/utils/helper';
   ```

3. **Duplicate Implementation**
   ```typescript
   // ❌ Violation: Duplicate function
   function validateEmail(email: string): boolean {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   }
   
   // ✅ Fix: Import from SSOT
   import { validateEmail } from '@/utils/common/validation';
   ```

---

## SSOT Domains

### Current SSOT Locations

| Domain | SSOT Path | Deprecated Paths |
|--------|-----------|------------------|
| **Validation** | `@/utils/common/validation` | `@/utils/passwordValidation` |
| **Error Handling** | `@/utils/common/errorHandling` | `@/utils/errorExtraction` |
| **Sanitization** | `@/utils/common/sanitization` | `@/utils/sanitize` |
| **API Client** | `@/services/apiClient` | `@/services/ApiService` |
| **Configuration** | `@/config/AppConfig` | Various config files |
| **Password (Backend)** | `backend/src/services/auth/password.rs` | `backend/src/utils/crypto.rs` |

**Full list**: See `SSOT_LOCK.yml`

---

## Code Review Guidelines

### For Reviewers

1. **Check SSOT Compliance**
   - Verify imports use SSOT paths
   - Check for duplicate implementations
   - Ensure no deprecated paths used

2. **Verify SSOT_LOCK.yml**
   - New SSOT modules documented?
   - Deprecated paths updated?
   - Exports listed correctly?

3. **Run Validation**
   ```bash
   ./scripts/validate-ssot.sh
   ```

### For Authors

1. **Before Creating New Code**
   - Check `SSOT_LOCK.yml` for existing implementations
   - Search codebase for similar functionality
   - Use SSOT locations when possible

2. **When Refactoring**
   - Update imports to SSOT paths
   - Remove duplicate implementations
   - Update `SSOT_LOCK.yml` if needed

3. **Before Committing**
   - Run `./scripts/validate-ssot.sh`
   - Fix any SSOT violations
   - Update documentation if needed

---

## Troubleshooting

### Issue: "SSOT violation: deprecated import"

**Solution**:
```bash
# Find the violation
./scripts/validate-ssot.sh

# Update import to SSOT path
# See SSOT_LOCK.yml for correct path
```

### Issue: "Duplicate implementation found"

**Solution**:
1. Identify which is the SSOT (check `SSOT_LOCK.yml`)
2. Migrate all usages to SSOT location
3. Remove duplicate implementation
4. Update `SSOT_LOCK.yml`

### Issue: "Root-level directory violation"

**Solution**:
1. Move files to `frontend/src/` or `backend/src/`
2. Update all imports
3. Update `tsconfig.json` paths if needed
4. Run validation again

---

## Quick Reference

### Common SSOT Paths

```typescript
// Validation
import { validateEmail, passwordSchema } from '@/utils/common/validation';

// Error Handling
import { getErrorMessage, extractErrorCode } from '@/utils/common/errorHandling';

// Sanitization
import { sanitizeInput, escapeHtml } from '@/utils/common/sanitization';

// API Client
import { apiClient } from '@/services/apiClient';

// Configuration
import { APP_CONFIG } from '@/config/AppConfig';
```

### Validation Commands

```bash
# Validate SSOT compliance
./scripts/validate-ssot.sh

# Check for deprecated imports
grep -r "from '@/utils/passwordValidation'" frontend/src

# Find duplicate implementations
grep -r "function validateEmail" frontend/src
```

---

## Related Documentation

- [SSOT_LOCK.yml](../../SSOT_LOCK.yml) - Complete SSOT definitions
- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md) - Architecture guidance
- [SSOT Migration Guide](./SSOT_MIGRATION_GUIDE.md) - Migration procedures
- [Validation Script](../../scripts/validate-ssot.sh) - SSOT validation tool

---

**Remember**: When in doubt, check `SSOT_LOCK.yml` and run `./scripts/validate-ssot.sh`!
