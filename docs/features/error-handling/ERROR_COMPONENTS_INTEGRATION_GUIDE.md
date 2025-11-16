# Error Components Integration Guide

Complete guide for integrating error handling components in your application.

## Quick Start

### 1. Import Components and Hooks

```typescript
import {
  UserFriendlyError,
  ErrorHistory,
  ErrorReportingForm,
  ServiceDegradedBanner,
  FallbackContent,
  CircuitBreakerStatus,
} from '@/components/ui';

import { useErrorManagement } from '@/hooks/useErrorManagement';
import { extractErrorFromApiResponse } from '@/utils/errorExtraction';
```

### 2. Use the Hook

```typescript
const [state, actions, errorRecovery] = useErrorManagement({
  component: 'MyComponent',
  action: 'fetch-data',
  maxHistoryItems: 20,
  enableErrorHistory: true,
  enableErrorReporting: true,
});
```

### 3. Handle API Errors

```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    const errorData = await response.json();
    const extracted = extractErrorFromApiResponse(
      { response: { status: response.status, data: errorData } },
      new Error('API request failed')
    );
    actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);
  }
} catch (error) {
  const extracted = extractErrorFromApiResponse(error);
  actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);
}
```

### 4. Display Error

```typescript
{state.currentError && (
  <UserFriendlyError
    error={state.currentError}
    errorCode={state.errorCode}
    correlationId={state.correlationId}
    recoveryActions={errorRecovery.recoveryActions}
    suggestions={errorRecovery.suggestions}
    onDismiss={actions.clearError}
  />
)}
```

## Integration Patterns

### Pattern 1: Basic Error Handling

```typescript
const [state, actions] = useErrorManagement({
  component: 'MyComponent',
});

try {
  await apiCall();
} catch (error) {
  actions.setError(error);
}

return (
  <>
    {state.currentError && (
      <UserFriendlyError
        error={state.currentError}
        onDismiss={actions.clearError}
      />
    )}
  </>
);
```

### Pattern 2: API Error with Correlation IDs

```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    const extracted = extractErrorFromApiResponse(
      await response.json(),
      new Error('Request failed')
    );
    actions.setError(
      extracted.error,
      extracted.errorCode,
      extracted.correlationId // Ready for Agent 1 Task 1.19
    );
  }
} catch (error) {
  const extracted = extractErrorFromApiResponse(error);
  actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);
}
```

### Pattern 3: Circuit Breaker Integration

```typescript
const [serviceStatus, setServiceStatus] = useState<'open' | 'closed'>('closed');

// On API failure
if (response.status >= 500) {
  setServiceStatus('open');
}

// Display service status
{serviceStatus === 'open' && (
  <ServiceDegradedBanner
    service="Data API"
    status={serviceStatus}
    onRetry={handleRetry}
  />
)}
```

## Complete Example

See `frontend/src/components/pages/ErrorHandlingExample.tsx` for a complete integration example.

## Testing

All components have comprehensive tests in `frontend/src/components/ui/__tests__/`.

Run tests:
```bash
npm test -- ErrorComponent
```

## Accessibility

All components are WCAG 2.1 AA compliant with:
- ARIA labels and descriptions
- Screen reader announcements
- Keyboard navigation
- Focus management

## Ready for Correlation IDs

All components are ready for correlation ID integration when Agent 1 completes Task 1.19. The `extractErrorFromApiResponse` utility will automatically extract correlation IDs from API responses.

