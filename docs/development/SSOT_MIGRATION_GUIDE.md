# SSOT Migration Guide

**Last Updated**: January 2025  
**Status**: Active  
**Version**: 1.0.0

---

## Overview

This guide helps developers migrate from deprecated import paths to the new Single Source of Truth (SSOT) locations. The SSOT consolidation effort reduces code duplication and improves maintainability by consolidating similar functionality into canonical implementations.

**Related Documentation**:
- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md) - SSOT principles
- [Consolidation Quick Reference](../refactoring/CONSOLIDATION_QUICK_REFERENCE.md) - Quick lookup table
- [SSOT_LOCK.yml](../../SSOT_LOCK.yml) - Authoritative SSOT definitions

---

## Quick Reference

### Import Path Changes

| Old Import Path | New SSOT Path | Status |
|----------------|---------------|--------|
| `@/utils/passwordValidation` | `@/utils/common/validation` | ⚠️ Deprecated |
| `@/utils/inputValidation` | `@/utils/common/validation` | ⚠️ Deprecated |
| `@/utils/fileValidation` | `@/utils/common/validation` | ⚠️ Deprecated |
| `@/utils/errorExtraction` | `@/utils/common/errorHandling` | ⚠️ Deprecated |
| `@/utils/errorExtractionAsync` | `@/utils/common/errorHandling` | ⚠️ Deprecated |
| `@/utils/errorSanitization` | `@/utils/common/errorHandling` | ⚠️ Deprecated |
| `@/utils/sanitize` | `@/utils/common/sanitization` | ⚠️ Deprecated |
| `@/utils/ariaLiveRegionsHelper` | `@/utils/accessibility` | ⚠️ Deprecated |
| `@/utils/dynamicImports` | `@/utils/codeSplitting` | ⚠️ Deprecated |

---

## Migration Steps

### Step 1: Identify Files Using Deprecated Imports

Use the migration script to find all files using deprecated imports:

```bash
# Find files using deprecated validation imports
grep -r "from '@/utils/passwordValidation'" frontend/src
grep -r "from '@/utils/inputValidation'" frontend/src
grep -r "from '@/utils/fileValidation'" frontend/src

# Find files using deprecated error handling imports
grep -r "from '@/utils/errorExtraction'" frontend/src
grep -r "from '@/utils/errorExtractionAsync'" frontend/src
grep -r "from '@/utils/errorSanitization'" frontend/src

# Find files using deprecated sanitization imports
grep -r "from '@/utils/sanitize'" frontend/src
```

### Step 2: Update Imports

#### Option A: Automated Migration (Recommended)

Use the migration script:

```bash
# Dry run to see what would change
./scripts/migrate-imports.sh --dry-run

# Migrate all files
./scripts/migrate-imports.sh

# Migrate a specific file
./scripts/migrate-imports.sh --file "frontend/src/components/MyComponent.tsx"
```

#### Option B: Manual Migration

Update imports manually:

**Before:**
```typescript
import { validatePassword } from '@/utils/passwordValidation';
import { validateEmail } from '@/utils/inputValidation';
import { validateFile } from '@/utils/fileValidation';
import { extractError } from '@/utils/errorExtraction';
import { sanitizeInput } from '@/utils/sanitize';
```

**After:**
```typescript
import { 
  validatePassword, 
  validateEmail, 
  validateFile 
} from '@/utils/common/validation';

import { extractError } from '@/utils/common/errorHandling';
import { sanitizeInput } from '@/utils/common/sanitization';
```

### Step 3: Verify Changes

After updating imports, verify the changes:

```bash
# Type check
npx tsc --noEmit

# Run linter
npm run lint

# Run tests
npm run test

# Build
npm run build
```

### Step 4: Remove Deprecated Files (After All Migrations)

Once all files have been migrated, deprecated files can be removed:

```bash
# Verify no files are using deprecated imports
grep -r "from '@/utils/passwordValidation'" frontend/src || echo "No files found"
grep -r "from '@/utils/inputValidation'" frontend/src || echo "No files found"
grep -r "from '@/utils/fileValidation'" frontend/src || echo "No files found"

# Remove deprecated files (after verification)
rm frontend/src/utils/passwordValidation.ts
rm frontend/src/utils/inputValidation.ts
rm frontend/src/utils/fileValidation.ts
```

---

## Detailed Migration Examples

### Validation Functions

**Before:**
```typescript
import { validatePassword } from '@/utils/passwordValidation';
import { validateEmail } from '@/utils/inputValidation';
import { validateFile, validateFileType } from '@/utils/fileValidation';

function handleSubmit(data: FormData) {
  if (!validateEmail(data.email)) {
    return { error: 'Invalid email' };
  }
  if (!validatePassword(data.password)) {
    return { error: 'Invalid password' };
  }
  if (!validateFile(data.file)) {
    return { error: 'Invalid file' };
  }
}
```

**After:**
```typescript
import { 
  validateEmail, 
  validatePassword, 
  validateFile, 
  validateFileType 
} from '@/utils/common/validation';

function handleSubmit(data: FormData) {
  if (!validateEmail(data.email)) {
    return { error: 'Invalid email' };
  }
  if (!validatePassword(data.password)) {
    return { error: 'Invalid password' };
  }
  if (!validateFile(data.file)) {
    return { error: 'Invalid file' };
  }
}
```

