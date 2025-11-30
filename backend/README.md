# Reconciliation Platform Backend

A high-performance reconciliation platform backend built with Rust, Actix-Web, and PostgreSQL.

## Features

- **Multi-tenant reconciliation engine** for comparing data sources
- **Real-time synchronization** with conflict resolution
- **Comprehensive security** with authentication, authorization, and audit logging
- **RESTful API** with OpenAPI/Swagger documentation
- **WebSocket support** for real-time updates
- **Monitoring and metrics** with Prometheus integration
- **Project management** with customizable settings and analytics
- **System administration** with backup/restore capabilities (admin only)
- **GDPR compliance** with data export and deletion endpoints

## Architecture

- **Web Framework**: Actix-Web with comprehensive middleware stack
- **Database**: PostgreSQL with Diesel ORM
- **Authentication**: JWT with bcrypt password hashing
- **Caching**: Redis with multi-level caching strategy
- **Message Queue**: Redis for background job processing
- **Monitoring**: Sentry for error tracking, Prometheus for metrics

## Development Setup

### Prerequisites

- Rust 1.70+
- PostgreSQL 13+
- Redis 6+
- Docker (optional, for local development)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd reconciliation-platform-378/backend
```

2. Install dependencies:

```bash
cargo build
```

3. Set up environment variables (see `.env.example`)

4. Run database migrations:

```bash
diesel migration run
```

5. Start the server:

```bash
cargo run
```

### Testing

```bash
cargo test
```

### API Documentation

Once running, visit `http://localhost:8080/swagger-ui/` for API documentation.

## Configuration

The application uses environment variables for configuration. Key settings include:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection URL
- `JWT_SECRET`: Secret key for JWT tokens
- `SERVER_PORT`: Server port (default: 8080)

## Security

This application implements multiple security layers:

- **Authentication**: JWT-based with secure password hashing
- **Authorization**: Role-based access control (RBAC) with admin-only system operations
- **Input validation**: Comprehensive validation with custom rules and JSON schema validation
- **Rate limiting**: Per-endpoint and per-user rate limits with authentication rate limiting
- **Audit logging**: All security events are logged with user tracking
- **CORS**: Configurable cross-origin resource sharing with credentials support
- **Data protection**: Sensitive data validation and secure settings management
- **Admin controls**: Restricted access to system-level operations (backup/restore)

## Monitoring

- **Health checks**: `/health` endpoint for service health
- **Metrics**: Prometheus metrics at `/metrics`
- **Logging**: Structured logging with configurable levels
- **Tracing**: Distributed tracing support

## Contributing

1. Follow Rust coding standards
2. Run tests before submitting PRs
3. Update documentation for API changes
4. Ensure security best practices are followed

## License

[License information]</content>
<parameter name="filePath">/Users/Arief/Documents/GitHub/reconciliation-platform-378/backend/README.md
