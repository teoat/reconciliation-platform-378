# Dependency Management Guide

**Last Updated**: 2025-01-15  
**Status**: Active  
**Purpose**: Guide for managing module dependencies and preventing circular dependencies

---

## Overview

This guide outlines best practices for managing dependencies in the codebase, preventing circular dependencies, and maintaining clean module boundaries.

---

## Module Dependency Rules

### Allowed Dependencies

- **Utils** → Types only
- **Components** → Utils, Types, Services
- **Services** → Utils, Types
- **Types** → No dependencies (or other types only)

### Forbidden Dependencies

- **Utils** → Components, Services
- **Types** → Components, Services, Utils (except other types)

---

## Preventing Circular Dependencies

### 1. Use Type-Only Imports

Always use `import type` for type-only imports:

```typescript
// ✅ DO: Type-only import
import type { User } from '@/types/user';

// ❌ DON'T: Regular import for types
import { User } from '@/types/user';
```

### 2. Extract Shared Code

When two modules need to share functionality:

1. **Create a shared utility module**
   ```typescript
   // utils/shared/validation.ts
   export function validateEmail(email: string): boolean {
     // ...
   }
   ```

2. **Both modules import from shared utility**
   ```typescript
   // components/LoginForm.tsx
   import { validateEmail } from '@/utils/shared/validation';
   
   // services/authService.ts
   import { validateEmail } from '@/utils/shared/validation';
   ```

### 3. Dependency Inversion

Use interfaces and dependency injection:

```typescript
// ✅ DO: Use interface
interface ILogger {
  log(message: string): void;
}

class MyService {
  constructor(private logger: ILogger) {}
}

// ❌ DON'T: Direct import
import { Logger } from '@/services/logger';
```

### 4. Event-Based Communication

For cross-module communication, use events:

```typescript
// ✅ DO: Event-based
eventEmitter.emit('user-updated', userData);

// ❌ DON'T: Direct import
import { updateUser } from '@/services/userService';
```

---

## Validation Tools

### Automated Detection

Run dependency validation:

```bash
# Check for circular dependencies
npm run deps:circular

# Full dependency validation
npm run deps:validate

# Generate dependency graph
npm run deps:graph
```

### Pre-Commit Hook

Dependency validation runs automatically on commit. If circular dependencies are detected, the commit will be blocked.

### CI/CD Integration

Dependency checks run in CI/CD pipeline. PRs with circular dependencies will fail.

---

## Common Patterns to Avoid

### 1. Barrel File Cycles

```typescript
// ❌ DON'T: Barrel file creating cycle
// utils/index.ts
export * from './validation';
export * from './formatting'; // imports from components

// components/index.ts
export * from './Button';
export * from './Input'; // imports from utils
```

**Solution**: Use selective imports instead of barrel files, or restructure exports.

### 2. Mutual Dependencies

```typescript
// ❌ DON'T: Module A imports B, B imports A
// services/userService.ts
import { formatUser } from '@/utils/userFormatter';

// utils/userFormatter.ts
import { getUser } from '@/services/userService';
```

**Solution**: Extract shared logic to a third module, or use dependency injection.

### 3. Deep Dependency Chains

```typescript
// ❌ DON'T: A → B → C → D → E → A (circular)
```

**Solution**: Refactor to reduce coupling, use events or dependency injection.

---

## Refactoring Strategies

When circular dependencies are detected:

1. **Identify the cycle**: Use `npm run deps:circular` to see the cycle
2. **Find shared code**: Identify what both modules need
3. **Extract to shared module**: Create new utility or service
4. **Update imports**: Both modules import from shared module
5. **Verify**: Run validation again

---

## Best Practices

1. ✅ **Always use `import type` for types**
2. ✅ **Keep modules focused and small**
3. ✅ **Use dependency injection for services**
4. ✅ **Prefer composition over deep inheritance**
5. ✅ **Run validation before committing**
6. ✅ **Review dependency changes in PRs**

---

## Related Documentation

- [Circular Dependencies Report](../diagnostics/CIRCULAR_DEPENDENCIES_REPORT.md)
- [Import Conventions](./IMPORT_CONVENTIONS.md)
- [Architecture Guidelines](../architecture/ARCHITECTURE.md)

---

**Last Updated**: 2025-01-15

