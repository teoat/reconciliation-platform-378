# 🎯 **SSOT GUIDANCE DOCUMENT - SINGLE SOURCE OF TRUTH**

**Last Updated**: January 2025  
**Status**: Active and Mandatory - SSOT  
**Version**: 2.0.0

## 📋 **MANDATORY READING BEFORE ANY NEW DEVELOPMENT**

> ⚠️ **CRITICAL**: This document MUST be read and understood before adding any new files, features, or functions to the Reconciliation Platform. Failure to follow SSOT principles will result in code rejection.

**Note**: This guide consolidates all SSOT principles and best practices into a single source of truth.

---

## 🎯 **SSOT PRINCIPLES OVERVIEW**

### **Core SSOT Rules**

1. **ONE IMPLEMENTATION PER FEATURE** - Never duplicate functionality
2. **ONE LOCATION PER CONCEPT** - Each concept has exactly one authoritative source
3. **ONE RESPONSIBILITY PER FILE** - Each file serves one clear purpose
4. **ONE WAY TO DO THINGS** - Consistent patterns across the codebase
5. **ONE TRUTH SOURCE** - No conflicting information or implementations

---

## 📁 **SSOT DIRECTORY STRUCTURE**

### **MANDATORY PROJECT STRUCTURE**

```
reconciliation-platform/
├── frontend/                    # 🎨 SINGLE FRONTEND IMPLEMENTATION
│   ├── src/
│   │   ├── components/         # UI Components (SSOT)
│   │   ├── services/           # Business Logic Services (SSOT)
│   │   ├── hooks/              # React Hooks (SSOT)
│   │   ├── types/              # TypeScript Types (SSOT)
│   │   ├── utils/              # Utility Functions (SSOT)
│   │   └── styles/             # Styling (SSOT)
│   ├── package.json            # Frontend Dependencies (SSOT)
│   ├── vite.config.ts          # Build Configuration (SSOT)
│   └── tailwind.config.js      # Styling Configuration (SSOT)
│
├── backend/                     # 🦀 SINGLE BACKEND IMPLEMENTATION
│   ├── src/
│   │   ├── handlers/           # API Handlers (SSOT)
│   │   ├── services/           # Business Logic (SSOT)
│   │   ├── models/             # Data Models (SSOT)
│   │   ├── middleware/         # Middleware (SSOT)
│   │   ├── utils/              # Utilities (SSOT)
│   │   └── config/             # Configuration (SSOT)
│   ├── Cargo.toml              # Backend Dependencies (SSOT)
│   └── src/lib.rs              # Main Entry Point (SSOT)
│
├── infrastructure/              # 🏗️ SINGLE INFRASTRUCTURE SETUP
│   ├── docker/                 # Container Configuration (SSOT)
│   ├── k8s/                    # Kubernetes Configuration (SSOT)
│   ├── monitoring/             # Monitoring Setup (SSOT)
│   └── scripts/                # Deployment Scripts (SSOT)
│
├── docs/                        # 📚 SINGLE DOCUMENTATION SOURCE
│   ├── README.md               # Main Documentation (SSOT)
│   ├── ARCHITECTURE.md         # Architecture Guide (SSOT)
│   ├── API.md                  # API Documentation (SSOT)
│   ├── INFRASTRUCTURE.md       # Infrastructure Guide (SSOT)
│   └── SSOT_GUIDANCE.md        # This Document (SSOT)
│
├── tests/                       # 🧪 SINGLE TEST SUITE
│   ├── unit/                   # Unit Tests (SSOT)
│   ├── integration/            # Integration Tests (SSOT)
│   └── e2e/                    # End-to-End Tests (SSOT)
│
└── scripts/                     # 🔧 SINGLE SCRIPT COLLECTION
    ├── setup.sh                # Setup Script (SSOT)
    ├── deploy.sh               # Deployment Script (SSOT)
    ├── test.sh                 # Test Script (SSOT)
    └── backup.sh               # Backup Script (SSOT)
```

---

## 🚫 **FORBIDDEN ACTIONS - NEVER DO THESE**

### **❌ NEVER CREATE DUPLICATE DIRECTORIES**

