# Backend Cargo Dependencies for Monitoring

Add these dependencies to your `backend/Cargo.toml`:

```toml
[dependencies]
# ... existing dependencies ...

# Monitoring & Observability
prometheus = "0.13"
sentry = "0.32"
sentry-actix = "0.32"
tracing = "0.1"
tracing-actix-web = "0.7"
tracing-subscriber = "0.3"

# Additional error handling
anyhow = "1.0"
thiserror = "1.0"

[dev-dependencies]
# ... existing dev dependencies ...
```

## Installation

```bash
cd backend
cargo add prometheus --features histogram
cargo add sentry sentry-actix
cargo add tracing tracing-actix-web tracing-subscriber
```

## Integration

Add to your `main.rs`:

```rust
// Add at top of main()
let sentry_guard = sentry::init(sentry::ClientOptions {
    dsn: std::env::var("SENTRY_DSN").ok(),
    traces_sample_rate: 0.1,
    ..Default::default()
});

// Add metrics middleware
let metrics = MetricsMiddleware::new(Registry::new());
app.wrap(metrics);
```

