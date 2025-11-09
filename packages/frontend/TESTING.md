# Frontend Testing Documentation

## Overview

This document describes the testing setup and strategy for the Reconciliation Platform frontend application.

## Testing Framework

We use **Vitest** as our primary testing framework, which provides:
- Fast test execution
- Built-in TypeScript support
- Jest-compatible API
- Coverage reporting
- UI for test debugging

## Test Structure

```
src/
├── test/
│   ├── setup.ts          # Test setup and global mocks
│   ├── utils.tsx          # Test utilities and helpers
│   └── vitest.config.ts   # Test configuration
├── components/
│   ├── ui/
│   │   └── __tests__/
│   │       ├── Button.test.tsx
│   │       └── Input.test.tsx
│   └── pages/
│       └── __tests__/
│           └── AuthPage.test.tsx
├── hooks/
│   └── __tests__/
│       ├── useAuth.test.tsx
│       └── useForm.test.tsx
├── services/
│   └── __tests__/
│       └── apiClient.test.ts
└── store/
    └── __tests__/
        └── store.test.ts
```

## Test Categories

### 1. Unit Tests
- **Components**: Test individual UI components in isolation
- **Hooks**: Test custom React hooks
- **Utilities**: Test helper functions and utilities
- **Services**: Test API client and service layer

### 2. Integration Tests
- **Redux Store**: Test state management and reducers
- **Form Handling**: Test form validation and submission
- **API Integration**: Test API client with mocked responses

### 3. Component Tests
- **UI Components**: Test rendering, props, and user interactions
- **Page Components**: Test complete page functionality
- **Layout Components**: Test responsive behavior and accessibility

## Test Utilities

### Custom Render Function
```typescript
import { render } from '../test/utils'

// Renders component with all necessary providers
render(<Component />, { initialState: mockState })
```

### Mock Data Factories
```typescript
import { createMockUser, createMockProject } from '../test/utils'

const user = createMockUser({ email: 'test@example.com' })
const project = createMockProject({ name: 'Test Project' })
```

### Mock Hooks
```typescript
import { mockUseAuth, mockUseApi } from '../test/utils'

const mockAuth = mockUseAuth({ user: mockUser })
const mockApi = mockUseApi({ data: mockData })
```

## Running Tests

### Commands
```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test Button.test.tsx

# Run tests in watch mode
npm run test -- --watch
```

### Test Script
Use the provided test runner script:
```bash
./run-tests.sh
```

## Test Coverage

We aim for:
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

Coverage reports are generated in the `coverage/` directory.

## Mocking Strategy

### Global Mocks
- **IntersectionObserver**: For intersection-based hooks
- **ResizeObserver**: For resize-based hooks
- **matchMedia**: For responsive design tests
- **localStorage/sessionStorage**: For persistence tests
- **fetch**: For API calls
- **WebSocket**: For real-time features

### Component Mocks
- Mock external dependencies
- Mock complex child components
- Mock API calls and data fetching

### Hook Mocks
- Mock custom hooks with predictable behavior
- Mock external library hooks
- Mock context providers

## Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe` blocks
- Follow AAA pattern: Arrange, Act, Assert

### 2. Test Data
- Use factory functions for consistent test data
- Keep test data minimal and focused
- Use realistic data when possible

### 3. Assertions
- Test behavior, not implementation
- Use specific assertions
- Test error cases and edge cases

### 4. Cleanup
- Clean up after each test
- Reset mocks between tests
- Clear timers and intervals

## Example Test Cases

### Component Test
```typescript
describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Hook Test
```typescript
describe('useAuth Hook', () => {
  it('should handle successful login', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      const response = await result.current.login('test@example.com', 'password')
      expect(response.success).toBe(true)
    })
  })
})
```

### Redux Test
```typescript
describe('Auth Slice', () => {
  it('should handle login success', () => {
    const user = createMockUser()
    const action = authSlice.actions.loginSuccess({ user, token: 'token' })
    
    store.dispatch(action)
    
    const state = store.getState().auth
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
  })
})
```

## Continuous Integration

Tests are automatically run on:
- Pull request creation
- Push to main branch
- Scheduled nightly runs

## Debugging Tests

### Using Test UI
```bash
npm run test:ui
```
Opens a web interface for debugging tests.

### Debugging in VS Code
Install the Vitest extension for integrated debugging.

### Console Logging
Use `console.log` in tests for debugging (removed in production builds).

## Performance Testing

### Test Performance
- Tests should run quickly (< 5 seconds for full suite)
- Use `vi.hoisted()` for expensive setup
- Mock heavy dependencies

### Component Performance
- Test rendering performance
- Test re-render optimization
- Test memory leaks

## Accessibility Testing

### Automated Testing
- Use `@testing-library/jest-dom` matchers
- Test ARIA attributes
- Test keyboard navigation

### Manual Testing
- Test with screen readers
- Test keyboard-only navigation
- Test high contrast mode

## Future Improvements

1. **E2E Testing**: Add Playwright for end-to-end tests
2. **Visual Testing**: Add visual regression tests
3. **Performance Testing**: Add performance benchmarks
4. **Accessibility Testing**: Add automated a11y tests
5. **Test Data Management**: Improve test data factories
6. **Test Parallelization**: Optimize test execution speed
