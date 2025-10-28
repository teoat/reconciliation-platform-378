# 📡 API DOCUMENTATION

## 🔐 Authentication

The Reconciliation API uses JWT-based authentication with refresh tokens for secure access.

### Authentication Flow

1. **Login** - Obtain access and refresh tokens
2. **API Requests** - Include access token in Authorization header
3. **Token Refresh** - Use refresh token to get new access token
4. **Logout** - Invalidate tokens

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "analyst",
    "permissions": ["read", "write"]
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### Authorization Header

Include the access token in the Authorization header for all authenticated requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👥 User Management

### User Endpoints

#### Get Users
```http
GET /api/users?page=1&limit=50&role=analyst
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "users": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "analyst",
      "permissions": ["read", "write"],
      "preferences": {
        "theme": "dark",
        "notifications": true
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 250,
    "limit": 50,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Create User
```http
POST /api/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "analyst",
  "password": "securepassword123"
}
```

#### Get User by ID
```http
GET /api/users/{id}
Authorization: Bearer <access_token>
```

#### Update User
```http
PUT /api/users/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "role": "manager",
  "preferences": {
    "theme": "light",
    "notifications": false
  }
}
```

#### Delete User
```http
DELETE /api/users/{id}
Authorization: Bearer <access_token>
```

### User Roles and Permissions

#### Available Roles
- **admin** - Full system access
- **manager** - Project and user management
- **analyst** - Data analysis and reconciliation
- **viewer** - Read-only access

#### Permission System
```json
{
  "permissions": [
    {
      "resource": "users",
      "actions": ["read", "write", "delete"],
      "conditions": {
        "project_id": "optional-project-filter"
      }
    },
    {
      "resource": "projects",
      "actions": ["read", "write"],
      "conditions": null
    }
  ]
}
```

## 📁 Project Management

### Project Endpoints

#### Get Projects
```http
GET /api/projects?page=1&limit=50&status=active
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "projects": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Q4 Financial Reconciliation",
      "description": "Quarterly financial data reconciliation",
      "status": "active",
      "project_type": "financial",
      "owner_id": "123e4567-e89b-12d3-a456-426614174001",
      "settings": {
        "auto_match_threshold": 0.8,
        "notification_enabled": true
      },
      "data": {
        "source_systems": ["ERP", "Banking"],
        "currency": "USD"
      },
      "analytics": {
        "total_records": 10000,
        "matched_records": 8500,
        "unmatched_records": 1500
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 150,
    "limit": 50,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "New Reconciliation Project",
  "description": "Project description",
  "project_type": "financial",
  "settings": {
    "auto_match_threshold": 0.8,
    "notification_enabled": true
  },
  "data": {
    "source_systems": ["ERP", "Banking"],
    "currency": "USD"
  }
}
```

#### Get Project by ID
```http
GET /api/projects/{id}
Authorization: Bearer <access_token>
```

#### Update Project
```http
PUT /api/projects/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description",
  "settings": {
    "auto_match_threshold": 0.9,
    "notification_enabled": false
  }
}
```

#### Delete Project
```http
DELETE /api/projects/{id}
Authorization: Bearer <access_token>
```

### Project Members

#### Get Project Members
```http
GET /api/projects/{id}/members
Authorization: Bearer <access_token>
```

#### Add Project Member
```http
POST /api/projects/{id}/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "role": "analyst",
  "permissions": ["read", "write"]
}
```

#### Update Project Member
```http
PUT /api/projects/{id}/members/{member_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "manager",
  "permissions": ["read", "write", "delete"]
}
```

#### Remove Project Member
```http
DELETE /api/projects/{id}/members/{member_id}
Authorization: Bearer <access_token>
```

## 📊 Data Ingestion

### Ingestion Endpoints

#### Upload File
```http
POST /api/ingestion/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <file_data>
project_id: "123e4567-e89b-12d3-a456-426614174000"
file_type: "csv"
```

**Response:**
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "financial_data.csv",
  "status": "processing",
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Get Ingestion Jobs
```http
GET /api/ingestion/jobs?project_id={id}&status=completed&page=1&limit=50
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "project_id": "123e4567-e89b-12d3-a456-426614174001",
      "filename": "financial_data.csv",
      "status": "completed",
      "metadata": {
        "file_size": 1024000,
        "columns": ["id", "amount", "date", "description"],
        "encoding": "utf-8"
      },
      "quality_metrics": {
        "total_rows": 10000,
        "valid_rows": 9950,
        "invalid_rows": 50,
        "duplicate_rows": 25,
        "completeness_score": 0.995
      },
      "record_count": 9950,
      "created_by": "123e4567-e89b-12d3-a456-426614174002",
      "started_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:35:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:35:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_count": 75,
    "limit": 50,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Get Ingestion Job by ID
