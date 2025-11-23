# Test Templates Guide

**Last Updated**: January 2025  
**Status**: ✅ Templates Created

## Overview

Test templates have been created to help agents write tests quickly and consistently.

## Available Templates

### 1. Component Test Template
**File**: `frontend/src/__tests__/example-component.test.tsx`

**Use for**: React component testing

**Features**:
- React Testing Library setup
- User interaction testing
- Async operation handling
- Router setup example

**Usage**:
```typescript
// Copy example-component.test.tsx and modify for your component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
// ... your component imports
```

### 2. Service Test Template
**File**: `frontend/src/__tests__/example-service.test.ts`

**Use for**: Service/utility function testing

**Features**:
- Basic operation testing
- Error handling tests
- Input validation tests

**Usage**:
```typescript
// Copy example-service.test.ts and modify for your service
import { describe, it, expect } from 'vitest';
// ... your service imports
```

## Test Coverage Targets

### Critical Paths (100%)
- Authentication flows
- Data integrity operations
- Security-critical functions

### Core Features (80%)
- Business logic
- API services
- Data processing

### Utilities (70%)
- Helper functions
- Validation utilities

### UI Components (60%)
- Visual components
- Form components

## Running Tests

### Frontend
```bash
cd frontend
npm run test              # Run tests
npm run test:coverage     # Run with coverage
npm run test:watch        # Watch mode
```

### Backend
```bash
cd backend
cargo test                # Run all tests
cargo test --lib          # Run unit tests only
cargo tarpaulin           # Run with coverage
```

## Test Organization

### Frontend
```
frontend/src/__tests__/
├── components/          # Component tests
├── services/            # Service tests
├── hooks/              # Hook tests
└── utils/              # Utility tests
```

### Backend
```
backend/src/
├── [module].rs         # Unit tests in #[cfg(test)] mod tests
backend/tests/
├── integration_tests.rs # Integration tests
└── api_tests.rs        # API endpoint tests
```

## Best Practices

1. **Test Behavior, Not Implementation**: Test what the component does, not how it does it
2. **Use Descriptive Names**: `test_user_can_login_with_valid_credentials`
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Mock API calls, timers, etc.
5. **Test Edge Cases**: Empty states, error states, boundary conditions
6. **Keep Tests Fast**: Avoid slow operations in tests
7. **Test Accessibility**: Use `getByRole`, `getByLabelText`, etc.

## Example Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should render correctly', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle user interaction', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle errors', () => {
    // Arrange
    // Act & Assert
  });
});
```

## Related Documentation

- [Test Coverage Plan](TEST_COVERAGE_PLAN.md)
- [Testing Status](TESTING_STATUS.md)
- [Coverage Integration](COVERAGE_INTEGRATION.md)

