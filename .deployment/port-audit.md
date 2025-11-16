# Port Configuration Audit

## Current Port Assignments

### Application Services
- **Backend**: 2000 (HOST:CONTAINER)
- **Frontend**: 1000:80 (HOST:CONTAINER)
- **API**: 2000 (duplicate of BACKEND_PORT)

### Databases
- **PostgreSQL**: 5432:5432
- **PgBouncer**: 6432:5432 (⚠️ CONFLICT - maps to same container port as postgres)
- **Redis**: 6379:6379

### Monitoring Stack
- **Prometheus**: 9090:9090
- **Grafana**: 3001:3000
- **Elasticsearch**: 9200:9200
- **Kibana**: 5601:5601
- **Logstash**: 5044:5044, 9600:9600
- **APM Server**: 8200:8200

## Issues Identified

### 1. ⚠️ CRITICAL: PgBouncer Port Conflict
**Problem**: PgBouncer maps host 6432 to container 5432, but postgres already maps 5432:5432
**Impact**: Port binding conflict if both services try to expose
**Resolution**: PgBouncer should not expose external port OR use different container port

### 2. ⚠️ Duplicate PORT Variables
**Problem**: Both `PORT` and `BACKEND_PORT` set to 2000
**Impact**: Confusion and potential conflicts
**Resolution**: Remove duplicate, use single `BACKEND_PORT`

### 3. ⚠️ API_PORT Unused
**Problem**: `API_PORT` defined but never referenced
**Impact**: Dead configuration
**Resolution**: Remove from .env

## Recommended Port Configuration

### Clean Port Mapping
```yaml
# Application
BACKEND_PORT=2000      # Backend API
FRONTEND_PORT=1000     # Frontend UI

# Databases  
POSTGRES_PORT=5432     # Direct PostgreSQL access
PGBOUNCER_PORT=6432    # PgBouncer connection pooler (internal only)
REDIS_PORT=6379        # Redis cache

# Monitoring (Optional - can be internal only)
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
LOGSTASH_PORT=5044
APM_PORT=8200
```

### Security Best Practices
1. **Production**: Monitoring ports should be internal only (no host mapping)
2. **Production**: Database ports should be internal only
3. **Production**: Only expose Backend (2000) and Frontend (1000)
4. **Development**: Can expose all ports for debugging

## Action Items
- [ ] Fix PgBouncer port configuration
- [ ] Remove duplicate PORT variables
- [ ] Create production docker-compose with minimal port exposure
- [ ] Update .env.example with clear port documentation

