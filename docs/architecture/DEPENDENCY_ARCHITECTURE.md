# Dependency Architecture

**Last Updated**: 2025-01-15  
**Status**: Active  
**Purpose**: Document module boundaries and dependency rules

---

## Overview

This document defines the dependency architecture, module boundaries, and allowed dependency flows for the codebase.

---

## Module Hierarchy

```
┌─────────────────────────────────────────┐
│           Application Layer              │
│  (Pages, App Components, Routes)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│          Component Layer                │
│  (UI Components, Feature Components)     │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│   Services   │  │     Hooks     │
│  (Business   │  │  (State Mgmt) │
│   Logic)     │  │               │
└──────┬───────┘  └───────┬───────┘
       │                   │
       └─────────┬─────────┘
                 ▼
         ┌──────────────┐
         │    Utils     │
         │  (Pure Funcs)│
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │    Types     │
         │ (Type Defs)  │
         └──────────────┘
```

---

## Module Dependency Rules

### Allowed Dependencies

| From Module | To Modules | Examples |
|------------|------------|----------|
| **Pages** | Components, Services, Hooks, Utils, Types | ✅ Allowed |
| **Components** | Services, Hooks, Utils, Types | ✅ Allowed |
| **Services** | Utils, Types | ✅ Allowed |
| **Hooks** | Services, Utils, Types | ✅ Allowed |
| **Utils** | Types only | ✅ Allowed |
| **Types** | Other Types only | ✅ Allowed |

### Forbidden Dependencies

| From Module | To Modules | Reason |
|------------|------------|--------|
| **Utils** | Components, Services, Hooks | Utils should be pure functions |
| **Types** | Components, Services, Hooks, Utils | Types should have no runtime dependencies |
| **Services** | Components | Services should not depend on UI |

---

## Dependency Flow Examples

### ✅ Correct Patterns

```typescript
// ✅ Page → Component → Service → Utils → Types
// pages/DashboardPage.tsx
import { DashboardComponent } from '@/components/Dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';

// components/Dashboard.tsx
import { dashboardService } from '@/services/dashboardService';

// services/dashboardService.ts
import { formatDate } from '@/utils/dateFormatting';
import type { DashboardData } from '@/types/dashboard';

// utils/dateFormatting.ts
import type { DateFormat } from '@/types/common';
```

### ❌ Incorrect Patterns

```typescript
// ❌ Utils → Component (FORBIDDEN)
// utils/helpers.ts
import { Button } from '@/components/ui/Button'; // ❌ FORBIDDEN

// ❌ Types → Service (FORBIDDEN)
// types/user.ts
import { userService } from '@/services/userService'; // ❌ FORBIDDEN

// ❌ Service → Component (FORBIDDEN)
// services/apiService.ts
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'; // ❌ FORBIDDEN
```

---

## Circular Dependency Prevention

### Detection

- **Automated**: Runs on pre-commit and in CI/CD
- **Manual**: `npm run deps:circular`
- **ESLint**: `import/no-cycle` rule

### Prevention Strategies

1. **Use Type-Only Imports**
   ```typescript
   // ✅ DO
   import type { User } from '@/types/user';
   
   // ❌ DON'T
   import { User } from '@/types/user';
   ```

2. **Extract Shared Code**
   ```typescript
   // ✅ DO: Extract to shared module
   // utils/shared/validation.ts
   export function validateEmail(email: string): boolean { }
   
   // Both modules import from shared
   import { validateEmail } from '@/utils/shared/validation';
   ```

3. **Dependency Inversion**
   ```typescript
   // ✅ DO: Use interfaces
   interface ILogger {
     log(message: string): void;
   }
   
   class MyService {
     constructor(private logger: ILogger) {}
   }
   ```

---

## Module Boundaries

### Utils Module
- **Purpose**: Pure utility functions
- **Can Import**: Types only
- **Cannot Import**: Components, Services, Hooks
- **Examples**: `dateFormatting.ts`, `validation.ts`, `formatting.ts`

### Types Module
- **Purpose**: Type definitions and interfaces
- **Can Import**: Other types only
- **Cannot Import**: Components, Services, Hooks, Utils
- **Examples**: `user.ts`, `project.ts`, `api.ts`

### Services Module
- **Purpose**: Business logic and API calls
- **Can Import**: Utils, Types
- **Cannot Import**: Components
- **Examples**: `userService.ts`, `apiService.ts`

### Components Module
- **Purpose**: UI components
- **Can Import**: Services, Hooks, Utils, Types
- **Cannot Import**: Pages (to avoid cycles)
- **Examples**: `Button.tsx`, `Modal.tsx`, `Dashboard.tsx`

### Hooks Module
- **Purpose**: React hooks and state management
- **Can Import**: Services, Utils, Types
- **Cannot Import**: Components
- **Examples**: `useAuth.ts`, `useProjects.ts`

---

## Validation

### Automated Checks

```bash
# Check for circular dependencies
npm run deps:circular

# Full dependency validation
npm run deps:validate

# Monitor dependency health
npm run deps:monitor

# Generate health report
npm run deps:report

# Analyze coupling
npm run deps:coupling
```

### CI/CD Integration

- Pre-commit hook validates dependencies
- CI/CD pipeline runs dependency checks
- Weekly monitoring generates reports
- Alerts on violations

---

## Refactoring Guidelines

When circular dependencies are detected:

1. **Identify the cycle** - Use `npm run deps:circular`
2. **Find shared code** - Identify what both modules need
3. **Extract to shared module** - Create new utility or service
4. **Update imports** - Both modules import from shared module
5. **Verify** - Run validation again

---

## Related Documentation

- [Dependency Management Guide](../development/DEPENDENCY_MANAGEMENT.md)
- [Circular Dependencies Report](../diagnostics/CIRCULAR_DEPENDENCIES_REPORT.md)
- [Import Conventions](../development/IMPORT_CONVENTIONS.md)

---

**Last Updated**: 2025-01-15

