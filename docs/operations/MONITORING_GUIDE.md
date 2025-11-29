# Monitoring Guide

**Last Updated**: January 2025  
**Status**: Active - SSOT  
**Version**: 2.0.0

## Overview

Comprehensive monitoring guide for the Reconciliation Platform, including metrics collection, health checks, and alerting. This guide consolidates all monitoring setup and configuration into a single source of truth.

## Metrics API

### Available Endpoints

#### Get All Metrics
```bash
curl http://localhost:2000/api/metrics
```

Returns all collected metrics with full history.

#### Get Metrics Summary
```bash
curl http://localhost:2000/api/metrics/summary
```

Returns aggregated metrics summary:
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

#### Get Specific Metric
```bash
curl http://localhost:2000/api/metrics/cqrs_command_total
```

Returns detailed information for a specific metric.

#### Metrics Health Check
```bash
curl http://localhost:2000/api/metrics/health
```

Returns health status with key metrics:
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

## Predefined Metrics

### CQRS Metrics
- `cqrs_command_total` - Total CQRS commands executed
- `cqrs_query_total` - Total CQRS queries executed

### Event Metrics
- `event_published_total` - Total events published

### Security Metrics
- `secret_rotation_total` - Total secret rotations
- `rate_limit_hits_total` - Total rate limit checks
- `rate_limit_exceeded_total` - Total rate limit violations
- `zero_trust_verifications_total` - Total zero-trust verifications

### Performance Metrics
- `cache_hit_rate` - Cache hit rate percentage
- `cache_warming_duration_seconds` - Cache warming duration
- `query_optimization_total` - Total query optimizations

## Monitoring Scripts

### Continuous Monitoring

```bash
# Start monitoring
./scripts/monitor-deployment.sh

# With custom settings
API_BASE_URL=https://api.example.com \
MONITOR_INTERVAL=60 \
./scripts/monitor-deployment.sh
```

### One-Time Metrics Check

```bash
# Get current metrics
curl -s http://localhost:2000/api/metrics/summary | jq '.'

# Get specific metric
curl -s http://localhost:2000/api/metrics/cache_hit_rate | jq '.'
```

## Health Checks

### Basic Health Check

```bash
curl http://localhost:2000/api/health
```

### Health with Metrics

```bash
curl http://localhost:2000/api/metrics/health
```

### Resilience Metrics

```bash
curl http://localhost:2000/api/health/resilience
```

## Alerting Thresholds

### Recommended Thresholds

- **Cache Hit Rate**: < 70% (warning), < 50% (critical)
- **Rate Limit Exceeded**: > 10% of requests (warning)
- **Query Performance**: P95 > 100ms (warning), P95 > 500ms (critical)
- **Error Rate**: > 1% (warning), > 5% (critical)

### Setting Up Alerts

```bash
# Example alert script
#!/bin/bash
CACHE_HIT_RATE=$(curl -s http://localhost:2000/api/metrics/summary | jq -r '.cache_hit_rate')

if (( $(echo "$CACHE_HIT_RATE < 70" | bc -l) )); then
    echo "ALERT: Cache hit rate is below 70%: $CACHE_HIT_RATE%"
    # Send alert notification
fi
```

## Integration with Monitoring Tools

### Prometheus Integration

Metrics can be exported in Prometheus format:

```bash
# Export metrics for Prometheus
curl http://localhost:2000/api/metrics | \
  jq -r 'to_entries[] | "\(.key) \(.value)"'
```

### Grafana Dashboard

Create dashboards using metrics from `/api/metrics/summary`:
- CQRS command/query rates
- Cache performance
- Rate limiting statistics
- Security metrics

## Logging

### Structured Logging

The platform uses structured JSON logging when `JSON_LOGGING=true`:

```bash
# Enable JSON logging
export JSON_LOGGING=true

# Logs will be in JSON format
{
  "timestamp": "2025-11-26T10:00:00Z",
  "level": "info",
  "message": "Request processed",
  "module": "handlers",
  "file": "metrics.rs",
  "line": 42
}
```

