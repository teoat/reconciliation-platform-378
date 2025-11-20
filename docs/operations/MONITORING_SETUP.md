# Application Monitoring Setup Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

The Reconciliation Platform includes comprehensive application and performance monitoring using Prometheus metrics, health checks, and alerting. This guide explains how to set up and use the monitoring infrastructure.

## Monitoring Components

### 1. Prometheus Metrics

The backend exposes Prometheus-formatted metrics at `/api/health/metrics` and `/health/metrics`.

#### Available Metrics

**HTTP Metrics:**
- `reconciliation_http_requests_total` - Total HTTP requests by method, route, status
- `reconciliation_http_request_duration_seconds` - Request duration histogram
- `reconciliation_http_request_size_bytes` - Request size
- `reconciliation_http_response_size_bytes` - Response size

**Database Metrics:**
- `reconciliation_db_query_duration_seconds` - Query duration by route, operation, table
- `reconciliation_db_pool_connections_active` - Active connections
- `reconciliation_db_pool_connections_idle` - Idle connections
- `reconciliation_db_pool_connections_total` - Total connections
- `reconciliation_db_pool_exhaustion_total` - Pool exhaustion events
- `reconciliation_db_queries_total` - Total queries

**Cache Metrics:**
- `reconciliation_cache_hits_total` - Cache hits by level and key type
- `reconciliation_cache_misses_total` - Cache misses by level and key type
- `reconciliation_cache_size_bytes` - Cache size
- `reconciliation_cache_evictions_total` - Cache evictions

**Circuit Breaker Metrics:**
- `reconciliation_circuit_breaker_state` - Circuit breaker state (0=closed, 1=half-open, 2=open)
- `reconciliation_circuit_breaker_failures_total` - Total failures
- `reconciliation_circuit_breaker_successes_total` - Total successes
- `reconciliation_circuit_breaker_requests_total` - Total requests

**Reconciliation Metrics:**
- `reconciliation_jobs_total` - Total reconciliation jobs
- `reconciliation_jobs_active` - Active jobs
- `reconciliation_job_duration_seconds` - Job duration
- `reconciliation_records_processed_total` - Records processed
- `reconciliation_matches_found_total` - Matches found

**System Metrics:**
- `reconciliation_system_memory_usage` - Memory usage (0.0-1.0)
- `reconciliation_system_cpu_usage` - CPU usage (0.0-1.0)
- `reconciliation_system_disk_usage` - Disk usage (0.0-1.0)

**User Metrics:**
- `reconciliation_user_sessions_active` - Active user sessions
- `reconciliation_user_logins_total` - Total logins
- `reconciliation_user_actions_total` - Total user actions

**Security Metrics:**
- `rate_limit_blocks_total` - Requests blocked by rate limiter
- `csrf_failures_total` - CSRF validation failures
- `auth_denied_total` - Authentication denials
- `unauthorized_access_attempts_total` - Unauthorized access attempts

### 2. Health Check Endpoints

**Basic Health Check:**
```bash
GET /api/health
GET /health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T10:00:00Z",
    "version": "2.0.0"
  }
}
```

**Resilience Status:**
```bash
GET /api/health/resilience
GET /health/resilience
```

Returns circuit breaker status for database, cache, and API services.

**Dependencies Status:**
```bash
GET /api/health/dependencies
GET /health/dependencies
```

Returns health status of database and cache connections.

### 3. Monitoring Endpoints

**Monitoring Health:**
```bash
GET /api/monitoring/health
```

**System Metrics:**
```bash
GET /api/monitoring/metrics
GET /api/monitoring/system
```

**Active Alerts:**
```bash
GET /api/monitoring/alerts
```

## Prometheus Setup

### 1. Install Prometheus

```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

### 2. Configure Prometheus

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

### 3. Start Prometheus

```bash
./prometheus --config.file=prometheus.yml
```

Access Prometheus UI at `http://localhost:9090`

## Grafana Setup

### 1. Install Grafana

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

### 2. Configure Grafana

1. Access Grafana at `http://localhost:3000`
2. Default credentials: `admin` / `admin`
3. Add Prometheus data source:
   - URL: `http://localhost:9090`
   - Access: Server (default)

### 3. Import Dashboards

Create dashboards for:
- **HTTP Metrics**: Request rate, duration, error rate
- **Database Metrics**: Query duration, pool usage, connection stats
- **Cache Metrics**: Hit rate, miss rate, cache size
- **System Metrics**: CPU, memory, disk usage
- **Reconciliation Metrics**: Job status, processing rate, match rate
- **Security Metrics**: Rate limit blocks, auth failures

## Alerting

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

## Performance Monitoring

### Key Performance Indicators (KPIs)

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

### Monitoring Queries

**Request Rate:**
```promql
rate(reconciliation_http_requests_total[5m])
```

**Error Rate:**
```promql
rate(reconciliation_http_requests_total{status=~"5.."}[5m]) / rate(reconciliation_http_requests_total[5m])
```

**Average Response Time:**
```promql
rate(reconciliation_http_request_duration_seconds_sum[5m]) / rate(reconciliation_http_request_duration_seconds_count[5m])
```

**Cache Hit Rate:**
```promql
rate(reconciliation_cache_hits_total[5m]) / (rate(reconciliation_cache_hits_total[5m]) + rate(reconciliation_cache_misses_total[5m]))
```

## Best Practices

1. **Set Up Dashboards**: Create comprehensive dashboards for all key metrics
2. **Configure Alerts**: Set up alerts for critical thresholds
3. **Monitor Trends**: Track metrics over time to identify patterns
4. **Review Regularly**: Review metrics weekly to identify optimization opportunities
5. **Document Thresholds**: Document alert thresholds and their rationale
6. **Test Alerts**: Regularly test alerting to ensure it works correctly

## Troubleshooting

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

---

**Related Documentation**:
- [Troubleshooting Guide](../operations/TROUBLESHOOTING.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING.md)

