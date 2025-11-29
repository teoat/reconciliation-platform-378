# Beeceptor Configuration Prompt for AI Agent

**Purpose**: Configure Beeceptor webhook endpoint to sync with Reconciliation Platform application

**Target Endpoint**: `378to492`  
**Beeceptor URL**: https://378to492.free.beeceptor.com  
**Dashboard**: https://beeceptor.com/dashboard

---

## Task Overview

You need to configure Beeceptor webhook rules to receive and handle webhooks from a Reconciliation Platform application. The application sends webhooks for health checks, alerts, monitoring metrics, and general events.

---

## Application Context

**Application Name**: Reconciliation Platform  
**Type**: Enterprise reconciliation platform with Rust backend and TypeScript/React frontend  
**Webhook Usage**: 
- AlertManager integration for Prometheus alerts
- Application monitoring metrics
- Health check endpoints
- General event notifications

**Current Configuration**:
- Webhook URL is set in environment variables: `WEBHOOK_URL=https://378to492.free.beeceptor.com`
- AlertManager configured to send alerts to this endpoint
- Application monitoring sends metrics to this endpoint

---

## Configuration Steps

### Step 1: Access Beeceptor Dashboard

1. Navigate to: https://beeceptor.com/dashboard
2. Sign in or create an account if needed
3. Select or create endpoint: `378to492`
4. Verify endpoint URL: https://378to492.free.beeceptor.com

### Step 2: Configure Webhook Rules

Create the following rules in Beeceptor dashboard:

#### Rule 1: Health Check Endpoint

**Configuration**:
- **Path**: `/health`
- **Method**: GET, POST
- **Response Status**: 200 OK
- **Response Content-Type**: `application/json`

**Response Body**:
```json
{
  "status": "ok",
  "timestamp": "{{timestamp}}",
  "service": "reconciliation-platform",
  "version": "2.0.0"
}
```

**Purpose**: Health check endpoint for monitoring service availability

**Expected Requests**:
- GET requests from health check monitors
- POST requests from application health checks
- Headers may include: `User-Agent`, `Content-Type`

---

#### Rule 2: Alert Webhook

**Configuration**:
- **Path**: `/alerts`
- **Method**: POST
- **Response Status**: 200 OK
- **Response Content-Type**: `application/json`

**Response Body**:
```json
{
  "received": true,
  "timestamp": "{{timestamp}}",
  "alert_count": "{{alerts.length}}"
}
```

**Expected Request Payload Format** (Prometheus AlertManager):
```json
{
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "HighErrorRate",
        "severity": "critical",
        "service": "backend",
        "instance": "backend:2000"
      },
      "annotations": {
        "summary": "High error rate detected",
        "description": "Error rate is 0.15 errors per second",
        "runbook_url": "https://docs.example.com/runbooks/high-error-rate"
      },
      "startsAt": "2025-01-15T10:30:00Z",
      "endsAt": "2025-01-15T10:35:00Z",
      "generatorURL": "http://prometheus:9090/graph"
    }
  ],
  "commonLabels": {
    "service": "backend"
  },
  "commonAnnotations": {},
  "externalURL": "http://alertmanager:9093",
  "groupKey": "{}:{service=\"backend\"}",
  "groupLabels": {
    "service": "backend"
  },
  "receiver": "webhook",
  "status": "firing",
  "version": "4"
}
```

**Purpose**: Receive Prometheus alerts from AlertManager

**Additional Configuration**:
- Log all incoming alerts
- Store alert payloads for analysis
- Enable request logging

---

#### Rule 3: Monitoring Webhook

**Configuration**:
- **Path**: `/monitoring`
- **Method**: POST
- **Response Status**: 200 OK
- **Response Content-Type**: `application/json`

**Response Body**:
```json
{
  "received": true,
  "timestamp": "{{timestamp}}",
  "event_type": "{{event}}"
}
```

**Expected Request Payload Format**:
```json
{
  "event": "metric",
  "service": "reconciliation-platform",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "metric": "api_response_time",
    "value": 150,
    "unit": "ms",
    "tags": {
      "endpoint": "/api/v1/projects",
      "method": "GET",
      "status_code": 200
    }
  }
}
```

