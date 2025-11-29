# Beeceptor Webhook Setup Guide

**Last Updated**: November 28, 2025  
**Status**: Complete Setup Instructions  
**Endpoint**: https://378to492.free.beeceptor.com

---

## Overview

This guide walks you through configuring Beeceptor rules and monitoring webhooks for the Reconciliation Platform.

---

## Step 1: Access Beeceptor Dashboard

1. Visit: https://beeceptor.com/dashboard
2. Sign in or create an account
3. Select your endpoint: `378to492`

---

## Step 2: Configure Webhook Rules

### Rule 1: Health Check Endpoint

**Path**: `/health`  
**Method**: GET, POST  
**Response**: 200 OK with JSON

```json
{
  "status": "ok",
  "timestamp": "2025-11-28T00:00:00Z",
  "service": "reconciliation-platform"
}
```

### Rule 2: Alert Webhook

**Path**: `/alerts`  
**Method**: POST  
**Response**: 200 OK

**Expected Payload**:
```json
{
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "HighErrorRate",
        "severity": "critical",
        "service": "backend"
      },
      "annotations": {
        "summary": "High error rate detected",
        "description": "Error rate is 0.15 errors per second"
      }
    }
  ]
}
```

### Rule 3: Monitoring Webhook

**Path**: `/monitoring`  
**Method**: POST  
**Response**: 200 OK

**Expected Payload**:
```json
{
  "event": "metric",
  "service": "reconciliation-platform",
  "timestamp": "2025-11-28T00:00:00Z",
  "data": {
    "metric": "api_response_time",
    "value": 150,
    "unit": "ms"
  }
}
```

### Rule 4: General Webhook (Catch-all)

**Path**: `/*`  
**Method**: POST, GET  
**Response**: 200 OK

**Response Body**:
```json
{
  "received": true,
  "timestamp": "{{timestamp}}",
  "method": "{{method}}",
  "path": "{{path}}",
  "headers": "{{headers}}",
  "body": "{{body}}"
}
```

---

## Step 3: Test Webhook Configuration

### Test from Command Line

```bash
# Test health check
curl -X GET https://378to492.free.beeceptor.com/health

# Test alert webhook
curl -X POST https://378to492.free.beeceptor.com/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [{
      "status": "firing",
      "labels": {"alertname": "TestAlert", "severity": "warning"},
      "annotations": {"summary": "Test alert", "description": "Testing webhook"}
    }]
  }'

# Test monitoring webhook
curl -X POST https://378to492.free.beeceptor.com/monitoring \
  -H "Content-Type: application/json" \
  -d '{
    "event": "metric",
    "service": "reconciliation-platform",
    "data": {"metric": "test", "value": 100}
  }'
```

---

## Step 4: Monitor Webhooks

### View Incoming Requests

1. Go to Beeceptor dashboard
2. Select endpoint `378to492`
3. View "Requests" tab to see all incoming webhooks
4. Filter by path, method, or time

### Set Up Alerts

1. In Beeceptor dashboard, configure email notifications
2. Set up webhook forwarding to other services if needed
3. Configure request logging and retention

---

## Step 5: Integration with Application

### AlertManager Integration

The AlertManager is already configured to send webhooks to:
- `https://378to492.free.beeceptor.com`

### Application Webhooks

To send webhooks from the application:

```rust
// Example: Send webhook from backend
let webhook_url = std::env::var("WEBHOOK_URL")
    .unwrap_or_else(|_| "https://378to492.free.beeceptor.com".to_string());

let client = reqwest::Client::new();
client
    .post(&webhook_url)
    .json(&webhook_payload)
    .send()
    .await?;
```

---

## Verification

### Check Webhook is Receiving Requests

1. Visit Beeceptor dashboard
2. Check "Requests" tab
3. Verify test webhooks appear

### Verify AlertManager Configuration

```bash
# Check AlertManager config
grep -A 5 "webhook_configs" infrastructure/monitoring/alertmanager.yml

# Should show:
# webhook_configs:
#   - url: 'https://378to492.free.beeceptor.com'
```

---

## Troubleshooting

### Webhook Not Receiving Requests

1. Verify endpoint URL is correct
2. Check Beeceptor dashboard for endpoint status
3. Test with curl command above
4. Check application logs for webhook send errors

### Requests Not Appearing in Dashboard

1. Verify endpoint name: `378to492`
2. Check if endpoint is active in dashboard
3. Verify network connectivity
4. Check Beeceptor service status

---

## Best Practices

1. **Use Specific Paths**: Configure different paths for different webhook types
2. **Log Everything**: Enable request logging in Beeceptor
3. **Set Retention**: Configure appropriate retention period
4. **Monitor Usage**: Watch for rate limits
5. **Test Regularly**: Send test webhooks to verify configuration

---

## Next Steps

1. ✅ Configure Beeceptor rules (this guide)
2. ✅ Test webhook endpoints
3. ⏳ Set up monitoring dashboards
4. ⏳ Configure alert forwarding if needed
5. ⏳ Set up webhook retry logic in application

---

**Status**: Ready for configuration  
**Endpoint**: https://378to492.free.beeceptor.com  
**Dashboard**: https://beeceptor.com/dashboard

