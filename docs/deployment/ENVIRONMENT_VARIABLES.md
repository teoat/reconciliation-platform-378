# Environment Variables Documentation

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document provides comprehensive documentation for all environment variables used in the Reconciliation Platform. All environment variables should be set in `.env` files (git-ignored) following 12-Factor App principles.

## Quick Start

1. Copy `env.consolidated` to `.env`
2. Update required variables (marked with [REQUIRED])
3. Start the application

## Required Variables

These variables must be set for the application to start:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_REFRESH_SECRET` - Secret key for JWT refresh tokens

## Variable Categories

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string: `postgresql://user:password@host:port/database` |
| `DATABASE_SHARD_COUNT` | ❌ No | `1` | Number of database shards |
| `DATABASE_SHARD_1_URL` | ❌ No | - | Shard 1 connection URL (if using sharding) |
| `DB_PASSWORD` | ❌ No | - | Database password (if not in DATABASE_URL) |

### Redis Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | ❌ No | `redis://localhost:6379` | Redis connection URL |
| `REDIS_PASSWORD` | ❌ No | - | Redis password (if not in REDIS_URL) |

### JWT Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | - | Secret key for JWT token signing (generate: `openssl rand -base64 32`) |
| `JWT_EXPIRATION_HOURS` | ❌ No | `24` | JWT token expiration in hours |
| `JWT_REFRESH_SECRET` | ✅ Yes | - | Secret key for JWT refresh tokens (must be different from JWT_SECRET) |
| `JWT_REFRESH_EXPIRATION` | ❌ No | `86400` | Refresh token expiration in seconds (24 hours) |

### Application Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HOST` | ❌ No | `0.0.0.0` | Backend host |
| `PORT` | ❌ No | `2000` | Backend port |
| `BACKEND_URL` | ❌ No | `http://localhost:2000` | Backend URL (used by frontend) |
| `FRONTEND_URL` | ❌ No | `http://localhost:1000` | Frontend URL (for CORS) |
| `NODE_ENV` | ❌ No | `development` | Node environment (development/production/test) |
| `RUST_LOG` | ❌ No | `info` | Rust log level (trace/debug/info/warn/error) |

### Frontend Configuration (Vite)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ❌ No | `http://localhost:2000/api` | Frontend API URL |
| `VITE_WS_URL` | ❌ No | `ws://localhost:2000` | WebSocket URL |
| `VITE_APP_NAME` | ❌ No | `Reconciliation Platform` | Application name |
| `VITE_APP_VERSION` | ❌ No | `1.0.0` | Application version |
| `VITE_LOG_LEVEL` | ❌ No | `info` | Frontend log level |
| `VITE_DEBUG` | ❌ No | `false` | Enable debug mode |

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGINS` | ❌ No | `http://localhost:1000,http://localhost:3000,http://localhost:5173` | Comma-separated allowed origins |

### Email Configuration (SMTP)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | ❌ No | - | SMTP server hostname |
| `SMTP_PORT` | ❌ No | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USERNAME` | ❌ No | - | SMTP username |
| `SMTP_PASSWORD` | ❌ No | - | SMTP password |
| `SMTP_FROM_ADDRESS` | ❌ No | - | Email sender address |

### File Upload Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_FILE_SIZE` | ❌ No | `10485760` | Maximum file size in bytes (10MB) |
| `UPLOAD_PATH` | ❌ No | `./uploads` | Upload directory path |
| `ALLOWED_FILE_TYPES` | ❌ No | `csv,xlsx,xls,pdf,txt` | Comma-separated allowed file types |

### Security Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | ❌ No | `900000` | Rate limit window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ No | `100` | Maximum requests per window |

### Performance Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORKER_THREADS` | ❌ No | `4` | Number of worker threads |
| `CONNECTION_POOL_SIZE` | ❌ No | `20` | Database connection pool size |
| `CACHE_TTL` | ❌ No | `3600` | Cache TTL in seconds (1 hour) |

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_ANALYTICS` | ❌ No | `true` | Enable analytics tracking |
| `ENABLE_METRICS` | ❌ No | `true` | Enable metrics collection |
| `ENABLE_TRACING` | ❌ No | `true` | Enable distributed tracing |
| `ENABLE_CACHING` | ❌ No | `true` | Enable caching |
| `ENABLE_RATE_LIMITING` | ❌ No | `true` | Enable rate limiting |
| `ENABLE_COMPRESSION` | ❌ No | `true` | Enable response compression |

### Development/Testing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEBUG` | ❌ No | `true` | Enable debug mode (set to false in production) |
| `ENABLE_SWAGGER` | ❌ No | `true` | Enable Swagger/OpenAPI docs (set to false in production) |
| `ENABLE_MOCK_DATA` | ❌ No | `false` | Enable mock data for testing |

### Monitoring Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | ❌ No | - | Sentry DSN for error tracking |
| `NEW_RELIC_LICENSE_KEY` | ❌ No | - | New Relic license key |
| `VITE_ELASTIC_APM_SERVER_URL` | ❌ No | `http://localhost:8200` | Elastic APM server URL |
| `VITE_ELASTIC_APM_SERVICE_NAME` | ❌ No | `reconciliation-frontend` | Elastic APM service name |
| `VITE_ELASTIC_APM_ENVIRONMENT` | ❌ No | `development` | Elastic APM environment |

### Slack Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SLACK_WEBHOOK_URL` | ❌ No | - | Slack webhook URL for alerts |
| `SLACK_CHANNEL` | ❌ No | `#alerts` | Slack channel for alerts |

### Backup Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKUP_RETENTION_DAYS` | ❌ No | `30` | Number of days to retain backups |
| `BACKUP_SCHEDULE` | ❌ No | `0 2 * * *` | Backup schedule (cron format) |
| `BACKUP_STORAGE_PATH` | ❌ No | `/app/backups` | Backup storage path |

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
DEBUG=true
ENABLE_SWAGGER=true
RUST_LOG=debug
```

### Production

```bash
NODE_ENV=production
DEBUG=false
ENABLE_SWAGGER=false
RUST_LOG=info
# Use strong secrets
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** in production (generate with `openssl rand -base64 32`)
3. **Rotate secrets regularly** (especially JWT secrets)
4. **Use environment-specific files** (`.env.development`, `.env.production`)
5. **Use secrets management services** in production (AWS Secrets Manager, HashiCorp Vault, etc.)
6. **Restrict access** to `.env` files (file permissions: `chmod 600 .env`)

## Validation

The application validates required environment variables at startup. If required variables are missing, the application will fail to start with a clear error message.

See `backend/src/config/mod.rs` for validation logic.

## Related Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Guide](../security/SECURITY_GUIDE.md)
- [README.md](../../README.md)

