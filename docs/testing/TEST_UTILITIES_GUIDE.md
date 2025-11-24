# Test Utilities Guide

**Last Updated**: January 2025  
**Status**: ✅ Utilities Created

## Overview

Test utilities have been created to help agents write tests quickly and consistently.

## Available Utilities

**File**: `frontend/src/utils/testUtils.tsx`

### 1. `createTestStore()`
Creates a Redux test store with minimal configuration.

**Usage**:
```typescript
import { createTestStore } from '@/utils/testUtils';

const store = createTestStore({
  // preloadedState
});
```

### 2. `renderWithProviders()`
Custom render function that includes Redux Provider and Router.

**Usage**:
```typescript
import { renderWithProviders } from '@/utils/testUtils';

const { store } = renderWithProviders(<MyComponent />, {
  preloadedState: { /* ... */ }
});
```

### 3. `createMockResponse()`
Creates a mock fetch Response object.

**Usage**:
```typescript
import { createMockResponse } from '@/utils/testUtils';

global.fetch = vi.fn().mockResolvedValue(
  createMockResponse({ data: 'test' })
);
```

### 4. `waitForAsync()`
Helper for waiting for async operations in tests.

**Usage**:
```typescript
import { waitForAsync } from '@/utils/testUtils';

await waitForAsync();
expect(screen.getByText('Loaded')).toBeInTheDocument();
```

### 5. `createMockLocalStorage()`
Creates a mock localStorage implementation.

**Usage**:
```typescript
import { createMockLocalStorage } from '@/utils/testUtils';

const mockStorage = createMockLocalStorage();
Object.defineProperty(window, 'localStorage', {
  value: mockStorage
});
```

### 6. `mockLocation()`
Mocks window.location.pathname.

**Usage**:
```typescript
import { mockLocation } from '@/utils/testUtils';

mockLocation('/projects/123');
```

### 7. `createMockError()`
Creates a mock Error object with optional code.

**Usage**:
```typescript
import { createMockError } from '@/utils/testUtils';

const error = createMockError('Test error', 'ERROR_CODE');
```

## Example Usage

### Component Test with Providers
```typescript
import { renderWithProviders } from '@/utils/testUtils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { container } = renderWithProviders(<MyComponent />);
    expect(container).toBeInTheDocument();
  });
});
```

### Service Test with Mock API
```typescript
import { createMockResponse } from '@/utils/testUtils';

describe('MyService', () => {
  it('fetches data', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createMockResponse({ data: 'test' })
    );
    
    const result = await MyService.fetchData();
    expect(result).toEqual({ data: 'test' });
  });
});
```

## Related Documentation

- [Test Templates Guide](TEST_TEMPLATES_GUIDE.md)
- [Test Coverage Plan](TEST_COVERAGE_PLAN.md)
- [Testing Status](TESTING_STATUS.md)