```http
GET /api/ingestion/jobs/{id}
Authorization: Bearer <access_token>
```

#### Get Job Status
```http
GET /api/ingestion/jobs/{id}/status
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": 75,
  "current_step": "data_validation",
  "estimated_completion": "2024-01-15T10:40:00Z",
  "error_message": null
}
```

#### Cancel Ingestion Job
```http
POST /api/ingestion/jobs/{id}/cancel
Authorization: Bearer <access_token>
```

### Supported File Formats

#### CSV Files
```csv
id,amount,date,description,external_id
1,100.50,2024-01-15,Payment to vendor A,EXT001
2,250.75,2024-01-16,Payment to vendor B,EXT002
```

#### Excel Files
- **.xlsx** - Excel 2007+ format
- **.xls** - Legacy Excel format

#### JSON Files
```json
[
  {
    "id": "1",
    "amount": 100.50,
    "date": "2024-01-15",
    "description": "Payment to vendor A",
    "external_id": "EXT001"
  }
]
```

#### XML Files
```xml
<?xml version="1.0" encoding="UTF-8"?>
<records>
  <record>
    <id>1</id>
    <amount>100.50</amount>
    <date>2024-01-15</date>
    <description>Payment to vendor A</description>
    <external_id>EXT001</external_id>
  </record>
</records>
```

## 🔄 Reconciliation

### Reconciliation Endpoints

