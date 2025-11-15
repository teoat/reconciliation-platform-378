# Phase 9: Final Roadmap & Maintenance Package

## To Delete/Archive
- Archived: handlers_old.rs, main_graceful_shutdown.rs, services/cache_old.rs, middleware/security_old.rs
- Removed duplicate: backend/src/schema.rs (SSOT: models/schema.rs)

## To Refactor
- Split ProjectService into CRUD, Permissions, Aggregations (defer post-GA)
- Reconciliation algorithm: finalize indexed matching integration (post metrics)

## New Hooks (Meta-Agent)
- POST /api/reconciliation/batch-resolve
- GET /api/projects/:id/reconciliation/view

## Updated README
- See START_HERE.md and HSG_11_PHASE_COMPLETE_REPORT.md for new commands and architecture

## Monitoring Plan (CUJ/BVP-aligned)
- CUJ 1 Success Rate (pages served without error)
- Reconciliation Processing Time (p95)
- API p95 latency (<200ms)
- Match Accuracy (>= 99.9%)
- Job throughput per hour