## Performance Monitoring

### Query Performance

Monitor query performance via metrics:
- `query_optimization_total` - Number of optimizations
- Query duration tracking (via query optimizer)

### Cache Performance

Monitor cache performance:
- `cache_hit_rate` - Percentage of cache hits
- `cache_warming_duration_seconds` - Cache warming time

## Security Monitoring

### Rate Limiting

Monitor rate limiting:
- `rate_limit_hits_total` - Total checks
- `rate_limit_exceeded_total` - Violations

### Zero-Trust

Monitor zero-trust verifications:
- `zero_trust_verifications_total` - Total verifications
- Failed verification logs

### Secret Management

Monitor secret operations:
- `secret_rotation_total` - Rotations performed
- Audit logs via secret rotation service

## Best Practices

1. **Monitor Key Metrics**: Focus on cache hit rate, error rates, and performance
2. **Set Appropriate Thresholds**: Adjust based on your workload
3. **Regular Review**: Review metrics weekly
4. **Automated Alerts**: Set up alerts for critical metrics
5. **Historical Analysis**: Track metrics over time for trends

## 🚀 PROMETHEUS & GRAFANA SETUP

### Prometheus Setup

#### 1. Install Prometheus

```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

#### 2. Configure Prometheus

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'reconciliation-backend'
    static_configs:
      - targets: ['localhost:2000']
    metrics_path: '/api/health/metrics'
    scrape_interval: 10s
```

#### 3. Start Prometheus

```bash
./prometheus --config.file=prometheus.yml
```

Access Prometheus UI at `http://localhost:9090`

### Grafana Setup

#### 1. Install Grafana

```bash
# Ubuntu/Debian
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update
sudo apt-get install grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

#### 2. Configure Grafana

1. Access Grafana at `http://localhost:3000`
2. Default credentials: `admin` / `admin`
3. Add Prometheus data source:
   - URL: `http://localhost:9090`
   - Access: Server (default)

#### 3. Import Dashboards

Create dashboards for:
- **HTTP Metrics**: Request rate, duration, error rate
- **Database Metrics**: Query duration, pool usage, connection stats
- **Cache Metrics**: Hit rate, miss rate, cache size
- **System Metrics**: CPU, memory, disk usage
- **Reconciliation Metrics**: Job status, processing rate, match rate
- **Security Metrics**: Rate limit blocks, auth failures

### Alert Rules

Create `alerts.yml` for Prometheus:

```yaml
groups:
  - name: reconciliation_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(reconciliation_http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: DatabasePoolExhaustion
        expr: increase(reconciliation_db_pool_exhaustion_total[5m]) > 0
        for: 1m
        annotations:
          summary: "Database connection pool exhausted"
          
      - alert: HighMemoryUsage
        expr: reconciliation_system_memory_usage > 0.9
        for: 5m
        annotations:
          summary: "High memory usage detected"
          
      - alert: CircuitBreakerOpen
        expr: reconciliation_circuit_breaker_state > 1
        for: 1m
        annotations:
          summary: "Circuit breaker is open"
```

### Alertmanager Configuration

Configure Alertmanager to send alerts via:
- Email
- Slack
- PagerDuty
- Webhooks

## 📊 COMPREHENSIVE METRICS

### HTTP Metrics
- `reconciliation_http_requests_total` - Total HTTP requests by method, route, status
- `reconciliation_http_request_duration_seconds` - Request duration histogram
- `reconciliation_http_request_size_bytes` - Request size
- `reconciliation_http_response_size_bytes` - Response size

### Database Metrics
- `reconciliation_db_query_duration_seconds` - Query duration by route, operation, table
- `reconciliation_db_pool_connections_active` - Active connections
- `reconciliation_db_pool_connections_idle` - Idle connections
- `reconciliation_db_pool_connections_total` - Total connections
- `reconciliation_db_pool_exhaustion_total` - Pool exhaustion events
- `reconciliation_db_queries_total` - Total queries