#### Get Reconciliation Records
```http
GET /api/reconciliation/records?project_id={id}&status=unmatched&page=1&limit=50
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "records": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "project_id": "123e4567-e89b-12d3-a456-426614174001",
      "ingestion_job_id": "123e4567-e89b-12d3-a456-426614174002",
      "external_id": "EXT001",
      "status": "unmatched",
      "amount": 100.50,
      "transaction_date": "2024-01-15",
      "description": "Payment to vendor A",
      "source_data": {
        "original_row": 1,
        "source_file": "financial_data.csv"
      },
      "matching_results": {
        "candidates": [
          {
            "record_id": "123e4567-e89b-12d3-a456-426614174003",
            "confidence": 0.95,
            "match_reasons": ["exact_amount", "same_date"]
          }
        ]
      },
      "confidence": null,
      "audit_trail": {
        "created_by": "system",
        "created_at": "2024-01-15T10:30:00Z",
        "last_modified_by": "user@example.com",
        "last_modified_at": "2024-01-15T11:00:00Z"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 20,
    "total_count": 1000,
    "limit": 50,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Create Reconciliation Record
```http
POST /api/reconciliation/records
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "ingestion_job_id": "123e4567-e89b-12d3-a456-426614174001",
  "external_id": "EXT001",
  "amount": 100.50,
  "transaction_date": "2024-01-15",
  "description": "Payment to vendor A",
  "source_data": {
    "original_row": 1,
    "source_file": "financial_data.csv"
  }
}
```

#### Match Records
```http
POST /api/reconciliation/match
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "record1_id": "123e4567-e89b-12d3-a456-426614174000",
  "record2_id": "123e4567-e89b-12d3-a456-426614174001",
  "confidence_threshold": 0.8
}
```

**Response:**
```json
{
  "record1_id": "123e4567-e89b-12d3-a456-426614174000",
  "record2_id": "123e4567-e89b-12d3-a456-426614174001",
  "confidence": 0.95,
  "match_type": "high_confidence",
  "reasons": [
    "Exact amount match",
    "Same transaction date",
    "High description similarity"
  ],
  "is_match": true
}
```

#### Bulk Actions
```http
POST /api/reconciliation/bulk-action
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "action": "match",
  "record_ids": [
    "123e4567-e89b-12d3-a456-426614174000",
    "123e4567-e89b-12d3-a456-426614174001"
  ],
  "parameters": {
    "confidence_threshold": 0.8,
    "auto_confirm": false
  }
}
```

#### AI-Powered Matching
```http
POST /api/reconciliation/ai-match
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "algorithm": "fuzzy_matching",
  "parameters": {
    "confidence_threshold": 0.7,
    "use_machine_learning": true
  }
}
```

**Response:**
```json
{
  "message": "AI matching completed successfully",
  "matches": [
    {
      "record1_id": "123e4567-e89b-12d3-a456-426614174000",
      "record2_id": "123e4567-e89b-12d3-a456-426614174001",
      "confidence": 0.92,
      "match_type": "ai_high_confidence"
    }
  ],
  "summary": {
    "total_comparisons": 10000,
    "high_confidence_matches": 8500,
    "medium_confidence_matches": 1000,
    "low_confidence_matches": 500,
    "processing_time": 45
  }
}
```

#### Get Reconciliation Summary
```http
GET /api/reconciliation/summary/{project_id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "total_records": 10000,
  "matched_records": 8500,
  "unmatched_records": 1500,
  "high_confidence_matches": 7000,
  "medium_confidence_matches": 1000,
  "low_confidence_matches": 500,
  "processing_time_ms": 45000,
  "last_updated": "2024-01-15T12:00:00Z"
}
```

### Matching Algorithms

#### Exact Matching
- **Amount Match** - Exact numeric value match
- **Date Match** - Same transaction date
- **External ID Match** - Same external identifier

#### Fuzzy Matching
- **String Similarity** - Levenshtein distance calculation
- **Numeric Tolerance** - Amount within specified range
- **Date Range** - Transaction date within range

#### AI-Powered Matching
- **Machine Learning** - Trained models for pattern recognition
- **Natural Language Processing** - Description analysis
- **Anomaly Detection** - Identify unusual patterns

## 📈 Analytics

### Analytics Endpoints

#### Get Project Analytics
```http
GET /api/analytics/projects/{id}?period=30d&metrics=all
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "period": "30d",
  "metrics": {
    "total_records": 10000,
    "matched_records": 8500,
    "unmatched_records": 1500,
    "match_rate": 0.85,
    "average_confidence": 0.92,
    "processing_time": {
      "total": 45000,
      "average_per_record": 4.5
    },
    "trends": {
      "daily_matches": [
        {"date": "2024-01-01", "matches": 300},
        {"date": "2024-01-02", "matches": 350}
      ],
      "confidence_distribution": {
        "high": 7000,
        "medium": 1000,
        "low": 500
      }
    }
  },
  "charts": {
    "match_rate_over_time": {
      "type": "line",
      "data": [
        {"date": "2024-01-01", "rate": 0.82},
        {"date": "2024-01-02", "rate": 0.85}
      ]
    },
    "confidence_distribution": {
      "type": "pie",
      "data": [
        {"label": "High Confidence", "value": 7000},
        {"label": "Medium Confidence", "value": 1000},
        {"label": "Low Confidence", "value": 500}
      ]
    }
  }
}
```

#### Get User Analytics
```http
GET /api/analytics/users/{id}?period=7d
Authorization: Bearer <access_token>
```

#### Get System Analytics
```http
GET /api/analytics/system?period=24h
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "period": "24h",
  "system_metrics": {
    "total_users": 150,
    "active_users": 45,
    "total_projects": 25,
    "active_projects": 12,
    "total_records_processed": 50000,
    "api_requests": {
      "total": 15000,
      "successful": 14850,
      "failed": 150,
      "average_response_time": 250
    },
    "performance": {
      "cpu_usage": 45.5,
      "memory_usage": 68.2,
      "disk_usage": 25.8
    }
  }
}
```

#### Generate Custom Report
```http
POST /api/analytics/reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Monthly Reconciliation Report",
  "project_ids": ["123e4567-e89b-12d3-a456-426614174000"],
  "metrics": ["match_rate", "confidence", "processing_time"],
  "period": "30d",
  "format": "pdf",
  "schedule": "monthly"
}
```

## 🔒 Security

### Security Endpoints

#### Get Security Events
```http
GET /api/security/events?severity=high&page=1&limit=50
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "events": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "failed_login",
      "severity": "high",
      "user_id": "123e4567-e89b-12d3-a456-426614174001",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "details": {
        "attempted_email": "user@example.com",
        "failure_reason": "invalid_password"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 250,
    "limit": 50,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Get Audit Logs
```http
GET /api/security/audit-logs?user_id={id}&action=create&page=1&limit=50
Authorization: Bearer <access_token>
```

#### Security Configuration
```http
GET /api/security/config
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "password_policy": {
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special_chars": true,
    "max_age_days": 90
  },
  "session_policy": {
    "timeout_minutes": 30,
    "max_concurrent_sessions": 3
  },
  "rate_limiting": {
    "requests_per_minute": 100,
    "burst_limit": 200
  }
}
```

## 🗄️ Storage

### Storage Endpoints

#### Upload File to Storage
```http
POST /api/storage/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <file_data>
bucket: "reconciliation-files"
path: "projects/{project_id}/uploads/"
```

#### Get Storage Files
```http
GET /api/storage/files?bucket=reconciliation-files&path=projects/{id}/
Authorization: Bearer <access_token>
```

#### Download File
```http
GET /api/storage/files/{file_id}/download
Authorization: Bearer <access_token>
```

#### Delete File
```http
DELETE /api/storage/files/{file_id}
Authorization: Bearer <access_token>
```

## 🔗 Webhooks

### Webhook Endpoints

#### Get Webhooks
```http
GET /api/webhooks?project_id={id}&status=active
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "webhooks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Slack Notifications",
      "url": "https://hooks.slack.com/services/...",
      "events": ["reconciliation.completed", "reconciliation.failed"],
      "status": "active",
      "secret": "webhook_secret",
      "retry_policy": {
        "max_retries": 3,
        "retry_delay": 5000
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Webhook
```http
POST /api/webhooks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/...",
  "events": ["reconciliation.completed", "reconciliation.failed"],
  "secret": "webhook_secret",
  "retry_policy": {
    "max_retries": 3,
    "retry_delay": 5000
  }
}
```

#### Test Webhook
```http
POST /api/webhooks/{id}/test
Authorization: Bearer <access_token>
```

#### Get Webhook Logs
```http
GET /api/webhooks/{id}/logs?page=1&limit=50
Authorization: Bearer <access_token>
```

### Webhook Events

#### Available Events
- **reconciliation.started** - Reconciliation process started
- **reconciliation.completed** - Reconciliation process completed
- **reconciliation.failed** - Reconciliation process failed
- **project.created** - New project created
- **project.updated** - Project updated
- **user.created** - New user created
- **user.login** - User logged in
- **user.logout** - User logged out

#### Webhook Payload Example
```json
{
  "event": "reconciliation.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "project_name": "Q4 Financial Reconciliation",
    "total_records": 10000,
    "matched_records": 8500,
    "unmatched_records": 1500,
    "match_rate": 0.85,
    "processing_time": 45000
  },
  "webhook_id": "123e4567-e89b-12d3-a456-426614174001"
}
```

## 🏪 Marketplace

### Marketplace Endpoints

#### Get Available Integrations
```http
GET /api/marketplace/integrations?category=analytics&status=active
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "integrations": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Google Analytics",
      "category": "analytics",
      "description": "Integrate with Google Analytics for web tracking",
      "status": "active",
      "version": "1.2.0",
      "configuration": {
        "required_fields": ["tracking_id", "api_key"],
        "optional_fields": ["custom_dimensions"]
      },
      "pricing": {
        "type": "free",
        "limits": {
          "requests_per_month": 10000
        }
      }
    }
  ]
}
```

#### Install Integration
```http
POST /api/marketplace/integrations/{id}/install
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "configuration": {
    "tracking_id": "GA-XXXXXXXXX",
    "api_key": "your_api_key"
  }
}
```

#### Get Installed Integrations
```http
GET /api/marketplace/installed
Authorization: Bearer <access_token>
```

## ⚡ Performance

### Performance Endpoints

#### Get Performance Metrics
```http
GET /api/performance/metrics
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "cpu_usage_percent": 45.5,
  "memory_usage_mb": 1024.5,
  "active_tasks": 12,
  "completed_tasks": 1500,
  "average_task_duration_ms": 250.5,
  "throughput_per_second": 45.2,
  "network_total_requests": 15000,
  "network_successful_requests": 14850,
  "network_failed_requests": 150,
  "network_average_response_time_ms": 250.5,
  "database_active_connections": 8,
  "database_idle_connections": 12,
  "database_max_connections": 20,
  "database_connection_wait_time_ms": 5.2,
  "cache_hits": 8500,
  "cache_misses": 1500,
  "cache_hit_rate": 0.85
}
```

#### Clear Cache
```http
POST /api/performance/cache/clear
Authorization: Bearer <access_token>
```

#### Optimize Performance
```http
POST /api/performance/optimize
Authorization: Bearer <access_token>
```

#### Get Health Status
```http
GET /api/performance/health
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "metrics": {
    "cpu_usage_percent": 45.5,
    "memory_usage_mb": 1024.5,
    "response_time_ms": 250.5,
    "error_rate": 0.01
  },
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "external_services": "healthy"
  }
}
```

## 📝 Logs

### Log Endpoints

#### Get Application Logs
```http
GET /api/logs?level=error&page=1&limit=50&start_date=2024-01-01&end_date=2024-01-15
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "logs": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "level": "error",
      "message": "Database connection failed",
      "timestamp": "2024-01-15T10:30:00Z",
      "source": "database",
      "user_id": "123e4567-e89b-12d3-a456-426614174001",
      "request_id": "req_123456789",
      "details": {
        "error_code": "CONNECTION_TIMEOUT",
        "retry_count": 3
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_count": 500,
    "limit": 50,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Get System Logs
```http
GET /api/logs/system?level=warning&page=1&limit=50
Authorization: Bearer <access_token>
```

## ❌ Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00Z",
  "details": {
    "field": "email",
    "code": "INVALID_FORMAT"
  },
  "request_id": "req_123456789"
}
```

### HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Access denied
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict
- **422 Unprocessable Entity** - Validation error
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

### Common Error Codes

#### Authentication Errors
- **INVALID_CREDENTIALS** - Invalid email or password
- **TOKEN_EXPIRED** - Access token expired
- **TOKEN_INVALID** - Invalid access token
- **REFRESH_TOKEN_EXPIRED** - Refresh token expired

#### Validation Errors
- **INVALID_EMAIL** - Invalid email format
- **PASSWORD_TOO_WEAK** - Password doesn't meet requirements
- **REQUIRED_FIELD** - Required field missing
- **INVALID_FORMAT** - Invalid data format

#### Business Logic Errors
- **PROJECT_NOT_FOUND** - Project doesn't exist
- **INSUFFICIENT_PERMISSIONS** - User lacks required permissions
- **RECORD_ALREADY_MATCHED** - Record already matched
- **FILE_TOO_LARGE** - Uploaded file exceeds size limit

## 🔧 SDKs and Libraries

### TypeScript/JavaScript SDK

```typescript
import { ReconciliationClient } from '@reconciliation/sdk';

