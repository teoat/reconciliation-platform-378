# Application Startup Integration Guide

## Overview

The `AppStartup` module provides a unified way to initialize the application with resilience patterns enabled. It automatically configures circuit breakers for database, cache, and external API calls.

## Quick Start

```rust
use reconciliation_backend::{Config, AppStartup, resilience_config_from_env};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize application with resilience patterns
    let app_startup = AppStartup::with_resilience_config(
        &config,
        resilience_config_from_env()
    ).await?;
    
    // Configure Actix-web server
    HttpServer::new(move || {
        App::new()
            .configure(|cfg| {
                app_startup.configure_app_data(cfg);
            })
            .configure(configure_routes)
    })
    .bind(format!("{}:{}", config.host, config.port))?
    .run()
    .await
}
```

## Features

- **Automatic Resilience Setup**: Database and cache are automatically configured with circuit breakers
- **Environment-Based Configuration**: Circuit breaker thresholds can be configured via environment variables
- **Unified Initialization**: Single entry point for application startup
- **App Data Configuration**: Automatically configures Actix-web app data

## Environment Variables

### Database Circuit Breaker
- `DB_CIRCUIT_BREAKER_FAILURE_THRESHOLD` (default: 5)
- `DB_CIRCUIT_BREAKER_SUCCESS_THRESHOLD` (default: 2)
- `DB_CIRCUIT_BREAKER_TIMEOUT_SECONDS` (default: 30)
- `DB_CIRCUIT_BREAKER_ENABLE_FALLBACK` (default: true)

### Cache Circuit Breaker
- `CACHE_CIRCUIT_BREAKER_FAILURE_THRESHOLD` (default: 10)
- `CACHE_CIRCUIT_BREAKER_SUCCESS_THRESHOLD` (default: 3)
- `CACHE_CIRCUIT_BREAKER_TIMEOUT_SECONDS` (default: 15)
- `CACHE_CIRCUIT_BREAKER_ENABLE_FALLBACK` (default: true)

### API Circuit Breaker
- `API_CIRCUIT_BREAKER_FAILURE_THRESHOLD` (default: 5)
- `API_CIRCUIT_BREAKER_SUCCESS_THRESHOLD` (default: 2)
- `API_CIRCUIT_BREAKER_TIMEOUT_SECONDS` (default: 60)
- `API_CIRCUIT_BREAKER_ENABLE_FALLBACK` (default: true)

### Retry Configuration
- `RETRY_MAX_RETRIES` (default: 3)
- `RETRY_INITIAL_DELAY_MS` (default: 100)
- `RETRY_MAX_DELAY_MS` (default: 5000)
- `RETRY_BACKOFF_MULTIPLIER` (default: 2.0)

## Custom Configuration

```rust
use reconciliation_backend::{
    AppStartup, 
    ResilienceConfig, 
    CircuitBreakerServiceConfig, 
    RetryConfig
};

let resilience_config = ResilienceConfig {
    database: CircuitBreakerServiceConfig {
        failure_threshold: 10,
        success_threshold: 3,
        timeout_seconds: 60,
        enable_fallback: true,
    },
    cache: CircuitBreakerServiceConfig::default_cache(),
    api: CircuitBreakerServiceConfig::default_api(),
    retry: RetryConfig {
        max_retries: 5,
        initial_delay_ms: 200,
        max_delay_ms: 10000,
        backoff_multiplier: 2.0,
    },
};

let app_startup = AppStartup::with_resilience_config(
    &config,
    resilience_config
).await?;
```

## Usage in Handlers

Once `AppStartup` is configured, services can access the resilience-protected database and cache:

```rust
use actix_web::{web, HttpResponse};
use reconciliation_backend::AppError;

async fn my_handler(
    db: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
    resilience: web::Data<ResilienceManager>,
) -> Result<HttpResponse, AppError> {
    // Database operations automatically use circuit breakers
    let conn = db.get_connection_async().await?;
    
    // Cache operations automatically use circuit breakers
    let value = cache.get("key").await?;
    
    // External API calls with retry
    let result = resilience.execute_api(|| async {
        call_external_api().await
    }).await?;
    
    Ok(HttpResponse::Ok().json(result))
}
```

## Testing

For testing without resilience (faster startup):

```rust
let app_startup = AppStartup::without_resilience(&config).await?;
```

## Related Documentation

- [Resilience Patterns](./RESILIENCE_PATTERNS.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Database](./DATABASE.md)
- [Cache](./CACHE.md)

