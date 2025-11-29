# Log Aggregation Setup Guide

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Guide for setting up log aggregation for the Reconciliation Platform

---

## Overview

Log aggregation centralizes logs from all services for easier monitoring, searching, and analysis.

---

## Architecture Options

### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)

**Pros**:
- Powerful search and analytics
- Rich visualization
- Open source
- Widely used

**Cons**:
- Resource intensive
- Complex setup

### Option 2: Loki + Grafana

**Pros**:
- Lightweight
- Integrates with Grafana
- Simple setup
- Good for Kubernetes

**Cons**:
- Less mature than ELK
- Fewer features

### Option 3: Cloud Logging (AWS CloudWatch, GCP Logging, Azure Monitor)

**Pros**:
- Managed service
- Easy setup
- Integrated with cloud services
- Pay-as-you-go

**Cons**:
- Vendor lock-in
- Cost at scale

---

## ELK Stack Setup

### Docker Compose

```yaml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  es_data:
```

### Logstash Pipeline

```ruby
# logstash/pipeline/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "backend" {
    json {
      source => "message"
    }
  }
  
  if [fields][service] == "frontend" {
    json {
      source => "message"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "reconciliation-%{+YYYY.MM.dd}"
  }
}
```

---

## Loki Setup

### Docker Compose

```yaml
version: '3.8'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./loki:/etc/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - ./promtail:/etc/promtail
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
    depends_on:
      - loki
```

### Promtail Configuration

```yaml
# promtail/config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: backend
          __path__: /var/log/backend/*.log

  - job_name: frontend
    static_configs:
      - targets:
          - localhost
        labels:
          job: frontend
          __path__: /var/log/frontend/*.log
```

---

## Kubernetes Setup

### Fluentd DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: fluentd
  template:
    metadata:
      labels:
        name: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.logging.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

---

## Application Configuration

### Backend Logging

Already configured for JSON logging:
```bash
# Enable JSON logging
export JSON_LOGGING=true
```

### Frontend Logging

Send logs to aggregation endpoint:
```typescript
// frontend/src/services/logging.ts
export const sendLogToAggregation = (log: LogEntry) => {
  fetch('/api/v1/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  });
};
```

---

## Verification

### Check Log Collection

```bash
# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices

# Check Loki targets
curl http://localhost:3100/ready

# Check Fluentd status
kubectl logs -n kube-system -l name=fluentd
```

---

## Best Practices

1. **Structured Logging**: Use JSON format
2. **Log Levels**: Use appropriate levels (DEBUG, INFO, WARN, ERROR)
3. **PII Masking**: Mask sensitive data in logs
4. **Retention**: Set appropriate retention policies
5. **Indexing**: Use appropriate index patterns
6. **Monitoring**: Monitor log aggregation system health

---

## Related Documentation

- [Common Issues Runbook](./COMMON_ISSUES_RUNBOOK.md)
- [Monitoring Setup](../project-management/PRODUCTION_READINESS_CHECKLIST.md)
- [Security Hardening](../project-management/SECURITY_HARDENING_IMPLEMENTATION.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

