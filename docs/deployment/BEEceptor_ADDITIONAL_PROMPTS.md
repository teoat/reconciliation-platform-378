# Additional Beeceptor Configuration Prompts

This document contains specialized prompts for various Beeceptor configuration scenarios beyond basic webhook setup.

---

## 1. API Mocking Prompt

**Use Case**: Mock application API endpoints for testing and development

```text
Configure Beeceptor to mock Reconciliation Platform API endpoints for integration testing.

ENDPOINT: https://378to492.free.beeceptor.com

MOCK THESE API ENDPOINTS:

1. AUTHENTICATION ENDPOINTS:
   - POST /api/v1/auth/login
     Response (200 OK):
     {
       "token": "mock_jwt_token_12345",
       "user": {
         "id": "550e8400-e29b-12d3-a456-426614174000",
         "email": "test@example.com",
         "first_name": "Test",
         "last_name": "User",
         "role": "user"
       },
       "expires_at": 1737000000
     }
   
   - POST /api/v1/auth/register
     Response (201 Created):
     {
       "token": "mock_jwt_token_12345",
       "user": {
         "id": "550e8400-e29b-12d3-a456-426614174000",
         "email": "{{body.email}}",
         "first_name": "{{body.first_name}}",
         "last_name": "{{body.last_name}}"
       }
     }

2. PROJECT ENDPOINTS:
   - GET /api/v1/projects
     Response (200 OK):
     {
       "data": [
         {
           "id": "project-1",
           "name": "Test Project",
           "description": "Mock project",
           "status": "active",
           "created_at": "2025-01-15T10:00:00Z"
         }
       ],
       "total": 1,
       "page": 1,
       "per_page": 10
     }
   
   - POST /api/v1/projects
     Response (201 Created):
     {
       "success": true,
       "data": {
         "id": "{{uuid}}",
         "name": "{{body.name}}",
         "description": "{{body.description}}",
         "status": "active"
       }
     }

3. HEALTH CHECK:
   - GET /api/v1/health
     Response (200 OK):
     {
       "status": "ok",
       "timestamp": "{{timestamp}}",
       "version": "2.0.0",
       "services": {
         "database": "ok",
         "redis": "ok"
       }
     }

CONFIGURATION:
- Enable request logging
- Store request/response pairs
- Support query parameters (page, per_page)
- Handle authentication headers (Authorization: Bearer token)
- Return 401 Unauthorized if Authorization header missing for protected endpoints

TESTING:
Test with:
- curl -X POST https://378to492.free.beeceptor.com/api/v1/auth/login -d '{"email":"test@example.com","password":"test123"}'
- curl -X GET https://378to492.free.beeceptor.com/api/v1/projects -H "Authorization: Bearer mock_token"
```

---

## 2. Webhook Transformation Prompt

**Use Case**: Transform webhook payloads before forwarding or storing

```text
Configure Beeceptor to transform webhook payloads for the Reconciliation Platform.

ENDPOINT: https://378to492.free.beeceptor.com

TRANSFORMATION RULES:

1. ALERT WEBHOOK TRANSFORMATION (/alerts/transformed):
   - Transform Prometheus AlertManager format to simplified format
   - Input: Prometheus alert format
   - Output:
     {
       "alert_id": "{{alerts[0].labels.alertname}}",
       "severity": "{{alerts[0].labels.severity}}",
       "service": "{{alerts[0].labels.service}}",
       "message": "{{alerts[0].annotations.summary}}",
       "description": "{{alerts[0].annotations.description}}",
       "status": "{{alerts[0].status}}",
       "timestamp": "{{alerts[0].startsAt}}",
       "transformed_at": "{{timestamp}}"
     }

2. MONITORING METRIC TRANSFORMATION (/monitoring/transformed):
   - Transform application metrics to standardized format
   - Input: Application metric format
   - Output:
     {
       "metric_name": "{{data.metric}}",
       "value": "{{data.value}}",
       "unit": "{{data.unit}}",
       "service": "{{service}}",
       "timestamp": "{{timestamp}}",
       "tags": "{{data.tags}}",
       "normalized_value": "{{calculate_normalized_value}}"
     }

3. NORMALIZE TIMESTAMPS:
   - Convert all timestamps to ISO 8601 format
   - Ensure timezone is UTC
   - Format: YYYY-MM-DDTHH:mm:ssZ

CONFIGURATION:
- Create transformation rules for each endpoint
- Store both original and transformed payloads
- Log transformation errors
- Forward transformed payloads to /alerts or /monitoring endpoints
```