### Error Handling

**Before:**
```typescript
import { extractError } from '@/utils/errorExtraction';
import { extractErrorAsync } from '@/utils/errorExtractionAsync';
import { sanitizeError } from '@/utils/errorSanitization';

try {
  await someAsyncOperation();
} catch (error) {
  const message = extractError(error);
  const sanitized = sanitizeError(message);
  console.error(sanitized);
}
```

**After:**
```typescript
import { 
  extractError, 
  extractErrorAsync, 
  sanitizeError 
} from '@/utils/common/errorHandling';

try {
  await someAsyncOperation();
} catch (error) {
  const message = extractError(error);
  const sanitized = sanitizeError(message);
  console.error(sanitized);
}
```

### Sanitization

**Before:**
```typescript
import { sanitizeInput, sanitizeHtml } from '@/utils/sanitize';

const cleanInput = sanitizeInput(userInput);
const cleanHtml = sanitizeHtml(htmlContent);
```

**After:**
```typescript
import { sanitizeInput, sanitizeHtml } from '@/utils/common/sanitization';

const cleanInput = sanitizeInput(userInput);
const cleanHtml = sanitizeHtml(htmlContent);
```

---

## Root-Level Directory Migration

If you're migrating root-level directories to `frontend/src/`, update imports accordingly:

### Before (Root-Level)
```typescript
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/user';
import { API_BASE_URL } from '@/constants';
```

### After (Frontend Source)
```typescript
import { useAuth } from '@/hooks/useAuth';  // Already correct if tsconfig paths updated
import { User } from '@/types/user';         // Already correct if tsconfig paths updated
import { API_BASE_URL } from '@/constants'; // Already correct if tsconfig paths updated
```

**Note**: If `tsconfig.json` paths are properly configured, imports may not need to change. Verify your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["frontend/src/*"]
    }
  }
}
```

---

## Backend Password System Migration

The backend password system has been consolidated. Use the SSOT location:

**SSOT Location**: `backend/src/services/auth/password.rs`

**Deprecated Locations** (Do NOT use):
- ❌ `backend/src/utils/crypto.rs` (password functions)
- ❌ `backend/src/services/security.rs` (password methods)
- ❌ `backend/src/services/password_manager_db.rs` (unused)

**Migration**: All password-related functionality should use `backend/src/services/auth/password.rs`.

---

## Troubleshooting

### Import Not Found

If you get "Module not found" errors after migration:

1. **Verify SSOT location exists**:
   ```bash
   ls -la frontend/src/utils/common/validation.ts
   ```

2. **Check tsconfig.json paths**:
   ```bash
   cat tsconfig.json | grep -A 5 "paths"
   ```

3. **Clear TypeScript cache**:
   ```bash
   rm -f tsconfig.tsbuildinfo
   npx tsc --noEmit
   ```

### Type Errors After Migration

If you get type errors:

1. **Check function signatures match**:
   ```typescript
   // Old signature
   validatePassword(password: string): boolean
   
   // New signature (should be the same)
   validatePassword(password: string): boolean
   ```

2. **Verify exports in SSOT file**:
   ```bash
   grep "export.*validatePassword" frontend/src/utils/common/validation.ts
   ```

### Circular Dependency Warnings

If you see circular dependency warnings:

1. **Check import paths**:
   ```bash
   # Find circular dependencies
   npx madge --circular frontend/src
   ```

2. **Use barrel exports carefully**:
   - Prefer direct imports over barrel exports when possible
   - Avoid importing from index files that re-export everything

---

## Migration Checklist

- [ ] Identify all files using deprecated imports
- [ ] Update imports (automated or manual)
- [ ] Run type check (`npx tsc --noEmit`)
- [ ] Run linter (`npm run lint`)
- [ ] Run tests (`npm run test`)
- [ ] Build project (`npm run build`)
- [ ] Verify no deprecated imports remain
- [ ] Update SSOT_LOCK.yml if needed
- [ ] Remove deprecated files (after all migrations complete)
- [ ] Update documentation references

---

## Timeline

- **Phase 1** (Weeks 1-2): Critical SSOT violations (root-level directories)
- **Phase 2** (Weeks 3-6): High priority features (import migration)
- **Phase 3** (Weeks 7-12): Medium priority enhancements

**Target Completion**: All migrations should be complete by end of Phase 2.

---

## Support

If you encounter issues during migration:

1. **Check this guide** for common solutions
2. **Review SSOT_LOCK.yml** for authoritative paths
3. **Check consolidation quick reference** for quick lookup
4. **Contact architecture team** for complex cases

---

## Related Documentation

- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md)
- [Consolidation Quick Reference](../refactoring/CONSOLIDATION_QUICK_REFERENCE.md)
- [Consolidation Optimization Plan](../refactoring/CONSOLIDATION_OPTIMIZATION_PLAN.md)
- [Zero Error Consolidation Plan](../refactoring/ZERO_ERROR_CONSOLIDATION_PLAN.md)
- [SSOT_LOCK.yml](../../SSOT_LOCK.yml)

---

**Last Updated**: January 2025  
**Maintainer**: Architecture Team  
**Version**: 1.0.0