const client = new ReconciliationClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.reconciliation.example.com'
});

// Get projects
const projects = await client.projects.list();

// Create reconciliation record
const record = await client.reconciliation.createRecord({
  project_id: 'project-id',
  amount: 100.50,
  transaction_date: '2024-01-15',
  description: 'Payment to vendor'
});

// Match records
const match = await client.reconciliation.match({
  record1_id: 'record-1',
  record2_id: 'record-2',
  confidence_threshold: 0.8
});
```

### Python SDK

```python
from reconciliation_sdk import ReconciliationClient

client = ReconciliationClient(
    api_key='your-api-key',
    base_url='https://api.reconciliation.example.com'
)

# Get projects
projects = client.projects.list()

# Create reconciliation record
record = client.reconciliation.create_record({
    'project_id': 'project-id',
    'amount': 100.50,
    'transaction_date': '2024-01-15',
    'description': 'Payment to vendor'
})

# Match records
match = client.reconciliation.match({
    'record1_id': 'record-1',
    'record2_id': 'record-2',
    'confidence_threshold': 0.8
})
```

### cURL Examples

#### Authentication
```bash
# Login
curl -X POST https://api.reconciliation.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Use access token
curl -X GET https://api.reconciliation.example.com/api/users \
  -H "Authorization: Bearer your-access-token"