---

## 3. Multi-Environment Configuration Prompt

**Use Case**: Configure different Beeceptor endpoints for dev, staging, and production

```text
Configure Beeceptor endpoints for multiple environments of Reconciliation Platform.

ENVIRONMENTS:

1. DEVELOPMENT:
   - Endpoint: dev-reconciliation (or create new)
   - URL: https://dev-reconciliation.free.beeceptor.com
   - Purpose: Development and local testing
   - Retention: 3 days
   - Logging: Verbose

2. STAGING:
   - Endpoint: staging-reconciliation (or create new)
   - URL: https://staging-reconciliation.free.beeceptor.com
   - Purpose: Pre-production testing
   - Retention: 7 days
   - Logging: Standard

3. PRODUCTION:
   - Endpoint: 378to492 (existing)
   - URL: https://378to492.free.beeceptor.com
   - Purpose: Production monitoring
   - Retention: 30 days
   - Logging: Essential only

CONFIGURATION FOR EACH:
- Same webhook rules as main configuration
- Environment-specific response formats
- Different retention periods
- Environment tags in responses

ENVIRONMENT VARIABLES:
- DEV: WEBHOOK_URL=https://dev-reconciliation.free.beeceptor.com
- STAGING: WEBHOOK_URL=https://staging-reconciliation.free.beeceptor.com
- PROD: WEBHOOK_URL=https://378to492.free.beeceptor.com

TESTING:
Test each environment endpoint separately to verify isolation.
```

---

## 4. Webhook Forwarding & Retry Prompt

**Use Case**: Forward webhooks to other services with retry logic

```text
Configure Beeceptor to forward webhooks to external services with retry logic.

ENDPOINT: https://378to492.free.beeceptor.com

FORWARDING RULES:

1. FORWARD ALERTS TO SLACK:
   - Path: /alerts
   - Forward to: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
   - Transform payload to Slack format:
     {
       "text": "Alert: {{alerts[0].labels.alertname}}",
       "attachments": [{
         "color": "{{severity_color}}",
         "fields": [{
           "title": "Severity",
           "value": "{{alerts[0].labels.severity}}",
           "short": true
         }]
       }]
     }
   - Retry: 3 attempts with exponential backoff
   - Timeout: 5 seconds

2. FORWARD METRICS TO DATADOG:
   - Path: /monitoring
   - Forward to: https://api.datadoghq.com/api/v1/series?api_key=YOUR_KEY
   - Transform to Datadog format:
     {
       "series": [{
         "metric": "reconciliation.{{data.metric}}",
         "points": [[{{timestamp_unix}}, {{data.value}}]],
         "tags": ["service:{{service}}"]
       }]
     }
   - Retry: 5 attempts
   - Timeout: 10 seconds

3. FORWARD TO INTERNAL API:
   - Path: /webhooks/internal
   - Forward to: http://internal-api:3000/webhooks
   - Retry: 3 attempts
   - Add authentication header: X-API-Key: YOUR_KEY

RETRY CONFIGURATION:
- Initial delay: 1 second
- Max delay: 30 seconds
- Exponential backoff: 2x
- Max retries: 3-5 (configurable per endpoint)

ERROR HANDLING:
- Log failed forwarding attempts
- Store failed webhooks for manual retry
- Send notification after max retries exceeded
```

---

## 5. Security & Authentication Prompt

**Use Case**: Secure webhook endpoints with authentication