**Alternative Payload Format** (System Metrics):
```json
{
  "event": "system_metric",
  "service": "reconciliation-platform",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "metric": "cpu_usage",
    "value": 45.5,
    "unit": "percent",
    "host": "backend-1"
  }
}
```

**Purpose**: Receive application monitoring metrics and system metrics

**Additional Configuration**:
- Log all metrics
- Enable request retention (suggest 7 days minimum)
- Set up filtering by metric type if needed

---

#### Rule 4: General Webhook (Catch-all)

**Configuration**:
- **Path**: `/*` (catch-all pattern)
- **Method**: POST, GET, PUT, DELETE
- **Response Status**: 200 OK
- **Response Content-Type**: `application/json`

**Response Body**:
```json
{
  "received": true,
  "timestamp": "{{timestamp}}",
  "method": "{{method}}",
  "path": "{{path}}",
  "headers": "{{headers}}",
  "body": "{{body}}",
  "query_params": "{{query}}"
}
```

**Purpose**: Catch any webhook requests that don't match specific paths

**Use Cases**:
- Testing webhook endpoints
- Custom application events
- Integration testing
- Debugging webhook delivery

**Additional Configuration**:
- Enable full request logging
- Store request/response pairs
- Enable request inspection

---

### Step 3: Configure Request Logging

**Settings to Enable**:
1. **Request Logging**: Enable logging for all endpoints
2. **Retention Period**: Set to 7-30 days (depending on plan)
3. **Request Storage**: Enable storing request/response pairs
4. **Filtering**: Set up filters by:
   - Path (`/health`, `/alerts`, `/monitoring`)
   - Method (GET, POST)
   - Status code
   - Timestamp ranges

---

### Step 4: Configure Notifications (Optional)

**Email Notifications**:
- Enable email notifications for:
  - Failed webhook deliveries (if forwarding enabled)
  - High request volume alerts
  - Endpoint status changes

**Webhook Forwarding** (if needed):
- Configure forwarding to other services
- Set up retry logic
- Configure timeout settings

---

## Testing Configuration

### Test Health Check Endpoint

```bash
curl -X GET https://378to492.free.beeceptor.com/health \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "service": "reconciliation-platform",
  "version": "2.0.0"
}
```

### Test Alert Webhook

```bash
curl -X POST https://378to492.free.beeceptor.com/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [{
      "status": "firing",
      "labels": {
        "alertname": "TestAlert",
        "severity": "warning",
        "service": "backend"
      },
      "annotations": {
        "summary": "Test alert from reconciliation platform",
        "description": "Testing webhook configuration"
      },
      "startsAt": "2025-01-15T10:30:00Z"
    }],
    "version": "4"
  }'
```

**Expected Response**:
```json
{
  "received": true,
  "timestamp": "2025-01-15T10:30:00Z",
  "alert_count": 1
}
```

### Test Monitoring Webhook

```bash
curl -X POST https://378to492.free.beeceptor.com/monitoring \
  -H "Content-Type: application/json" \
  -d '{
    "event": "metric",
    "service": "reconciliation-platform",
    "timestamp": "2025-01-15T10:30:00Z",
    "data": {
      "metric": "api_response_time",
      "value": 150,
      "unit": "ms"
    }
  }'
```

**Expected Response**:
```json
{
  "received": true,
  "timestamp": "2025-01-15T10:30:00Z",
  "event_type": "metric"
}
```

### Test General Webhook

```bash
curl -X POST https://378to492.free.beeceptor.com/test \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "timestamp": "2025-01-15T10:30:00Z",
    "source": "reconciliation-platform",
    "message": "General webhook test"
  }'
```

---

## Verification Checklist

After configuration, verify:

- [ ] Endpoint `378to492` is active in Beeceptor dashboard
- [ ] All 4 rules are configured and active
- [ ] Health check endpoint returns 200 OK
- [ ] Alert webhook accepts POST requests
- [ ] Monitoring webhook accepts POST requests
- [ ] Catch-all webhook handles unmatched paths
- [ ] Request logging is enabled
- [ ] Requests appear in Beeceptor dashboard "Requests" tab
- [ ] Response formats match expected JSON structure
- [ ] All test curl commands return expected responses

