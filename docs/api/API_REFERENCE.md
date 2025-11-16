# API Reference - 378 Reconciliation Platform

**Last Updated**: January 2025  
**Status**: Production Ready  
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Base URLs](#base-urls)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [User Management](#user-management)
   - [Project Management](#project-management)
   - [File Management](#file-management)
   - [Data Sources](#data-sources)
   - [Reconciliation Jobs](#reconciliation-jobs)
   - [Analytics](#analytics)
   - [System](#system)
7. [WebSocket API](#websocket-api)
8. [SDKs & Libraries](#sdks--libraries)
9. [Examples](#examples)
10. [Support](#support)

---

## Overview

The 378 Reconciliation Platform provides a comprehensive REST API for data reconciliation, project management, and user administration. This API enables seamless integration with external systems and provides real-time data processing capabilities.

---

## Base URLs

```
Production: https://api.378reconciliation.com
Development: http://localhost:8080
```

---

## Authentication

The API uses JWT (JSON Web Token) authentication with refresh tokens. Include the access token in the Authorization header on every request:

```
Authorization: Bearer <access_token>
```

### Authentication Flow

1. `POST /api/auth/login` → returns access and refresh tokens
2. Use the access token on subsequent requests
3. `POST /api/auth/refresh` with the refresh token to rotate credentials
4. `POST /api/auth/logout` to invalidate tokens

### Sample Login Response

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "role": "analyst",
    "permissions": ["reconciliation:read", "reconciliation:write"]
  }
}
```

### Optional Authentication Endpoints

- `POST /api/auth/register` – create a new user
- `POST /api/auth/change-password` – change password (accepts `{ "current_password", "new_password" }`)
- `POST /api/auth/password-reset` – request password reset token
- `POST /api/auth/password-reset/confirm` – confirm reset with token + new password
- `GET /api/auth/me` – fetch the current authenticated user profile

---

## Rate Limiting

- **Authentication endpoints**: 10 requests/minute
- **General API endpoints**: 100 requests/minute
- **File upload and bulk endpoints**: 20 requests/minute

Rate limit headers are included on every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 94
X-RateLimit-Reset: 1736443200
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Email address is invalid",
  "details": { "field": "email" },
  "timestamp": "2025-01-01T12:00:00Z",
  "request_id": "req_01HFZ6B1AVX9N9K2D7D4GZ7F9A"
}
```

### Error Codes

| Code                  | Status | Meaning                                |
|-----------------------|--------|----------------------------------------|
| `VALIDATION_ERROR`    | 400    | Input failed validation                |
| `UNAUTHORIZED`        | 401    | Missing or invalid credentials         |
| `FORBIDDEN`           | 403    | Lacking the required role/permission   |
| `NOT_FOUND`           | 404    | Referenced resource does not exist     |
| `RATE_LIMIT_EXCEEDED` | 429    | Slow down; retry after reset           |
| `INTERNAL_ERROR`      | 500    | Unexpected server-side failure         |

---

## Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token"
  }
}
```

#### POST /api/auth/login

Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "token": "jwt_token",
    "expires_at": "2024-01-01T24:00:00Z"
  }
}
```

#### POST /api/auth/logout

Logout user and invalidate token.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/refresh

Refresh access token.

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expires_at": "2024-01-01T24:00:00Z"
  }
}
```

---

### User Management

#### GET /api/users

Get list of users (Admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `search` (optional): Search term for email or name
- `role` (optional): Filter by role
- `is_active` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "user",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

#### GET /api/users/{id}

Get user details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T12:00:00Z",
    "preferences": {
      "theme": "light",
      "notifications": {
        "email": true,
        "websocket": true
      }
    }
  }
}
```

#### PUT /api/users/{id}

Update user details (Admin only).

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "role": "analyst",
  "is_active": true
}
```

#### DELETE /api/users/{id}

Delete user account (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### GET /api/users/search

Search users by name/email.

**Query Parameters:**
- `q`: Search query
- `page`: Page number
- `per_page`: Items per page

#### GET /api/users/statistics

Aggregate platform-wide user statistics (Admin/reporting).

---

### Project Management

#### GET /api/projects

Get list of projects.

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page
- `search` (optional): Search term
- `owner_id` (optional): Filter by owner

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Project Name",
        "description": "Project description",
        "owner_id": "uuid",
        "owner_name": "John Doe",
        "settings": {
          "collaboration_enabled": true,
          "max_concurrent_users": 5
        },
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 50,
      "total_pages": 3
    }
  }
}
```

#### POST /api/projects

Create a new project.

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "settings": {
    "collaboration_enabled": true,
    "max_concurrent_users": 5
  }
}
```

#### GET /api/projects/{id}

Get project details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Project Name",
    "description": "Project description",
    "owner_id": "uuid",
    "owner_name": "John Doe",
    "settings": {
      "collaboration_enabled": true,
      "max_concurrent_users": 5
    },
    "data_sources": [
      {
        "id": "uuid",
        "name": "Data Source 1",
        "source_type": "csv",
        "file_count": 5
      }
    ],
    "reconciliation_jobs": [
      {
        "id": "uuid",
        "name": "Job 1",
        "status": "completed",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

#### PUT /api/projects/{id}

Update project details.

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "settings": {
    "collaboration_enabled": false,
    "max_concurrent_users": 10
  }
}
```

#### DELETE /api/projects/{id}

Delete project.

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

#### GET /api/projects/{project_id}/data-sources

List project data sources.

#### POST /api/projects/{project_id}/data-sources

Create data source for project.

#### GET /api/projects/{project_id}/reconciliation-jobs

List reconciliation jobs scoped to project.

#### POST /api/projects/{project_id}/reconciliation-jobs

Create reconciliation job for project.

---

### File Management

#### POST /api/files/upload

Upload a file to a project.

**Request:** Multipart form data
- `file`: The file to upload
- `project_id`: Project ID (query parameter)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_name": "data.csv",
    "file_size": 1024000,
    "file_type": "text/csv",
    "project_id": "uuid",
    "uploaded_by": "uuid",
    "uploaded_at": "2024-01-01T00:00:00Z",
    "status": "uploaded"
  }
}
```

#### GET /api/files/{id}

Get file details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_name": "data.csv",
    "file_size": 1024000,
    "file_type": "text/csv",
    "project_id": "uuid",
    "uploaded_by": "uuid",
    "uploaded_at": "2024-01-01T00:00:00Z",
    "status": "processed",
    "processing_result": {
      "records_count": 1000,
      "columns": ["id", "name", "value"],
      "errors": []
    }
  }
}
```

#### POST /api/files/{id}/process

Kick off ingestion pipeline.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "processing",
    "processing_started_at": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE /api/files/{id}

Remove file and associated staging data.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### GET /api/ingestion/jobs

Track ingestion jobs (status, metrics).

#### POST /api/ingestion/jobs/{job_id}/cancel

Abort an active ingestion job.

#### GET /api/storage/files

List stored assets (S3/GCS abstraction).

#### GET /api/storage/files/{file_id}/download

Stream/download a stored file.

---

### Data Sources

#### GET /api/data-sources

Get list of data sources.

**Query Parameters:**
- `project_id` (optional): Filter by project
- `source_type` (optional): Filter by type

**Response:**
```json
{
  "success": true,
  "data": {
    "data_sources": [
      {
        "id": "uuid",
        "name": "Customer Data",
        "source_type": "csv",
        "project_id": "uuid",
        "file_id": "uuid",
        "schema": {
          "columns": ["id", "name", "email"],
          "primary_key": "id"
        },
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST /api/data-sources

Create a new data source.

**Request Body:**
```json
{
  "name": "Customer Data",
  "source_type": "csv",
  "project_id": "uuid",
  "file_id": "uuid",
  "schema": {
    "columns": ["id", "name", "email"],
    "primary_key": "id"
  }
}
```

#### PUT /api/data-sources/{id}

Update data source.

**Request Body:**
```json
{
  "name": "Updated Customer Data",
  "schema": {
    "columns": ["id", "name", "email", "phone"],
    "primary_key": "id"
  }
}
```

#### DELETE /api/data-sources/{id}

Delete data source.

**Response:**
```json
{
  "success": true,
  "message": "Data source deleted successfully"
}
```

---

### Reconciliation Jobs

#### GET /api/reconciliation/jobs

Get list of reconciliation jobs.

**Query Parameters:**
- `project_id` (optional): Filter by project
- `status` (optional): Filter by status
- `page` (optional): Page number

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "name": "Customer Reconciliation",
        "description": "Reconcile customer data",
        "project_id": "uuid",
        "status": "completed",
        "progress": 100,
        "created_at": "2024-01-01T00:00:00Z",
        "completed_at": "2024-01-01T01:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 25,
      "total_pages": 2
    }
  }
}
```

#### GET /api/reconciliation/jobs/active

Active jobs snapshot.

#### GET /api/reconciliation/jobs/queued

Queued jobs snapshot.

#### POST /api/reconciliation/jobs

Create a new reconciliation job (also available through project-scoped path).

**Request Body:**
```json
{
  "name": "Customer Reconciliation",
  "description": "Reconcile customer data between systems",
  "project_id": "uuid",
  "source_data_source_id": "uuid",
  "target_data_source_id": "uuid",
  "matching_rules": [
    {
      "field": "email",
      "type": "exact"
    },
    {
      "field": "name",
      "type": "fuzzy",
      "threshold": 0.8
    }
  ],
  "confidence_threshold": 0.7,
  "auto_approve": false
}
```

#### GET /api/reconciliation/jobs/{id}

Get reconciliation job details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Customer Reconciliation",
    "description": "Reconcile customer data",
    "project_id": "uuid",
    "status": "running",
    "progress": 75,
    "matching_rules": [
      {
        "field": "email",
        "type": "exact"
      }
    ],
    "confidence_threshold": 0.7,
    "auto_approve": false,
    "created_at": "2024-01-01T00:00:00Z",
    "started_at": "2024-01-01T00:05:00Z",
    "estimated_completion": "2024-01-01T00:15:00Z"
  }
}
```

#### PUT /api/reconciliation/jobs/{id}

Update job metadata/settings.

#### DELETE /api/reconciliation/jobs/{id}

Delete job.

#### POST /api/reconciliation/jobs/{id}/start

Start processing.

**Response:**
```json
{
  "success": true,
  "message": "Reconciliation job started"
}
```

#### POST /api/reconciliation/jobs/{id}/stop

Halt processing.

**Response:**
```json
{
  "success": true,
  "message": "Reconciliation job stopped"
}
```

#### GET /api/reconciliation/jobs/{id}/results

Review matches, confidence, approval status.

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page
- `match_type` (optional): Filter by match type
- `confidence_min` (optional): Minimum confidence score

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "source_record": {
          "id": "1",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "target_record": {
          "id": "1",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "match_type": "exact",
        "confidence_score": 1.0,
        "status": "approved",
        "reviewed_by": "uuid",
        "reviewed_at": "2024-01-01T01:00:00Z"
      }
    ],
    "summary": {
      "total_records": 1000,
      "matched_records": 950,
      "unmatched_records": 50,
      "exact_matches": 800,
      "fuzzy_matches": 150,
      "average_confidence": 0.85
    },
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 1000,
      "total_pages": 50
    }
  }
}
```

