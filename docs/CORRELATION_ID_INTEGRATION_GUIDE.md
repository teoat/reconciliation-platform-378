# Correlation ID Integration Guide

Complete guide for integrating correlation IDs into error handling when Agent 1 completes Task 1.19.

## Status

**Backend Status**: ✅ Correlation ID middleware already exists (`backend/src/middleware/correlation_id.rs`)
- Extracts or generates correlation IDs
- Adds `X-Correlation-ID` header to all responses
- Ready for use

**Frontend Status**: ✅ All components and utilities ready
- Error extraction utilities ready
- All error components support correlation IDs
- Error history tracks correlation IDs
- Error reporting includes correlation IDs

## Integration Steps

### Step 1: Verify Backend Correlation IDs (After Agent 1 Task 1.19)

The backend middleware (`correlation_id.rs`) already:
- ✅ Extracts `X-Correlation-ID` from request headers
- ✅ Generates new correlation ID if missing
- ✅ Adds `X-Correlation-ID` to response headers
- ✅ Stores in request extensions

**Verify**: Test that correlation IDs appear in response headers:
```bash
curl -H "X-Correlation-ID: test-123" http://localhost:2000/api/test
# Response should include: X-Correlation-ID: test-123
```

### Step 2: Update Error Extraction (READY)

The `extractErrorFromApiResponse` utility already extracts correlation IDs:

```typescript
import { extractErrorFromApiResponse } from '@/utils/errorExtraction';

try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    const errorData = await response.json();
    const extracted = extractErrorFromApiResponse(
      { response: { status: response.status, data: errorData, headers: response.headers } },
      new Error('Request failed')
    );
    // extracted.correlationId will be populated from response.headers['X-Correlation-ID']
  }
} catch (error) {
  const extracted = extractErrorFromApiResponse(error);
  // extracted.correlationId available if error includes Response object
}
```

### Step 3: Use Async Extraction for Full Body Parsing

For extracting correlation IDs from response body (if backend also includes in body):

```typescript
import { extractErrorFromFetchResponseAsync } from '@/utils/errorExtractionAsync';

const response = await fetch('/api/data');
if (!response.ok) {
  const extracted = await extractErrorFromFetchResponseAsync(response);
  // extracted.correlationId from headers or response body
}
```

### Step 4: Integration with Error Management Hook

The `useErrorManagement` hook already supports correlation IDs:

```typescript
import { useErrorManagement } from '@/hooks/useErrorManagement';

const [state, actions, errorRecovery] = useErrorManagement({
  component: 'MyComponent',
});

// When error occurs:
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    const extracted = await extractErrorFromFetchResponseAsync(response);
    actions.setError(
      extracted.error,
      extracted.errorCode,
      extracted.correlationId // ✅ Ready!
    );
  }
} catch (error) {
  const extracted = await extractErrorFromFetchCall(fetch('/api/data'));
  actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);
}
```

### Step 5: Display Correlation IDs

All components already support correlation IDs:

```typescript
<UserFriendlyError
  error={state.currentError}
  errorCode={state.errorCode}
  correlationId={state.correlationId} // ✅ Ready!
  recoveryActions={errorRecovery.recoveryActions}
/>

<ErrorCodeDisplay
  errorCode={state.errorCode}
  correlationId={state.correlationId} // ✅ Ready!
/>

<ErrorHistory
  errors={state.errorHistory} // Includes correlation IDs automatically
/>

<ErrorReportingForm
  error={state.currentError}
  correlationId={state.correlationId} // ✅ Ready!
/>
```

## Testing Correlation ID Integration

### Test 1: Extract from Response Headers

```typescript
import { extractCorrelationIdFromResponse } from '@/utils/errorExtraction';

const headers = new Headers();
headers.set('X-Correlation-ID', 'corr-123');

const response = new Response(null, { headers });
const correlationId = extractCorrelationIdFromResponse(response);

expect(correlationId).toBe('corr-123');
```

### Test 2: Extract from Error Response

```typescript
import { extractErrorFromFetchResponseAsync } from '@/utils/errorExtractionAsync';

const headers = new Headers();
headers.set('X-Correlation-ID', 'corr-456');
headers.set('content-type', 'application/json');

const response = new Response(
  JSON.stringify({ message: 'Error', correlationId: 'corr-456' }),
  { status: 500, headers }
);

const extracted = await extractErrorFromFetchResponseAsync(response);
expect(extracted.correlationId).toBe('corr-456');
```

### Test 3: Integration Flow

```typescript
// Simulate API call with correlation ID in response
const response = await fetch('/api/data');
if (!response.ok) {
  const extracted = await extractErrorFromFetchResponseAsync(response);
  
  // Set error with correlation ID
  actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);
  
  // Verify correlation ID is stored
  expect(state.correlationId).toBe('corr-from-backend');
  
  // Verify correlation ID is displayed
  render(<UserFriendlyError {...state} />);
  expect(screen.getByText(/corr-from-backend/i)).toBeInTheDocument();
}
```

## Verification Checklist

After Agent 1 Task 1.19 completion:

- [ ] Backend returns `X-Correlation-ID` in response headers
- [ ] Frontend extracts correlation ID from response headers
- [ ] Correlation ID appears in `ErrorCodeDisplay` component
- [ ] Correlation ID appears in `UserFriendlyError` component
- [ ] Correlation ID is stored in error history
- [ ] Correlation ID is included in error reports
- [ ] Correlation ID is searchable in error history
- [ ] Tests pass for correlation ID extraction

## Quick Integration Example

Complete example ready for use:

```typescript
import { useErrorManagement } from '@/hooks/useErrorManagement';
import { extractErrorFromFetchResponseAsync } from '@/utils/errorExtractionAsync';
import { UserFriendlyError } from '@/components/ui';

const MyComponent = () => {
  const [state, actions] = useErrorManagement({
    component: 'MyComponent',
  });

  const handleApiCall = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        // Extract error with correlation ID
        const extracted = await extractErrorFromFetchResponseAsync(response);
        
        // Set error - correlation ID automatically included
        actions.setError(extracted.error, extracted.errorCode, extracted.correlationId);
      }
    } catch (error) {
      // Handle network errors
      actions.setError(error);
    }
  };

  return (
    <>
      {state.currentError && (
        <UserFriendlyError
          error={state.currentError}
          errorCode={state.errorCode}
          correlationId={state.correlationId} // ✅ Ready!
          onDismiss={actions.clearError}
        />
      )}
    </>
  );
};
```

## Summary

**Status**: ✅ **READY FOR CORRELATION ID INTEGRATION**

All components and utilities are ready:
- ✅ Error extraction utilities
- ✅ All error components
- ✅ Error management hook
- ✅ Error history tracking
- ✅ Error reporting

**Next Steps** (After Agent 1 Task 1.19):
1. Verify backend returns `X-Correlation-ID` header
2. Test correlation ID extraction (2-3 hours)
3. Update documentation with verification results

**Estimated Time**: 2-3 hours for verification and testing