```bash
# FORBIDDEN - Multiple frontend implementations
├── app/                    # ❌ FORBIDDEN
├── frontend-simple/        # ❌ FORBIDDEN  
├── components/             # ❌ FORBIDDEN (root level)
├── pages/                  # ❌ FORBIDDEN (root level)
├── hooks/                  # ❌ FORBIDDEN (root level)
├── services/               # ❌ FORBIDDEN (root level)
├── types/                  # ❌ FORBIDDEN (root level)
├── utils/                  # ❌ FORBIDDEN (root level)
```

### **❌ NEVER CREATE DUPLICATE FILES**

```bash
# FORBIDDEN - Multiple implementations of same functionality
├── Button.tsx              # ❌ FORBIDDEN (multiple locations)
├── Navigation.tsx          # ❌ FORBIDDEN (multiple locations)
├── AuthService.ts          # ❌ FORBIDDEN (multiple locations)
├── ApiClient.ts            # ❌ FORBIDDEN (multiple locations)
├── package.json            # ❌ FORBIDDEN (root level)
├── Dockerfile              # ❌ FORBIDDEN (multiple locations)
├── docker-compose.yml      # ❌ FORBIDDEN (multiple locations)
```

---

## ✅ **MANDATORY ACTIONS - ALWAYS DO THESE**

### **✅ ALWAYS CHECK BEFORE ADDING NEW FILES**

#### **Step 1: Verify SSOT Location**

```bash
# Before creating any new file, ask:
1. Does this functionality already exist?
2. Where is the SSOT location for this type of file?
3. Can I extend existing functionality instead?
4. Am I following the established patterns?
```

#### **Step 2: Check SSOT_LOCK.yml**

**Before creating any new utility or service**, check `SSOT_LOCK.yml`:

```bash
# Check if similar functionality exists
grep -i "validation\|error\|sanitize" SSOT_LOCK.yml
```

#### **Step 3: Verify No Duplicates**

```bash
# Search for existing implementations
grep -r "function validateEmail" frontend/src
grep -r "fn hash_password" backend/src
```

#### **Step 4: Use Correct SSOT Directory**

```bash
# Frontend Components
frontend/src/components/ui/           # Base UI components
frontend/src/components/layout/       # Layout components
frontend/src/components/forms/        # Form components
frontend/src/components/features/     # Feature-specific components

# Frontend Services
frontend/src/services/apiClient/      # ✅ SSOT: Unified API client (modular structure)
  ├── index.ts                        # Main entry point, exports apiClient singleton
  ├── interceptors.ts                # Request/response interceptors
  ├── request.ts                      # Request building and execution
  ├── response.ts                     # Response handling, caching, validation
  ├── types.ts                        # TypeScript type definitions
  ├── settings.ts                     # Configuration and settings
  └── utils.ts                        # Utility functions
frontend/src/services/api/            # API service modules (use apiClient internally)
frontend/src/services/auth/           # Authentication
frontend/src/services/state/          # State management
frontend/src/services/utils/          # Utility services

# Frontend Utilities (SSOT)
frontend/src/utils/common/            # Common utilities (SSOT)
  ├── validation.ts                   # ✅ SSOT: All validation
  ├── errorHandling.ts                # ✅ SSOT: All error handling
  └── sanitization.ts                 # ✅ SSOT: All sanitization

# Backend Handlers
backend/src/handlers/                 # API endpoints

# Backend Services
backend/src/services/                 # Business logic
  └── auth/
      └── password.rs                 # ✅ SSOT: Password operations

# Documentation
docs/                                 # All documentation
```

## 📝 **SSOT IMPORT PATTERNS**

### ✅ **Correct Import Patterns**

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

// ✅ DO: Import API client types from the modular structure
import type { ApiResponse, RequestConfig } from '@/services/apiClient/types';
import { InterceptorManager } from '@/services/apiClient/interceptors';
```

### ❌ **Incorrect Import Patterns**

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

## 🔧 **CREATING NEW SSOT MODULES**

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

## 🔄 **MIGRATING TO SSOT**

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

## ✅ **VALIDATION & COMPLIANCE**

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

## 📊 **SSOT DOMAINS**

### Current SSOT Locations

| Domain | SSOT Path | Deprecated Paths |
|--------|-----------|------------------|
| **Validation** | `@/utils/common/validation` | `@/utils/passwordValidation` |
| **Error Handling** | `@/utils/common/errorHandling` | `@/utils/errorExtraction` |
| **Sanitization** | `@/utils/common/sanitization` | `@/utils/sanitize` |
| **API Client** | `@/services/apiClient` (modular structure) | `@/services/ApiService` |
| **Configuration** | `@/config/AppConfig` | Various config files |
| **Password (Backend)** | `backend/src/services/auth/password.rs` | `backend/src/utils/crypto.rs` |

**Full list**: See `SSOT_LOCK.yml`

## 🔍 **QUICK REFERENCE**

### Common SSOT Paths

```typescript
// Validation
import { validateEmail, passwordSchema } from '@/utils/common/validation';

