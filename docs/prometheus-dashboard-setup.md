# Prometheus Dashboard Setup Guide

## Overview

This guide explains how to set up Prometheus and Grafana to monitor circuit breaker metrics for the Reconciliation Backend.

## Prerequisites

- Prometheus installed and running
- Grafana installed and running
- Reconciliation Backend running with metrics endpoint at `/api/health/metrics`

## Step 1: Configure Prometheus

Add the following configuration to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'reconciliation-backend'
    scrape_interval: 15s
    metrics_path: '/api/health/metrics'
    static_configs:
      - targets: ['localhost:2000']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'reconciliation-backend'
```

## Step 2: Import Grafana Dashboard

1. Open Grafana
2. Go to Dashboards → Import
3. Import the dashboard JSON from `docs/grafana-dashboard-circuit-breakers.json`

Alternatively, use the Grafana API:

```bash
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @docs/grafana-dashboard-circuit-breakers.json
```

## Step 3: Configure Alerts (Optional)

### Circuit Breaker State Alerts

Create alerts for when circuit breakers are open:

```yaml
groups:
  - name: circuit_breaker_alerts
    interval: 30s
    rules:
      - alert: CircuitBreakerOpen
        expr: reconciliation_circuit_breaker_state == 2
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker is OPEN for {{ $labels.service }}"
          description: "The {{ $labels.service }} circuit breaker has been open for more than 5 minutes"

      - alert: HighFailureRate
        expr: rate(reconciliation_circuit_breaker_failures_total[5m]) / rate(reconciliation_circuit_breaker_requests_total[5m]) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High failure rate for {{ $labels.service }}"
          description: "{{ $labels.service }} has a failure rate > 50% over the last 5 minutes"
```

## Step 4: Verify Metrics

Check that metrics are being scraped:

```bash
# Query circuit breaker state
curl http://localhost:9090/api/v1/query?query=reconciliation_circuit_breaker_state

# Query request rate
curl http://localhost:9090/api/v1/query?query=rate(reconciliation_circuit_breaker_requests_total[5m])
```

## Available Metrics

### Circuit Breaker State
- `reconciliation_circuit_breaker_state{service="database|cache|api"}` - Current state (0=closed, 1=half-open, 2=open)

### Circuit Breaker Counters
- `reconciliation_circuit_breaker_requests_total{service="database|cache|api"}` - Total requests
- `reconciliation_circuit_breaker_successes_total{service="database|cache|api"}` - Total successes
- `reconciliation_circuit_breaker_failures_total{service="database|cache|api"}` - Total failures

### Calculated Metrics
- **Success Rate**: `rate(successes_total[5m]) / rate(requests_total[5m]) * 100`
- **Failure Rate**: `rate(failures_total[5m]) / rate(requests_total[5m]) * 100`
- **Request Rate**: `rate(requests_total[5m])`

## Dashboard Panels

The dashboard includes:
1. **Circuit Breaker States** - Visual status indicators for each service
2. **Circuit Breaker Requests** - Request rate over time
3. **Circuit Breaker Success Rate** - Percentage of successful requests
4. **Circuit Breaker Failures** - Failure rate over time
5. **Circuit Breaker Failure Rate** - Percentage of failed requests

## Troubleshooting

### Metrics Not Appearing

1. Check that the metrics endpoint is accessible:
   ```bash
   curl http://localhost:2000/api/health/metrics
   ```

2. Verify Prometheus is scraping:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

3. Check Prometheus logs for scraping errors

### Dashboard Not Loading

1. Verify Prometheus data source is configured in Grafana
2. Check that time range matches data availability
3. Verify metric names match exactly (case-sensitive)

## Best Practices

1. **Alert Thresholds**: Adjust alert thresholds based on your SLOs
2. **Retention**: Configure Prometheus retention based on your needs (default: 15 days)
3. **Sampling**: Use appropriate scrape intervals (15s recommended)
4. **Labeling**: Use consistent service labels across all metrics
5. **Documentation**: Document your alert thresholds and response procedures


