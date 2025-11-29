# Error Handling Standardization Design

**Date**: 2025-01-15  
**Status**: Design Phase  
**Purpose**: Design unified error handling architecture

---

## Design Goals

1. **Single Error Pattern**: One consistent way to handle errors
2. **Type Safety**: Strong typing for all error types
3. **User Experience**: Consistent, user-friendly error messages
4. **Developer Experience**: Easy to use, well-documented
5. **Observability**: Full error tracking and logging

---

## Recommended Architecture

### Primary Handler: UnifiedErrorService

**Rationale**:
- Most comprehensive (translation, context, correlation IDs)
- Already integrated with other services
- Supports error history and recovery

**Location**: `frontend/src/services/unifiedErrorService.ts`

---

## Unified Error Type

### Base Error Interface

```typescript
interface UnifiedError {
  id: string;
  code: string;
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  correlationId?: string;
  context?: Record<string, unknown>;
  retryable: boolean;
  stack?: string;
}
```

### Error Categories

```typescript
enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  UNKNOWN = 'UNKNOWN'
}
```

### Error Severity

```typescript
enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

---

## Error Handling API

### Primary Function

```typescript
async function handleError(
  error: unknown,
  options: {
    component?: string;
    action?: string;
    projectId?: string;
    userId?: string;
    workflowStage?: string;
    retryable?: boolean;
    maxRetries?: number;
  }
): Promise<UnifiedError>
```

### Usage Pattern

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  const unifiedError = await unifiedErrorService.handleError(error, {
    component: 'MyComponent',
    action: 'fetchData',
    projectId: currentProject.id
  });
  
  // Show user-friendly message
  toast.error(unifiedError.userMessage);
  
  // Log for debugging
  logger.error(unifiedError.message, {
    errorId: unifiedError.id,
    correlationId: unifiedError.correlationId,
    context: unifiedError.context
  });
  
  throw unifiedError;
}
```

---

## Error Type Mapping

### Frontend ↔ Backend

```typescript
const ERROR_CODE_MAP: Record<string, ErrorCategory> = {
  // Backend error codes → Frontend categories
  'ERR_BAD_REQUEST': ErrorCategory.VALIDATION,
  'ERR_UNAUTHORIZED': ErrorCategory.AUTHENTICATION,
  'ERR_FORBIDDEN': ErrorCategory.AUTHORIZATION,
  'ERR_NOT_FOUND': ErrorCategory.NOT_FOUND,
  'ERR_INTERNAL_SERVER_ERROR': ErrorCategory.SERVER,
  'ERR_NETWORK': ErrorCategory.NETWORK,
  // ... more mappings
};
```

---

## Error Recovery

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: ErrorCategory[];
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  // Exponential backoff retry logic
}
```

### Error Recovery Actions

```typescript
interface RecoveryAction {
  type: 'retry' | 'fallback' | 'refresh' | 'redirect';
  handler: () => Promise<void>;
}

function getRecoveryActions(error: UnifiedError): RecoveryAction[] {
  // Return appropriate recovery actions based on error
}
```

---

## Error Boundaries

### React Error Boundary

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    unifiedErrorService.handleError(error, {
      component: this.props.componentName,
      action: 'render',
      context: { errorInfo }
    );
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Route-Level Error Boundaries

- Wrap all routes in error boundaries
- Provide route-specific error handling
- Show appropriate error UI

---

## Error Logging

### Structured Logging

```typescript
logger.error('Operation failed', {
  errorId: unifiedError.id,
  correlationId: unifiedError.correlationId,
  category: unifiedError.category,
  severity: unifiedError.severity,
  component: options.component,
  action: options.action,
  context: unifiedError.context,
  stack: unifiedError.stack
});
```

### Log Levels

- **ERROR**: All errors logged
- **WARN**: Retryable errors, recoverable issues
- **INFO**: Error recovery actions
- **DEBUG**: Detailed error context

---

## User-Facing Messages

### Translation Layer

```typescript
function getUserMessage(error: UnifiedError): string {
  // Use error translation service
  return errorTranslationService.translateError(
    error.code,
    error.category,
    error.context
  );
}
```

### Message Format

- **Technical errors**: Generic user-friendly message
- **Validation errors**: Specific field-level messages
- **Network errors**: Retry suggestions
- **Auth errors**: Login redirect prompts

---

## Migration Plan

### Phase 1: Create Unified Service

1. Enhance `UnifiedErrorService` with all features
2. Create error type mapping
3. Add error recovery mechanisms

### Phase 2: Migrate API Services

1. Update `AuthApiService` to use unified service
2. Update other API services
3. Standardize error responses

### Phase 3: Migrate Components

1. Add error boundaries to routes
2. Update component error handling
3. Standardize error UI

### Phase 4: Remove Old Patterns

1. Deprecate old error handlers
2. Remove unused error handling code
3. Update documentation

---

## Implementation Checklist

- [ ] Enhance UnifiedErrorService
- [ ] Create error type mapping
- [ ] Implement error recovery
- [ ] Add error boundaries
- [ ] Standardize error logging
- [ ] Create error code registry
- [ ] Update API services
- [ ] Update components
- [ ] Remove old patterns
- [ ] Update documentation

---

**Status**: Design complete, ready for implementation

