# API Documentation

Concise reference for integrating with the 378 Reconciliation Platform REST and realtime APIs.

## Base URLs
- Production: `https://api.378reconciliation.com`
- Development: `http://localhost:8080`

## Authentication
- JWT access tokens with refresh tokens; include the access token on every request:  
  `Authorization: Bearer <access_token>`
- Default token expiry: 1 hour; refresh before expiry to maintain sessions.

### Authentication Flow
1. `POST /api/auth/login` → returns access and refresh tokens.
2. Use the access token on subsequent requests.
3. `POST /api/auth/refresh` with the refresh token to rotate credentials.
4. `POST /api/auth/logout` to invalidate tokens.
5. Optional flows:
   - `POST /api/auth/register` – create a new user.
   - `POST /api/auth/change-password` – change password (accepts `{ "current_password", "new_password" }`; current backend expects a user identifier via middleware and will be updated to accept explicit path/query parameters).
   - `POST /api/auth/password-reset` – request password reset token.
   - `POST /api/auth/password-reset/confirm` – confirm reset with token + new password.
   - `GET /api/auth/me` – fetch the current authenticated user profile (requires middleware to inject identity; presently returns a placeholder until JWT extraction is wired up).

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

## Rate Limiting
- Authentication endpoints: 10 requests/minute.
- General API endpoints: 100 requests/minute.
- File upload and bulk endpoints: 20 requests/minute.
- Headers surfaced on every response:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 94
  X-RateLimit-Reset: 1736443200
  ```

## Error Model
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Email address is invalid",
  "details": { "field": "email" },
  "timestamp": "2025-01-01T12:00:00Z",
  "request_id": "req_01HFZ6B1AVX9N9K2D7D4GZ7F9A"
}
```

| Code                  | Status | Meaning                                |
|-----------------------|--------|----------------------------------------|
| `VALIDATION_ERROR`    | 400    | Input failed validation                |
| `UNAUTHORIZED`        | 401    | Missing or invalid credentials         |
| `FORBIDDEN`           | 403    | Lacking the required role/permission   |
| `NOT_FOUND`           | 404    | Referenced resource does not exist     |
| `RATE_LIMIT_EXCEEDED` | 429    | Slow down; retry after reset           |
| `INTERNAL_ERROR`      | 500    | Unexpected server-side failure         |

## Endpoint Catalogue

### User & Access Management
| Method/Path                   | Description                              | Notes                                    |
|-------------------------------|------------------------------------------|------------------------------------------|
| `GET /api/users`              | List users                               | Supports `page`, `per_page`              |
| `POST /api/users`             | Create user                              | Admin only                               |
| `GET /api/users/{user_id}`    | Retrieve user profile                    |                                          |
| `PUT /api/users/{user_id}`    | Update user profile                      |                                          |
| `DELETE /api/users/{user_id}` | Delete user                              | Soft-delete semantics                    |
| `GET /api/users/search`       | Search users by name/email               | Query: `q`, `page`, `per_page`           |
| `GET /api/users/statistics`   | Aggregate platform-wide user statistics  | Admin/reporting                          |

### Project & Collaboration
| Method/Path                                             | Description                                        |
|---------------------------------------------------------|----------------------------------------------------|
| `GET /api/projects`                                     | List projects (supports pagination)                |
| `POST /api/projects`                                    | Create project                                     |
| `GET /api/projects/{project_id}`                        | Project detail                                     |
| `PUT /api/projects/{project_id}`                        | Update project                                     |
| `DELETE /api/projects/{project_id}`                     | Archive/delete project                             |
| `GET /api/projects/{project_id}/data-sources`           | List project data sources                          |
| `POST /api/projects/{project_id}/data-sources`          | Create data source                                 |
| `GET /api/projects/{project_id}/reconciliation-jobs`    | List reconciliation jobs scoped to project         |
| `POST /api/projects/{project_id}/reconciliation-jobs`   | Create reconciliation job for project              |

### Data Ingestion & Storage
| Method/Path                                | Description                                        | Notes                                        |
|--------------------------------------------|----------------------------------------------------|----------------------------------------------|
| `POST /api/files/upload?project_id=UUID`   | Multipart upload into a project                    | Form-data: `file`; query param is required   |
| `GET /api/files/{file_id}`                 | Inspect upload metadata and processing results     |                                              |
| `POST /api/files/{file_id}/process`        | Kick off ingestion pipeline                        |                                              |
| `DELETE /api/files/{file_id}`              | Remove file and associated staging data            |                                              |
| `GET /api/ingestion/jobs`                  | Track ingestion jobs (status, metrics)             | (Scoped service implementation in progress)  |
| `POST /api/ingestion/jobs/{job_id}/cancel` | Abort an active ingestion job                      |                                              |
| `GET /api/storage/files`                   | List stored assets (S3/GCS abstraction)            |                                              |
| `GET /api/storage/files/{file_id}/download`| Stream/download a stored file                      |                                              |

