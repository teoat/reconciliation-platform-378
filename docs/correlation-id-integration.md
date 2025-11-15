# Correlation ID Integration Guide

## Overview

Correlation IDs are automatically generated or extracted from request headers and propagated through all resilience operations. This enables distributed tracing and better error tracking across the application.

## How It Works

### 1. Request-Level Correlation IDs

Correlation IDs are automatically handled by `CorrelationIdMiddleware`:

- **Extracted** from `X-Correlation-ID` header if present
- **Generated** as UUID v4 if not present
- **Stored** in request extensions
- **Added** to response headers
- **Available** to all handlers via `HttpRequest::correlation_id()`

### 2. Resilience Operation Logging

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

### 3. Automatic Propagation

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

## Usage in Handlers

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

## Log Format

All resilience operations log with correlation IDs:

```
[correlation-id] Executing database operation with circuit breaker
[correlation-id] Database operation succeeded
[correlation-id] API operation failed, retrying: Connection timeout
[correlation-id] Retry attempt 1 for API operation
[correlation-id] Waiting 200ms before retry 2
[correlation-id] API operation succeeded after 2 retries
```

## Error Tracking

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

## Testing

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

## Best Practices

1. **Always Pass Correlation IDs**: Pass correlation IDs to all resilience operations when available
2. **Generate When Missing**: If no correlation ID is available, generate one
3. **Include in Logs**: Always include correlation IDs in log messages
4. **Propagate Across Services**: When calling external services, include correlation ID in headers
5. **Track in Metrics**: Consider adding correlation IDs as labels to metrics (be careful with cardinality)

## Integration Points

### Database Operations

```rust
resilience.execute_database_with_correlation(
    async {
        db.get_connection_async().await
    },
    correlation_id,
).await?;
```

### Cache Operations

```rust
resilience.execute_cache_with_correlation(
    async {
        cache.get("key").await
    },
    correlation_id,
).await?;
```

### External API Calls

```rust
resilience.execute_api_with_correlation(
    || async {
        http_client.get("https://api.example.com").await
    },
    correlation_id,
).await?;
```

## Monitoring

Correlation IDs are logged at various levels:
- **DEBUG**: Operation start/success
- **WARN**: Operation failures
- **ERROR**: Final failures after all retries

Filter logs by correlation ID:

```bash
# View all logs for a specific correlation ID
grep "\[test-123\]" application.log
```


