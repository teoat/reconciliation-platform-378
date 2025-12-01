# Monitoring Stack

Unified observability stack for the Reconciliation Platform, combining metrics, logs, and traces.

## Components

### Metrics (Prometheus + Grafana)
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **Alertmanager**: Alert routing and notification

### Logs (ELK Stack)
- **Elasticsearch**: Log storage and search
- **Logstash**: Log processing pipeline
- **Kibana**: Log visualization
- **Filebeat**: Log shipping

### Traces (OpenTelemetry + Jaeger)
- **OpenTelemetry Collector**: Trace collection and processing
- **Jaeger**: Distributed tracing visualization

## Quick Start

### Start the full monitoring stack

```bash
cd monitoring/elk
docker-compose up -d
```

### Access the services

| Service       | URL                    | Credentials          |
|---------------|------------------------|----------------------|
| Grafana       | http://localhost:3000  | admin/admin          |
| Prometheus    | http://localhost:9090  | -                    |
| Kibana        | http://localhost:5601  | -                    |
| Jaeger        | http://localhost:16686 | -                    |
| Alertmanager  | http://localhost:9093  | -                    |
| Elasticsearch | http://localhost:9200  | -                    |

## CLI Tool

Use the telemetry debug CLI for quick diagnostics:

```bash
# Check health of all services
node monitoring/cli/telemetry-debug.js health

# Query logs
node monitoring/cli/telemetry-debug.js logs --level error --time 1h

# View metrics
node monitoring/cli/telemetry-debug.js metrics

# Query traces
node monitoring/cli/telemetry-debug.js traces --service reconciliation-backend

# List active alerts
node monitoring/cli/telemetry-debug.js alerts
```

## Configuration

### Prometheus

Edit `prometheus.yml` to add new scrape targets:

```yaml
scrape_configs:
  - job_name: 'my-service'
    static_configs:
      - targets: ['my-service:8080']
```

### Alerting

Define alerts in `alerts.yaml`:

```yaml
groups:
  - name: my-alerts
    rules:
      - alert: HighLatency
        expr: http_request_duration_seconds > 0.5
        for: 5m
        labels:
          severity: warning
```

### Grafana Dashboards

Add dashboard JSON files to `grafana/dashboards/`.

### Logstash Pipeline

Configure log parsing in `logging/logstash/pipeline.conf`.

## Kubernetes Integration

For K8s deployments, use the ServiceMonitor CRDs:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-service
spec:
  selector:
    matchLabels:
      app: my-service
  endpoints:
    - port: http
      path: /metrics
```

## OpenTelemetry Integration

### Rust Backend

Add OpenTelemetry to your Rust service:

```rust
use opentelemetry::sdk::trace::TracerProvider;
use opentelemetry_otlp::WithExportConfig;

let tracer = opentelemetry_otlp::new_pipeline()
    .tracing()
    .with_exporter(
        opentelemetry_otlp::new_exporter()
            .tonic()
            .with_endpoint("http://otel-collector:4317"),
    )
    .install_simple()?;
```

### React Frontend

```typescript
import { init as initApm } from '@elastic/apm-rum';

const apm = initApm({
  serviceName: 'reconciliation-frontend',
  serverUrl: 'http://localhost:8200',
  environment: 'production'
});
```

## Troubleshooting

### Elasticsearch not starting
Check memory limits:
```bash
docker-compose logs elasticsearch
sysctl vm.max_map_count  # Should be >= 262144
```

### Prometheus not scraping targets
Verify targets are reachable:
```bash
curl http://localhost:9090/api/v1/targets
```

### Missing logs in Kibana
Check Filebeat is shipping logs:
```bash
docker-compose logs filebeat
```

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Backend   │───▶│    OTEL     │───▶│   Jaeger    │
│   Service   │    │  Collector  │    │   (traces)  │
└──────┬──────┘    └──────┬──────┘    └─────────────┘
       │                  │
       │ /metrics         │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  Prometheus │    │Elasticsearch│
│  (metrics)  │    │   (logs)    │
└──────┬──────┘    └──────┬──────┘
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   Grafana   │    │   Kibana    │
│ (dashboards)│    │(log search) │
└─────────────┘    └─────────────┘
```
