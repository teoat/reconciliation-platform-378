# Barrel Exports Guide

**Last Updated**: 2025-01-15  
**Status**: Active

## Overview

This guide documents the barrel export patterns used in the reconciliation platform codebase. Barrel exports (index files that re-export modules) help organize code and provide convenient import paths.

## Principles

1. **Single Source of Truth (SSOT)**: Each module should be exported from exactly one barrel file
2. **Domain Organization**: Group exports by domain/feature area
3. **Documentation**: Document deprecated exports and migration paths
4. **Performance**: Avoid deep barrel export chains that impact bundle size

## Barrel Export Locations

### Frontend

#### `frontend/src/utils/index.ts`
- **Purpose**: Central export for all utility functions
- **Organization**: Organized by domain (performance, error handling, security, etc.)
- **Pattern**: Named exports grouped by category
- **Deprecated**: Some legacy exports marked with comments
- **Status**: ✅ Well-organized, documented

#### `frontend/src/hooks/index.ts`
- **Purpose**: Export custom React hooks
- **Organization**: Error management hooks grouped together
- **Pattern**: Named exports with type exports
- **Status**: ✅ Well-organized

#### `frontend/src/components/index.tsx`
- **Purpose**: Export UI and feature components
- **Organization**: Grouped by category (UI, Layout, Features, etc.)
- **Pattern**: Re-exports from subdirectories
- **Status**: ✅ Well-organized

#### `frontend/src/services/index.ts`
- **Purpose**: Export service layer modules
- **Organization**: Grouped by service type
- **Status**: ✅ Well-organized

## Best Practices

### ✅ DO

1. **Group Related Exports**: Organize exports by domain/feature
2. **Document Deprecated Exports**: Add comments for deprecated exports
3. **Use Named Exports**: Prefer named exports over default exports
4. **Export Types Separately**: Export types in a separate section
5. **Add Comments**: Document the purpose of each export group

### ❌ DON'T

1. **Deep Nesting**: Avoid barrel files that import from other barrel files
2. **Circular Dependencies**: Ensure barrel exports don't create cycles
3. **Unused Exports**: Remove exports that are no longer used
4. **Default Exports in Barrels**: Prefer named exports for better tree-shaking

## Migration Guide

When deprecating an export:

1. Add a comment indicating the export is deprecated
2. Document the new import path
3. Add a deprecation date
4. Remove after a reasonable migration period

Example:
```typescript
// Deprecated: Use @/utils/common/errorHandling instead
// export * from './errorExtraction'; // REMOVED - use common/errorHandling
```

## Related Documentation

- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md)
- [Import Conventions](./IMPORT_CONVENTIONS.md)

