# Correlation ID Integration Guide

**Date**: January 2025  
**Status**: ✅ Complete Implementation Guide

---

## 📋 Overview

Correlation IDs are automatically generated or extracted from request headers and propagated through all resilience operations. This enables distributed tracing and better error tracking across the application.

---

## 🔧 How It Works

### 1. Request-Level Correlation IDs

Correlation IDs are automatically handled by `CorrelationIdMiddleware`:

- **Extracted** from `X-Correlation-ID` header if present
- **Generated** as UUID v4 if not present
- **Stored** in request extensions
- **Added** to response headers
- **Available** to all handlers via `HttpRequest::correlation_id()`

### 2. Backend Implementation

**Status**: ✅ Correlation ID middleware already exists (`backend/src/middleware/correlation_id.rs`)

The backend middleware:
- ✅ Extracts `X-Correlation-ID` from request headers
- ✅ Generates new correlation ID if missing
- ✅ Adds `X-Correlation-ID` to response headers
- ✅ Stores in request extensions

**Verify**: Test that correlation IDs appear in response headers:
```bash
curl -H "X-Correlation-ID: test-123" http://localhost:2000/api/test
# Response should include: X-Correlation-ID: test-123
```

### 3. Resilience Operation Logging

All resilience operations log correlation IDs:

```rust
// Database operations
resilience_manager.execute_database_with_correlation(
    async { /* operation */ },
    Some(correlation_id),
).await?;

// Cache operations
resilience_manager.execute_cache_with_correlation(
    async { /* operation */ },
    Some(correlation_id),
).await?;

// API operations
resilience_manager.execute_api_with_correlation(
    || async { /* operation */ },
    Some(correlation_id),
).await?;
```

### 4. Automatic Propagation

If a correlation ID is available in the request context, it's automatically used:

```rust
use crate::middleware::CorrelationIdExt;

async fn my_handler(req: HttpRequest, ...) -> Result<HttpResponse, AppError> {
    let correlation_id = req.correlation_id(); // Extract from request
    
    // Pass to resilience operations
    resilience.execute_api_with_correlation(
        || async { call_external_api().await },
        correlation_id,
    ).await?;
    
    Ok(HttpResponse::Ok().json(result))
}
```

---

## 🎨 Frontend Integration

### Status

**Frontend Status**: ✅ All components and utilities ready
- Error extraction utilities ready
- All error components support correlation IDs
- Error history tracks correlation IDs
- Error reporting includes correlation IDs

### Error Extraction

The `extractErrorFromApiResponse` utility extracts correlation IDs:

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

### Async Extraction

For extracting correlation IDs from response body:

```typescript
import { extractErrorFromFetchResponseAsync } from '@/utils/errorExtractionAsync';

const response = await fetch('/api/data');
if (!response.ok) {
  const extracted = await extractErrorFromFetchResponseAsync(response);
  // extracted.correlationId from headers or response body
}
```

### Integration with Error Management Hook

The `useErrorManagement` hook supports correlation IDs:

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

### Display Correlation IDs

All components support correlation IDs:

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

---

## 📝 Usage in Handlers

### Basic Usage

```rust
use actix_web::{web, HttpRequest, HttpResponse};
use crate::middleware::CorrelationIdExt;
use crate::services::resilience::ResilienceManager;

async fn my_handler(
    req: HttpRequest,
    resilience: web::Data<Arc<ResilienceManager>>,
) -> Result<HttpResponse, AppError> {
    // Extract correlation ID from request
    let correlation_id = req.correlation_id();
    
    // Use in resilience operations
    let result = resilience.execute_api_with_correlation(
        || async {
            // Your operation here
            Ok("success")
        },
        correlation_id,
    ).await?;
    
    Ok(HttpResponse::Ok().json(result))
}
```

### Service-Level Usage

Services can accept correlation IDs as parameters:

```rust
// EmailService with correlation ID
email_service.send_email_with_correlation(
    "user@example.com",
    "Subject",
    "Body",
    correlation_id,
).await?;

// FileService with correlation ID
file_service.upload_file_with_correlation(
    payload,
    project_id,
    user_id,
    correlation_id,
).await?;
```

---

## 📊 Log Format

All resilience operations log with correlation IDs:

```
[correlation-id] Executing database operation with circuit breaker
[correlation-id] Database operation succeeded
[correlation-id] API operation failed, retrying: Connection timeout
[correlation-id] Retry attempt 1 for API operation
[correlation-id] Waiting 200ms before retry 2
[correlation-id] API operation succeeded after 2 retries
```

---

## 🔍 Error Tracking

Correlation IDs are included in error logs:

```rust
log::error!(
    "[{}] API operation failed after all retries: {}",
    correlation_id,
    error
);
```

This allows you to:
1. Track all operations for a specific request
2. Correlate errors across services
3. Debug distributed system issues
4. Monitor request flow through the application

---

## 🧪 Testing

### Manual Testing

Send requests with correlation IDs:

```bash
curl -H "X-Correlation-ID: test-123" \
     http://localhost:2000/api/health/resilience
```

### Programmatic Testing

```rust
#[tokio::test]
async fn test_correlation_id_propagation() {
    let resilience = ResilienceManager::new();
    let correlation_id = Some("test-correlation-id".to_string());
    
    let result = resilience.execute_database_with_correlation(
        async { Ok("success") },
        correlation_id.clone(),
    ).await;
    
    assert!(result.is_ok());
    // Check logs contain correlation ID
}
```

### Frontend Testing

```typescript
import { extractCorrelationIdFromResponse } from '@/utils/errorExtraction';

const headers = new Headers();
headers.set('X-Correlation-ID', 'corr-123');

const response = new Response(null, { headers });
const correlationId = extractCorrelationIdFromResponse(response);

expect(correlationId).toBe('corr-123');
```

---

## 🎯 Best Practices

1. **Always Pass Correlation IDs**: Pass correlation IDs to all resilience operations when available
2. **Generate When Missing**: If no correlation ID is available, generate one
3. **Include in Logs**: Always include correlation IDs in log messages
4. **Propagate Across Services**: When calling external services, include correlation ID in headers
5. **Track in Metrics**: Consider adding correlation IDs as labels to metrics (be careful with cardinality)

---

## 📈 Monitoring

Correlation IDs are logged at various levels:
- **DEBUG**: Operation start/success
- **WARN**: Operation failures
- **ERROR**: Final failures after all retries

Filter logs by correlation ID:

```bash
# View all logs for a specific correlation ID
grep "\[test-123\]" application.log
```

---

## ✅ Verification Checklist

- [x] Backend returns `X-Correlation-ID` in response headers
- [x] Frontend extracts correlation ID from response headers
- [x] Correlation ID appears in `ErrorCodeDisplay` component
- [x] Correlation ID appears in `UserFriendlyError` component
- [x] Correlation ID is stored in error history
- [x] Correlation ID is included in error reports
- [x] Correlation ID is searchable in error history
- [x] Tests pass for correlation ID extraction

---

**Last Updated**: January 2025  
**Status**: ✅ Complete Implementation

