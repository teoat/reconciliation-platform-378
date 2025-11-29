# Import Conventions

**Last Updated**: 2025-01-15  
**Status**: Active  
**Purpose**: Document import path conventions and best practices

---

## Import Path Standards

### Absolute Imports (Required)

**All imports MUST use absolute paths with `@/` alias:**

```typescript
// ✅ DO: Use absolute imports
import { logger } from '@/services/logger';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/backend-aligned';
import { validateEmail } from '@/utils/common/validation';

// ❌ DON'T: Use relative imports
import { logger } from '../../services/logger';
import { Button } from '../ui/Button';
import type { User } from '../../../types/backend-aligned';
```

### Path Aliases

- `@/` → `frontend/src/`
- `@/components/` → `frontend/src/components/`
- `@/services/` → `frontend/src/services/`
- `@/utils/` → `frontend/src/utils/`
- `@/types/` → `frontend/src/types/`
- `@/hooks/` → `frontend/src/hooks/`
- `@/store/` → `frontend/src/store/`

---

## Import Organization

### Order of Imports

1. **External dependencies** (React, third-party libraries)
2. **Internal services** (logger, API clients)
3. **Internal utilities** (validation, formatting)
4. **Internal components** (UI components)
5. **Internal types** (type-only imports)
6. **Relative imports** (only for co-located files)

```typescript
// ✅ DO: Organized imports
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logger } from '@/services/logger';
import { validateEmail } from '@/utils/common/validation';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types/backend-aligned';
import type { ComponentProps } from './types';
```

### Type-Only Imports

**Use `import type` for type-only imports:**

```typescript
// ✅ DO: Type-only imports
import type { User } from '@/types/backend-aligned';
import type { ComponentProps } from './types';

// ❌ DON'T: Regular imports for types
import { User } from '@/types/backend-aligned';
```

---

## Barrel Exports

### When to Use Barrel Exports

Barrel exports (`index.ts`) are acceptable for:
- Utility modules (`@/utils/index.ts`)
- Component libraries (`@/components/ui/index.ts`)
- Type definitions (`@/types/index.ts`)

### Best Practices

1. **Keep barrel exports focused** - Don't export everything
2. **Use named exports** - Avoid default exports in barrels
3. **Document deprecated exports** - Mark deprecated exports clearly
4. **Avoid circular dependencies** - Be careful with barrel exports

```typescript
// ✅ DO: Focused barrel export
export { debounce, throttle, memoize } from './common/performance';
export { validateEmail, validatePassword } from './common/validation';

// ❌ DON'T: Export everything
export * from './module1';
export * from './module2';
export * from './module3';
```

---

## Circular Dependencies

### Detection

Circular dependencies are detected by:
- Feature registry (`frontend/src/features/registry.ts`)
- Enhanced feature tour (`frontend/src/components/ui/EnhancedFeatureTour.tsx`)
- TypeScript compiler warnings

### Prevention

1. **Use `import type` for type-only imports**
2. **Avoid barrel exports that create cycles**
3. **Extract shared types to separate files**
4. **Use dependency injection for services**

---

## Migration Guide

### Converting Relative to Absolute Imports

1. **Identify relative imports:**
   ```typescript
   import { something } from '../../utils/common';
   ```

2. **Count directory levels:**
   - `../` = one level up
   - `../../` = two levels up
   - `../../../` = three levels up

3. **Convert to absolute:**
   ```typescript
   import { something } from '@/utils/common';
   ```

### Automated Conversion

Use find/replace with regex:
- Pattern: `from ['"]\.\./`
- Replace: `from '@/`

---

## Validation

### Pre-Commit Checks

Import validation is enforced by:
- ESLint rules (if configured)
- TypeScript compiler
- Pre-commit hooks

### Manual Validation

Run import validation script:
```bash
./scripts/validate-imports.sh
```

---

## Related Documentation

- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md)
- [Code Quality Filters](../../.cursor/rules/code_quality_filters.mdc)
- [Import/Export Consistency Discovery](../diagnostics/IMPORT_EXPORT_CONSISTENCY_DISCOVERY.md)

---

**Last Updated**: 2025-01-15