```

#### Create Project
```bash
curl -X POST https://api.reconciliation.example.com/api/projects \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Project",
    "description": "Project description",
    "project_type": "financial"
  }'
```

#### Upload File
```bash
curl -X POST https://api.reconciliation.example.com/api/ingestion/upload \
  -H "Authorization: Bearer your-access-token" \
  -F "file=@data.csv" \
  -F "project_id=project-id" \
  -F "file_type=csv"
```

## 📊 Rate Limiting

### Rate Limits

- **Authentication endpoints**: 10 requests per minute
- **General API endpoints**: 100 requests per minute
- **File upload endpoints**: 20 requests per minute
- **Bulk operations**: 10 requests per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "status": 429,
  "timestamp": "2024-01-15T10:30:00Z",
  "retry_after": 60
}
```

## 🔄 WebSocket API

### WebSocket Connection

```javascript
const ws = new WebSocket('wss://api.reconciliation.example.com/ws');

ws.onopen = function() {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-access-token'
  }));
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### WebSocket Events

#### Real-time Updates
```json
{
  "type": "reconciliation_update",
  "data": {
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "processing",
    "progress": 75,
    "matched_records": 7500,
    "total_records": 10000
  }
}
```

#### Notifications
```json
{
  "type": "notification",
  "data": {
    "title": "Reconciliation Completed",
    "message": "Project Q4 Financial Reconciliation has been completed",
    "project_id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

---

This comprehensive API documentation provides all the information needed to integrate with the Reconciliation Platform. For additional support or questions, please refer to the community resources or contact our support team.
