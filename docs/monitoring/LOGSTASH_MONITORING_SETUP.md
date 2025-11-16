# Logstash Monitoring Setup Guide

**Service**: `reconciliation-logstash`  
**Last Updated**: December 2024

---

## 📊 Overview

This guide covers setting up monitoring for Logstash using Prometheus and Grafana, as well as using the built-in HTTP API for metrics collection.

---

## 🔍 Logstash HTTP API

Logstash provides a built-in HTTP API on port 9600 (localhost only) that exposes comprehensive metrics.

### Available Endpoints

1. **Node Statistics**
   ```
   GET http://localhost:9600/_node/stats
   ```
   - Pipeline events (in/out/filtered)
   - JVM metrics (heap, GC)
   - Plugin statistics
   - Queue information

2. **Node Information**
   ```
   GET http://localhost:9600/_node
   ```
   - Node name and version
   - Pipeline configuration
   - Plugin information

3. **Pipeline Information**
   ```
   GET http://localhost:9600/_node/pipelines
   ```
   - Pipeline status
   - Event counts
   - Queue sizes

4. **Hot Threads**
   ```
   GET http://localhost:9600/_node/hot_threads
   ```
   - Thread information
   - CPU usage per thread

### Example Queries

```bash
# Get all node statistics
curl http://localhost:9600/_node/stats | jq

# Get pipeline events
curl http://localhost:9600/_node/stats | jq '.pipelines.main.events'

# Get JVM heap usage
curl http://localhost:9600/_node/stats | jq '.jvm.mem.heap_used_percent'

# Get pipeline queue size
curl http://localhost:9600/_node/stats | jq '.pipelines.main.queue'
```

---

## 📈 Prometheus Integration

### Option 1: Logstash Exporter (Recommended)