---

## Integration Points

### Application Integration

The application is already configured to send webhooks to:
- **Environment Variable**: `WEBHOOK_URL=https://378to492.free.beeceptor.com`
- **AlertManager**: Configured in `infrastructure/monitoring/alertmanager.yml`
- **Application Monitoring**: Sends metrics to `/monitoring` endpoint

### Expected Webhook Flow

1. **Prometheus** → Detects alert condition
2. **AlertManager** → Sends webhook to `https://378to492.free.beeceptor.com/alerts`
3. **Beeceptor** → Receives, logs, and responds to webhook
4. **Application** → Sends monitoring metrics to `https://378to492.free.beeceptor.com/monitoring`
5. **Beeceptor** → Receives, logs, and responds to metrics

---

## Troubleshooting

### If Webhooks Not Received

1. Verify endpoint name: `378to492`
2. Check endpoint is active in dashboard
3. Verify URL: https://378to492.free.beeceptor.com
4. Test with curl commands above
5. Check application logs for webhook send errors
6. Verify network connectivity

### If Rules Not Working

1. Check rule order (more specific rules should come first)
2. Verify path patterns match exactly
3. Check method restrictions (GET vs POST)
4. Verify response format is valid JSON
5. Check Beeceptor rule syntax

### If Requests Not Appearing in Dashboard

1. Verify you're viewing the correct endpoint
2. Check request retention settings
3. Verify endpoint is not paused
4. Check if requests are being filtered out
5. Verify Beeceptor service status

---

## Additional Configuration Options

### Request Filtering

Configure filters to:
- Filter by specific alert types
- Filter by severity level
- Filter by service name
- Filter by timestamp ranges

### Response Customization

Customize responses to:
- Include request metadata
- Add custom headers
- Return different status codes based on conditions
- Include request validation results

### Advanced Features

If available in your Beeceptor plan:
- Set up webhook forwarding to other services
- Configure request transformation
- Set up rate limiting
- Enable request replay
- Configure custom domains

---

## Success Criteria

Configuration is successful when:

1. ✅ All 4 webhook rules are active
2. ✅ Health check endpoint responds correctly
3. ✅ Alert webhook accepts Prometheus AlertManager format
4. ✅ Monitoring webhook accepts application metrics
5. ✅ Catch-all webhook handles unmatched requests
6. ✅ Requests are visible in Beeceptor dashboard
7. ✅ All test curl commands return expected responses
8. ✅ Request logging is enabled and working
9. ✅ Application can successfully send webhooks
10. ✅ AlertManager can successfully send alerts

---

## Next Steps After Configuration

1. **Monitor Webhook Traffic**: 
   - Check Beeceptor dashboard regularly
   - Review incoming webhook patterns
   - Monitor for errors or failures

2. **Set Up Alerts**:
   - Configure email notifications in Beeceptor
   - Set up alerts for high request volumes
   - Monitor for webhook delivery failures

3. **Integration Testing**:
   - Run application test suite
   - Verify webhooks are received
   - Test AlertManager integration
   - Verify monitoring metrics are captured

4. **Documentation**:
   - Document webhook payload formats
   - Create runbook for troubleshooting
   - Update application documentation

---

## Reference Documentation

- **Beeceptor Dashboard**: https://beeceptor.com/dashboard
- **Application Setup Guide**: `docs/deployment/BEEceptor_SETUP_GUIDE.md`
- **Webhook Test Script**: `scripts/test-webhook-integration.sh`
- **API Reference**: `docs/api/API_REFERENCE.md`
- **OpenAPI Spec**: `backend/openapi.yaml`

---

## Support Information

**Endpoint ID**: `378to492`  
**Endpoint URL**: https://378to492.free.beeceptor.com  
**Dashboard URL**: https://beeceptor.com/dashboard  
**Application**: Reconciliation Platform v2.0.0

---

**End of Configuration Prompt**

