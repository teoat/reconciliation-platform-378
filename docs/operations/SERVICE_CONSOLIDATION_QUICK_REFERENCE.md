# Service Consolidation - Quick Reference

**Last Updated**: January 2025  
**Quick Reference**: Immediate optimization opportunities

---

## Current State

- **11 services** in production (4 core + 7 monitoring)
- **~3.5-7.5GB RAM** total usage
- **~8-14 CPU cores** total

---

## Quick Wins (Implement Now)

### 1. Use Minimal Stack for Development

```bash
# Instead of full stack
docker compose up -d

# Use minimal stack (saves ~2.8GB RAM)
docker compose -f docker-compose.dev.yml up -d
```

**Savings**: 67% reduction (11 → 4 services), 80% RAM reduction

### 2. Make Monitoring Optional

```bash
# Core services only
docker compose -f docker-compose.dev.yml up -d

# Add monitoring when needed
docker compose -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d
```

**Savings**: ~2.5GB RAM when monitoring disabled

### 3. Disable PgBouncer in Development

PgBouncer is only needed for high-concurrency production. For development:
- Remove from `docker-compose.dev.yml`
- Use PostgreSQL directly

**Savings**: 1 service, ~20MB RAM

---

## Service Consolidation Opportunities

| Service Group | Current | Optimized | Savings |
|---------------|---------|-----------|---------|
| **ELK Stack** | Elasticsearch + Logstash + Kibana (3 services, ~1.5-2.5GB) | Loki + Promtail (2 services, ~500MB) | 1 service, ~1-2GB RAM |
| **APM** | APM Server (1 service, ~200-400MB) | Integrated into backend | 1 service, ~200-400MB RAM |
| **Connection Pooling** | PgBouncer (1 service, ~20MB) | Optional, use in production only | 1 service (dev), ~20MB RAM |

**Total Potential Savings**: 3 services, ~1.2-2.4GB RAM

---

## Recommended Deployment Profiles

### Profile: Minimal (Development)
```bash
docker compose --profile minimal up -d
```
- PostgreSQL, Redis, Backend, Frontend
- **RAM**: ~700MB
- **Services**: 4

### Profile: Standard (Staging)
```bash
docker compose --profile standard up -d
```
- Core + Prometheus + Grafana
- **RAM**: ~1.4GB
- **Services**: 6

### Profile: Production (Full)
```bash
docker compose --profile production up -d
```
- All optimized services
- **RAM**: ~3-4GB
- **Services**: 8

---

## Resource Optimization Targets

| Service | Current RAM | Optimized RAM | Reduction |
|---------|-------------|---------------|-----------|
| PostgreSQL | 2-4GB | 1-2GB | 50% |
| Backend | 1-2GB | 512MB-1GB | 50% |
| Redis | 512MB-1GB | 256-512MB | 50% |
| Monitoring Stack | ~2.5GB | ~1GB | 60% |

**Total**: 3.5-7.5GB → 2-4GB (40-50% reduction)

---

## Implementation Priority

### ✅ Phase 1: Immediate (This Week)
- [x] Use minimal stack for development
- [x] Make monitoring optional
- [ ] Add Docker Compose profiles
- [ ] Optimize resource limits

### ⏳ Phase 2: Short-term (This Month)
- [ ] Replace ELK with Loki stack
- [ ] Consolidate Docker Compose files
- [ ] Document optimization results

### 📅 Phase 3: Medium-term (Next Quarter)
- [ ] Integrate APM into backend
- [ ] Profile and optimize resource usage
- [ ] Implement auto-scaling if needed

---

## Quick Commands

### Check Current Resource Usage
```bash
docker stats --no-stream
```

### Compare Service Counts
```bash
# Full stack
docker compose ps | wc -l

# Minimal stack
docker compose -f docker-compose.dev.yml ps | wc -l
```

### View Resource Limits
```bash
docker inspect <container> | grep -A 10 "Resources"
```

---

## Expected Results

After optimizations:
- **Services**: 11 → 6-8 (27-45% reduction)
- **RAM**: 3.5-7.5GB → 2-4GB (40-50% reduction)
- **Cost**: 30-40% reduction
- **Maintenance**: 40-50% reduction in time

---

**See Full Analysis**: [SERVICE_CONSOLIDATION_ANALYSIS.md](./SERVICE_CONSOLIDATION_ANALYSIS.md)