```text
Configure Beeceptor webhook endpoints with security and authentication.

ENDPOINT: https://378to492.free.beeceptor.com

SECURITY RULES:

1. API KEY AUTHENTICATION:
   - Path: /alerts/secure
   - Require header: X-API-Key: YOUR_SECRET_KEY
   - Reject requests without valid API key (401 Unauthorized)
   - Response for unauthorized:
     {
       "error": "Unauthorized",
       "message": "Missing or invalid API key"
     }

2. HMAC SIGNATURE VERIFICATION:
   - Path: /webhooks/signed
   - Verify X-Signature header
   - Algorithm: SHA256
   - Secret: YOUR_HMAC_SECRET
   - Reject if signature invalid (403 Forbidden)

3. RATE LIMITING:
   - Limit: 100 requests per minute per IP
   - Path: All endpoints
   - Response when limit exceeded (429 Too Many Requests):
     {
       "error": "Rate limit exceeded",
       "retry_after": 60
     }

4. IP WHITELISTING:
   - Path: /alerts
   - Allowed IPs: [YOUR_ALERTMANAGER_IP, YOUR_APP_IP]
   - Reject requests from other IPs (403 Forbidden)

5. REQUEST VALIDATION:
   - Validate JSON schema for all POST requests
   - Reject malformed JSON (400 Bad Request)
   - Validate required fields
   - Sanitize input to prevent injection

CONFIGURATION:
- Enable request logging (mask sensitive data)
- Log security events separately
- Set up alerts for suspicious activity
- Store failed authentication attempts
```

---

## 6. Load Testing & Performance Prompt

**Use Case**: Configure Beeceptor for load testing webhook endpoints

```text
Configure Beeceptor for load testing Reconciliation Platform webhooks.

ENDPOINT: https://378to492.free.beeceptor.com

LOAD TEST CONFIGURATION:

1. PERFORMANCE MONITORING:
   - Enable request timing metrics
   - Track response times
   - Monitor throughput (requests/second)
   - Track error rates

2. LOAD TEST ENDPOINTS:
   - /load-test/alerts - For alert webhook load testing
   - /load-test/monitoring - For metrics webhook load testing
   - /load-test/mixed - For mixed traffic testing

3. RESPONSE SIMULATION:
   - Simulate slow responses (add delay: 100-500ms)
   - Simulate errors (5% error rate: 500, 503)
   - Simulate timeouts (1% timeout rate)

4. METRICS COLLECTION:
   - Track: Request count, Response time (p50, p95, p99), Error rate
   - Export metrics format:
     {
       "timestamp": "{{timestamp}}",
       "endpoint": "{{path}}",
       "request_count": "{{count}}",
       "avg_response_time_ms": "{{avg_time}}",
       "p95_response_time_ms": "{{p95_time}}",
       "error_rate": "{{error_rate}}"
     }

5. LOAD TEST SCENARIOS:
   - Scenario 1: 100 req/sec for 5 minutes
   - Scenario 2: 500 req/sec for 2 minutes
   - Scenario 3: Spike test: 0-1000 req/sec ramp up
   - Scenario 4: Sustained load: 200 req/sec for 30 minutes

CONFIGURATION:
- Enable detailed logging for load tests
- Set up separate endpoint for load testing
- Configure rate limiting to match production limits
- Monitor Beeceptor service limits
```

---

## 7. Integration Testing Prompt

**Use Case**: Set up Beeceptor for automated integration tests

```text
Configure Beeceptor for automated integration testing of Reconciliation Platform.

ENDPOINT: https://378to492.free.beeceptor.com

INTEGRATION TEST CONFIGURATION:

1. TEST ENDPOINTS:
   - /test/alerts - For alert webhook tests
   - /test/monitoring - For monitoring webhook tests
   - /test/health - For health check tests

2. TEST DATA STORAGE:
   - Store all test requests
   - Tag requests with test run ID
   - Enable request/response storage
   - Retention: 7 days (for test analysis)

3. ASSERTION ENDPOINTS:
   - GET /test/assertions - Get stored test requests
   - Query by: test_run_id, endpoint, timestamp
   - Response format:
     {
       "test_run_id": "{{test_run_id}}",
       "requests": [
         {
           "path": "{{path}}",
           "method": "{{method}}",
           "body": "{{body}}",
           "timestamp": "{{timestamp}}"
         }
       ]
     }

4. TEST SCENARIOS:
   - Scenario: Send alert webhook → Verify received
   - Scenario: Send monitoring metric → Verify stored
   - Scenario: Health check → Verify response format
   - Scenario: Error handling → Verify error responses

5. CLEANUP:
   - POST /test/cleanup - Clear test data
   - Query parameter: test_run_id (optional, clears all if not provided)

CONFIGURATION:
- Enable test mode flag
- Separate test endpoints from production
- Enable detailed logging for tests
- Support test data export

TESTING WORKFLOW:
1. Start test run → Generate test_run_id
2. Send webhooks with test_run_id header
3. Query assertions endpoint to verify
4. Cleanup test data after verification
```

