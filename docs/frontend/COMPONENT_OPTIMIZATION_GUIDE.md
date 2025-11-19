# Component Optimization Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

This guide provides best practices for optimizing React components to improve performance and user experience.

## React.memo Optimization

### When to Use React.memo

Use `React.memo` for components that:
- Receive props that don't change frequently
- Are expensive to render
- Are rendered often in lists
- Have stable props

### Example: Optimized Button Component

```tsx
import React, { memo, forwardRef } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(({ variant, onClick, children }, ref) => {
    return (
      <button ref={ref} className={`btn btn-${variant}`} onClick={onClick}>
        {children}
      </button>
    );
  })
);

Button.displayName = 'Button';
```

### When NOT to Use React.memo

Avoid `React.memo` for:
- Components with frequently changing props
- Very simple components (overhead may exceed benefit)
- Components that always receive new object/array props

## useMemo and useCallback

### useMemo for Expensive Calculations

```tsx
import { useMemo } from 'react';

function ExpensiveComponent({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  return <div>{filteredItems.map(item => <Item key={item.id} data={item} />)}</div>;
}
```

### useCallback for Stable Function References

```tsx
import { useCallback } from 'react';

function ParentComponent({ items }) {
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <div>
      {items.map(item => (
        <ChildComponent key={item.id} onClick={handleClick} />
      ))}
    </div>
  );
}
```

## Code Splitting

### Lazy Loading Components

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Route-Based Code Splitting

```tsx
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
    </Routes>
  );
}
```

## Component Splitting

### Large Component Example

**Before** (Large component):
```tsx
function Dashboard() {
  // 500+ lines of code
  return (
    <div>
      {/* Many sections */}
    </div>
  );
}
```

**After** (Split into smaller components):
```tsx
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardMetrics />
      <DashboardCharts />
      <DashboardActions />
    </div>
  );
}
```

## Performance Monitoring

### React DevTools Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Record a session
4. Analyze component render times

### Performance Best Practices

1. **Avoid inline object/array creation in render**
   ```tsx
   // ❌ Bad
   <Component style={{ margin: 10 }} items={[1, 2, 3]} />
   
   // ✅ Good
   const style = { margin: 10 };
   const items = [1, 2, 3];
   <Component style={style} items={items} />
   ```

2. **Use keys properly in lists**
   ```tsx
   // ✅ Good
   {items.map(item => <Item key={item.id} data={item} />)}
   ```

3. **Avoid unnecessary state updates**
   ```tsx
   // ❌ Bad
   setState({ ...state, count: state.count + 1 });
   
   // ✅ Good
   setState(prev => ({ ...prev, count: prev.count + 1 }));
   ```

## Identified Components for Optimization

### High Priority:
- `FrenlyAI.tsx` - Split into sub-components
- `ConversationalInterface.tsx` - Extract message list, input, etc.
- `ReconciliationInterface.tsx` - Split into sections
- `WorkflowOrchestrator.tsx` - Extract stage components

### Medium Priority:
- `AnalyticsDashboard.tsx` - Already uses lazy loading (good!)
- Large form components - Extract field groups

## Related Documentation

- [Services Guide](./SERVICES_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)

