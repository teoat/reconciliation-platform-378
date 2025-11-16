# Port Standardization Reference

## Standardized Port Configuration

| Service | Host Port | Container Port | Protocol | Purpose |
|---------|-----------|----------------|----------|---------|
| **Frontend** | 1000 | 80 | HTTP | Web application |
| **Backend API** | 2000 | 2000 | HTTP/WS | REST API & WebSocket |
| **PostgreSQL** | 5432 | 5432 | TCP | Direct database access |
| **PgBouncer** | 6432 | 5432 | TCP | Connection pooler |
| **Redis** | 6379 | 6379 | TCP | Cache & sessions |
| **Prometheus** | 9090 | 9090 | HTTP | Metrics collection |
| **Grafana** | 3001 | 3000 | HTTP | Dashboards |
| **Elasticsearch** | 9200 | 9200 | HTTP | Search & logs |
| **Kibana | 5601 | 5601 | HTTP | Log visualization |
| **Logstash** | 5044 | 5044 | TCP | Beats input |
| **Logstash HTTP** | 9600 | 9600 | HTTP | Monitoring API |
| **APM Server** | 8200 | 8200 | HTTP | Performance monitoring |

## Integration Points

### Frontend → Backend
- API URL: `http://localhost:2000/api/v1`
- WebSocket URL: `ws://localhost:2000`

### Backend → Database
- Direct: `postgres:5432`
- Pooled: `pgbouncer:5432` (internal)

### Backend → Redis
- URL: `redis:6379` (internal)

### Monitoring Stack
- Prometheus → Backend: `http://backend:2000/metrics`
- Grafana → Prometheus: `http://prometheus:9090`
- Kibana → Elasticsearch: `http://elasticsearch:9200`
- APM → Elasticsearch: `http://elasticsearch:9200`