---

## 8. Error Handling & Dead Letter Queue Prompt

**Use Case**: Handle webhook failures and create dead letter queue

```text
Configure Beeceptor error handling and dead letter queue for failed webhooks.

ENDPOINT: https://378to492.free.beeceptor.com

ERROR HANDLING CONFIGURATION:

1. ERROR ENDPOINTS:
   - /errors - Store all errors
   - /errors/retry - Retry failed webhooks
   - /errors/dlq - Dead letter queue for unrecoverable errors

2. ERROR CATEGORIES:
   - Validation errors (400) → Store in /errors/validation
   - Authentication errors (401/403) → Store in /errors/auth
   - Server errors (500/503) → Store in /errors/server
   - Timeout errors → Store in /errors/timeout
   - Network errors → Store in /errors/network

3. DEAD LETTER QUEUE:
   - Path: /errors/dlq
   - Store webhooks that failed after max retries
   - Format:
     {
       "original_request": "{{original_request}}",
       "error_type": "{{error_type}}",
       "error_message": "{{error_message}}",
       "retry_count": "{{retry_count}}",
       "first_failed_at": "{{timestamp}}",
       "last_attempted_at": "{{timestamp}}"
     }

4. RETRY LOGIC:
   - Automatic retry: 3 attempts
   - Retry delay: Exponential backoff (1s, 2s, 4s)
   - Manual retry endpoint: POST /errors/retry/{error_id}

5. ERROR NOTIFICATIONS:
   - Send notification after max retries
   - Include error details and original payload
   - Format:
     {
       "error_id": "{{error_id}}",
       "endpoint": "{{path}}",
       "error_type": "{{error_type}}",
       "retry_count": "{{retry_count}}",
       "original_payload": "{{original_payload}}"
     }

CONFIGURATION:
- Enable error logging
- Set up error monitoring alerts
- Configure error retention (30 days)
- Support error export for analysis
```

---

## 9. Monitoring & Analytics Dashboard Prompt

**Use Case**: Set up monitoring and analytics for webhook traffic

```text
Configure Beeceptor monitoring and analytics for Reconciliation Platform webhooks.

ENDPOINT: https://378to492.free.beeceptor.com

MONITORING CONFIGURATION:

1. ANALYTICS ENDPOINTS:
   - GET /analytics/summary - Overall webhook statistics
   - GET /analytics/endpoints - Per-endpoint statistics
   - GET /analytics/timeline - Time-series data

2. SUMMARY ENDPOINT (/analytics/summary):
   Response:
   {
     "total_requests": "{{total_count}}",
     "successful_requests": "{{success_count}}",
     "failed_requests": "{{error_count}}",
     "success_rate": "{{success_rate}}%",
     "avg_response_time_ms": "{{avg_time}}",
     "requests_per_minute": "{{rpm}}",
     "time_range": {
       "start": "{{start_time}}",
       "end": "{{end_time}}"
     }
   }

3. ENDPOINT STATISTICS (/analytics/endpoints):
   Response:
   {
     "endpoints": [
       {
         "path": "/alerts",
         "request_count": "{{count}}",
         "success_rate": "{{rate}}%",
         "avg_response_time_ms": "{{time}}",
         "error_count": "{{errors}}"
       }
     ]
   }

4. TIMELINE DATA (/analytics/timeline):
   Query params: start_time, end_time, interval (1m, 5m, 1h)
   Response:
   {
     "timeline": [
       {
         "timestamp": "{{timestamp}}",
         "request_count": "{{count}}",
         "success_count": "{{success}}",
         "error_count": "{{errors}}"
       }
     ]
   }

5. ALERTS:
   - Alert on high error rate (>5%)
   - Alert on high request volume (spike detection)
   - Alert on slow response times (>500ms p95)

CONFIGURATION:
- Enable analytics collection
- Set up dashboard views
- Configure alert thresholds
- Export analytics data (JSON, CSV)
```

---

## 10. Webhook Replay & Testing Prompt

**Use Case**: Replay stored webhooks for testing and debugging

