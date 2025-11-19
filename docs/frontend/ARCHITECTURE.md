# Frontend Architecture

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document describes the architecture of the frontend application, including component structure, state management, service layer, and data flow.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Pages   │  │   UI     │  │  Layout   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
├─────────────────────────────────────────────────────────────┤
│  Hooks Layer                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │   API    │  │  Error   │  │   Form   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
├─────────────────────────────────────────────────────────────┤
│  State Management (Redux)                                   │
│  ┌──────────────────────────────────────────┐             │
│  │         unifiedStore.ts                  │             │
│  │  - Auth, Projects, Reconciliation, UI   │             │
│  └──────────────────────────────────────────┘             │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │   API    │  │  Error    │  │  Retry   │                │
│  │  Client  │  │  Service  │  │ Service  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
├─────────────────────────────────────────────────────────────┤
│  Backend API                                                │
│  ┌──────────────────────────────────────────┐             │
│  │         REST API + WebSocket             │             │
│  └──────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### Pages
Located in `components/pages/` - Top-level route components
- `Dashboard.tsx` - Main dashboard
- `ProjectsPage.tsx` - Projects listing
- `ReconciliationDetailPage.tsx` - Reconciliation details

### UI Components
Located in `components/ui/` - Reusable UI components
- `Button.tsx` - Button component (optimized with React.memo)
- `Modal.tsx` - Modal dialog
- `DataTable.tsx` - Data table with virtualization

### Layout Components
Located in `components/layout/` - Layout components
- `AppShell.tsx` - Main app shell
- `UnifiedNavigation.tsx` - Navigation component

## State Management

### Redux Store (`unifiedStore.ts`)

Single source of truth for application state:

```typescript
{
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
  },
  projects: {
    items: Project[];
    selectedProject: Project | null;
  },
  reconciliation: {
    records: ReconciliationRecord[];
    matches: ReconciliationMatch[];
    jobs: ReconciliationJob[];
  },
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
  }
}
```

### State Flow

1. **Component** dispatches action
2. **Redux** updates state
3. **Component** re-renders with new state
4. **Services** handle side effects (API calls)

## Service Layer

### API Client
- Handles all HTTP requests
- Manages authentication tokens
- Provides interceptors for logging/error handling

### Error Service
- Unified error handling
- Error translation
- Error context tracking

### Retry Service
- Exponential backoff
- Circuit breaker pattern
- Retry logic

## Data Flow

### Reading Data
```
Component → Hook → Redux Selector → State
```

### Writing Data
```
Component → Hook → Redux Action → Service → API → Backend
                                      ↓
                                   Redux Update
```

## Performance Optimizations

### Code Splitting
- Route-based lazy loading
- Component lazy loading for heavy components
- Vendor chunk splitting

### Memoization
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable function references

### Virtualization
- Virtual scrolling for large lists
- Virtual tables for data grids

## Security

### Content Security Policy (CSP)
- Nonce-based CSP for inline scripts
- Strict CSP headers

### Input Validation
- Client-side validation
- Sanitization with DOMPurify
- XSS protection

### Authentication
- JWT token management
- Token refresh mechanism
- Secure storage for tokens

## Testing Strategy

### Unit Tests
- Component tests with React Testing Library
- Hook tests
- Service tests

### Integration Tests
- Redux integration tests
- API integration tests

### E2E Tests
- Playwright for browser automation
- Accessibility tests
- Performance tests

## Build & Deployment

### Build Process
1. TypeScript compilation
2. Vite bundling with code splitting
3. Asset optimization
4. Bundle analysis

### Bundle Optimization
- Tree shaking
- Minification
- Compression
- Chunk splitting

## Related Documentation

- [Services Guide](./SERVICES_GUIDE.md)
- [Hooks Guide](./HOOKS_GUIDE.md)
- [Component Optimization Guide](./COMPONENT_OPTIMIZATION_GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)

