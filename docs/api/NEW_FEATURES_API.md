# New Features API Documentation

**Last Updated**: November 26, 2025  
**Status**: Active  
**Version**: 1.1.0

## Overview

This document describes the new API endpoints and features added in version 1.1.0, including CQRS commands/queries, event bus, metrics, secret management, and zero-trust security.

---

## Metrics API

### Get All Metrics

Retrieve all collected metrics.

**Endpoint**: `GET /api/metrics`

**Response**:
```json
{
  "cqrs_command_total": {
    "name": "cqrs_command_total",
    "metric_type": "Counter",
    "values": [
      {
        "value": 1.0,
        "timestamp": "2025-11-26T10:00:00Z",
        "labels": {}
      }
    ],
    "description": "Counter metric: cqrs_command_total"
  }
}
```

### Get Metrics Summary

Get aggregated metrics summary.

**Endpoint**: `GET /api/metrics/summary`

**Response**:
```json
{
  "cqrs_command_total": 150.0,
  "cqrs_query_total": 500.0,
  "event_published_total": 75.0,
  "cache_hit_rate": 85.5,
  "rate_limit_hits_total": 1000.0,
  "rate_limit_exceeded_total": 5.0
}
```

### Get Specific Metric

Get details for a specific metric.

**Endpoint**: `GET /api/metrics/{metric_name}`

**Parameters**:
- `metric_name` (path): Name of the metric

**Response**:
```json
{
  "name": "cqrs_command_total",
  "metric_type": "Counter",
  "values": [...],
  "description": "Counter metric: cqrs_command_total"
}
```

### Metrics Health Check

Health check endpoint with metrics overview.

**Endpoint**: `GET /api/metrics/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-26T10:00:00Z",
  "metrics": {
    "cqrs_commands": 150.0,
    "cqrs_queries": 500.0,
    "events_published": 75.0,
    "cache_hit_rate": 85.5
  }
}
```

---

## CQRS Commands and Queries

### Command Pattern

Commands represent write operations that modify state.

**Example Command**:
```json
{
  "name": "CreateProject",
  "data": {
    "name": "My Project",
    "description": "Project description",
    "owner_id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Query Pattern

Queries represent read operations that don't modify state.

**Example Query**:
```json
{
  "name": "GetProject",
  "data": {
    "project_id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

---

## Event Bus

### Publishing Events

Events are published automatically by the system when state changes occur.

**Event Types**:
- `ProjectCreated` - When a project is created
- `ProjectUpdated` - When a project is updated
- `ProjectDeleted` - When a project is deleted

**Event Structure**:
```json
{
  "event_type": "ProjectCreated",
  "data": {
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "My Project",
    "owner_id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2025-11-26T10:00:00Z"
  }
}
```

---

## Secret Management

### Secret Rotation

Secrets are automatically rotated based on configured intervals.

**Rotation Intervals**:
- JWT_SECRET: 90 days
- CSRF_SECRET: 180 days
- DATABASE_URL: 180 days
- PASSWORD_MASTER_KEY: 365 days

**Audit Logging**:
All secret access and rotation events are logged for security auditing.

---

## Zero-Trust Security

### Identity Verification

All requests are verified for identity before processing.

**Headers Required**:
```
Authorization: Bearer <access_token>
```

### mTLS Support

Mutual TLS can be enabled for internal service communication.

**Configuration**:
Set `ZERO_TRUST_REQUIRE_MTLS=true` in environment variables.

### Least Privilege Enforcement

Access is granted based on the principle of least privilege.

**Features**:
- Role-based access control (RBAC)
- Permission-based authorization
- Network segmentation checks

---

## Rate Limiting

### Per-Endpoint Rate Limits

Different endpoints have different rate limits:

**Authentication Endpoints**:
- `/api/auth/login`: 5 requests/minute per user
- `/api/auth/register`: 3 requests/hour

**General Endpoints**:
- Default: 100 requests/minute

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1736443200
```

### Rate Limit Exceeded Response

**Status Code**: `429 Too Many Requests`

**Response**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

---

## Cache Management

### Cache Warming

Cache is automatically warmed with frequently accessed data.

**Configuration**:
- Warming interval: Configurable (default: 1 hour)
- Pre-loaded data: User data, project data, analytics

### Cache Analytics

Cache performance metrics are available via the metrics API.

**Metrics**:
- `cache_hit_rate`: Percentage of cache hits
- `cache_warming_duration_seconds`: Time taken for cache warming

---

## Query Optimization

### Automatic Index Creation

The system automatically creates recommended indexes for optimal query performance.

**Target Performance**:
- P95 query time: < 50ms
- Index recommendations: Automatic
- Query analysis: Continuous

---

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

## Related Documentation

- [Main API Reference](./API_REFERENCE.md)
- [CQRS and Event-Driven Architecture](../architecture/CQRS_AND_EVENT_DRIVEN_ARCHITECTURE.md)
- [Security Hardening Checklist](../security/SECURITY_HARDENING_CHECKLIST.md)

