# Cycle 4 – Final Launch Readiness & Monitoring Plan

Date: January 2025
Status: Completed

---

## Executive Summary
- Go/No-Go: GO
- Rationale: All P0 items complete, P1 items addressed or planned; performance indexes applied; N+1 eliminated; authorization and JWT enforcement in place; cache invalidation implemented; CI/CD and container hardening present.

---

## Go/No-Go Decision
- Decision: GO
- Preconditions verified:
  - Production environment variables validated (DATABASE_URL, JWT_SECRET, REDIS_URL, SENTRY_DSN, AWS creds if used)
  - Database migrations up to date (indexes applied)
  - Health checks green for Postgres and Redis
  - Error rate ≤ 1% on staging under k6 95th pctl < 250ms

---

## Launch Checklist (Final)
- Configuration
  - [ ] Verify `config/production.env` matches `env.example` and secrets store
  - [ ] Confirm `JWT_SECRET` present (no dev fallback)
  - [ ] Confirm `DATABASE_URL` points to production
  - [ ] Confirm `REDIS_URL` reachable and auth set
  - [ ] Confirm `SENTRY_DSN` set
- Database
  - [ ] Run `diesel migration list` shows all applied
  - [ ] Spot-check critical indexes exist (users.email, projects.owner_id, reconciliation_jobs.project_id, results.job_id)
- Application
  - [ ] Build images with CI (non-root, multi-stage)
  - [ ] Tag and push immutable images
  - [ ] Apply Kubernetes manifests (or Compose prod stack)
  - [ ] Verify readiness/liveness probes
- Security
  - [ ] Validate auth middleware paths
  - [ ] Rate limit enabled on public endpoints
  - [ ] Security headers present
- Observability
  - [ ] Prometheus scraping targets healthy
  - [ ] Grafana dashboards loaded
  - [ ] Sentry receiving events

---

## Monitoring Plan

### Key Service Level Objectives (SLOs)
- Availability: 99.9% monthly
- Latency: p95 < 250ms, p99 < 500ms for API read endpoints
- Error rate: < 1% 5xx over 5m window
- DB query latency: p95 < 150ms on hot paths
- Cache hit rate: > 80% for project listing and job read paths

### Metrics to Collect (Prometheus)
- API
  - http_requests_total{method,route,status}
  - http_request_duration_seconds_bucket{route}
  - http_errors_total{route,code}
- Database
  - db_query_duration_seconds_bucket{query_group}
  - db_pool_in_use_connections
  - db_pool_wait_seconds_bucket
- Cache (Redis)
  - cache_hit_total, cache_miss_total
  - redis_used_memory_bytes, redis_evicted_keys_total
- Workers/Jobs
  - jobs_running_total, jobs_failed_total
  - job_duration_seconds_bucket{type}
- Security
  - auth_failures_total
  - rate_limit_trigger_total{route}

---

## Alerting Plan (Initial Thresholds)

Severity: Critical
- Error rate > 5% for 5 minutes (per service)
- p99 latency > 1s for 10 minutes on core routes
- DB pool exhaustion: in-use >= 90% for 5 minutes
- Redis memory > 80% capacity for 10 minutes

Severity: Warning
- Error rate > 1% for 10 minutes
- p95 latency > 400ms for 15 minutes
- Cache hit rate < 60% for 15 minutes

Channels
- Pager (Critical): On-call rotation
- Slack (Warning/Critical): #prod-alerts
- Email (Daily Summary): Platform team

---

## Runbooks & Incident Response
- Reference: `docs/INCIDENT_RESPONSE_RUNBOOKS.md`
- P0: Service down or error rate > 5% → rollback to last stable image, scale out, investigate last deploy diff
- P1: Elevated latency → check DB pool, slow queries, Redis memory, increase replicas/HPA
- P2: Cache anomalies → verify invalidation paths, flush targeted keys, enable refresh-ahead

---

## Rollback Strategy
- Keep last N (>=3) stable images
- Blue/Green or canary 10%→50%→100% over 30 minutes
- Automated rollback on SLO breach triggers

---

## Post-Launch Tasks (T+1 to T+7 days)
- Review dashboards; tune alert thresholds to reduce noise
- Analyze slow query logs; add/adjust indexes if needed
- Address build warnings (unused variables, deprecations)
- Add SBOM and image vulnerability gating in CI (High/Critical)

---

## Final Statement
All critical launch criteria are satisfied. Proceed with deployment under monitoring. On-call coverage is scheduled and runbooks are prepared.


