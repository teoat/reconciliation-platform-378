# Cycle 1 Pillar 5 Audit: Deployment & Scalability (CI/CD)

Date: January 2025  
Auditor: Agent B - Performance & Infrastructure Lead  
Scope: Docker, CI/CD, Environment Variables, K8s, Migrations, Automation

---

## Executive Summary
Deployment and scalability foundations are strong: Dockerized services, docker-compose for local/prod, GitHub Actions CI/CD, and Kubernetes manifests with HPA. However, multiple configuration drifts exist between environments (ports, env var names, and frameworks), and the migration strategy is split between Diesel and raw SQL scripts. These introduce risk of failed deploys, downtime, and performance regressions.

- Critical: 3 findings
- High: 5 findings
- Medium: 6 findings
- Low: 4 findings

Top actions:
- Normalize ports/env names across Docker, K8s, and .env.
- Consolidate CI/CD workflows and ensure single migration path.
- Add index-application validation step post-deploy.

---

## Findings by Area

### 1) Docker Configuration

1.1 CRITICAL: Port mismatches across environments  
- Files: 
  - `docker-compose.yml` backend exposes `PORT=2000` and maps `${BACKEND_PORT:-2000}:2000` (lines 78-113)
  - `k8s/reconciliation-platform.yaml` backend `containerPort: 3001` and environment `PORT: 3001` (lines 55-66, 90-101)
  - `env.production` sets `PORT=8080` (line 24)
- Impact: Deploy failures or unresponsive services due to incorrect health checks/routing.
- Severity: Critical
- Recommendation: Standardize backend port to 2000 or 3001 across all configs and health checks; update service and ingress targets accordingly.

1.2 HIGH: Frontend framework mismatch in Dockerfile vs compose  
- Files:
  - `Dockerfile` is a Next.js pipeline with `nextjs` user and `.next/standalone` (entire file)
  - `docker-compose.yml` describes frontend as React/Vite (lines 114-134) with `VITE_` env vars (123-125)
- Impact: Build/runtime failures if the root Dockerfile is used for Vite frontend; confusion in infra automation.
- Severity: High
- Recommendation: Remove or rename root `Dockerfile` to `infrastructure/docker/Dockerfile.frontend` (already referenced by compose). Add a README clarifying build entrypoints.

1.3 MEDIUM: Redis authentication inconsistent across environments  
- Files:
  - `docker-compose.yml` Redis uses no password (lines 55-74)
  - `k8s/reconciliation-platform.yaml` Redis requires password via secret and `--requirepass` (lines 269-276)
- Impact: Security drift; code paths may not handle both.
- Severity: Medium
- Recommendation: Require password in all environments; update compose to pass `REDIS_PASSWORD` and set Redis to require auth.

1.4 LOW: Image resource limits only set in compose for Postgres  
- File: `docker-compose.yml` postgres `deploy.resources` limits (lines 46-51)
- Impact: Non-critical; good practice but not applied to other services.
- Severity: Low
- Recommendation: Add resource limits to backend/frontend services for parity and predictability under load.

---

### 2) Environment Variables Consistency

2.1 CRITICAL: Divergent env var names between backend/frontend and K8s  
- Files:
  - `env.example` includes `BACKEND_URL`, `FRONTEND_URL`, `REDIS_URL` (lines 14-21)
  - `env.production` uses `NEXT_PUBLIC_API_URL`, `PORT=8080`, `REDIS_URL` with password (lines 22-27, 24, 13-15)
  - `frontend/env.example` uses `VITE_API_URL`, `VITE_WS_URL` (lines 5-7)
  - `docker-compose.yml` sets `VITE_API_URL`/`VITE_WS_URL` for frontend (lines 122-125) and hard-coded backend `PORT=2000` (86-93)
  - `k8s/reconciliation-platform.yaml` uses `PORT=3001` for backend (lines 63-69)
- Impact: Deployment misconfiguration and broken endpoints across environments.
- Severity: Critical
- Recommendation: Adopt a single naming scheme: `BACKEND_PORT`, `VITE_API_URL`, `REDIS_URL`, `DATABASE_URL`. Align all files to the canonical names and defaults.

