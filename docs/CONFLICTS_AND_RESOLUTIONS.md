# Phase 8: Conflict & Resolution Table

| Area | Conflict | Resolution | North Star Alignment |
|------|----------|------------|----------------------|
| Caching vs. Freshness | Caching matches risks stale views | Use short TTL and BFF endpoint to aggregate fresh data | Prioritizes Analyst accuracy and speed |
| Algorithm Speed vs. Memory | Indexed matching adds memory overhead | Accept O(n) memory; keep index scoped per job | Meets <2h for 1M records |
| API Chatty vs. Simplicity | Multiple calls per view | Add BFF /projects/:id/reconciliation/view | Faster CUJ 1 review step |
| Schema Duplication | Duplicate schema files | SSOT at models/schema.rs; removed root schema.rs | Reduces drift |
| Security vs. Usability | Strict JWT/CSRF may add friction | Keep strict in prod; dev defaults documented | Security SLOs without blocking dev |