Use the [Logstash Exporter](https://github.com/prometheuscommunity/logstash_exporter) to scrape Logstash metrics.

#### Installation

```yaml
# Add to docker-compose.yml or monitoring stack
logstash-exporter:
  image: prometheuscommunity/logstash-exporter:latest
  container_name: reconciliation-logstash-exporter
  command:
    - '--logstash.endpoint=http://logstash:9600'
    - '--web.listen-address=:9198'
  ports:
    - "9198:9198"
  networks:
    - reconciliation-network
  depends_on:
    - logstash
  restart: unless-stopped
```

#### Prometheus Configuration

```yaml
# Add to prometheus.yml
scrape_configs:
  - job_name: 'logstash'
    static_configs:
      - targets: ['logstash-exporter:9198']
```

### Option 2: Custom Exporter Script

Create a custom exporter that queries the Logstash HTTP API:

```python
# scripts/monitoring/logstash-exporter.py
#!/usr/bin/env python3
"""
Logstash Prometheus Exporter
Exposes Logstash metrics in Prometheus format
"""
import json
import time
import requests
from http.server import HTTPServer, BaseHTTPRequestHandler

LOGSTASH_URL = "http://logstash:9600"
PORT = 9198

class LogstashExporter(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/metrics':
            try:
                stats = self.get_logstash_stats()
                metrics = self.format_metrics(stats)
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(metrics.encode())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Error: {str(e)}".encode())
        elif self.path == '/health':
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
    
    def get_logstash_stats(self):
        response = requests.get(f"{LOGSTASH_URL}/_node/stats", timeout=5)
        response.raise_for_status()
        return response.json()
    
    def format_metrics(self, stats):
        metrics = []
        
        # Pipeline events
        pipeline = stats.get('pipelines', {}).get('main', {})
        events = pipeline.get('events', {})
        metrics.append(f"logstash_events_in_total {events.get('in', 0)}")
        metrics.append(f"logstash_events_out_total {events.get('out', 0)}")
        metrics.append(f"logstash_events_filtered_total {events.get('filtered', 0)}")
        
        # JVM metrics
        jvm = stats.get('jvm', {})
        mem = jvm.get('mem', {})
        metrics.append(f"logstash_jvm_heap_used_percent {mem.get('heap_used_percent', 0)}")
        metrics.append(f"logstash_jvm_heap_used_bytes {mem.get('heap_used_in_bytes', 0)}")
        metrics.append(f"logstash_jvm_heap_max_bytes {mem.get('heap_max_in_bytes', 0)}")
        
        # Queue metrics
        queue = pipeline.get('queue', {})
        metrics.append(f"logstash_queue_events_count {queue.get('events_count', 0)}")
        
        return '\n'.join(metrics) + '\n'

if __name__ == '__main__':
    server = HTTPServer(('', PORT), LogstashExporter)
    print(f"Logstash exporter listening on port {PORT}")
    server.serve_forever()
```

---

## 📊 Grafana Dashboard

### Key Metrics to Display

1. **Pipeline Performance**
   - Events in/out rate
   - Events filtered
   - Pipeline latency

2. **JVM Metrics**
   - Heap usage percentage
   - Heap used/max bytes
   - GC statistics

3. **Queue Metrics**
   - Queue size
   - Queue capacity
   - Queue fill percentage

4. **Plugin Metrics**
   - Input plugin events
   - Filter plugin events
   - Output plugin events

### Example Grafana Queries

```promql
# Events per second (rate)
rate(logstash_events_in_total[5m])

# Heap usage percentage
logstash_jvm_heap_used_percent

# Queue fill percentage
(logstash_queue_events_count / logstash_queue_capacity_bytes) * 100

# Error rate
rate(logstash_events_filtered_total[5m])
```

### Sample Dashboard JSON

```json
{
  "dashboard": {
    "title": "Logstash Monitoring",
    "panels": [
      {
        "title": "Events Rate",
        "targets": [
          {
            "expr": "rate(logstash_events_in_total[5m])",
            "legendFormat": "Events In"
          },
          {
            "expr": "rate(logstash_events_out_total[5m])",
            "legendFormat": "Events Out"
          }
        ]
      },
      {
        "title": "JVM Heap Usage",
        "targets": [
          {
            "expr": "logstash_jvm_heap_used_percent",
            "legendFormat": "Heap Used %"
          }
        ]
      },
      {
        "title": "Queue Size",
        "targets": [
          {
            "expr": "logstash_queue_events_count",
            "legendFormat": "Queue Events"
          }
        ]
      }
    ]
  }
}
```

---

## 🔔 Alerting Rules

### Prometheus Alert Rules

```yaml
# monitoring/rules/logstash-alerts.yml
groups:
  - name: logstash
    interval: 30s
    rules:
      - alert: LogstashHighHeapUsage
        expr: logstash_jvm_heap_used_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Logstash heap usage is high"
          description: "Logstash heap usage is {{ $value }}% (threshold: 80%)"
      
      - alert: LogstashQueueFull
        expr: (logstash_queue_events_count / logstash_queue_capacity_bytes) * 100 > 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Logstash queue is nearly full"
          description: "Logstash queue is {{ $value }}% full"
      
      - alert: LogstashDown
        expr: up{job="logstash"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Logstash is down"
          description: "Logstash exporter is not responding"
      
      - alert: LogstashNoEvents
        expr: rate(logstash_events_in_total[10m]) == 0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Logstash is not receiving events"
          description: "No events received in the last 10 minutes"
```

---

## 🔧 Manual Monitoring Scripts

### Health Check Script

```bash
#!/bin/bash
# scripts/monitoring/logstash-health-check.sh

LOGSTASH_URL="http://localhost:9600"
THRESHOLD_HEAP=80
THRESHOLD_QUEUE=90

# Get stats
STATS=$(curl -sf "${LOGSTASH_URL}/_node/stats" || echo "{}")

if [ "$STATS" = "{}" ]; then
    echo "ERROR: Cannot connect to Logstash API"
    exit 1
fi

# Extract metrics
HEAP_USED=$(echo "$STATS" | jq -r '.jvm.mem.heap_used_percent // 0')
QUEUE_EVENTS=$(echo "$STATS" | jq -r '.pipelines.main.queue.events_count // 0')
EVENTS_IN=$(echo "$STATS" | jq -r '.pipelines.main.events.in // 0')
EVENTS_OUT=$(echo "$STATS" | jq -r '.pipelines.main.events.out // 0')

# Check thresholds
if (( $(echo "$HEAP_USED > $THRESHOLD_HEAP" | bc -l) )); then
    echo "WARNING: Heap usage is ${HEAP_USED}% (threshold: ${THRESHOLD_HEAP}%)"
fi

echo "Heap Usage: ${HEAP_USED}%"
echo "Queue Events: ${QUEUE_EVENTS}"
echo "Events In: ${EVENTS_IN}"
echo "Events Out: ${EVENTS_OUT}"
```

### Performance Monitoring Script

```bash
#!/bin/bash
# scripts/monitoring/logstash-performance.sh

LOGSTASH_URL="http://localhost:9600"
OUTPUT_FILE="logstash-metrics-$(date +%Y%m%d-%H%M%S).json"

while true; do
    STATS=$(curl -sf "${LOGSTASH_URL}/_node/stats")
    if [ -n "$STATS" ]; then
        echo "$(date -Iseconds) $STATS" >> "$OUTPUT_FILE"
    fi
    sleep 60
done
```

---

## 📋 Monitoring Checklist

### Daily Checks
- [ ] Container is running
- [ ] Health check is passing
- [ ] Events are being processed
- [ ] Heap usage < 80%

### Weekly Checks
- [ ] Review performance trends
- [ ] Check for error patterns
- [ ] Verify queue is not backing up
- [ ] Review resource usage trends

### Monthly Checks
- [ ] Review and optimize pipeline configuration
- [ ] Check for deprecated settings
- [ ] Review alert thresholds
- [ ] Update documentation

---

## 🔗 Related Documentation

- **Troubleshooting**: `LOGSTASH_TROUBLESHOOTING_RUNBOOK.md`
- **Comprehensive Analysis**: `LOGSTASH_COMPREHENSIVE_ANALYSIS.md`
- **Elastic Documentation**: https://www.elastic.co/guide/en/logstash/current/node-stats-api.html
- **Prometheus Exporter**: https://github.com/prometheuscommunity/logstash_exporter

---

**Last Updated**: December 2024

