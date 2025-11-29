# Performance Verification Guide

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Guide for verifying performance metrics

---

## Performance Targets

### API Response Times
- **p50 (median)**: < 200ms
- **p95**: < 500ms
- **p99**: < 1000ms

### Frontend Load Times
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s

### Database Query Performance
- **Simple queries**: < 50ms
- **Complex queries**: < 500ms
- **Batch operations**: < 2000ms

---

## Verification Scripts

### API Response Time Verification

```bash
#!/bin/bash
# verify-api-performance.sh

API_URL="${API_URL:-http://localhost:2000}"
ENDPOINTS=(
    "/api/v1/health"
    "/api/v1/projects"
    "/api/v1/reconciliation/jobs"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing $endpoint..."
    curl -w "@-" -o /dev/null -s "$API_URL$endpoint" <<'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
EOF
done
```

### Frontend Performance Verification

```bash
#!/bin/bash
# verify-frontend-performance.sh

FRONTEND_URL="${FRONTEND_URL:-http://localhost:1000}"

# Use Lighthouse CI or similar
npx lighthouse "$FRONTEND_URL" \
  --output=json \
  --output-path=./lighthouse-report.json \
  --only-categories=performance

# Parse results
FCP=$(jq '.audits["first-contentful-paint"].numericValue' lighthouse-report.json)
LCP=$(jq '.audits["largest-contentful-paint"].numericValue' lighthouse-report.json)

echo "FCP: ${FCP}ms (target: <1800ms)"
echo "LCP: ${LCP}ms (target: <2500ms)"
```

### Database Query Performance

```bash
#!/bin/bash
# verify-query-performance.sh

DATABASE_URL="${DATABASE_URL:-}"

# Enable query logging
psql "$DATABASE_URL" -c "SET log_min_duration_statement = 100;"

# Run test queries
psql "$DATABASE_URL" -c "SELECT * FROM reconciliation_jobs LIMIT 100;"
psql "$DATABASE_URL" -c "SELECT * FROM projects WHERE status = 'active';"

# Check slow queries
psql "$DATABASE_URL" -c "
SELECT 
    query,
    mean_exec_time,
    calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

---

## Load Testing

### Using Apache Bench

```bash
# Test API endpoint
ab -n 1000 -c 10 http://localhost:2000/api/v1/health

# Test with authentication
ab -n 1000 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:2000/api/v1/projects
```

### Using k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:2000/api/v1/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## Performance Monitoring

### Prometheus Queries

```promql
# Average response time
avg(rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Database query performance
avg(pg_stat_statements_mean_exec_time)
```

---

## Benchmarking

### Database Indexes

```bash
# Before indexes
EXPLAIN ANALYZE SELECT * FROM reconciliation_jobs WHERE project_id = 1;

# After indexes
EXPLAIN ANALYZE SELECT * FROM reconciliation_jobs WHERE project_id = 1;

# Compare execution times
```

### API Endpoints

```bash
# Benchmark specific endpoint
wrk -t4 -c100 -d30s http://localhost:2000/api/v1/projects
```

---

## Related Documentation

- [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md)
- [Common Issues Runbook](./COMMON_ISSUES_RUNBOOK.md)
- [Monitoring Setup](../project-management/PRODUCTION_READINESS_CHECKLIST.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