```text
Configure Beeceptor webhook replay functionality for Reconciliation Platform.

ENDPOINT: https://378to492.free.beeceptor.com

REPLAY CONFIGURATION:

1. REPLAY ENDPOINTS:
   - POST /replay/{request_id} - Replay specific request
   - POST /replay/batch - Replay multiple requests
   - GET /replay/history - Get replay history

2. REPLAY SINGLE REQUEST:
   POST /replay/{request_id}
   Response:
   {
     "replay_id": "{{replay_id}}",
     "original_request_id": "{{request_id}}",
     "status": "replayed",
     "replayed_at": "{{timestamp}}",
     "response": "{{response}}"
   }

3. BATCH REPLAY:
   POST /replay/batch
   Body:
   {
     "request_ids": ["id1", "id2", "id3"],
     "delay_ms": 100,
     "target_endpoint": "/alerts" (optional)
   }
   Response:
   {
     "replay_id": "{{batch_replay_id}}",
     "total_requests": 3,
     "successful": 2,
     "failed": 1,
     "replays": [
       {
         "request_id": "id1",
         "status": "success",
         "response_time_ms": 150
       }
     ]
   }

4. REPLAY FILTERING:
   - Filter by: path, method, timestamp range, status code
   - Example: Replay all /alerts requests from last hour
   - Example: Replay all failed requests

5. REPLAY HISTORY:
   GET /replay/history?limit=100
   Response:
   {
     "replays": [
       {
         "replay_id": "{{id}}",
         "original_request_id": "{{id}}",
         "replayed_at": "{{timestamp}}",
         "status": "success",
         "response_time_ms": 120
       }
     ]
   }

CONFIGURATION:
- Enable request storage for replay
- Set replay retention period
- Support replay to different endpoints
- Log all replay operations
```

---

## 11. CI/CD Integration Prompt

**Use Case**: Integrate Beeceptor with CI/CD pipelines for automated testing

```text
Configure Beeceptor for CI/CD integration with Reconciliation Platform.

ENDPOINT: https://378to492.free.beeceptor.com

CI/CD CONFIGURATION:

1. PIPELINE ENDPOINTS:
   - /ci/webhooks - Receive CI/CD webhooks
   - /ci/test-results - Store test results
   - /ci/deployments - Track deployment events

2. GITHUB ACTIONS INTEGRATION:
   - Webhook URL: https://378to492.free.beeceptor.com/ci/webhooks
   - Events: push, pull_request, workflow_run
   - Response format:
     {
       "received": true,
       "event": "{{event}}",
       "repository": "{{repository}}",
       "branch": "{{branch}}",
       "commit": "{{commit}}",
       "timestamp": "{{timestamp}}"
     }

3. TEST RESULT STORAGE:
   - POST /ci/test-results
   - Store test results from CI runs
   - Format:
     {
       "pipeline_id": "{{pipeline_id}}",
       "test_suite": "{{suite}}",
       "passed": "{{count}}",
       "failed": "{{count}}",
       "duration_ms": "{{time}}",
       "timestamp": "{{timestamp}}"
     }

4. DEPLOYMENT TRACKING:
   - POST /ci/deployments
   - Track deployment events
   - Format:
     {
       "environment": "{{env}}",
       "version": "{{version}}",
       "status": "{{status}}",
       "deployed_by": "{{user}}",
       "timestamp": "{{timestamp}}"
     }

5. PIPELINE STATUS:
   - GET /ci/status/{pipeline_id}
   - Get pipeline status
   - Response:
     {
       "pipeline_id": "{{id}}",
       "status": "{{status}}",
       "stages": ["{{stage}}"],
       "started_at": "{{timestamp}}",
       "completed_at": "{{timestamp}}"
     }

CONFIGURATION:
- Enable CI/CD webhook logging
- Set retention: 30 days
- Tag requests with pipeline_id
- Support webhook signature verification
```

---

## 12. Webhook Validation & Schema Prompt

**Use Case**: Validate webhook payloads against schemas