2.2 HIGH: Mixed public env prefixes (NEXT_PUBLIC_ vs VITE_)  
- Files: `env.production` (lines 26-27) vs `frontend/env.example` (5-7)
- Impact: Frontend builds may miss required environment values.
- Severity: High
- Recommendation: Standardize on Vite (`VITE_*`). Remove `NEXT_PUBLIC_*` from `env.production` or segregate Next.js configs if truly required.

2.3 MEDIUM: JWT variable naming drift  
- Files: `docker-compose.yml` uses `JWT_EXPIRES_IN`; `env.production` uses `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` (17-21)
- Impact: Unclear effective expiration in different environments.
- Severity: Medium
- Recommendation: Consolidate to `JWT_EXPIRATION_SECONDS` and `JWT_REFRESH_EXPIRATION_SECONDS` everywhere.

2.4 LOW: DATABASE_URL differences  
- Files: `env.example` vs `env.production` differ in protocol `postgres://` vs `postgresql://` and host names
- Impact: Minor; both valid, but can cause confusion.
- Severity: Low
- Recommendation: Standardize protocol and provide example host names aligned to each environment.

---

### 3) CI/CD Pipeline

3.1 HIGH: Workflow redundancy and potential ordering conflicts  
- Files: `.github/workflows/ci-cd.yml`, `.github/workflows/comprehensive-testing.yml`, `.github/workflows/enhanced-ci-cd.yml`
- Impact: Duplicate or conflicting jobs increase build time and risk race conditions.
- Severity: High
- Recommendation: Consolidate into a single workflow with strategy matrices; ensure clear needs/dependencies.

3.2 HIGH: Mixed migration strategies (Diesel vs raw SQL script)  
- Files:
  - CI uses Diesel migrations (`diesel migration run`) in multiple jobs (ci-cd.yml lines 76-81, 207-212)
  - A separate `backend/apply-indexes.sh` applies raw `20250102000000_add_performance_indexes.sql`
- Impact: Order-of-operations drift; indexes may not be present in some environments.
- Severity: High
- Recommendation: Fold `20250102000000_add_performance_indexes.sql` into Diesel migrations or invoke the script as a CI/CD step post-migrations. Record status in a single migration table.

3.3 MEDIUM: Docker image tags not aligned to releases  
- Files: `ci-cd.yml` pushes images with `${{ github.sha }}` (274-288)
- Impact: Hard to roll back to a semantic version.
- Severity: Medium
- Recommendation: Also tag images with release tag/semver and `latest` when appropriate.

3.4 MEDIUM: SSH-based deployment without health-guarded rollout  
- Files: `ci-cd.yml` deploy jobs using `appleboy/ssh-action` and docker-compose (291-319, 332-345)
- Impact: Limited rollback/blue-green; risk on failures during restart.
- Severity: Medium
- Recommendation: Add health checks and staged rollouts; consider Docker Swarm or K8s for staging/prod with proper rollout strategies.

3.5 LOW: Missing artifact retention for test reports  
- Files: `ci-cd.yml`
- Impact: Harder debugging when jobs fail.
- Severity: Low
- Recommendation: Upload test logs and coverage reports as artifacts.

---

### 4) Kubernetes (Horizontal Scaling)

4.1 HIGH: Backend port mismatch and probes  
- File: `k8s/reconciliation-platform.yaml`
- Finding: `containerPort: 3001` with liveness/readiness on `/health` port 3001 (90-101), while docker-compose/other envs use 2000 or 8080.
- Impact: Pods may never become Ready if backend expects different port.
- Severity: High
- Recommendation: Align backend port across all environments; expose through a single `BACKEND_PORT` env.

4.2 MEDIUM: HPA configured, but no custom metrics  
- File: `k8s/reconciliation-platform.yaml` HPA (309-361)
- Impact: CPU/memory-only scaling might be insufficient for IO-bound workloads.
- Severity: Medium
- Recommendation: Add custom metrics (request latency, queue depth) via Prometheus Adapter for more responsive autoscaling.

