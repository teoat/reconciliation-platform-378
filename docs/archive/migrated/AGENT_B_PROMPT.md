# Agent B Prompt: Performance & Infrastructure ORCHESTRATE

## Your Role
You are **Agent B - Performance & Infrastructure Lead** for the 378 Reconciliation Platform Tier 4 Analysis.

## Current Status
You need to complete **Cycle 1** by auditing:
- **Pillar 2**: Performance & Efficiency
- **Pillar 5**: Deployment & Scalability (CI/CD)

## Deliverables Required

### 1. CYCLE1_PILLAR2_AUDIT.md
Audit performance and efficiency:

**Key Areas:**
- [ ] Database query patterns in reconciliation service
- [ ] Identify N+1 query problems in handlers
- [ ] Analyze caching implementation effectiveness (Redis + in-memory)
- [ ] Check memory management for potential leaks
- [ ] Review file upload/processing efficiency
- [ ] Verify database indexes: defined in `services/performance.rs` line 441-506 vs applied
- [ ] Check if `20250102000000_add_performance_indexes.sql` migration has been run

**Specific Findings to Investigate:**
1. Database indexes script exists at `backend/migrations/20250102000000_add_performance_indexes.sql` - need to verify if applied
2. Index application scripts: `backend/apply-indexes.sh` and `backend/apply_performance_indexes.sh` exist
3. Caching implemented in handlers (`handlers.rs` lines 600-623) - verify effectiveness
4. Connection pool with retry logic in `backend/src/database/mod.rs` lines 64-91
5. Large file handling with streaming in file service - verify efficiency

**Cache Implementation:**
- Multi-level cache (L1 in-memory + L2 Redis) infrastructure ready
- Cache usage in `get_project` (10 min TTL), `get_reconciliation_jobs` (2 min TTL)
- Need to verify cache hit rates and invalidation strategy

### 2. CYCLE1_PILLAR5_AUDIT.md
Audit deployment and scalability:

**Key Areas:**
- [ ] Docker configuration optimization
- [ ] CI/CD pipeline efficiency review
- [ ] Environment variable consistency across files
- [ ] Horizontal scaling readiness (K8s configs)
- [ ] Database migration strategy and application
- [ ] Deployment automation effectiveness

**Specific Findings to Investigate:**
1. **Docker Files:**
   - `Dockerfile` (Next.js frontend)
   - `docker-compose.yml` with services: postgres, redis, backend, frontend, prometheus, grafana
   - Backend Dockerfile referenced: `infrastructure/docker/Dockerfile.backend`
   - Frontend Dockerfile referenced: `infrastructure/docker/Dockerfile.frontend`

2. **clearing Variable Files (Multiple!):**
   - `env.example` - base template
   - `env.production` - production config
   - `env.template` - alternative template
   - `frontend/env.example` - frontend specific
   - Check for consistency and conflicts

3. **CI/CD Pipeline:**
   - `.github/workflows/ci-cd.yml` - main pipeline
   - `.github/workflows/comprehensive-testing.yml` - test suite
   - `.github/workflows/enhanced-ci-cd.yml` - enhanced pipeline
   - Check for redundancy and efficiency

4. **K8s Configuration:**
   - `k8s/reconciliation-platform.yaml`
   - `k8s/reconciliation-platform-enhanced.yaml`
   - `k8s/base/configmap.yaml`
   - Verify horizontal scaling configuration

5. **Migration Files:**
   - Multiple migration directories: `backend/migrations/`
   - Diesel migrations vs SQL migrations
   - Need to verify application order and status

## Instructions

1. Read all relevant configuration and source files
2. Create each deliverable markdown file
3. Format: Markdown with clear sections for each finding
4. Include specific file paths and line references
5. Categorize findings by severity (Critical, High, Medium, Low)
6. Test/verify claims where possible (e.g., run index check queries)
7. Upload deliverables to workspace root when complete

## Success Criteria
- [ ] Both audit documents created
- [ ] Each finding includes file path, severity, impact
- [ ] Specific configuration references provided
- [ ] Actionable recommendations included
- [ ] Performance bottleneck priorities identified

---

**Focus on actionable findings that affect production performance and deployment reliability.**