```text
Configure Beeceptor webhook validation for Reconciliation Platform.

ENDPOINT: https://378to492.free.beeceptor.com

VALIDATION CONFIGURATION:

1. VALIDATION ENDPOINTS:
   - /validate/alerts - Validate alert webhooks
   - /validate/monitoring - Validate monitoring webhooks
   - /validate/custom - Custom validation

2. ALERT VALIDATION SCHEMA:
   Path: /validate/alerts
   Required fields: alerts[].status, alerts[].labels.alertname
   Schema:
   {
     "type": "object",
     "required": ["alerts"],
     "properties": {
       "alerts": {
         "type": "array",
         "items": {
           "required": ["status", "labels"],
           "properties": {
             "status": {"enum": ["firing", "resolved"]},
             "labels": {
               "required": ["alertname"],
               "properties": {
                 "alertname": {"type": "string"},
                 "severity": {"enum": ["critical", "warning", "info"]}
               }
             }
           }
         }
       }
     }
   }

3. VALIDATION RESPONSES:
   - Valid (200 OK):
     {
       "valid": true,
       "timestamp": "{{timestamp}}"
     }
   - Invalid (400 Bad Request):
     {
       "valid": false,
       "errors": [
         {
           "field": "{{field}}",
           "message": "{{error_message}}"
         }
       ]
     }

4. VALIDATION MODES:
   - Strict: Reject invalid payloads
   - Lenient: Accept with warnings
   - Log-only: Log validation errors but accept

5. CUSTOM VALIDATORS:
   - POST /validate/custom
   - Body: { "schema": "{{json_schema}}", "payload": "{{payload}}" }
   - Response: Validation result

CONFIGURATION:
- Enable schema validation
- Log validation errors
- Store invalid payloads for review
- Support JSON Schema Draft 7
```

---

## 13. Cost Optimization Prompt

**Use Case**: Optimize Beeceptor usage and reduce costs

```text
Configure Beeceptor for cost optimization of Reconciliation Platform webhooks.

ENDPOINT: https://378to492.free.beeceptor.com

OPTIMIZATION STRATEGIES:

1. REQUEST FILTERING:
   - Filter duplicate requests
   - Deduplicate by: payload hash, timestamp window (5 min)
   - Store only unique requests

2. SAMPLING:
   - Sample high-volume endpoints
   - /monitoring: Sample 10% of requests
   - /alerts: Keep 100% (critical)
   - /health: Sample 1% (low value)

3. RETENTION OPTIMIZATION:
   - /alerts: 30 days (critical)
   - /monitoring: 7 days (metrics)
   - /health: 1 day (low value)
   - /test: 3 days (temporary)

4. COMPRESSION:
   - Compress stored payloads
   - Use gzip compression
   - Reduce storage by ~70%

5. ARCHIVAL:
   - Archive old requests (>30 days)
   - Export to S3/cloud storage
   - Keep only metadata in Beeceptor

6. USAGE MONITORING:
   - GET /analytics/usage
   - Track: request count, storage used, costs
   - Response:
     {
       "requests_today": "{{count}}",
       "storage_mb": "{{size}}",
       "estimated_cost": "{{cost}}",
       "optimization_savings": "{{savings}}"
     }

7. ALERTS:
   - Alert on high usage (>80% of limit)
   - Alert on unexpected spikes
   - Recommend optimization actions

CONFIGURATION:
- Enable request deduplication
- Configure sampling rates
- Set retention periods
- Enable compression
- Set up usage alerts
```

---

## 14. Compliance & Data Governance Prompt

**Use Case**: Ensure GDPR and compliance requirements

```text
Configure Beeceptor for compliance and data governance for Reconciliation Platform.

ENDPOINT: https://378to492.free.beeceptor.com

COMPLIANCE CONFIGURATION:

1. DATA RETENTION:
   - Default retention: 30 days
   - PII data: 7 days (GDPR)
   - Audit logs: 90 days (compliance)
   - Auto-delete after retention period

2. PII DETECTION & MASKING:
   - Detect: emails, phone numbers, SSNs, IPs
   - Mask in logs: email@***.com, ***-***-1234
   - Store masked versions only
   - Original data: Encrypted, auto-deleted

3. AUDIT LOGGING:
   - Log all access to webhook data
   - Track: who, what, when, why
   - Format:
     {
       "action": "{{action}}",
       "user": "{{user_id}}",
       "endpoint": "{{path}}",
       "timestamp": "{{timestamp}}",
       "ip_address": "{{masked_ip}}"
     }

4. DATA EXPORT (GDPR):
   - GET /compliance/export/{user_id}
   - Export all user-related webhook data
   - Format: JSON, encrypted
   - Include: requests, responses, metadata

5. DATA DELETION (GDPR):
   - DELETE /compliance/delete/{user_id}
   - Delete all user-related data
   - Confirm deletion
   - Response:
     {
       "deleted": true,
       "records_deleted": "{{count}}",
       "deleted_at": "{{timestamp}}"
     }

6. ACCESS CONTROLS:
   - Role-based access
   - Admin: Full access
   - Auditor: Read-only
   - User: Own data only

7. ENCRYPTION:
   - Encrypt sensitive payloads at rest
   - Use AES-256 encryption
   - Encrypt in transit (HTTPS)

CONFIGURATION:
- Enable PII detection
- Configure retention policies
- Set up audit logging
- Enable encryption
- Configure access controls
```