4.3 LOW: Ingress annotations exist but TLS secrets are placeholders  
- File: `k8s/reconciliation-platform.yaml` (364-400)
- Impact: Requires operationalization before production use.
- Severity: Low
- Recommendation: Ensure cert-manager issuer and DNS are configured; validate TLS termination.

---

### 5) Database Migration Strategy

5.1 CRITICAL: Dual-path migrations can drift  
- Files:
  - Diesel migrations executed in CI and via docker-compose exec
  - `backend/apply-indexes.sh` runs raw SQL for indexes
- Impact: Environments may miss indexes; performance regressions in production.
- Severity: Critical
- Recommendation: Unify under Diesel migrations or have a single migration runner script that runs both (in order) and writes a checkpoint. Add an "index verification" CI step:
  - Run `SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%';`
  - Fail pipeline if expected indexes missing.

5.2 MEDIUM: Lack of migration status reporting  
- Impact: Hard to audit applied migrations across environments.
- Severity: Medium
- Recommendation: Emit migration status to logs and upload as CI artifacts; consolidate into CHANGELOG.

---

### 6) Deployment Automation

6.1 HIGH: Manual-ish docker-compose deploys in CI  
- File: `.github/workflows/ci-cd.yml` deploy steps (291-345)
- Impact: Less reliable than GitOps/K8s; harder rollbacks.
- Severity: High
- Recommendation: Move staging/prod deploys to Kubernetes with declarative manifests and automated rollouts; use versioned images and `kubectl rollout status` gates.

6.2 MEDIUM: Health check parity across environments  
- Files:
  - `docker-compose.yml` uses wget to `http://localhost:2000/health` (108-113)
  - K8s uses `/health` on port 3001 (90-101)
- Impact: Different probes increase drift.
- Severity: Medium
- Recommendation: Standardize `/health` and port; verify backend exposes consistent health endpoint.

6.3 LOW: Missing post-deploy verification for indexes  
- Impact: Indexes may not be present after deploy.
- Severity: Low
- Recommendation: Add a CI step to run `backend/apply-indexes.sh` or a SQL check after deployment.

---

## Positive Findings
- Docker Compose SSOT comment and health checks present (`docker-compose.yml`)
- K8s manifests include HPA, PDBs, NetworkPolicy, and monitoring components
- CI includes security scanning (Trivy), cargo audit, caching for cargo and node modules

---

## Actionable Remediation Plan

P0 (within 24-48h):
- Standardize backend port across all configs (compose, K8s, env files) and update health checks accordingly.
- Consolidate env var naming (`VITE_*` for frontend, canonical `BACKEND_PORT`, `DATABASE_URL`, `REDIS_URL`).
- Unify migration strategy; ensure performance index SQL is applied automatically and verified.

P1 (within sprint):
- Consolidate CI workflows into one pipeline; align image tagging to releases.
- Enforce Redis auth in all environments.
- Add post-deploy verification: service health, DB indexes present.

P2 (next sprint):
- Extend HPA with custom metrics via Prometheus Adapter.
- Add artifact retention for logs and test reports.
- Add resource limits to all services in docker-compose for parity and predictability.

P3 (backlog):
- Migrate deployments to K8s for both staging and prod; adopt GitOps.
- Add blue/green or canary strategies and automated rollback gates.

---

## Referenced Files and Lines
- `docker-compose.yml`: 78-113 (backend), 114-134 (frontend), 55-74 (redis), 46-51 (postgres limits)
- `k8s/reconciliation-platform.yaml`: 55-101 (backend container and probes), 309-361 (HPA), 364-400 (Ingress)
- `env.example`, `env.production`, `frontend/env.example`
- `.github/workflows/ci-cd.yml`: 76-81, 207-212 (migrations), 274-288 (image tags), 291-345 (deploy)
- `backend/apply-indexes.sh`
- `backend/migrations/20250102000000_add_performance_indexes.sql`

---

End of Pillar 5 Audit.
