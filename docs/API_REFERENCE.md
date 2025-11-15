# 378 Reconciliation Platform - API Documentation

## Overview

The 378 Reconciliation Platform provides a comprehensive REST API for data reconciliation, project management, and user administration. This API enables seamless integration with external systems and provides real-time data processing capabilities.

## Base URL

```
Production: https://api.378reconciliation.com
Development: http://localhost:8080
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

## Rate Limiting

- **Rate Limit**: 100 requests per hour per user
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "error_code",
  "message": "Human readable error message",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |

## API Endpoints

### Authentication

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

### File Management

#### POST /api/files/upload

Upload a file to a project.

**Request:** Multipart form data
- `file`: The file to upload
- `project_id`: Project ID

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

Process uploaded file.

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

Delete file.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

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

#### POST /api/reconciliation/jobs

Create a new reconciliation job.

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

#### POST /api/reconciliation/jobs/{id}/start

Start reconciliation job.

**Response:**
```json
{
  "success": true,
  "message": "Reconciliation job started"
}
```

#### POST /api/reconciliation/jobs/{id}/stop

Stop reconciliation job.

**Response:**
```json
{
  "success": true,
  "message": "Reconciliation job stopped"
}
```

#### GET /api/reconciliation/jobs/{id}/results

Get reconciliation results.

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

#### POST /api/reconciliation/jobs/{id}/results/{result_id}/approve

Approve reconciliation result.

**Response:**
```json
{
  "success": true,
  "message": "Result approved"
}
```

#### POST /api/reconciliation/jobs/{id}/results/{result_id}/reject

Reject reconciliation result.

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

#### GET /api/analytics/reconciliation

Get reconciliation analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_jobs": 100,
    "completed_jobs": 95,
    "failed_jobs": 5,
    "pending_jobs": 0,
    "running_jobs": 0,
    "total_records_processed": 100000,
    "total_matches": 95000,
    "total_unmatched": 5000,
    "average_confidence_score": 0.82,
    "average_processing_time_ms": 300000,
    "jobs_by_month": [
      {
        "month": "2024-01",
        "count": 25
      }
    ]
  }
}
```

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

#### GET /api/system/status

Get system status.

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

Get system metrics (Admin only).

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

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @378reconciliation/sdk
```

```javascript
import { ReconciliationClient } from '@378reconciliation/sdk';

const client = new ReconciliationClient({
  baseUrl: 'http://localhost:8080',
  token: 'your_jwt_token'
});

// Create a project
const project = await client.projects.create({
  name: 'My Project',
  description: 'Project description'
});

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

## Examples

### Complete Reconciliation Workflow

```bash
# 1. Authenticate
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.token')

# 2. Create project
PROJECT_ID=$(curl -s -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Reconciliation Project","description":"Test project"}' \
  | jq -r '.data.id')

# 3. Upload files
FILE1_ID=$(curl -s -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@source1.csv" \
  -F "project_id=$PROJECT_ID" \
  | jq -r '.data.id')

FILE2_ID=$(curl -s -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@source2.csv" \
  -F "project_id=$PROJECT_ID" \
  | jq -r '.data.id')

# 4. Create data sources
SOURCE_ID=$(curl -s -X POST http://localhost:8080/api/data-sources \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Source 1\",\"source_type\":\"csv\",\"project_id\":\"$PROJECT_ID\",\"file_id\":\"$FILE1_ID\"}" \
  | jq -r '.data.id')

TARGET_ID=$(curl -s -X POST http://localhost:8080/api/data-sources \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Source 2\",\"source_type\":\"csv\",\"project_id\":\"$PROJECT_ID\",\"file_id\":\"$FILE2_ID\"}" \
  | jq -r '.data.id')

# 5. Create reconciliation job
JOB_ID=$(curl -s -X POST http://localhost:8080/api/reconciliation/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Job\",\"project_id\":\"$PROJECT_ID\",\"source_data_source_id\":\"$SOURCE_ID\",\"target_data_source_id\":\"$TARGET_ID\"}" \
  | jq -r '.data.id')

# 6. Start job
curl -s -X POST http://localhost:8080/api/reconciliation/jobs/$JOB_ID/start \
  -H "Authorization: Bearer $TOKEN"

# 7. Monitor progress
curl -s -X GET http://localhost:8080/api/reconciliation/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.status'

# 8. Get results
curl -s -X GET http://localhost:8080/api/reconciliation/jobs/$JOB_ID/results \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.results'
```

## Changelog

### Version 1.0.0 (2024-01-01)

- Initial API release
- Authentication and user management
- Project and file management
- Data source management
- Reconciliation job processing
- Analytics and reporting
- WebSocket real-time updates

## Support

For API support and questions:

- **Email**: api-support@378reconciliation.com
- **Documentation**: https://docs.378reconciliation.com
- **Status Page**: https://status.378reconciliation.com
