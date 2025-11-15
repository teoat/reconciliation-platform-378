# Phase 10: Post-Deployment Triage

## Inputs (24h Snapshot)
- API p95 latency, error rate, reconciliation success rate
- Job throughput/hour, cache hit rate, DB p95 query time
- Top CUJ funnel drop-offs

## Identify Optimization Mismatches
- If p95 > 200ms: check DB histograms, cache hit rate, N+1 regressions
- If high write locks: check reconciliation_results writes & indexes
- If stale data reports: reduce cache TTLs on BFF endpoints

## User Pain Points
- Track CUJ 1 failure (upload → review) per step
- Record match approval errors and retry rate

## HOTFIX PLAN
1) If DB lock contention high:
   - Add idx_reconciliation_results_job_id (if missing)
   - Batch writes in chunks of 1k rows
2) If API p95 spikes:
   - Enable response compression and validate HPA targets
3) If cache hit < 80%:
   - Review cache keys and TTLs for BFF view

## BUG_TICKET (P0 Template)
- Title: [P0] Reconciliation write lock spike in production
- Impact: Users unable to complete CUJ 1; error rate X%
- Suspected Root Cause: Lock contention on reconciliation_results
- Proposed Fix: Add index, batch writes, increase pool size
- Owner: Backend
- SLA: 24h
