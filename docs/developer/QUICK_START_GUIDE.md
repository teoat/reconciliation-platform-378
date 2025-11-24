# Quick Start Guide for Agents

**Last Updated**: January 2025  
**Status**: ✅ Active Reference

## Overview

This guide provides quick reference for common tasks agents need to complete. Use this as a cheat sheet for accelerating TODO completion.

## Common Tasks

### 1. Create Component Tests

**Quick Command**:
```bash
./scripts/generate-component-test.sh ComponentName [component/path]
```

**Example**:
```bash
./scripts/generate-component-test.sh UserProfile components/user
./scripts/generate-component-test.sh Dashboard components/dashboard
```

**Manual Template**: `frontend/src/__tests__/example-component.test.tsx`

### 2. Create Playwright E2E Tests

**Quick Command**:
```bash
./scripts/generate-playwright-test.sh TestName [feature|auth|navigation]
```

**Examples**:
```bash
./scripts/generate-playwright-test.sh ProjectCreation feature
./scripts/generate-playwright-test.sh LoginFlow auth
./scripts/generate-playwright-test.sh MainNavigation navigation
```

**Test Location**: `e2e/tests/`

### 3. Create Backend Handlers

**Quick Command**:
```bash
./scripts/generate-backend-handler.sh HandlerName [resource_name]
```

**Example**:
```bash
./scripts/generate-backend-handler.sh Projects projects
```

**Then**:
1. Add to `backend/src/handlers/mod.rs`
2. Register routes
3. Implement business logic

### 4. Organize Components

**Use Script**:
```bash
./scripts/component-organization-helper.sh
```

**Manual Steps** (from plan):
1. Create directory: `components/[category]/`
2. Move files
3. Update imports
4. Update `components/index.tsx`

**Plan**: `docs/refactoring/COMPONENT_ORGANIZATION_IMPLEMENTATION_PLAN.md`

### 5. Run Database Migrations

**Quick Command**:
```bash
./scripts/execute-migrations.sh
```

**Manual**:
```bash
cd backend && diesel migration run
```

**Guide**: `docs/operations/DATABASE_MIGRATION_GUIDE.md`

### 6. Analyze Test Coverage

**Quick Command**:
```bash
./scripts/test-coverage-audit-enhanced.sh
```

**Frontend Only**:
```bash
cd frontend && npm run test:coverage
```

**Backend Only**:
```bash
cd backend && cargo tarpaulin
```

### 7. Analyze Bundle Size

**Quick Command**:
```bash
./scripts/analyze-bundle-size.sh
```

**Output**: `frontend/dist/stats.html`

### 8. Verify Backend Health

**Quick Command**:
```bash
./scripts/verify-backend-health.sh
```

**Manual**:
```bash
curl http://localhost:2000/health
```

## Test Templates

### Component Test Structure
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
```

### Service Test Structure
```typescript
import { describe, it, expect } from 'vitest';
import { serviceName } from '@/services/serviceName';

describe('serviceName', () => {
  it('should perform operation', () => {
    const result = serviceName.operation();
    expect(result).toBeDefined();
  });
});
```

### Playwright Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('should complete workflow', async ({ page }) => {
  await page.goto('/path');
  await page.click('[data-testid="button"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## Component Organization

### Categories
- `components/auth/` - Authentication components
- `components/dashboard/` - Dashboard components
- `components/files/` - File management
- `components/workflow/` - Workflow components
- `components/collaboration/` - Collaboration features
- `components/reports/` - Reporting components
- `components/security/` - Security components
- `components/api/` - API development components

### Moving Components
1. Create directory if needed
2. Move file: `mv Component.tsx components/category/`
3. Update imports in moved file
4. Update all imports across codebase
5. Update `components/index.tsx` if needed
6. Test

## API Endpoint Pattern

### Handler Structure
```rust
//! Handler module
use actix_web::{web, HttpResponse, Result};
use crate::errors::AppError;
use crate::handlers::types::ApiResponse;

pub async fn get_resource(path: web::Path<i32>) -> Result<HttpResponse, AppError> {
    // Implementation
    Ok(HttpResponse::Ok().json(ApiResponse { ... }))
}
```

### Registration
```rust
// In handlers/mod.rs
pub mod handler_name;

// In route configuration
.service(web::scope("/api/resource")
    .route("", web::get().to(handler_name::get_resource)))
```

## Testing Checklist

### Component Tests
- [ ] Renders correctly
- [ ] Handles user interactions
- [ ] Handles errors
- [ ] Is accessible
- [ ] Handles loading states
- [ ] Handles empty states

### Service Tests
- [ ] Performs operations correctly
- [ ] Handles errors
- [ ] Validates input
- [ ] Returns expected format

### E2E Tests
- [ ] Complete user workflow
- [ ] Error scenarios
- [ ] Edge cases
- [ ] Accessibility

## Common Patterns

### React Component
```typescript
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export const ComponentName: React.FC<Props> = ({ prop }) => {
  const { user } = useAuth();
  
  return <div>{/* Component JSX */}</div>;
};
```

### Custom Hook
```typescript
import { useState, useEffect } from 'react';

export const useCustomHook = () => {
  const [state, setState] = useState();
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  return { state, setState };
};
```

### Service Method
```typescript
class ServiceName {
  async method(param: string): Promise<Result> {
    try {
      const response = await apiClient.get(`/endpoint/${param}`);
      return response.data;
    } catch (error) {
      throw new Error('Operation failed');
    }
  }
}
```

## Documentation

### Adding JSDoc
```typescript
/**
 * Component description
 * 
 * @component
 * @example
 * ```tsx
 * <ComponentName prop="value" />
 * ```
 */
```

### Updating Status
When completing a TODO:
1. Update `docs/UNIMPLEMENTED_TODOS_AND_RECOMMENDATIONS.md`
2. Mark as `✅ COMPLETE`
3. Add completion date/notes
4. Update related documentation

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `generate-component-test.sh` | Generate component tests | `./scripts/generate-component-test.sh Name` |
| `generate-playwright-test.sh` | Generate E2E tests | `./scripts/generate-playwright-test.sh Name` |
| `generate-backend-handler.sh` | Generate handlers | `./scripts/generate-backend-handler.sh Name` |
| `component-organization-helper.sh` | Component organization | `./scripts/component-organization-helper.sh` |
| `test-coverage-audit-enhanced.sh` | Coverage analysis | `./scripts/test-coverage-audit-enhanced.sh` |
| `analyze-bundle-size.sh` | Bundle analysis | `./scripts/analyze-bundle-size.sh` |
| `execute-migrations.sh` | Run migrations | `./scripts/execute-migrations.sh` |
| `verify-backend-health.sh` | Health check | `./scripts/verify-backend-health.sh` |

## Related Documentation

- [Test Templates Guide](../testing/TEST_TEMPLATES_GUIDE.md)
- [Test Utilities Guide](../testing/TEST_UTILITIES_GUIDE.md)
- [Component Organization Plan](../refactoring/COMPONENT_ORGANIZATION_IMPLEMENTATION_PLAN.md)
- [Database Migration Guide](../operations/DATABASE_MIGRATION_GUIDE.md)
- [API Design Rules](../../.cursor/rules/api_design.mdc)
- [Testing Rules](../../.cursor/rules/testing.mdc)

