# Custom Hooks Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

This guide documents all custom hooks available in the frontend application. Hooks provide reusable logic and state management for React components.

## Table of Contents

- [Error Management Hooks](#error-management-hooks)
- [API Hooks](#api-hooks)
- [Form Hooks](#form-hooks)
- [Performance Hooks](#performance-hooks)
- [Accessibility Hooks](#accessibility-hooks)
- [Reconciliation Hooks](#reconciliation-hooks)

## Error Management Hooks

### useErrorManagement

Comprehensive error management hook integrating error handling, history, and reporting.

```typescript
import { useErrorManagement } from '@/hooks/useErrorManagement';

function MyComponent() {
  const [errorState, errorActions, errorRecovery] = useErrorManagement({
    component: 'MyComponent',
    action: 'fetchData',
    enableErrorHistory: true,
    enableErrorReporting: true,
  });

  const handleError = () => {
    errorActions.setError(new Error('Something went wrong'), 'ERROR_CODE', 'corr-123');
  };

  return (
    <div>
      {errorState.currentError && (
        <div>Error: {errorState.currentError.message}</div>
      )}
      <button onClick={handleError}>Trigger Error</button>
    </div>
  );
}
```

**Options:**
- `component?: string` - Component name for context
- `action?: string` - Action name for context
- `maxHistoryItems?: number` - Max items in error history (default: 50)
- `enableErrorHistory?: boolean` - Enable error history (default: true)
- `enableErrorReporting?: boolean` - Enable error reporting (default: true)

**Returns:**
- `[ErrorManagementState, ErrorManagementActions, ErrorRecovery]`

### useErrorRecovery

Hook for error recovery with retry logic.

```typescript
import { useErrorRecovery } from '@/hooks/useErrorRecovery';

function MyComponent() {
  const errorRecovery = useErrorRecovery({
    error: currentError,
    context: { component: 'MyComponent' },
    onRetry: () => refetchData(),
    onReset: () => clearError(),
  });

  return (
    <div>
      {errorRecovery.canRetry && (
        <button onClick={errorRecovery.retry}>Retry</button>
      )}
    </div>
  );
}
```

## API Hooks

### useAuthAPI

Authentication API hook with Redux integration.

```typescript
import { useAuthAPI } from '@/hooks/useApiEnhanced';

function LoginForm() {
  const { login, logout, user, isAuthenticated, isLoading } = useAuthAPI();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password');
    if (result.success) {
      console.log('Logged in!');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>Welcome, {user?.email}</div>
      ) : (
        <button onClick={handleLogin} disabled={isLoading}>
          Login
        </button>
      )}
    </div>
  );
}
```

### useApiEnhanced

Enhanced API hooks with automatic Redux state management.

```typescript
import { useProjectsAPI } from '@/hooks/useApiEnhanced';

function ProjectsList() {
  const { projects, isLoading, fetchProjects, createProject } = useProjectsAPI();

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        projects.map(project => <div key={project.id}>{project.name}</div>)
      )}
    </div>
  );
}
```

## Form Hooks

### useForm

Form state management hook with validation.

```typescript
import { useForm } from '@/hooks/useForm';

function MyForm() {
  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: { name: '', email: '' },
    validate: (values) => {
      const errors = {};
      if (!values.name) errors.name = 'Name is required';
      if (!values.email) errors.email = 'Email is required';
      return errors;
    },
    onSubmit: async (values) => {
      await submitForm(values);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={values.name}
        onChange={handleChange}
      />
      {errors.name && <div>{errors.name}</div>}
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

## Performance Hooks

### useDebounce

Debounce values to prevent excessive updates.

```typescript
import { useDebounce } from '@/hooks/useDebounce';

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### useStaleWhileRevalidate

Cache data with stale-while-revalidate pattern.

```typescript
import { useStaleWhileRevalidate } from '@/hooks/useStaleWhileRevalidate';

function DataComponent() {
  const { data, isLoading, error } = useStaleWhileRevalidate(
    '/api/data',
    { staleTime: 5000, cacheTime: 30000 }
  );

  return (
    <div>
      {isLoading && !data ? (
        <div>Loading...</div>
      ) : (
        <div>{JSON.stringify(data)}</div>
      )}
    </div>
  );
}
```

## Accessibility Hooks

### useKeyboardNavigation

Keyboard navigation support for components.

```typescript
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

function ListComponent({ items }) {
  const { focusedIndex, handleKeyDown } = useKeyboardNavigation({
    items,
    onSelect: (item) => console.log('Selected:', item),
  });

  return (
    <ul onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          className={index === focusedIndex ? 'focused' : ''}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### useFocusTrap

Trap focus within a component (useful for modals).

```typescript
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose }) {
  const trapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div ref={trapRef} className="modal">
      <button onClick={onClose}>Close</button>
      {/* Focus is trapped within this div */}
    </div>
  );
}
```

## Reconciliation Hooks

### useReconciliationEngine

Reconciliation engine hook for matching logic.

```typescript
import { useReconciliationEngine } from '@/hooks/reconciliation/useReconciliationEngine';

function ReconciliationComponent() {
  const { matches, isLoading, runMatching } = useReconciliationEngine();

  const handleMatch = async () => {
    await runMatching({
      sourceData: sourceData,
      targetData: targetData,
      rules: matchingRules,
    });
  };

  return (
    <div>
      <button onClick={handleMatch} disabled={isLoading}>
        Run Matching
      </button>
      {matches.map(match => (
        <div key={match.id}>{match.confidence}</div>
      ))}
    </div>
  );
}
```

## Best Practices

1. **Use hooks for reusable logic**: Extract common patterns into hooks
2. **Memoize callbacks**: Use `useCallback` for stable function references
3. **Handle loading states**: Always provide loading indicators
4. **Error handling**: Use error management hooks for consistent error handling
5. **Type safety**: Always type hook parameters and return values

## Related Documentation

- [Services Guide](./SERVICES_GUIDE.md)
- [Component Optimization Guide](./COMPONENT_OPTIMIZATION_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)

