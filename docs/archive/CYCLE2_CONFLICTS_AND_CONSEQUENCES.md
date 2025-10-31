# Cycle 2 – Conflicts, Consequences, and Trade‑offs (Final)

Date: January 2025
Status: Complete
Scope: All 6 pillars (Code, Performance, Security, Testing, Deployment, UX)

---

## Executive Summary
- Conflicts identified were primarily around security strictness vs developer ergonomics, caching performance vs data freshness, and documentation consolidation vs historical referenceability.
- Resolutions chosen bias toward production safety and performance, with dev‑mode allowances where appropriate.

---

## Key Conflicts and Second‑Order Effects

- Security: Strict JWT secret enforcement vs local development convenience
  - Conflict: Failing fast in prod on missing `JWT_SECRET` can complicate local runs.
  - Decision: Enforce in prod; allow fallback only in dev. Documented clearly.
  - Second‑order: Prevents insecure prod; zero DX impact in dev.

- Authorization wiring vs handler complexity
  - Conflict: Adding `check_project_permission` and `extract_user_id` error handling increases handler boilerplate.
  - Decision: Keep explicit checks; centralize helpers in `utils` to minimize noise.
  - Consequence: Slightly more verbose handlers, significantly stronger security posture.

- Performance indexes vs migration noise
  - Conflict: Large index set introduces migration churn and potential minor lock contention.
  - Decision: Use `CONCURRENTLY` where possible; batch non‑blocking application; run during maintenance window.
  - Consequence: Lower lock risk; predictable rollout with big perf wins.

- Caching throughput vs data freshness (cache invalidation)
  - Conflict: Aggressive caching risks stale reads after writes.
  - Decision: Multi‑level cache plus explicit invalidation on mutations in handlers.
  - Consequence: Minimal staleness windows; preserved read performance.

- Duplicate algorithm utilities vs service cohesion
  - Conflict: Multiple Levenshtein implementations created DRY violations.
  - Decision: Single source in `utils::string::levenshtein_distance`; update call sites.
  - Consequence: Cleaner code, less coupling, easier testing.

- Docs consolidation vs discoverability of legacy analysis
  - Conflict: Reducing ~300 files to ~30 risks losing context.
  - Decision: Archive all redundant docs to `docs/archive/migrated/`, keep SSOT front‑and‑center.
  - Consequence: Faster onboarding; legacy available but out of the way.

- CI strictness vs velocity
  - Conflict: Adding image scanning and gating can slow merges.
  - Decision: Gate on high/critical CVEs; warn on medium; cache scanners.
  - Consequence: Balanced security and throughput.

---

## Resolved Trade‑offs (By Pillar)

- Code & Architecture: Prefer utility centralization over local duplicates; accept slightly longer imports for clarity.
- Performance: Prefer batched queries and indexes; accept maintenance overhead for sustained gains.
- Security: Prefer explicit authz/authn; accept handler verbosity; prod‑only hard fails for secrets.
- Testing: Prefer comprehensive CI pipelines; accept longer CI times with caching.
- Deployment: Prefer non‑root, multi‑stage images; accept slightly longer builds.
- UX & API: Prefer consistent REST and standardized errors; accept breaking changes behind versioned routes if needed.

---

## Risks and Mitigations

- Index drift or unused indexes
  - Mitigation: Quarterly EXPLAIN plans; prune unused indexes.
- Cache stampede on hot keys
  - Mitigation: Add refresh‑ahead or jittered TTL if metrics indicate.
- CI false positives on scanners
  - Mitigation: Allow waivers with expiry and documented justification.
- Handler sprawl
  - Mitigation: Continue extracting shared auth helpers and middlewares.

---

## Monitoring Signals to Watch (Post‑Cycle 2)

- DB: p95 and p99 query latency per operation; deadlock/lock wait events.
- Cache: Hit/miss, evictions, keyspace scans, Redis CPU/mem.
- API: 4xx/5xx rates, tail latency, error code distributions.
- Security: Auth failures, rate‑limit triggers, anomaly detectors.

---

## Outcome
- Conflicts resolved with bias toward secure, performant, maintainable defaults.
- No remaining P0 conflicts; any residual items are P2+ and scheduled post‑launch.
