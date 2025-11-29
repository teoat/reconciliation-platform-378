# Alerting and Dashboards Setup Guide

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Guide for setting up alerting and monitoring dashboards

---

## Overview

Alerting and dashboards provide real-time visibility into system health and performance.

---

## Alerting Setup

### Prometheus Alerts

**Alert Rules**:
```yaml
# alerts.yml
groups:
  - name: reconciliation_platform
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s"

      - alert: DatabaseConnectionPoolExhausted
        expr: database_connections_active / database_connections_max > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value }}% of connections in use"

      - alert: CertificateExpiring
        expr: (ssl_certificate_expiry_timestamp - time()) / 86400 < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "SSL certificate expiring soon"
          description: "Certificate expires in {{ $value }} days"
```

### Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'slack-critical'
      continue: true
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'slack-critical'
    slack_configs:
      - channel: '#alerts-critical'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## Dashboard Setup

### Grafana Dashboards

**Key Dashboards**:

1. **System Overview**
   - CPU, Memory, Disk usage
   - Request rate and latency
   - Error rates
   - Active connections

2. **Application Metrics**
   - API endpoint performance
   - Database query performance
   - Cache hit rates
   - Background job status

3. **Security Dashboard**
   - Authentication attempts
   - Security events
   - Failed login attempts
   - Rate limit hits

4. **Business Metrics**
   - Active users
   - Reconciliation jobs
   - Data processing volume
   - User activity

### Example Dashboard JSON

```json
{
  "dashboard": {
    "title": "Reconciliation Platform Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Errors"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ]
      }
    ]
  }
}
```

---

## Notification Channels

### Slack Integration

```yaml
# alertmanager.yml
receivers:
  - name: slack
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Email Integration

```yaml
receivers:
  - name: email
    email_configs:
      - to: 'ops@example.com'
        from: 'alerts@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@example.com'
        auth_password: 'password'
        subject: 'Alert: {{ .GroupLabels.alertname }}'
        html: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### PagerDuty Integration

```yaml
receivers:
  - name: pagerduty
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        description: '{{ .GroupLabels.alertname }}: {{ .Annotations.summary }}'
```

---

## Testing Alerts

### Test Alert Notification

```bash
# Send test alert
curl -X POST http://alertmanager:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[
    {
      "labels": {
        "alertname": "TestAlert",
        "severity": "warning"
      },
      "annotations": {
        "summary": "Test alert",
        "description": "This is a test alert"
      }
    }
  ]'
```

### Verify Alert Delivery

1. Check Alertmanager UI: `http://alertmanager:9093`
2. Check notification channels (Slack, email, etc.)
3. Verify alert routing rules
4. Test alert resolution

---

## Best Practices

1. **Alert Fatigue**: Set appropriate thresholds
2. **Alert Grouping**: Group related alerts
3. **Alert Routing**: Route by severity
4. **Documentation**: Document alert meanings
5. **Regular Review**: Review and tune alerts regularly
6. **Testing**: Test alert delivery regularly

---

## Related Documentation

- [Monitoring Setup](../project-management/PRODUCTION_READINESS_CHECKLIST.md)
- [Common Issues Runbook](./COMMON_ISSUES_RUNBOOK.md)
- [Incident Response Procedures](./INCIDENT_RESPONSE_PROCEDURES.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

