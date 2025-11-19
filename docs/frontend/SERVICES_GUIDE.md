# Frontend Services Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

This guide provides comprehensive documentation for all frontend services. All services should be imported from `@/services` (the unified service registry).

## Table of Contents

- [Error Handling Services](#error-handling-services)
- [Retry & Resilience Services](#retry--resilience-services)
- [Storage & Persistence Services](#storage--persistence-services)
- [API Client Services](#api-client-services)
- [UI Services](#ui-services)
- [Security Services](#security-services)

## Error Handling Services

### Unified Error Service

Single source of truth for all error handling. Integrates error parsing, translation, and context tracking.

```typescript
import { unifiedErrorService } from '@/services';

// Handle error with logging and context
unifiedErrorService.handleError(error, {
  component: 'LoginForm',
  action: 'login',
  userId: '123',
});

// Get user-friendly message
const message = unifiedErrorService.getUserFriendlyMessage(error, {
  component: 'LoginForm',
});

// Handle error with translation
const { parsed, translation, userMessage } = unifiedErrorService.handleErrorWithTranslation(
  error,
  { component: 'LoginForm' }
);
```

### Error Context Service

Tracks error context (user, project, component, etc.).

```typescript
import { errorContextService } from '@/services';

// Set context
errorContextService.setContext({
  component: 'ProjectList',
  projectId: '123',
  userId: '456',
});

// Track error
errorContextService.trackError(error, {
  component: 'ProjectList',
  action: 'fetchProjects',
});

// Get current context
const context = errorContextService.getCurrentContext();
```

### Error Translation Service

Translates backend error codes to user-friendly messages.

```typescript
import { errorTranslationService } from '@/services';

const translation = errorTranslationService.translateError('VALIDATION_ERROR', {
  component: 'Form',
  action: 'submit',
});
// Returns: { userMessage: 'Please check your input...', ... }
```

## Retry & Resilience Services

### Retry Service

Provides exponential backoff, circuit breaker patterns, and retry logic.

```typescript
import { retryService } from '@/services';

// Basic retry
const result = await retryService.executeWithRetry(
  () => fetchData(),
  { maxRetries: 3, baseDelay: 1000 }
);

if (result.success) {
  console.log('Data:', result.data);
} else {
  console.error('Failed after', result.attempts, 'attempts');
}

// With circuit breaker
const result = await retryService.executeWithRetry(
  () => apiCall(),
  { maxRetries: 3 },
  'api-endpoint-key' // Circuit breaker key
);

// Predefined configurations
const networkConfig = retryService.getNetworkRetryConfig();
const apiConfig = retryService.getAPIRetryConfig();
const criticalConfig = retryService.getCriticalOperationRetryConfig();
```

### Convenience Functions

```typescript
import { retryWithBackoff, retryWithJitter, createRetryableFetch } from '@/services';

// Simple retry with backoff
const data = await retryWithBackoff(() => fetchData(), {
  maxRetries: 3,
  baseDelay: 1000,
});

// Retry with jitter
const data = await retryWithJitter(() => fetchData());

// Retryable fetch wrapper
const retryableFetch = createRetryableFetch(fetch, {
  maxRetries: 3,
});
const response = await retryableFetch('/api/data');
```

## Storage & Persistence Services

### Unified Storage Tester

Tests localStorage, sessionStorage, and IndexedDB operations.

```typescript
import { unifiedStorageTester } from '@/services';

// Test localStorage
const result = await unifiedStorageTester.testLocalStorage();
console.log('Success:', result.success);
console.log('Operations:', result.storageOperations);

// Test all storages
const results = await unifiedStorageTester.testAllStorages();
console.log('localStorage:', results.localStorage);
console.log('sessionStorage:', results.sessionStorage);

// Get metrics
const metrics = unifiedStorageTester.getMetrics();
console.log('Total operations:', metrics.totalOperations);
```

### Secure Storage

Provides encrypted storage for sensitive data.

```typescript
import { secureStorage } from '@/services';

// Save encrypted data
await secureStorage.setItem('token', 'secret-token');

// Retrieve decrypted data
const token = await secureStorage.getItem('token');

// Remove item
await secureStorage.removeItem('token');
```

## API Client Services

### API Client

Main API client with authentication, interceptors, and error handling.

```typescript
import { apiClient } from '@/services';

// GET request
const response = await apiClient.get('/api/projects');
if (response.success) {
  console.log('Projects:', response.data);
}

// POST request
const response = await apiClient.post('/api/projects', {
  name: 'New Project',
  description: 'Description',
});

// PUT request
const response = await apiClient.put('/api/projects/123', {
  name: 'Updated Project',
});

// DELETE request
const response = await apiClient.delete('/api/projects/123');
```

## UI Services

### UI Service

Manages UI state, themes, and UI-related operations.

```typescript
import { uiService } from '@/services';

// Get UI state
const state = uiService.getState();

// Update theme
uiService.setTheme('dark');

// Toggle sidebar
uiService.toggleSidebar();
```

### Optimistic UI Service

Handles optimistic updates for better UX.

```typescript
import { optimisticUIService } from '@/services';

// Create optimistic update
const update = optimisticUIService.createUpdate({
  id: '123',
  type: 'update',
  data: { name: 'New Name' },
  apiCall: () => api.updateProject('123', { name: 'New Name' }),
});

// Apply update
await optimisticUIService.applyUpdate(update);
```

## Security Services

### Security Service

Comprehensive security service including CSP, CSRF, XSS protection.

```typescript
import { securityService } from '@/services';

// Validate input
const isValid = securityService.validateInput(userInput);

// Check CSRF token
const isValid = securityService.checkCSRFToken(token);

// Sanitize HTML
const sanitized = securityService.sanitizeHTML(html);
```

## Service Integration

### Service Integration Service

Ties all critical services together with unified error handling.

```typescript
import { serviceIntegrationService } from '@/services/serviceIntegrationService';

// Handle error with full integration
const error = await serviceIntegrationService.handleError(error, {
  component: 'ProjectList',
  action: 'fetchProjects',
  projectId: '123',
  userId: '456',
});

// Get service status
const status = serviceIntegrationService.getStatus();
console.log('Error translation:', status.errorTranslation);
console.log('Retry logic:', status.retryLogic);
```

## Best Practices

1. **Always use unified services**: Import from `@/services` (the registry)
2. **Handle errors properly**: Use `unifiedErrorService` for all error handling
3. **Use retry logic**: Wrap API calls with retry service for resilience
4. **Track context**: Set error context for better debugging
5. **Test storage**: Use storage tester to verify persistence works
6. **Follow SSOT**: One service per responsibility, no duplicates

## Related Documentation

- [API Reference](./API_REFERENCE.md)
- [Error Handling Guide](./ERROR_HANDLING.md)
- [Testing Guide](./TESTING_GUIDE.md)

