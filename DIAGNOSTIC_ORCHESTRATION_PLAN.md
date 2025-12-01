# Diagnostic Orchestration Plan: Efficiency & Optimization Deep Dive

**Version:** 1.0
**Status:** PROPOSED
**Objective:** To systematically diagnose, analyze, and map the performance characteristics of the 378 Reconciliation Platform, identifying critical bottlenecks and optimization opportunities.

---

## Phase 1: The Baseline & Infrastructure Audit (The Foundation)

**Objective:** Establish trusted performance baselines and verify infrastructure limits before attempting optimization. We must know "normal" to detect "abnormal".

### 1.1 Load Testing & Throughput Baseline
*   **Action:** Execute the existing `k6-load-test.js` against a staging-like environment.
*   **Target:** Determine the "breaking point" (max concurrent users before latency > 500ms or error rate > 1%).
*   **Tools:** `k6` (local or containerized).
*   **Metrics to Capture:**
    *   Requests Per Second (RPS)
    *   P95 and P99 Latency
    *   Error Rates (HTTP 5xx)

### 1.2 Infrastructure Resource Utilization
*   **Action:** Correlate load test timestamps with system resource metrics.
*   **Target:** Identify if CPU, Memory, I/O, or Network is the primary limiter.
*   **Tools:** `docker stats` (local), `kubectl top` (cluster), or existing Prometheus/Grafana dashboards.
*   **Specific Check:**
    *   Rust Backend memory footprint under load (potential leaks in `unsafe` blocks or FFI?).
    *   PostgreSQL connection pool exhaustion (check `pg_stat_activity` if possible).

### 1.3 Database Schema Verification
*   **Action:** Investigate the discrepancy between `backend/src/schema.rs` (complex schema present) and `backend/migrations/` (files missing).
*   **Risk:** Without migration history, query planning analysis is theoretical.
*   **Task:** Attempt to dump the running database schema to verify it matches `schema.rs`.

---

## Phase 2: Backend Deep Dive (The Engine)

**Objective:** Analyze the Rust/Actix application and Database interactions for inefficiencies.

### 2.1 Diesel Query Analysis
*   **Action:** Enable Diesel query logging (`DIESEL_LOG_SQL=true` or similar) during a sample load test.
*   **Target:** Identify "N+1" query patterns or queries scanning large tables without indexes.
*   **Focus Areas:**
    *   `reconciliation_jobs` fetching related `reconciliation_records`.
    *   `users` fetching `permissions` and `roles`.
*   **Reference:** `backend/src/schema.rs` indicates heavy relational data.

### 2.2 Async Runtime Health
*   **Action:** Analyze `tokio` task scheduling.
*   **Target:** Detect blocking operations inside async handlers (e.g., heavy CPU computation for reconciliation logic running on the async worker thread instead of `spawn_blocking`).
*   **Code Review Focus:** `backend/src/services/reconciliation_service.rs` (or similar logic files).

### 2.3 Dependency Audit
*   **Action:** Review `backend/Cargo.toml` for bloated dependencies.
*   **Target:** Reduce binary size and compile times.
*   **Specific Check:** `aws-sdk-*` crates (are we using all features?), `regex` usage (is it compiled once or every request?).

---

## Phase 3: Frontend Critical Path (The Experience)

**Objective:** Validate user-perceived performance and verify the claims in `REACT_PERFORMANCE_GUIDE.md`.

### 3.1 Bundle Size & Chunking
*   **Action:** Run a build with a visualizer plugin (`rollup-plugin-visualizer`).
*   **Target:** Identify large chunks that delay Time-to-Interactive (TTI).
*   **Specific Check:** Is the `reconciliation` logic leaking into the initial page load bundle?

### 3.2 Render Performance Validation
*   **Action:** Profile the `JobList` and `DataTable` components using React DevTools during heavy interaction (scrolling, filtering).
*   **Target:** Verify that `React.memo` usage is actually preventing renders and not adding overhead.
*   **Hypothesis:** Excessive `memo` usage on simple components might be slower than re-rendering.

### 3.3 Network Waterfall Analysis
*   **Action:** Analyze the loading sequence of the main dashboard.
*   **Target:** Identify "waterfall" requests (API calls waiting for other API calls).
*   **Fix Potential:** Move sequential `await` calls to `Promise.all` where independent.

---

## Phase 4: Synthesis & Optimization Strategy (The Mandate)

**Objective:** Consolidate findings into a prioritized roadmap.

### 4.1 The "Low Hanging Fruit" Report
*   List of 1-hour fixes with high impact (e.g., adding a missing DB index, enabling gzip compression).

### 4.2 The "Deep Work" Roadmap
*   Architectural changes (e.g., offloading reconciliation to a background worker queue if it blocks the API, implementing server-side pagination if frontend is overwhelmed).

### 4.3 Success Metrics Definition
*   Define specific thresholds (e.g., "Reconciliation job < 1M records must finish in < 5s") to guide future engineering.

---

## Execution Instructions

1.  **Start with Phase 1.1:** Run `k6 run load-test/k6-load-test.js` (ensure backend is running).
2.  **Proceed to Phase 3.1:** Run `npm run build` in `frontend/` and inspect output.
3.  **Document Findings:** Create `DIAGNOSTIC_REPORT.md` with results.
