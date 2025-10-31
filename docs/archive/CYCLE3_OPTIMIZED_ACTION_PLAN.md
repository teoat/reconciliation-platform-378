# Cycle 3 – Optimized Action Plan (P0 → P3) + Top 5 Fixes

Date: January 2025
Status: Completed

---

## Executive Summary
- P0 items are complete with code changes merged and validated.
- P1 high-impact items are verified or scheduled with clear owners and timelines.
- This plan sets the exact order of execution, owners, acceptance criteria, and links to code locations.

---

## Prioritized Backlog (Now → Next → Later)

### NOW (P0 – Must Have)
1) Security: Enforce prod secrets, explicit authz checks – DONE
- Code: `backend/src/services/secrets.rs` (JWT enforced in prod)
- Code: `backend/src/handlers.rs` (authz checks added in job creation)
- Acceptance: No missing `JWT_SECRET` in prod; 403 on unauthorized access

2) Performance: N+1 eliminations – DONE
- Code: `services/project.rs:626-680`, `services/user.rs:298-342`
- Acceptance: No per-row count loops; GROUP BY batches present

3) Performance: Database indexes – APPLIED
- Execution: Index SQL applied to Postgres
- Acceptance: p95 DB < 150ms on hot paths

4) Consistency: Cache invalidation – VERIFIED
- Code: `handlers.rs` mutation routes clear keys via `MultiLevelCache`
- Acceptance: No stale reads after writes in smoke flows

5) Code Quality: Remove duplicate algorithms – DONE
- Code: Use `utils::string::levenshtein_distance` everywhere
- Acceptance: Single implementation in utils only

### NEXT (P1 – High Priority)
6) Security/Infra: CI image scanning + SBOM gating
- Change: Add Trivy/Grype step; fail build on High/Critical
- Owner: Platform
- Acceptance: CI fails on High/Critical CVEs

7) Observability: DB and cache metrics
- Change: Expose query latency histograms, cache hit/miss counters
- Owner: Backend
- Acceptance: Grafana dashboards show DB p95/p99 and cache rate

8) Resilience: ExternalSecrets/Sealed-Secrets for K8s
- Change: Pull secrets into cluster securely
- Owner: Platform
- Acceptance: No plaintext secrets in manifests

### LATER (P2/P3 – Recommended)
9) Performance hygiene: Quarterly EXPLAIN audit + index pruning
10) Code hygiene: Reduce warnings and deprecations
11) UX/API: RESTful upload route refactor (versioned)

---

## Top 5 Code Fixes – Implementation Notes (All DONE)

1) Authz in reconciliation job creation
- File: `backend/src/handlers.rs`
- Snippet:
```rust
check_project_permission(data.get_ref(), user_id, project_id_val)?;
```

2) JWT secret enforcement in production
- File: `backend/src/services/secrets.rs`
- Behavior: In prod, missing `JWT_SECRET` → startup failure

3) N+1 fixes (projects, users)
- Files: `services/project.rs`, `services/user.rs`
- Pattern: GROUP BY batched counts; hashmap join

4) Performance indexes applied to DB
- Action: Migrated with `CONCURRENTLY` where possible

5) Single source `levenshtein_distance`
- Call sites updated to `utils::string::levenshtein_distance`

---

## Delivery Plan & Owners

- Backend (Week 1)
  - Finalize metrics export (DB/cache) → Grafana panels
  - Add rate-limit metrics and security events counters
- Platform (Week 1)
  - Add Trivy/Grype scanner to CI with gating
  - Wire ExternalSecrets for prod
- Backend (Week 2)
  - Triage warnings and deprecations (non-functional cleanup)
- Product/Backend (Week 2+)
  - Versioned REST refactor for file uploads (non-breaking rollout)

---

## Acceptance Criteria (Rollup)
- P0: All complete; prod stability validated
- P1: CI scans block High/Critical; DB p95 < 150ms; cache hit > 80%
- P2: Warning count reduced by 50%; EXPLAIN audit checklist adopted

---

## Risk & Mitigation
- Risk: Scanner false positives → waiver process with expiry
- Risk: Metric overhead → sample rates and label cardinality caps
- Risk: Index drift → quarterly EXPLAIN SOP

---

## Outcome
- Cycle 3 complete. The system is optimized for launch with a staged plan to raise operational maturity in the first two weeks post‑launch.
