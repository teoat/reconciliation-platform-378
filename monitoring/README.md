# Centralized Monitoring Suite

This directory contains all monitoring configurations for the Reconciliation Platform.

## Overview

The monitoring stack includes:
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization dashboards
- **Kibana** - Log analysis (via ELK stack)
- **AlertManager** - Alert routing and notifications

## Quick Start

### Access Monitoring Tools

```bash
# Check status of all monitoring services
./access-monitoring.sh status

# View service health
./access-monitoring.sh health

# View logs for a specific service
./access-monitoring.sh logs backend

# Check active alerts
./access-monitoring.sh alerts
```

### Open UI Dashboards

```bash
# Open Grafana
./access-monitoring.sh grafana

# Open Prometheus
./access-monitoring.sh prometheus

# Open Kibana
./access-monitoring.sh kibana
```

### Query Metrics

```bash
# Run a PromQL query
./access-monitoring.sh query 'up'

# Get current metrics summary
./access-monitoring.sh metrics
```

## Directory Structure

```
monitoring/
├── README.md                     # This file
├── access-monitoring.sh          # Unified monitoring access script
├── prometheus.yml                # Prometheus configuration
├── alertmanager.yml              # AlertManager configuration
├── alerts.yaml                   # Alert rules
├── queries.promql                # PromQL query examples
├── grafana/
│   └── dashboards/
│       └── reconciliation-platform.json  # Main dashboard
├── rules/                        # Additional Prometheus rules
├── bug-detection.js              # Bug detection integration
├── continuous-monitoring.js      # Continuous monitoring script
├── evolution-loop-integration.js # Evolution loop integration
└── hil-approval.js               # Human-in-the-loop approval
```

## Service Ports

| Service     | Port  | URL                      |
|-------------|-------|--------------------------|
| Prometheus  | 9090  | http://localhost:9090    |
| Grafana     | 3001  | http://localhost:3001    |
| Kibana      | 5601  | http://localhost:5601    |
| Backend Metrics | 2000 | http://localhost:2000/api/metrics |

## Configuration

### Prometheus

The main Prometheus configuration is in `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'reconciliation-platform'
    static_configs:
      - targets: ['host.docker.internal:2000']
    metrics_path: '/metrics'
```

### AlertManager

Alert routing is configured in `alertmanager.yml`:
- Critical alerts → Email + Slack
- Warning alerts → Email only
- Default → Webhook

### Grafana Dashboards

Import dashboards from `grafana/dashboards/`:
1. Open Grafana at http://localhost:3001
2. Go to Dashboards → Import
3. Upload `reconciliation-platform.json`

## Common Commands

```bash
# View all container logs
./access-monitoring.sh logs all

# View backend logs
./access-monitoring.sh logs backend

# Check specific Prometheus query
./access-monitoring.sh query 'rate(http_requests_total[5m])'

# Check service health
./access-monitoring.sh health
```

## Troubleshooting

### Prometheus Not Starting

1. Check configuration syntax:
   ```bash
   promtool check config prometheus.yml
   ```

2. Check Docker logs:
   ```bash
   ./access-monitoring.sh logs prometheus
   ```

### Grafana Connection Issues

1. Verify Prometheus data source is configured
2. Check Grafana logs:
   ```bash
   ./access-monitoring.sh logs grafana
   ```

### Missing Metrics

1. Verify backend is exposing metrics:
   ```bash
   curl http://localhost:2000/metrics
   ```

2. Check Prometheus targets:
   ```bash
   ./access-monitoring.sh query 'up'
   ```