### Reconciliation Engine
| Method/Path                                                  | Description                                        |
|--------------------------------------------------------------|----------------------------------------------------|
| `GET /api/reconciliation/jobs`                               | Paginated job listing                              |
| `GET /api/reconciliation/jobs/active`                        | Active jobs snapshot                               |
| `GET /api/reconciliation/jobs/queued`                        | Queued jobs snapshot                               |
| `POST /api/reconciliation/jobs` (planned)                    | Create job (available through project-scoped path) |
| `GET /api/reconciliation/jobs/{job_id}`                      | Job detail/status                                  |
| `PUT /api/reconciliation/jobs/{job_id}`                      | Update job metadata/settings                       |
| `DELETE /api/reconciliation/jobs/{job_id}`                   | Delete job                                         |
| `POST /api/reconciliation/jobs/{job_id}/start`               | Start processing                                   |
| `POST /api/reconciliation/jobs/{job_id}/stop`                | Halt processing                                    |
| `GET /api/reconciliation/jobs/{job_id}/results`              | Review matches, confidence, approval status        |
| `GET /api/reconciliation/jobs/{job_id}/progress`             | Poll for progress metrics                          |
| `GET /api/reconciliation/jobs/{job_id}/statistics`           | Summary metrics for a single job                   |
| `POST /api/reconciliation/jobs/{job_id}/results/{result_id}/approve` | Approve a result |
| `POST /api/reconciliation/jobs/{job_id}/results/{result_id}/reject`  | Reject with reason |
| `GET /api/reconciliation/summary/{project_id}`               | Aggregated stats for a project                     |

Matching strategies supported:
- Exact match (amount/date/external ID).
- Fuzzy matching (adjustable thresholds).
- Machine-learning assisted comparisons with anomaly detection and confidence scoring.

### Analytics & Monitoring
| Method/Path                                        | Description                                  |
|----------------------------------------------------|----------------------------------------------|
| `GET /api/analytics/dashboard`                     | Global KPI snapshot                          |
| `GET /api/analytics/projects/{project_id}/stats`   | Project-level analytics                      |
| `GET /api/analytics/users/{user_id}/activity`      | User activity timeline                       |
| `GET /api/analytics/reconciliation/stats`          | Fleet-wide reconciliation metrics            |
| `POST /api/analytics/reports`                      | Generate scheduled or on-demand reports      |
| `GET /api/system/health`                           | High-level system health JSON                |
| `GET /api/system/status`                           | Operational status summary                   |
| `GET /api/system/metrics`                          | Detailed runtime metrics (JSON)              |
| `/health`, `/health/live`, `/health/ready`         | Liveness/readiness endpoints (root scope)    |
| `/metrics`, `/metrics/summary`                     | Prometheus/plain text & JSON metrics         |

### Security & Audit
| Method/Path                     | Description                       |
|---------------------------------|-----------------------------------|
| `GET /api/security/events`      | Security event feed               |
| `GET /api/security/audit-logs`  | Audit log traversal               |
| `GET /api/security/config`      | Current password/session policies |

### Webhooks & Integrations
| Method/Path                               | Description                                   |
|-------------------------------------------|-----------------------------------------------|
| `GET /api/webhooks`                       | List configured webhooks                      |
| `POST /api/webhooks`                      | Create/update webhook endpoint                |
| `POST /api/webhooks/{webhook_id}/test`    | Fire a test payload                           |
| `GET /api/webhooks/{webhook_id}/logs`     | Inspect delivery attempts                     |
| `GET /api/marketplace/integrations`       | Discover marketplace integrations             |
| `POST /api/marketplace/integrations/{id}/install` | Install/configure integration           |

Webhook payload schema:
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

## Typical Workflow
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
FILE_ID=$(curl -s -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./data/source.csv" \
  -F "project_id=$PROJECT_ID" \
  | jq -r '.data.id')

# 4. Launch reconciliation
JOB_ID=$(curl -s -X POST http://localhost:8080/api/reconciliation/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Q4 vs ERP\",\"project_id\":\"$PROJECT_ID\",\"source_data_source_id\":\"$FILE_ID\",\"target_data_source_id\":\"$FILE_ID\"}" \
  | jq -r '.data.id')

curl -X POST http://localhost:8080/api/reconciliation/jobs/$JOB_ID/start \
  -H "Authorization: Bearer $TOKEN"
```

## Realtime Interfaces

### WebSocket
- Endpoint: `ws://localhost:8080/ws?token=<access_token>`
- Message envelope:
  ```json
  {
    "type": "reconciliation:progress",
    "timestamp": "2025-01-01T11:30:00Z",
    "data": { "job_id": "job_abc", "progress": 72 }
  }
  ```
- Event families: reconciliation lifecycle, collaboration presence, notifications.

### Server-Sent Events (when enabled)
- Endpoint: `GET /api/events/stream`
- Uses the same token and emits the same payload schema as WebSockets.

## SDKs & Tooling
- JavaScript/TypeScript: `npm install @378reconciliation/sdk`
- Python: `pip install reconciliation-sdk`

Example (TypeScript):
```typescript
import { ReconciliationClient } from '@378reconciliation/sdk';

const client = new ReconciliationClient({
  baseUrl: 'http://localhost:8080',
  token: process.env.API_TOKEN!
});

const projects = await client.projects.list({ status: 'active' });
```

## Support
- Email: `api-support@378reconciliation.com`
- Status page: `https://status.378reconciliation.com`
- Issue tracker: GitHub Issues (`reconciliation-platform-378`)