---

## 15. Disaster Recovery & Backup Prompt

**Use Case**: Backup and recovery procedures for webhook data

```text
Configure Beeceptor disaster recovery and backup for Reconciliation Platform.

ENDPOINT: https://378to492.free.beeceptor.com

BACKUP CONFIGURATION:

1. BACKUP ENDPOINTS:
   - POST /backup/create - Create backup
   - GET /backup/list - List backups
   - POST /backup/restore/{backup_id} - Restore backup
   - GET /backup/status - Backup status

2. AUTOMATED BACKUPS:
   - Schedule: Daily at 2 AM UTC
   - Retention: 30 days
   - Format: JSON export
   - Include: All webhook data, configurations, rules

3. BACKUP CREATION:
   POST /backup/create
   Body: { "type": "full|incremental", "include_data": true }
   Response:
   {
     "backup_id": "{{id}}",
     "type": "{{type}}",
     "size_mb": "{{size}}",
     "created_at": "{{timestamp}}",
     "status": "completed"
   }

4. BACKUP STORAGE:
   - Primary: Beeceptor storage
   - Secondary: S3/cloud storage (optional)
   - Format: Compressed JSON
   - Encryption: AES-256

5. RESTORE PROCEDURE:
   POST /backup/restore/{backup_id}
   Response:
   {
     "restore_id": "{{id}}",
     "backup_id": "{{backup_id}}",
     "status": "in_progress|completed|failed",
     "records_restored": "{{count}}"
   }

6. BACKUP VERIFICATION:
   - GET /backup/verify/{backup_id}
   - Verify backup integrity
   - Check: Data completeness, checksums
   - Response:
     {
       "backup_id": "{{id}}",
       "verified": true,
       "checksum": "{{hash}}",
       "verified_at": "{{timestamp}}"
     }

7. DISASTER RECOVERY PLAN:
   - RTO: 1 hour (Recovery Time Objective)
   - RPO: 24 hours (Recovery Point Objective)
   - Failover endpoint: Backup Beeceptor endpoint
   - Notification: Alert on backup failure

8. MONITORING:
   - Monitor backup success/failure
   - Alert on backup failures
   - Track backup sizes
   - Monitor restore operations

CONFIGURATION:
- Enable automated backups
- Configure backup schedule
- Set up backup storage
- Enable backup verification
- Configure disaster recovery procedures
```

---

## Usage Instructions

1. **Choose the appropriate prompt** based on your use case
2. **Copy the prompt** and provide it to an AI agent or Beeceptor support
3. **Customize** endpoint URLs, API keys, and configuration values
4. **Test** the configuration after setup
5. **Verify** all endpoints are working as expected

---

## Quick Reference

- **Basic Setup**: Use `BEEceptor_QUICK_PROMPT.txt`
- **Detailed Setup**: Use `BEEceptor_AI_AGENT_PROMPT.md`
- **API Mocking**: Use Prompt #1
- **Webhook Transformation**: Use Prompt #2
- **Multi-Environment**: Use Prompt #3
- **Forwarding**: Use Prompt #4
- **Security**: Use Prompt #5
- **Load Testing**: Use Prompt #6
- **Integration Testing**: Use Prompt #7
- **Error Handling**: Use Prompt #8
- **Monitoring**: Use Prompt #9
- **Replay**: Use Prompt #10
- **CI/CD Integration**: Use Prompt #11
- **Validation**: Use Prompt #12
- **Cost Optimization**: Use Prompt #13
- **Compliance**: Use Prompt #14
- **Disaster Recovery**: Use Prompt #15

---

**Last Updated**: January 2025  
**Status**: Active
