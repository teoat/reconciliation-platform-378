# Monitoring Guide

**Last Updated**: November 26, 2025  
**Status**: Active

## Overview

Comprehensive monitoring guide for the Reconciliation Platform, including metrics collection, health checks, and alerting.

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

## Related Documentation

- [Deployment Guide](../deployment/DEPLOYMENT_GUIDE.md)
- [New Features API](../api/NEW_FEATURES_API.md)
- [Security Hardening](../security/SECURITY_HARDENING_CHECKLIST.md)

