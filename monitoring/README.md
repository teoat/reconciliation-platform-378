# Centralized Monitoring

## Overview

This directory contains the centralized monitoring configuration for the Reconciliation Platform, including:

- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Elasticsearch/Kibana** - Log aggregation and analysis
- **OpenTelemetry** - Distributed tracing
- **Alert Manager** - Alert routing and notifications

## Directory Structure

```
monitoring/
├── README.md                    # This file
├── prometheus.yml               # Prometheus configuration
├── alertmanager.yml            # AlertManager configuration
├── alerts.yaml                 # Alert rules
├── queries.promql              # Useful PromQL queries
├── grafana/
│   ├── dashboards/             # Dashboard JSON files
│   └── provisioning/           # Auto-provisioning config
├── kibana/
│   └── kibana.yml              # Kibana configuration
├── elk/
│   ├── elasticsearch.yml       # Elasticsearch configuration
│   └── logstash.conf          # Logstash pipeline
├── tracing/
│   └── otel-collector-config.yaml  # OpenTelemetry Collector
├── rules/
│   └── *.yml                   # Additional alert rules
└── scripts/
    └── view-logs.sh            # Log viewer utility
```

## Quick Start

### Start Monitoring Stack with Docker Compose

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:v2.45.0
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/rules:/etc/prometheus/rules
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:10.0.0
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  alertmanager:
    image: prom/alertmanager:v0.26.0
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - ./monitoring/elk/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
    volumes:
      - ./monitoring/kibana/kibana.yml:/usr/share/kibana/config/kibana.yml
    depends_on:
      - elasticsearch

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./monitoring/elk/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.88.0
    volumes:
      - ./monitoring/tracing/otel-collector-config.yaml:/etc/otel/config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8889:8889"   # Prometheus metrics
    command: ["--config=/etc/otel/config.yaml"]

  jaeger:
    image: jaegertracing/all-in-one:1.51
    ports:
      - "16686:16686"  # UI
      - "14250:14250"  # gRPC
```

### Run the Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

## Component Documentation

### Prometheus

Access: http://localhost:9090

**Key Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency histogram
- `db_query_duration_seconds` - Database query latency
- `redis_operation_duration_seconds` - Redis operation latency

**Configuration Example:**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:2000']
    metrics_path: '/metrics'
```

### Grafana

Access: http://localhost:3001 (admin/admin)

**Pre-built Dashboards:**
- Application Overview
- Request/Response Metrics
- Database Performance
- Redis Cache Stats
- Error Analysis
- System Resources

### Kibana

Access: http://localhost:5601

**Index Patterns:**
- `logs-*` - Application logs
- `errors-*` - Error logs
- `audit-*` - Audit logs
- `metrics-*` - Metrics data

### OpenTelemetry

**Trace Propagation:**
```rust
// Backend (Rust)
use tracing_opentelemetry::OpenTelemetryLayer;
// Configure tracing subscriber with OTLP exporter
```

```typescript
// Frontend (TypeScript)
import { trace } from '@opentelemetry/api';
// Initialize with OTLP exporter
```

### Alerting

**Alert Levels:**
- `critical` - Immediate action required (PagerDuty)
- `warning` - Attention needed (Slack #alerts)
- `info` - Informational (Slack #monitoring)

**Example Alerts:**
```yaml
groups:
  - name: availability
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
```

## Scripts

### View Logs

```bash
# View backend logs
./monitoring/scripts/view-logs.sh service backend -n 100

# Search for errors
./monitoring/scripts/view-logs.sh search "error" --since 1h

# Tail logs in real-time
./monitoring/scripts/view-logs.sh tail backend

# Export logs
./monitoring/scripts/view-logs.sh export --from 2024-01-01 --to 2024-01-02
```

## Useful Queries

### PromQL Examples

```promql
# Request rate per second
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Database connection pool usage
db_pool_connections_active / db_pool_connections_max * 100

# Redis cache hit ratio
sum(rate(redis_cache_hits[5m])) / sum(rate(redis_cache_requests[5m])) * 100
```

### Kibana Queries

```
# Find error logs
level:ERROR OR level:error

# Search by trace ID
trace_id:"abc123"

# Find slow requests
response_time:>1000

# Audit log for specific user
type:audit AND user_id:"user123"
```

## Integration

### Backend Integration

```rust
// Cargo.toml
[dependencies]
prometheus = "0.13"
tracing = "0.1"
tracing-opentelemetry = "0.21"
opentelemetry = "0.21"
opentelemetry-otlp = "0.14"
```

### Frontend Integration

```json
// package.json
{
  "dependencies": {
    "@opentelemetry/api": "^1.6.0",
    "@opentelemetry/sdk-trace-web": "^1.17.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.43.0"
  }
}
```

## Health Checks

```bash
# Prometheus
curl -s http://localhost:9090/-/healthy

# Grafana
curl -s http://localhost:3001/api/health

# Elasticsearch
curl -s http://localhost:9200/_cluster/health

# AlertManager
curl -s http://localhost:9093/-/healthy
```

## Troubleshooting

### Common Issues

**Prometheus not scraping targets:**
```bash
# Check target status
curl http://localhost:9090/api/v1/targets

# Validate config
promtool check config prometheus.yml
```

**Grafana dashboard not loading:**
```bash
# Check datasource
curl http://localhost:3001/api/datasources

# Restart provisioning
docker-compose restart grafana
```

**Elasticsearch cluster health yellow:**
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Check indices
curl http://localhost:9200/_cat/indices?v
```

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