// Error Handling
import { getErrorMessage, extractErrorCode } from '@/utils/common/errorHandling';

// Sanitization
import { sanitizeInput, escapeHtml } from '@/utils/common/sanitization';

// API Client (modular structure)
import { apiClient } from '@/services/apiClient';
// Or import specific modules:
import { InterceptorManager } from '@/services/apiClient/interceptors';
import type { ApiResponse, RequestConfig } from '@/services/apiClient/types';

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

## 📚 **CODE REVIEW GUIDELINES**

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

## 📦 **API CLIENT MODULAR STRUCTURE**

The API client follows a modular architecture for better maintainability and extensibility:

### Structure

```text
frontend/src/services/apiClient/
├── index.ts          # Main entry point - exports apiClient singleton
├── interceptors.ts  # Request/response interceptors (auth, logging, error handling)
├── request.ts       # Request building and execution
├── response.ts      # Response handling, caching, validation
├── types.ts         # TypeScript type definitions
├── settings.ts      # Configuration and settings
└── utils.ts         # Utility functions
```

### Usage Patterns

```typescript
// ✅ DO: Use the main apiClient singleton
import { apiClient } from '@/services/apiClient';

// Make API calls
const response = await apiClient.get('/api/v1/projects');

// ✅ DO: Import types from the modular structure
import type { ApiResponse, RequestConfig } from '@/services/apiClient/types';

// ✅ DO: Use interceptors for custom behavior
import { InterceptorManager } from '@/services/apiClient/interceptors';

// ✅ DO: Access specific modules when needed
import { RequestBuilder } from '@/services/apiClient/request';
import { ResponseHandler } from '@/services/apiClient/response';
```

### Re-export Wrapper

The file `frontend/src/services/apiClient.ts` is a **deprecated wrapper** that re-exports from the modular structure:

```typescript
// Deprecated wrapper (for backward compatibility)
export * from './apiClient/index';
```

**Migration**: New code should import directly from `@/services/apiClient` (which resolves to `apiClient/index.ts`).

### Backward Compatibility

- ✅ Old imports still work: `import { apiClient } from '@/services/apiClient'`
- ✅ New code should use the same import path
- ✅ Internal structure is modular but external API is unchanged

---

## 🐛 **TROUBLESHOOTING**

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

## 🎯 **CONCLUSION**

This SSOT Guidance Document is the **single source of truth** for all development practices in the Reconciliation Platform. Every developer, every feature, and every file must adhere to these principles to maintain the clean, efficient, and maintainable codebase we've achieved.

**Remember**:

- 🎯 **One implementation per feature**
- 📁 **One location per concept**
- 🔧 **One responsibility per file**
- 📝 **One way to do things**
- ✅ **One truth source**

**The Reconciliation Platform's success depends on maintaining SSOT principles. Let's keep it clean, efficient, and maintainable!** 🚀

---

*This document is the SSOT for SSOT guidance. Any updates must be made here and communicated to all team members.*

## 📚 **RELATED DOCUMENTATION**

- [SSOT_LOCK.yml](../../SSOT_LOCK.yml) - Complete SSOT definitions
- [SSOT Areas and Locking](./SSOT_AREAS_AND_LOCKING.md) - SSOT locking system
- [SSOT Migration Guide](../development/SSOT_MIGRATION_GUIDE.md) - Migration procedures
- [Validation Script](../../scripts/validate-ssot.sh) - SSOT validation tool

---

**Remember**: When in doubt, check `SSOT_LOCK.yml` and run `./scripts/validate-ssot.sh`!

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: ✅ Active and Mandatory - SSOT

**Note**: This guide consolidates the previous SSOT Best Practices. All SSOT principles and best practices are now in this single source of truth.