#### GET /api/reconciliation/jobs/{id}/progress

Poll for progress metrics.

#### GET /api/reconciliation/jobs/{id}/statistics

Summary metrics for a single job.

#### POST /api/reconciliation/jobs/{id}/results/{result_id}/approve

Approve a result.

**Response:**
```json
{
  "success": true,
  "message": "Result approved"
}
```

#### POST /api/reconciliation/jobs/{id}/results/{result_id}/reject

Reject with reason.

**Request Body:**
```json
{
  "reason": "Data quality issues"
}
```

#### GET /api/reconciliation/jobs/{id}/export

Export reconciliation results.

**Query Parameters:**
- `format` (optional): Export format (csv, excel, json)
- `status` (optional): Filter by status

**Response:** File download

#### GET /api/reconciliation/summary/{project_id}

Aggregated stats for a project.

### Matching Strategies

Supported matching strategies:
- **Exact match**: Amount/date/external ID
- **Fuzzy matching**: Adjustable thresholds
- **Machine-learning assisted**: Comparisons with anomaly detection and confidence scoring

---

### Analytics

#### GET /api/analytics/dashboard

Get dashboard analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "total_projects": 25,
    "total_reconciliation_jobs": 100,
    "total_data_sources": 200,
    "active_jobs": 5,
    "completed_jobs_today": 10,
    "average_processing_time": 300,
    "system_health": "healthy",
    "recent_activity": [
      {
        "type": "job_completed",
        "description": "Customer reconciliation completed",
        "timestamp": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

#### GET /api/analytics/projects/{id}

Get project analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "project_name": "Customer Data Project",
    "total_jobs": 20,
    "completed_jobs": 18,
    "failed_jobs": 2,
    "total_data_sources": 5,
    "total_matches": 5000,
    "total_unmatched": 200,
    "average_confidence_score": 0.85,
    "last_activity": "2024-01-01T12:00:00Z",
    "jobs_by_status": [
      {
        "status": "completed",
        "count": 18
      },
      {
        "status": "failed",
        "count": 2
      }
    ]
  }
}
```

#### GET /api/analytics/users/{user_id}/activity

User activity timeline.

#### GET /api/analytics/reconciliation/stats

Fleet-wide reconciliation metrics.

#### POST /api/analytics/reports

Generate scheduled or on-demand reports.

---

### System

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

#### GET /health/live

Liveness endpoint.

#### GET /health/ready

Readiness endpoint.

#### GET /api/system/health

High-level system health JSON.

#### GET /api/system/status

Operational status summary.

**Response:**
```json
{
  "status": "operational",
  "uptime": "7d 12h 30m",
  "version": "1.0.0",
  "database_status": "connected",
  "redis_status": "connected",
  "active_connections": 25
}
```

#### GET /api/system/metrics

Detailed runtime metrics (JSON) - Admin only.

**Response:**
```json
{
  "success": true,
  "data": {
    "request_count": 10000,
    "average_response_time": 150.5,
    "error_rate": 0.5,
    "active_connections": 25,
    "database_connections": 10,
    "cache_hit_rate": 0.85,
    "memory_usage": 0.65,
    "cpu_usage": 0.45,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /metrics

Prometheus metrics (plain text).

#### GET /metrics/summary

Prometheus metrics (JSON format).

---

### Security & Audit

#### GET /api/security/events

Security event feed.

#### GET /api/security/audit-logs

Audit log traversal.

#### GET /api/security/config

Current password/session policies.

---

### Webhooks & Integrations

#### GET /api/webhooks

List configured webhooks.

#### POST /api/webhooks

Create/update webhook endpoint.

#### POST /api/webhooks/{webhook_id}/test

Fire a test payload.

#### GET /api/webhooks/{webhook_id}/logs

Inspect delivery attempts.

#### GET /api/marketplace/integrations

Discover marketplace integrations.

#### POST /api/marketplace/integrations/{id}/install

Install/configure integration.

### Webhook Payload Schema

```json
{
  "event": "reconciliation.completed",
  "timestamp": "2025-01-01T10:30:00Z",
  "data": {
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "matched_records": 950,
    "unmatched_records": 50,
    "processing_time_ms": 420000
  },
  "webhook_id": "wh_abc123",
  "signature": "sha256=..."
}
```

---

## WebSocket API

### Connection

Connect to WebSocket endpoint:

```
ws://localhost:8080/ws?token=<jwt_token>
```

### Message Format

All WebSocket messages follow this format:

```json
{
  "type": "message_type",
  "id": "message_id",
  "timestamp": "2024-01-01T00:00:00Z",
  "userId": "user_id",
  "sessionId": "session_id",
  "data": {},
  "metadata": {}
}
```

### Message Types

#### Connection Events
- `connect`: User connected
- `disconnect`: User disconnected
- `reconnect`: User reconnected

#### Reconciliation Events
- `reconciliation:progress`: Job progress update
- `reconciliation:completed`: Job completed
- `reconciliation:error`: Job error

#### Collaboration Events
- `collaboration:user_joined`: User joined project
- `collaboration:user_left`: User left project
- `collaboration:cursor_update`: Cursor position update
- `collaboration:selection_update`: Selection update

#### Notification Events
- `notification:new`: New notification
- `notification:read`: Notification read

### Example WebSocket Usage

```javascript
const ws = new WebSocket('ws://localhost:8080/ws?token=your_jwt_token');

ws.onopen = function() {
  console.log('Connected to WebSocket');
};

ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'reconciliation:progress':
      console.log('Job progress:', message.data.progress);
      break;
    case 'reconciliation:completed':
      console.log('Job completed:', message.data.jobId);
      break;
    case 'notification:new':
      console.log('New notification:', message.data.title);
      break;
  }
};

ws.onclose = function() {
  console.log('WebSocket connection closed');
};

ws.onerror = function(error) {
  console.error('WebSocket error:', error);
};
```

### Server-Sent Events (when enabled)

- Endpoint: `GET /api/events/stream`
- Uses the same token and emits the same payload schema as WebSockets

---

## SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @378reconciliation/sdk
```

```typescript
import { ReconciliationClient } from '@378reconciliation/sdk';

const client = new ReconciliationClient({
  baseUrl: 'http://localhost:8080',
  token: process.env.API_TOKEN!
});

// Create a project
const projects = await client.projects.list({ status: 'active' });

// Upload a file
const file = await client.files.upload(project.id, fileData);

// Create reconciliation job
const job = await client.reconciliation.createJob({
  name: 'Reconciliation Job',
  projectId: project.id,
  sourceDataSourceId: sourceId,
  targetDataSourceId: targetId
});
```

### Python

```bash
pip install reconciliation-sdk
```

```python
from reconciliation_sdk import ReconciliationClient

client = ReconciliationClient(
    base_url='http://localhost:8080',
    token='your_jwt_token'
)

# Create a project
project = client.projects.create(
    name='My Project',
    description='Project description'
)

# Upload a file
file = client.files.upload(project.id, file_data)

# Create reconciliation job
job = client.reconciliation.create_job(
    name='Reconciliation Job',
    project_id=project.id,
    source_data_source_id=source_id,
    target_data_source_id=target_id
)
```

---

## Examples

### Complete Reconciliation Workflow

```bash
# 1. Authenticate
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}' \
  | jq -r '.access_token')

# 2. Create a project
PROJECT_ID=$(curl -s -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Quarterly Reconciliation","description":"Q4 close"}' \
  | jq -r '.id')

# 3. Upload source data
FILE_ID=$(curl -s -X POST http://localhost:8080/api/files/upload?project_id=$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./data/source.csv" \
  | jq -r '.data.id')

# 4. Launch reconciliation
JOB_ID=$(curl -s -X POST http://localhost:8080/api/reconciliation/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Q4 vs ERP\",\"project_id\":\"$PROJECT_ID\",\"source_data_source_id\":\"$FILE_ID\",\"target_data_source_id\":\"$FILE_ID\"}" \
  | jq -r '.data.id')

# 5. Start job
curl -X POST http://localhost:8080/api/reconciliation/jobs/$JOB_ID/start \
  -H "Authorization: Bearer $TOKEN"

# 6. Monitor progress
curl -X GET http://localhost:8080/api/reconciliation/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.status'

# 7. Get results
curl -X GET http://localhost:8080/api/reconciliation/jobs/$JOB_ID/results \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.results'
```

---

## Support

For API support and questions:

- **Email**: api-support@378reconciliation.com
- **Documentation**: https://docs.378reconciliation.com
- **Status Page**: https://status.378reconciliation.com
- **Issue Tracker**: GitHub Issues (`reconciliation-platform-378`)

---

## Changelog

### Version 1.0.0 (2024-01-01)

- Initial API release
- Authentication and user management
- Project and file management
- Data source management
- Reconciliation job processing
- Analytics and reporting
- WebSocket real-time updates