### Cache Metrics
- `reconciliation_cache_hits_total` - Cache hits by level and key type
- `reconciliation_cache_misses_total` - Cache misses by level and key type
- `reconciliation_cache_size_bytes` - Cache size
- `reconciliation_cache_evictions_total` - Cache evictions

### Circuit Breaker Metrics
- `reconciliation_circuit_breaker_state` - Circuit breaker state (0=closed, 1=half-open, 2=open)
- `reconciliation_circuit_breaker_failures_total` - Total failures
- `reconciliation_circuit_breaker_successes_total` - Total successes
- `reconciliation_circuit_breaker_requests_total` - Total requests

### Reconciliation Metrics
- `reconciliation_jobs_total` - Total reconciliation jobs
- `reconciliation_jobs_active` - Active jobs
- `reconciliation_job_duration_seconds` - Job duration
- `reconciliation_records_processed_total` - Records processed
- `reconciliation_matches_found_total` - Matches found

### System Metrics
- `reconciliation_system_memory_usage` - Memory usage (0.0-1.0)
- `reconciliation_system_cpu_usage` - CPU usage (0.0-1.0)
- `reconciliation_system_disk_usage` - Disk usage (0.0-1.0)

### User Metrics
- `reconciliation_user_sessions_active` - Active user sessions
- `reconciliation_user_logins_total` - Total logins
- `reconciliation_user_actions_total` - Total user actions

### Security Metrics
- `rate_limit_blocks_total` - Requests blocked by rate limiter
- `csrf_failures_total` - CSRF validation failures
- `auth_denied_total` - Authentication denials
- `unauthorized_access_attempts_total` - Unauthorized access attempts

## 🔍 MONITORING QUERIES

### Request Rate
```promql
rate(reconciliation_http_requests_total[5m])
```

### Error Rate
```promql
rate(reconciliation_http_requests_total{status=~"5.."}[5m]) / rate(reconciliation_http_requests_total[5m])
```

### Average Response Time
```promql
rate(reconciliation_http_request_duration_seconds_sum[5m]) / rate(reconciliation_http_request_duration_seconds_count[5m])
```

### Cache Hit Rate
```promql
rate(reconciliation_cache_hits_total[5m]) / (rate(reconciliation_cache_hits_total[5m]) + rate(reconciliation_cache_misses_total[5m]))
```

## 🎯 KEY PERFORMANCE INDICATORS (KPIs)

1. **Request Latency (P50, P95, P99)**
   - Target: P95 < 500ms
   - Alert: P95 > 1s

2. **Error Rate**
   - Target: < 0.1%
   - Alert: > 1%

3. **Database Query Duration**
   - Target: P95 < 100ms
   - Alert: P95 > 500ms

4. **Cache Hit Rate**
   - Target: > 80%
   - Alert: < 60%

5. **System Resource Usage**
   - CPU: Target < 70%, Alert > 90%
   - Memory: Target < 80%, Alert > 95%
   - Disk: Target < 80%, Alert > 90%

## 🐛 TROUBLESHOOTING

### Metrics Not Appearing

1. Check endpoint is accessible: `curl http://localhost:2000/api/health/metrics`
2. Verify Prometheus can scrape: Check Prometheus targets page
3. Check logs for metric registration errors

### High Memory Usage

1. Check cache size: `reconciliation_cache_size_bytes`
2. Review connection pool size: `reconciliation_db_pool_connections_total`
3. Check for memory leaks in application logs

### High Error Rate

1. Check circuit breaker status: `/api/health/resilience`
2. Review error logs with correlation IDs
3. Check dependency health: `/api/health/dependencies`

## Related Documentation

- [Deployment Guide](../deployment/DEPLOYMENT_GUIDE.md)
- [New Features API](../api/NEW_FEATURES_API.md)
- [Security Hardening](../security/SECURITY_HARDENING_CHECKLIST.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Note**: This guide consolidates the previous Application Monitoring Setup Guide. All monitoring setup and configuration instructions are now in this single source of truth.

